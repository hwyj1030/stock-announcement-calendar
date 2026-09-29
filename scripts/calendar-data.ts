import { load } from 'cheerio'
import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  parse,
  parseISO,
  subYears,
} from 'date-fns'
import type { Company, EarningsEvent } from '../src/types'

export const SAMSUNG_SOURCE = 'https://www.samsung.com/global/ir/ir-events-presentations/events/'
export const SKHYNIX_SOURCE = 'https://asia.tools.euroland.com/tools/FinCalendar2/Home/AllEvents?companyCode=kr-000660&lang=en-gb&CurrentPage=1&RowPerPage=200&SortOrder=DESC&v=redesign'
export const ESTIMATE_TEXT = '최근 3년 동일 분기의 공식 발표일과 분기 말 사이 간격의 중앙값으로 계산한 예상일입니다.'

const twoDigitYear = (value: string) => String(2000 + Number(value))

export function normalizeQuarter(title: string): string | null {
  const text = title.replace(/&#39;|&apos;|’/g, "'").replace(/\s+/g, ' ')
  const patterns = [
    /([1-4])Q\s*(\d{2})\b/i,
    /Q([1-4])\s*[' ]?FY(\d{2,4})/i,
    /([1-4])(?:st|nd|rd|th)?\s*Quarter.*?(20\d{2})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const year = match[2].length === 2 ? twoDigitYear(match[2]) : match[2]
      return `${year} Q${match[1]}`
    }
  }
  return null
}

const makeId = (company: Company, quarter: string) => `${company}-${quarter.toLowerCase().replace(' ', '-')}`

export function parseSamsungEvents(html: string, checkedAt: string): EarningsEvent[] {
  const $ = load(html)
  const events: EarningsEvent[] = []

  $('.ir-event-list__detail').each((_, node) => {
    const title = $(node).find('dt').first().text().trim()
    if (!/earnings conference call/i.test(title)) return
    const fiscalQuarter = normalizeQuarter(title)
    const dateText = $(node).find('dd').first().text().replace(/\s+/g, ' ').trim()
    if (!fiscalQuarter || !dateText) return

    const datePart = dateText.split(',').slice(0, 2).join(',').trim()
    const parsedDate = parse(datePart, 'MMMM d, yyyy', new Date())
    if (Number.isNaN(parsedDate.getTime())) return
    const timeMatch = dateText.match(/(\d{1,2}:\d{2})\s*(a\.m\.|p\.m\.)/i)
    let time: string | null = null
    if (timeMatch) {
      let hour = Number(timeMatch[1].split(':')[0])
      const minute = timeMatch[1].split(':')[1]
      if (/p/i.test(timeMatch[2]) && hour < 12) hour += 12
      if (/a/i.test(timeMatch[2]) && hour === 12) hour = 0
      time = `${String(hour).padStart(2, '0')}:${minute}`
    }

    events.push({
      id: makeId('samsung', fiscalQuarter),
      company: 'samsung',
      fiscalQuarter,
      date: format(parsedDate, 'yyyy-MM-dd'),
      time,
      status: 'confirmed',
      sourceUrl: SAMSUNG_SOURCE,
      sourceLabel: '삼성전자 공식 IR',
      checkedAt,
      estimateMethod: null,
    })
  })
  return dedupe(events)
}

interface EurolandEvent {
  title: string
  type: string
  startDateUTC: string
  displayDate: string
}

export function parseSkHynixEvents(payload: string, checkedAt: string): EarningsEvent[] {
  const json = JSON.parse(payload) as { events?: EurolandEvent[] }
  if (!Array.isArray(json.events)) throw new Error('SK hynix response does not contain an events array')

  return dedupe(json.events.flatMap((item) => {
    if (item.type !== 'Earnings Release') return []
    const fiscalQuarter = normalizeQuarter(item.title)
    const dateMatch = item.startDateUTC.match(/^(\d{4})(\d{2})(\d{2})/)
    if (!fiscalQuarter || !dateMatch) return []
    const timeMatch = item.displayDate.match(/at\s+(\d{2}:\d{2})/i)
    return [{
      id: makeId('skhynix', fiscalQuarter),
      company: 'skhynix' as const,
      fiscalQuarter,
      date: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,
      time: timeMatch?.[1] ?? null,
      status: 'confirmed' as const,
      sourceUrl: 'https://www.skhynix.com/ir/UI-FR-IR10',
      sourceLabel: 'SK하이닉스 공식 IR',
      checkedAt,
      estimateMethod: null,
    }]
  }))
}

export function dedupe(events: EarningsEvent[]): EarningsEvent[] {
  return [...new Map(events.map((event) => [`${event.company}-${event.fiscalQuarter}`, event])).values()]
    .sort((a, b) => a.date.localeCompare(b.date))
}

const quarterEnd = (year: number, quarter: number) => {
  const month = quarter * 3
  return new Date(year, month, 0)
}

const median = (numbers: number[]) => {
  const sorted = [...numbers].sort((a, b) => a - b)
  const center = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[center] : Math.round((sorted[center - 1] + sorted[center]) / 2)
}

export function shiftWeekend(date: Date): Date {
  const weekday = getDay(date)
  if (weekday === 6) return addDays(date, 2)
  if (weekday === 0) return addDays(date, 1)
  return date
}

export function addEstimates(confirmed: EarningsEvent[], today: Date): EarningsEvent[] {
  const results = [...confirmed]
  const checkedAt = today.toISOString()

  for (const company of ['samsung', 'skhynix'] as Company[]) {
    const companyEvents = confirmed.filter((event) => event.company === company)
    const future: EarningsEvent[] = companyEvents.filter((event) => parseISO(event.date) >= today)

    for (let year = today.getFullYear() - 1; year <= today.getFullYear() + 2; year += 1) {
      for (let quarter = 1; quarter <= 4; quarter += 1) {
        const fiscalQuarter = `${year} Q${quarter}`
        if (companyEvents.some((event) => event.fiscalQuarter === fiscalQuarter)) continue

        const sameQuarter = companyEvents
          .filter((event) => event.fiscalQuarter.endsWith(`Q${quarter}`))
          .sort((a, b) => b.fiscalQuarter.localeCompare(a.fiscalQuarter))
          .slice(0, 3)
        if (sameQuarter.length < 2) continue

        const offsets = sameQuarter.map((event) => {
          const eventYear = Number(event.fiscalQuarter.slice(0, 4))
          return differenceInCalendarDays(parseISO(event.date), quarterEnd(eventYear, quarter))
        })
        const estimatedDate = shiftWeekend(addDays(quarterEnd(year, quarter), median(offsets)))
        if (estimatedDate < today) continue

        future.push({
          id: makeId(company, fiscalQuarter),
          company,
          fiscalQuarter,
          date: format(estimatedDate, 'yyyy-MM-dd'),
          time: null,
          status: 'estimated',
          sourceUrl: company === 'samsung' ? SAMSUNG_SOURCE : 'https://www.skhynix.com/ir/UI-FR-IR10',
          sourceLabel: company === 'samsung' ? '삼성전자 공식 IR' : 'SK하이닉스 공식 IR',
          checkedAt,
          estimateMethod: ESTIMATE_TEXT,
        })
      }
    }

    const futureKeys = new Set(future.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2).map((event) => event.id))
    results.push(...future.filter((event) => event.status === 'estimated' && futureKeys.has(event.id)))
  }

  const keepAfter = subYears(today, 4)
  return dedupe(results).filter((event) => parseISO(event.date) >= keepAfter)
}

export function validateEvents(events: EarningsEvent[]) {
  for (const company of ['samsung', 'skhynix'] as Company[]) {
    const companyEvents = events.filter((event) => event.company === company && event.status === 'confirmed')
    if (companyEvents.length < 8) throw new Error(`${company} returned too few confirmed events (${companyEvents.length})`)
  }
  for (const event of events) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || Number.isNaN(parseISO(event.date).getTime())) {
      throw new Error(`Invalid event date: ${event.id}`)
    }
    if (!/^20\d{2} Q[1-4]$/.test(event.fiscalQuarter)) throw new Error(`Invalid quarter: ${event.id}`)
  }
}
