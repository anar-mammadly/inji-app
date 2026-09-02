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
} from 'date-fns'
import { az } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Check, Pencil, X, Clock } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import Modal from './ui/Modal'
import Button from './ui/Button'
import TimeInput24 from './TimeInput24'

const WEEKDAY_LABELS_AZ = ['B.E', 'Ç.A', 'Ç', 'C.A', 'C', 'Ş', 'B']
const WEEKDAY_LABELS_EN = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

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
      <div className="p-3 rounded-xl border-2 border-accent bg-surfaceAlt flex flex-col gap-2">
        <div className="flex gap-2">
          <TimeInput24
            value={time}
            onChange={setTime}
            className="w-16 px-2 py-1.5 text-[12px] font-bold rounded-lg border-2 border-border outline-none text-center"
          />
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="flex-1 px-2.5 py-1.5 text-[13px] font-semibold rounded-lg border-2 border-border outline-none"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" onClick={commit}>
            {t('save')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 border-border ${
        event.done ? 'bg-surfaceAlt opacity-60' : 'bg-surface'
      }`}
    >
      <button
        onClick={onToggleDone}
        className={`flex items-center justify-center rounded-full border-[2.5px] shrink-0 transition-all hover:scale-110 ${
          event.done ? 'border-accent bg-accent' : 'border-borderStrong hover:border-accent'
        }`}
        style={{ width: 22, height: 22 }}
        aria-label={t('markDone')}
      >
        {event.done && <Check size={13} strokeWidth={3} className="text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        {event.time && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-textMuted">
            <Clock size={10} strokeWidth={2.5} />
            {event.time}
          </div>
        )}
        <div className={`text-[13px] font-semibold ${event.done ? 'line-through text-textMuted' : 'text-textPrimary'}`}>
          {event.title}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => setEditing(true)} className="text-textMuted hover:text-textSecondary transition-colors" aria-label={t('editEntry')}>
          <Pencil size={12} strokeWidth={2.5} />
        </button>
        <button onClick={onDelete} className="text-textMuted hover:text-coral transition-colors" aria-label={t('deleteEntry')}>
          <X size={13} strokeWidth={2.5} />
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
  const dateLabel = dateKey ? format(new Date(dateKey), 'd MMMM yyyy, EEEE', { locale: lang === 'az' ? az : undefined }) : ''

  return (
    <Modal open={open} onClose={onClose} title={dateLabel}>
      <div className="flex gap-2 mb-3">
        <TimeInput24
          value={time}
          onChange={setTime}
          className="w-20 px-2 py-2 text-[13px] font-bold rounded-xl border-2 border-border outline-none text-center"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('eventTitlePlaceholder')}
          className="flex-1 px-3 py-2 text-[13px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent"
        />
      </div>
      <Button size="sm" onClick={submit} className="w-full mb-3">
        {t('addEvent')}
      </Button>

      {sorted.length === 0 ? (
        <div className="text-sm font-bold text-textMuted text-center py-4">{t('noEvents')}</div>
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

  return (
    <div className="flex-1 px-6 py-8 max-w-[640px] mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-textPrimary">{t('calendarTitle')}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-border text-textSecondary hover:border-accent hover:text-accent transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <div className="text-[13px] font-extrabold text-textPrimary w-32 text-center capitalize">
            {format(cursor, 'LLLL yyyy', { locale: lang === 'az' ? az : undefined })}
          </div>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-border text-textSecondary hover:border-accent hover:text-accent transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {weekdayLabels.map((label) => (
          <div key={label} className="text-center text-[10px] font-extrabold text-textMuted uppercase">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate[dateKey] || []
          const hasEvents = dayEvents.length > 0
          const allDone = hasEvents && dayEvents.every((e) => e.done)
          const inMonth = isSameMonth(day, cursor)
          const today = isToday(day)

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 transition-colors hover:border-accent ${
                today ? 'border-accent' : 'border-border'
              } ${inMonth ? 'bg-surface' : 'bg-surfaceAlt opacity-40'}`}
            >
              <span
                className={`text-[13px] ${hasEvents ? 'font-extrabold' : 'font-semibold'} ${
                  inMonth ? 'text-textPrimary' : 'text-textMuted'
                }`}
              >
                {format(day, 'd')}
              </span>
              {hasEvents && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: allDone ? '#58CC02' : '#FF9600' }} />
              )}
            </button>
          )
        })}
      </div>

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
    </div>
  )
}
