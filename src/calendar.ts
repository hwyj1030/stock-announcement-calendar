import {
  addDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { EarningsEvent } from './types'

export const getCalendarDays = (month: Date): Date[] => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const last = endOfMonth(month)
  const days: Date[] = []
  let cursor = start

  while (days.length < 42 && (days.length < 35 || cursor <= last)) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

export const eventsOnDate = (events: EarningsEvent[], date: Date) =>
  events.filter((event) => isSameDay(parseISO(event.date), date))

export const monthLabel = (month: Date) => format(month, 'yyyy년 M월')
export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd')
export { isSameMonth }
