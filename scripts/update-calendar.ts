import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { addEstimates, parseSamsungEvents, parseSkHynixEvents, SAMSUNG_SOURCE, SKHYNIX_SOURCE, validateEvents } from './calendar-data'
import type { CalendarData } from '../src/types'

const headers = { 'user-agent': 'Mozilla/5.0 (compatible; EarningsCalendarBot/1.0)' }

async function getText(url: string) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  return response.text()
}

async function main() {
  const now = new Date()
  const checkedAt = now.toISOString()
  const [samsungHtml, skHynixJson] = await Promise.all([
    getText(SAMSUNG_SOURCE),
    getText(SKHYNIX_SOURCE),
  ])
  const confirmed = [
    ...parseSamsungEvents(samsungHtml, checkedAt),
    ...parseSkHynixEvents(skHynixJson, checkedAt),
  ]
  const events = addEstimates(confirmed, now)
  validateEvents(events)

  const output: CalendarData = {
    generatedAt: checkedAt,
    timezone: 'Asia/Seoul',
    events,
  }
  await writeFile(resolve('src/data/events.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(`Updated ${events.length} events (${confirmed.length} confirmed records fetched).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
