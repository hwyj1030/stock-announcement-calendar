import { describe, expect, it } from 'vitest'
import { addEstimates, normalizeQuarter, parseSamsungEvents, parseSkHynixEvents, shiftWeekend } from '../scripts/calendar-data'
import type { EarningsEvent } from '../src/types'

const checkedAt = '2026-09-29T00:00:00.000Z'

describe('official source parsers', () => {
  it('parses Samsung IR event markup', () => {
    const html = `<ul><li><dl class="ir-event-list__detail"><dt>2Q26 Earnings Conference Call</dt><dd>July 30, 2026, 10:00 a.m. KST</dd></dl></li></ul>`
    expect(parseSamsungEvents(html, checkedAt)[0]).toMatchObject({
      company: 'samsung', fiscalQuarter: '2026 Q2', date: '2026-07-30', time: '10:00', status: 'confirmed',
    })
  })

  it('parses SK hynix Euroland JSON and ignores other event types', () => {
    const payload = JSON.stringify({ events: [
      { title: "Q2&#39;FY26 Earnings Release", type: 'Earnings Release', startDateUTC: '20260729T000000Z', displayDate: '2026.07.29 at 09:00 (UTC+09:00)' },
      { title: 'Tech Tour', type: 'Conference', startDateUTC: '20260820', displayDate: '2026.08.20' },
    ] })
    expect(parseSkHynixEvents(payload, checkedAt)).toHaveLength(1)
    expect(parseSkHynixEvents(payload, checkedAt)[0]).toMatchObject({
      company: 'skhynix', fiscalQuarter: '2026 Q2', date: '2026-07-29', time: '09:00',
    })
  })

  it('normalizes quarter title variants', () => {
    expect(normalizeQuarter("Q3'FY25 Earnings Release")).toBe('2025 Q3')
    expect(normalizeQuarter('4Q25 Earnings Conference Call')).toBe('2025 Q4')
  })
})

describe('estimation', () => {
  const history: EarningsEvent[] = [2023, 2024, 2025].flatMap((year) => [
    { id: `samsung-${year}-q3`, company: 'samsung' as const, fiscalQuarter: `${year} Q3`, date: `${year}-10-${year === 2024 ? '31' : '30'}`, time: '10:00', status: 'confirmed' as const, sourceUrl: 'https://example.com', sourceLabel: 'IR', checkedAt, estimateMethod: null },
    { id: `samsung-${year}-q4`, company: 'samsung' as const, fiscalQuarter: `${year} Q4`, date: `${year + 1}-01-${year === 2023 ? '31' : '30'}`, time: '10:00', status: 'confirmed' as const, sourceUrl: 'https://example.com', sourceLabel: 'IR', checkedAt, estimateMethod: null },
    { id: `skhynix-${year}-q3`, company: 'skhynix' as const, fiscalQuarter: `${year} Q3`, date: `${year}-10-${year === 2024 ? '24' : '25'}`, time: '09:00', status: 'confirmed' as const, sourceUrl: 'https://example.com', sourceLabel: 'IR', checkedAt, estimateMethod: null },
    { id: `skhynix-${year}-q4`, company: 'skhynix' as const, fiscalQuarter: `${year} Q4`, date: `${year + 1}-01-${year === 2023 ? '25' : '23'}`, time: '09:00', status: 'confirmed' as const, sourceUrl: 'https://example.com', sourceLabel: 'IR', checkedAt, estimateMethod: null },
  ])

  it('adds only the next two estimated quarters per company', () => {
    const events = addEstimates(history, new Date('2026-09-29T00:00:00+09:00'))
    expect(events.filter((event) => event.status === 'estimated')).toHaveLength(4)
    expect(events.some((event) => event.fiscalQuarter === '2026 Q3')).toBe(true)
  })

  it('moves weekend estimates to Monday', () => {
    expect(shiftWeekend(new Date('2026-10-31T12:00:00')).getDay()).toBe(1)
    expect(shiftWeekend(new Date('2026-11-01T12:00:00')).getDay()).toBe(1)
  })
})
