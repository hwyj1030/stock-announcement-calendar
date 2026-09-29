import { useMemo, useState } from 'react'
import {
  addMonths,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Info,
  RefreshCw,
} from 'lucide-react'
import rawData from './data/events.json'
import { dateKey, eventsOnDate, getCalendarDays, isSameMonth, monthLabel } from './calendar'
import type { CalendarData, Company, EarningsEvent } from './types'

const data = rawData as CalendarData

const COMPANY = {
  samsung: { name: '삼성전자', ticker: '005930', short: '삼성전자' },
  skhynix: { name: 'SK하이닉스', ticker: '000660', short: 'SK하이닉스' },
} satisfies Record<Company, { name: string; ticker: string; short: string }>

const getVisibleEvents = (events: EarningsEvent[]) => {
  const today = startOfDay(new Date())
  const from = subMonths(today, 12)
  const futureByCompany = new Map<Company, number>()

  return [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((event) => {
      const date = parseISO(event.date)
      if (!isBefore(date, from) && !isAfter(date, today)) return true
      if (isAfter(date, today) || isSameDay(date, today)) {
        const count = futureByCompany.get(event.company) ?? 0
        if (count < 2) {
          futureByCompany.set(event.company, count + 1)
          return true
        }
      }
      return false
    })
}

function EventPill({ event, onClick }: { event: EarningsEvent; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`event-pill ${event.company} ${event.status}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={`${COMPANY[event.company].name} ${event.fiscalQuarter} 실적발표, ${event.status === 'confirmed' ? '확정' : '예상'}`}
    >
      <span>{COMPANY[event.company].short}</span>
      {event.status === 'estimated' && <em>예상</em>}
    </button>
  )
}

function EventDetail({ event }: { event: EarningsEvent }) {
  const date = parseISO(event.date)
  return (
    <article className={`event-card ${event.company}`}>
      <div className="event-card-accent" />
      <div className="event-card-main">
        <div className="event-heading">
          <div>
            <div className="company-line">
              <span className={`company-mark ${event.company}`} aria-hidden="true" />
              <strong>{COMPANY[event.company].name}</strong>
              <span className="ticker">{COMPANY[event.company].ticker}</span>
            </div>
            <h3>{event.fiscalQuarter} 실적발표</h3>
          </div>
          <span className={`status-badge ${event.status}`}>
            {event.status === 'confirmed' ? <Check size={14} /> : <Clock3 size={14} />}
            {event.status === 'confirmed' ? '확정' : '예상'}
          </span>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>발표일</dt>
            <dd>{format(date, 'yyyy년 M월 d일 (EEE)', { locale: ko })}</dd>
          </div>
          <div>
            <dt>발표 시각</dt>
            <dd>{event.time ? `${event.time} KST` : '미정'}</dd>
          </div>
        </dl>
        {event.status === 'estimated' && (
          <p className="estimate-note"><Info size={15} />{event.estimateMethod}</p>
        )}
        <div className="source-row">
          <span>확인 {format(parseISO(event.checkedAt), 'yyyy.MM.dd')}</span>
          <a href={event.sourceUrl} target="_blank" rel="noreferrer">
            {event.sourceLabel}<ExternalLink size={14} />
          </a>
        </div>
      </div>
    </article>
  )
}

export function App() {
  const today = startOfDay(new Date())
  const initialEvents = useMemo(() => getVisibleEvents(data.events), [])
  const nextEvent = initialEvents.find((event) => !isBefore(parseISO(event.date), today))
  const [month, setMonth] = useState(nextEvent ? startOfDay(parseISO(nextEvent.date)) : today)
  const [selectedDate, setSelectedDate] = useState<Date>(nextEvent ? parseISO(nextEvent.date) : today)
  const [companies, setCompanies] = useState<Set<Company>>(new Set(['samsung', 'skhynix']))

  const filteredEvents = initialEvents.filter((event) => companies.has(event.company))
  const days = getCalendarDays(month)
  const selectedEvents = eventsOnDate(filteredEvents, selectedDate)
  const monthEventCount = filteredEvents.filter((event) => isSameMonth(parseISO(event.date), month)).length

  const toggleCompany = (company: Company) => {
    setCompanies((current) => {
      const next = new Set(current)
      if (next.has(company) && next.size > 1) next.delete(company)
      else next.add(company)
      return next
    })
  }

  const selectDay = (day: Date) => {
    setSelectedDate(day)
    if (!isSameMonth(day, month)) setMonth(day)
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#calendar" aria-label="반도체 실적 캘린더 홈">
          <span className="brand-icon"><CalendarDays size={20} /></span>
          <span>반도체 실적 캘린더</span>
        </a>
        <div className="updated"><RefreshCw size={14} /> {format(parseISO(data.generatedAt), 'M월 d일 업데이트')}</div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">EARNINGS CALENDAR</p>
          <h1 id="page-title">놓치지 말아야 할<br />반도체 실적 일정</h1>
        </div>
        <p className="intro-copy">삼성전자와 SK하이닉스의 분기 실적발표일을<br className="desktop-only" /> 공식 IR 자료를 기준으로 정리했습니다.</p>
      </section>

      <section id="calendar" className="calendar-shell" aria-label="실적발표 캘린더">
        <div className="calendar-toolbar">
          <div className="month-control">
            <button type="button" onClick={() => setMonth(addMonths(month, -1))} aria-label="이전 달"><ChevronLeft /></button>
            <h2 aria-live="polite">{monthLabel(month)}</h2>
            <button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="다음 달"><ChevronRight /></button>
            <button className="today-button" type="button" onClick={() => { setMonth(today); setSelectedDate(today) }}>오늘</button>
          </div>
          <div className="filters" aria-label="기업 필터">
            {(Object.keys(COMPANY) as Company[]).map((company) => (
              <button
                type="button"
                key={company}
                aria-pressed={companies.has(company)}
                className={`filter-chip ${company} ${companies.has(company) ? 'active' : ''}`}
                onClick={() => toggleCompany(company)}
              >
                <span />{COMPANY[company].name}
              </button>
            ))}
          </div>
        </div>

        <div className="calendar-meta">
          <span>{monthEventCount ? `${monthEventCount}개의 발표 일정` : '등록된 발표 일정이 없어요'}</span>
          <div className="legend"><span><i className="confirmed-dot" />확정</span><span><i className="estimated-ring" />예상</span></div>
        </div>

        <div className="weekdays" aria-hidden="true">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid" role="grid" aria-label={monthLabel(month)}>
          {days.map((day) => {
            const dayEvents = eventsOnDate(filteredEvents, day)
            const selected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, today)
            return (
              <button
                type="button"
                role="gridcell"
                key={dateKey(day)}
                className={`day-cell ${!isSameMonth(day, month) ? 'outside' : ''} ${selected ? 'selected' : ''}`}
                onClick={() => selectDay(day)}
                aria-selected={selected}
                aria-label={`${format(day, 'M월 d일 EEEE', { locale: ko })}${dayEvents.length ? `, 일정 ${dayEvents.length}개` : ''}`}
              >
                <span className={`day-number ${isToday ? 'today' : ''}`}>{format(day, 'd')}</span>
                <div className="desktop-events">
                  {dayEvents.map((event) => <EventPill key={event.id} event={event} onClick={() => setSelectedDate(day)} />)}
                </div>
                <div className="mobile-dots" aria-hidden="true">
                  {dayEvents.map((event) => <i key={event.id} className={`${event.company} ${event.status}`} />)}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="details" aria-labelledby="selected-date-title">
        <div className="details-title">
          <div>
            <p>선택한 날짜</p>
            <h2 id="selected-date-title">{format(selectedDate, 'M월 d일 EEEE', { locale: ko })}</h2>
          </div>
          <span>{selectedEvents.length}건</span>
        </div>
        <div className="event-list">
          {selectedEvents.length ? selectedEvents.map((event) => <EventDetail key={event.id} event={event} />) : (
            <div className="empty-state"><CalendarDays /><p>이 날짜에는 실적발표 일정이 없습니다.</p></div>
          )}
        </div>
      </section>

      <footer>
        <p><Info size={14} /> 예상 일정은 과거 발표 패턴을 바탕으로 산출되며 변경될 수 있습니다. 투자 판단의 근거로 사용하지 마세요.</p>
        <span>데이터 출처: 삼성전자 IR · SK하이닉스 IR</span>
      </footer>
    </main>
  )
}
