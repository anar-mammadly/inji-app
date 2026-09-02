import { useState } from 'react'
import { Flame, X, Check, PartyPopper } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useTranslation } from '../i18n/LanguageContext'
import HabitChainLinks from './HabitChainLinks'

const SPORT_OPTIONS = ['running', 'gym', 'walk', 'yoga', 'other']
const SPORT_LABEL_KEYS = {
  running: 'sportRunning',
  gym: 'sportGym',
  walk: 'sportWalk',
  yoga: 'sportYoga',
  other: 'sportOther',
}

export default function HabitChainCard({ habit, log, onToggleToday, onToggleDay, onDelete }) {
  const { t } = useTranslation()
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const doneToday = !!log[todayKey]
  const [picking, setPicking] = useState(false)
  const [note, setNote] = useState('')

  const targetDays = habit.targetDays || 30
  const startDate = habit.startDate || todayKey
  const filledCount = Array.from({ length: targetDays }, (_, i) => format(addDays(new Date(startDate), i), 'yyyy-MM-dd')).filter(
    (key) => !!log[key],
  ).length
  const isComplete = filledCount >= targetDays

  function handlePrimaryToggle() {
    if (doneToday) {
      onToggleToday()
      return
    }
    if (habit.kind === 'sport') {
      setPicking(true)
      return
    }
    onToggleToday()
  }

  function confirmSport(option) {
    onToggleToday(t(SPORT_LABEL_KEYS[option]))
    setPicking(false)
  }

  function confirmSportFreeText() {
    const trimmed = note.trim()
    if (!trimmed) return
    onToggleToday(trimmed)
    setPicking(false)
    setNote('')
  }

  const todayNote = doneToday && typeof log[todayKey] === 'string' ? log[todayKey] : null
  const displayName = habit.kind === 'sport' ? t('habitSportName') : habit.name

  return (
    <div className="rounded-3xl border-2 border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-[15px] font-extrabold text-textPrimary">{displayName}</div>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-0.5" style={{ color: isComplete ? '#58CC02' : '#FF9600' }}>
            {isComplete ? <PartyPopper size={13} /> : <Flame size={13} fill="#FF9600" />}
            {isComplete ? t('challengeComplete') : t('challengeProgress', { done: filledCount, total: targetDays })}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrimaryToggle}
            className={`flex items-center justify-center rounded-full border-[2.5px] transition-all hover:scale-110 ${
              doneToday ? 'border-accent bg-accent' : 'border-borderStrong hover:border-accent'
            }`}
            style={{ width: 26, height: 26 }}
            aria-label={t('markToday')}
          >
            {doneToday && <Check size={15} strokeWidth={3} className="text-white" />}
          </button>
          <button onClick={onDelete} className="text-textMuted hover:text-coral transition-colors" aria-label={t('deleteHabit')}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {picking && (
        <div className="mb-3 p-3 rounded-2xl bg-surfaceAlt flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {SPORT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => confirmSport(opt)}
                className="px-3 py-1.5 rounded-xl text-[12px] font-bold border-2 border-border bg-surface text-textSecondary hover:bg-accentSoft hover:text-accentDark hover:border-accent transition-colors"
              >
                {t(SPORT_LABEL_KEYS[opt])}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmSportFreeText()}
              placeholder={t('sportFreeTextPlaceholder')}
              className="flex-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-xl border-2 border-border outline-none"
            />
            <button onClick={() => setPicking(false)} className="text-[11px] font-bold text-textMuted px-1">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {todayNote && (
        <div className="text-[11px] font-bold text-textMuted mb-2">
          {t('todayNote')}: {todayNote}
        </div>
      )}

      <HabitChainLinks
        startDate={startDate}
        targetDays={targetDays}
        log={log}
        color={habit.color || '#FF4B4B'}
        onToggleDay={onToggleDay}
      />
    </div>
  )
}
