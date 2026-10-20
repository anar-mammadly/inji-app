import { useState } from 'react'
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  parseISO,
} from 'date-fns'
import { az } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Check, Pencil, X, Clock, CalendarDays } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Card from './ui/Card'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import TimeInput24 from './TimeInput24'
import { inputClass } from './ui/styles'

const WEEKDAY_LABELS_AZ = ['B.E', 'Ç.A', 'Ç', 'C.A', 'C', 'Ş', 'B']
const WEEKDAY_LABELS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const navButtonClass =
  'press flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-white text-textSecondary shadow-[0_3px_0_#E5E7EB] transition-colors hover:bg-surfaceAlt hover:text-blueDark'

function EventItem({ event, onToggleDone, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [time, setTime] = useState(event.time || '')

  function commit() {
    const trimmed = title.trim()
    if (!trimmed) return
    onEdit({ title: trimmed, time: time || null })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-3 rounded-2xl border-2 border-blue bg-blueSoft/40 flex flex-col gap-2.5">
        <div className="flex flex-wrap gap-2">
          <TimeInput24 value={time} onChange={setTime} size="sm" />
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="flex-1 min-w-[140px] h-9 px-3 rounded-xl border-2 border-border bg-white text-[14px] font-medium text-textPrimary outline-none transition-colors focus:border-blue"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
            {t('cancel')}
          </Button>
          <Button size="sm" onClick={commit}>
            {t('save')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors ${
        event.done ? 'border-transparent bg-surfaceAlt' : 'border-border bg-white shadow-[0_2px_0_#E5E7EB]'
      }`}
    >
      <button
        onClick={onToggleDone}
        className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-all ${
          event.done ? 'bg-accent border-2 border-accentDark' : 'border-[2.5px] border-borderStrong hover:border-accent hover:scale-110'
        }`}
        aria-label={t('markDone')}
        aria-pressed={!!event.done}
      >
        {event.done && <Check size={14} strokeWidth={3.5} className="text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        {event.time && (
          <span
            className={`mb-1 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-bold tabular-nums ${
              event.done ? 'bg-white text-textMuted' : 'bg-orangeSoft text-orangeDark'
            }`}
          >
            <Clock size={11} strokeWidth={2.6} />
            {event.time}
          </span>
        )}
        <div className={`text-[14px] font-medium break-words ${event.done ? 'line-through text-textMuted' : 'text-textPrimary'}`}>
          {event.title}
        </div>
      </div>
      <div className="flex items-center shrink-0 -mr-1">
        <button
          onClick={() => setEditing(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-textMuted transition-colors hover:bg-surfaceAlt hover:text-textSecondary"
          aria-label={t('editEntry')}
        >
          <Pencil size={14} strokeWidth={2.5} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-textMuted transition-colors hover:bg-pomSoft hover:text-coral"
          aria-label={t('deleteEntry')}
        >
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}

function DayDetailModal({ open, onClose, dateKey, events, lang, onAdd, onToggleDone, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, time || null)
    setTitle('')
    setTime('')
  }

  const sorted = [...events].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
  const dateLabel = dateKey ? format(parseISO(dateKey), 'd MMMM yyyy, EEEE', { locale: lang === 'az' ? az : undefined }) : ''

  return (
    <Modal open={open} onClose={onClose} title={dateLabel}>
      <div className="flex flex-wrap gap-2 mb-3">
        <TimeInput24 value={time} onChange={setTime} size="md" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('eventTitlePlaceholder')}
          className={`${inputClass.replace('w-full', '')} flex-1 min-w-[160px]`}
        />
      </div>
      <Button onClick={submit} className="w-full mb-5">
        {t('addEvent')}
      </Button>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CalendarDays size={30} strokeWidth={2.2} className="text-borderStrong" />
          <p className="text-[14px] font-bold text-textMuted">{t('noEvents')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onToggleDone={() => onToggleDone(event.id)}
              onEdit={(data) => onEdit(event.id, data)}
              onDelete={() => onDelete(event.id)}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function CalendarPage({ events, onAddEvent, onEditEvent, onDeleteEvent, onToggleEventDone }) {
  const { t, lang } = useTranslation()
  const [cursor, setCursor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const eventsByDate = {}
  events.forEach((e) => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  })

  const weekdayLabels = lang === 'az' ? WEEKDAY_LABELS_AZ : WEEKDAY_LABELS_EN
  const locale = lang === 'az' ? az : undefined
  const viewingCurrentMonth = isSameMonth(cursor, new Date())

  return (
    <Page width="normal">
      <PageHeader title={t('calendarTitle')} />

      <Card className="p-3 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="truncate text-[18px] sm:text-[20px] font-extrabold text-textPrimary capitalize">
              {format(cursor, 'LLLL yyyy', { locale })}
            </h2>
            {!viewingCurrentMonth && (
              <button
                onClick={() => setCursor(new Date())}
                className="press shrink-0 h-8 px-3 rounded-xl bg-blueSoft text-blueDark text-[12px] font-extrabold shadow-[0_3px_0_#B5E5FB]"
              >
                {t('todayPanel')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setCursor((c) => subMonths(c, 1))} className={navButtonClass} aria-label="Previous month">
              <ChevronLeft size={18} strokeWidth={2.6} />
            </button>
            <button onClick={() => setCursor((c) => addMonths(c, 1))} className={navButtonClass} aria-label="Next month">
              <ChevronRight size={18} strokeWidth={2.6} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 sm:mb-2">
          {weekdayLabels.map((label) => (
            <div key={label} className="text-center text-[11px] sm:text-[12px] font-bold text-textMuted truncate">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dateKey] || []
            const hasEvents = dayEvents.length > 0
            const allDone = hasEvents && dayEvents.every((e) => e.done)
            const inMonth = isSameMonth(day, cursor)
            const today = isToday(day)
            const preview = [...dayEvents].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                aria-label={format(day, 'd MMMM yyyy', { locale })}
                className={`group relative min-w-0 aspect-square sm:aspect-auto sm:h-24 lg:h-28 overflow-hidden rounded-xl sm:rounded-2xl border-2 p-0.5 sm:p-1.5 flex flex-col items-center sm:items-stretch justify-center sm:justify-start gap-1 transition-colors ${
                  today
                    ? 'border-accent bg-accentSoft/50'
                    : inMonth
                      ? 'border-border bg-white hover:border-blue'
                      : 'border-transparent bg-surfaceAlt/70 hover:border-border'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center h-6 min-w-[24px] sm:self-start sm:px-1.5 rounded-full text-[13px] sm:text-[14px] tabular-nums ${
                    today
                      ? 'bg-accent text-white font-extrabold px-1.5'
                      : inMonth
                        ? `text-textPrimary ${hasEvents ? 'font-extrabold' : 'font-semibold'}`
                        : 'text-textMuted font-semibold'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* phones: a single status dot */}
                {hasEvents && (
                  <span
                    className="sm:hidden h-1.5 w-1.5 rounded-full"
                    style={{ background: allDone ? '#58CC02' : '#FF9600' }}
                  />
                )}

                {/* tablet / desktop: event title previews */}
                {hasEvents && (
                  <span className={`hidden sm:flex flex-col gap-1 min-w-0 w-full ${inMonth ? '' : 'opacity-60'}`}>
                    {preview.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className={`block truncate text-left h-5 leading-5 px-1.5 rounded-md text-[11px] font-semibold ${
                          e.done ? 'bg-accentSoft text-accentDark line-through' : 'bg-orangeSoft text-orangeDark'
                        }`}
                      >
                        {e.time ? `${e.time} ` : ''}
                        {e.title}
                      </span>
                    ))}
                    {preview.length > 2 && (
                      <span className="text-left px-1.5 text-[11px] font-bold text-textMuted">+{preview.length - 2}</span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <DayDetailModal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        dateKey={selectedDate}
        events={selectedDate ? eventsByDate[selectedDate] || [] : []}
        lang={lang}
        onAdd={(title, time) => onAddEvent(selectedDate, title, time)}
        onToggleDone={onToggleEventDone}
        onEdit={onEditEvent}
        onDelete={onDeleteEvent}
      />
    </Page>
  )
}
