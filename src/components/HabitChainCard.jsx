import { useState } from 'react'
import { Flame, X, Check, PartyPopper, Plus } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useTranslation } from '../i18n/LanguageContext'
import HabitChainLinks from './HabitChainLinks'

export default function HabitChainCard({ habit, log, onToggleToday, onToggleDay, onDelete, onAddOption, onDeleteOption }) {
  const { t } = useTranslation()
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const doneToday = !!log[todayKey]
  const [picking, setPicking] = useState(false)
  const [note, setNote] = useState('')
  const [addingOption, setAddingOption] = useState(false)
  const [newOption, setNewOption] = useState('')

  const targetDays = habit.targetDays || 30
  const startDate = habit.startDate || todayKey
  const subOptions = habit.subOptions || []
  const filledCount = Array.from({ length: targetDays }, (_, i) => format(addDays(new Date(startDate), i), 'yyyy-MM-dd')).filter(
    (key) => !!log[key],
  ).length
  const isComplete = filledCount >= targetDays

  function handlePrimaryToggle() {
    if (doneToday) {
      onToggleToday()
      return
    }
    if (subOptions.length > 0) {
      setPicking(true)
      return
    }
    onToggleToday()
  }

  function confirmOption(option) {
    onToggleToday(option)
    setPicking(false)
  }

  function confirmFreeText() {
    const trimmed = note.trim()
    if (!trimmed) return
    onToggleToday(trimmed)
    setPicking(false)
    setNote('')
  }

  function submitNewOption() {
    const trimmed = newOption.trim()
    if (!trimmed) return
    onAddOption(trimmed)
    setNewOption('')
    setAddingOption(false)
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
            {subOptions.map((opt) => (
              <div key={opt} className="group relative">
                <button
                  onClick={() => confirmOption(opt)}
                  className="px-3 py-1.5 pr-6 rounded-xl text-[12px] font-bold border-2 border-border bg-surface text-textSecondary hover:bg-accentSoft hover:text-accentDark hover:border-accent transition-colors"
                >
                  {opt}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteOption(opt)
                  }}
                  aria-label={t('deleteOption')}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 flex items-center justify-center rounded-full text-textMuted hover:text-coral hover:bg-bg transition-colors"
                  style={{ width: 16, height: 16 }}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {addingOption ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitNewOption()}
                  onBlur={() => !newOption.trim() && setAddingOption(false)}
                  placeholder={t('newOptionPlaceholder')}
                  className="w-28 px-2 py-1.5 text-[12px] font-semibold rounded-xl border-2 border-accent outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingOption(true)}
                className="px-2.5 py-1.5 rounded-xl text-[12px] font-bold border-2 border-dashed border-borderStrong text-textMuted hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
              >
                <Plus size={12} strokeWidth={3} />
                {t('addOption')}
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmFreeText()}
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
