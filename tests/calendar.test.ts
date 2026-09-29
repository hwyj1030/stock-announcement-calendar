import { describe, expect, it } from 'vitest'
import { getCalendarDays } from '../src/calendar'

describe('calendar grid', () => {
  it('covers month boundaries with complete weeks', () => {
    const days = getCalendarDays(new Date(2026, 8, 1))
    expect(days.length).toBe(35)
    expect(days[0].getDay()).toBe(0)
    expect(days.at(-1)?.getDay()).toBe(6)
  })

  it('contains leap day', () => {
    const days = getCalendarDays(new Date(2028, 1, 1))
    expect(days.some((day) => day.getFullYear() === 2028 && day.getMonth() === 1 && day.getDate() === 29)).toBe(true)
  })
})
