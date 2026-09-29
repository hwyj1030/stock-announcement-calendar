export type Company = 'samsung' | 'skhynix'
export type EventStatus = 'confirmed' | 'estimated'

export interface EarningsEvent {
  id: string
  company: Company
  fiscalQuarter: string
  date: string
  time: string | null
  status: EventStatus
  sourceUrl: string
  sourceLabel: string
  checkedAt: string
  estimateMethod: string | null
}

export interface CalendarData {
  generatedAt: string
  timezone: 'Asia/Seoul'
  events: EarningsEvent[]
}
