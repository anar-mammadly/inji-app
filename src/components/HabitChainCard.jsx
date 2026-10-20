import { useState } from 'react'
import { Flame, X, PartyPopper, Plus, Pencil } from 'lucide-react'
import { addDays, format, parseISO, subDays } from 'date-fns'
import { useTranslation } from '../i18n/LanguageContext'
import HabitChainLinks from './HabitChainLinks'
import Card from './ui/Card'
import Button from './ui/Button'
import ProgressBar from './ui/ProgressBar'
import { inputClass, chipClass, iconButtonClass } from './ui/styles'

// soft tint of the habit's own color for badges / chips
function tint(color, alpha = '22') {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : '#F1F4F9'
}

export default function HabitChainCard({ habit, log, onToggleToday, onToggleDay, onDelete, onEdit, onAddOption, onDeleteOption }) {
  const { t } = useTranslation()
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const doneToday = !!log[todayKey]
  const [picking, setPicking] = useState(false)
  const [note, setNote] = useState('')
  const [addingOption, setAddingOption] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const targetDays = habit.targetDays || 30
  const startDate = habit.startDate || todayKey
  const subOptions = habit.subOptions || []
  const color = habit.color || '#FF4B4B'
  const filledCount = Array.from({ length: targetDays }, (_, i) => format(addDays(parseISO(startDate), i), 'yyyy-MM-dd')).filter(
    (key) => !!log[key],
  ).length
  const isComplete = filledCount >= targetDays

  // current run of consecutive done days, ending today (or yesterday while today is still open)
  let streak = 0
  for (let d = doneToday ? new Date() : subDays(new Date(), 1); log[format(d, 'yyyy-MM-dd')]; d = subDays(d, 1)) streak++

  function handleChainToggle(dateISO) {
    if (dateISO === todayKey) {
      if (doneToday) {
        onToggleToday()
        return
      }
      if (subOptions.length > 0) {
        setPicking(true)
        return
      }
      onToggleToday()
      return
    }
    onToggleDay(dateISO)
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
  const displayName = habit.kind === 'sport' && habit.name === 'Sport' ? t('habitSportName') : habit.name

  function startEditingName() {
    setNameValue(displayName)
    setEditingName(true)
  }

  function commitName() {
    const trimmed = nameValue.trim()
    if (trimmed) onEdit(trimmed)
    setEditingName(false)
  }

  return (
    <Card className="min-w-0 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* streak badge */}
        <div
          className="shrink-0 flex flex-col items-center justify-center h-12 w-12 rounded-2xl"
          style={{ background: isComplete ? '#DFFAB8' : streak > 0 ? '#FFE8CC' : '#F1F4F9' }}
          title={t('streak', { n: streak })}
        >
          {isComplete ? (
            <PartyPopper size={20} strokeWidth={2.5} className="text-accentDark" />
          ) : (
            <Flame
              size={20}
              strokeWidth={2.5}
              className={streak > 0 ? 'text-orange' : 'text-borderStrong'}
              fill={streak > 0 ? '#FFC800' : 'none'}
            />
          )}
          <span
            className={`text-[12px] leading-none font-extrabold tabular-nums mt-0.5 ${
              isComplete ? 'text-accentDark' : streak > 0 ? 'text-orangeDark' : 'text-textMuted'
            }`}
          >
            {isComplete ? filledCount : streak}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                else if (e.key === 'Escape') setEditingName(false)
              }}
              onBlur={commitName}
              className="w-full h-8 text-[17px] font-extrabold text-textPrimary outline-none bg-transparent border-b-2 border-blue"
            />
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <h2 className="text-[17px] leading-8 font-extrabold text-textPrimary truncate">{displayName}</h2>
              <button onClick={startEditingName} className={`${iconButtonClass} shrink-0 !h-7 !w-7`} aria-label={t('editHabit')}>
                <Pencil size={13} strokeWidth={2.5} />
              </button>
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={chipClass}
              style={isComplete ? { background: '#DFFAB8', color: '#46A302' } : { background: tint(color), color: '#3C3C3C' }}
            >
              {isComplete ? t('challengeComplete') : t('challengeProgress', { done: filledCount, total: targetDays })}
            </span>
            {streak > 0 && !isComplete && (
              <span className={`${chipClass} bg-orangeSoft text-orangeDark`}>{t('streak', { n: streak })}</span>
            )}
          </div>
        </div>

        <button
          onClick={onDelete}
          className={`${iconButtonClass} shrink-0 -mr-1 hover:!bg-pomSoft hover:!text-coral`}
          aria-label={t('deleteHabit')}
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      <ProgressBar value={filledCount} max={targetDays} color={isComplete ? '#58CC02' : color} height={10} />

      {picking && (
        <div className="p-3 rounded-2xl border-2 border-border bg-surfaceAlt flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {subOptions.map((opt) => (
              <div key={opt} className="relative max-w-full">
                <button
                  onClick={() => confirmOption(opt)}
                  className="press max-w-full truncate h-9 pl-3.5 pr-8 rounded-xl text-[13px] font-bold border-2 border-border bg-white text-textPrimary shadow-[0_3px_0_#E5E7EB] hover:border-accent hover:bg-accentSoft hover:text-accentDark transition-colors"
                >
                  {opt}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteOption(opt)
                  }}
                  aria-label={t('deleteOption')}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg text-textMuted hover:text-coral hover:bg-pomSoft transition-colors"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {addingOption ? (
              <input
                autoFocus
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitNewOption()}
                onBlur={() => !newOption.trim() && setAddingOption(false)}
                placeholder={t('newOptionPlaceholder')}
                className="w-36 h-9 px-3 rounded-xl border-2 border-blue bg-white text-[13px] font-semibold text-textPrimary placeholder:text-textMuted outline-none"
              />
            ) : (
              <button
                onClick={() => setAddingOption(true)}
                className="h-9 px-3 rounded-xl text-[13px] font-bold border-2 border-dashed border-borderStrong text-textMuted hover:border-accent hover:text-accentDark transition-colors flex items-center gap-1"
              >
                <Plus size={14} strokeWidth={3} />
                {t('addOption')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmFreeText()}
              placeholder={t('sportFreeTextPlaceholder')}
              className={`${inputClass} flex-1 min-w-0`}
            />
            <Button variant="ghost" onClick={() => setPicking(false)} className="shrink-0 !px-3">
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {todayNote && (
        <div className="flex items-center gap-1.5 min-w-0 text-[13px] font-medium text-textSecondary">
          <span className={`${chipClass} shrink-0 bg-accentSoft text-accentDark`}>{t('todayNote')}</span>
          <span className="truncate">{todayNote}</span>
        </div>
      )}

      <HabitChainLinks startDate={startDate} targetDays={targetDays} log={log} color={color} onToggleDay={handleChainToggle} />
    </Card>
  )
}
