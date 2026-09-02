import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import HabitChainCard from './HabitChainCard'
import Button from './ui/Button'

const PRESET_DAYS = [10, 30, 100]
const HABIT_COLORS = ['#FF4B4B', '#1CB0F6', '#CE82FF', '#FF9600', '#58CC02']

export default function HabitsPage({
  habits,
  habitLog,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleToday,
  onToggleDay,
  onAddOption,
  onDeleteOption,
}) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [targetDays, setTargetDays] = useState(30)
  const [customDays, setCustomDays] = useState('')
  const [subOptions, setSubOptions] = useState([])
  const [newSubOption, setNewSubOption] = useState('')

  function addSubOption() {
    const trimmed = newSubOption.trim()
    if (!trimmed || subOptions.includes(trimmed)) return
    setSubOptions((opts) => [...opts, trimmed])
    setNewSubOption('')
  }

  function removeSubOption(label) {
    setSubOptions((opts) => opts.filter((o) => o !== label))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const days = customDays ? Math.max(1, parseInt(customDays, 10) || 30) : targetDays
    const color = HABIT_COLORS[habits.length % HABIT_COLORS.length]
    onAddHabit(trimmed, { targetDays: days, color, subOptions })
    setName('')
    setCustomDays('')
    setTargetDays(30)
    setSubOptions([])
    setNewSubOption('')
    setAdding(false)
  }

  return (
    <div className="flex-1 px-6 py-8 max-w-[640px] mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-textPrimary">{t('habitsTitle')}</h1>
        <button
          onClick={() => setAdding((a) => !a)}
          className="flex items-center gap-1 text-[12px] font-extrabold text-accent"
        >
          <Plus size={16} strokeWidth={3} />
          {t('addHabit')}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 rounded-2xl border-2 border-border bg-surface flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('habitNamePlaceholder')}
            className="w-full px-3 py-1.5 text-[13px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent"
          />

          <div className="text-[11px] font-extrabold uppercase tracking-wide text-textMuted mt-1">
            {t('challengeLength')}
          </div>
          <div className="flex gap-1.5">
            {PRESET_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setTargetDays(d)
                  setCustomDays('')
                }}
                className={`flex-1 px-2 py-1.5 rounded-xl text-[12px] font-bold border-2 transition-colors ${
                  targetDays === d && !customDays
                    ? 'bg-accentSoft text-accentDark border-accentSoft'
                    : 'border-border text-textMuted'
                }`}
              >
                {t('challengeDays', { n: d })}
              </button>
            ))}
            <input
              type="number"
              min="1"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder={t('customDaysPlaceholder')}
              className="w-20 px-2 py-1.5 text-[12px] font-bold rounded-xl border-2 border-border outline-none focus:border-accent"
            />
          </div>

          <div className="text-[11px] font-extrabold uppercase tracking-wide text-textMuted mt-1">
            {t('subOptionsLabel')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {subOptions.map((opt) => (
              <span
                key={opt}
                className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-xl text-[12px] font-bold border-2 border-accentSoft bg-accentSoft text-accentDark"
              >
                {opt}
                <button
                  type="button"
                  onClick={() => removeSubOption(opt)}
                  className="flex items-center justify-center rounded-full hover:bg-white/40"
                  style={{ width: 16, height: 16 }}
                  aria-label={t('deleteOption')}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newSubOption}
              onChange={(e) => setNewSubOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSubOption()
                }
              }}
              placeholder={t('newOptionPlaceholder')}
              className="flex-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addSubOption}>
              {t('addOption')}
            </Button>
          </div>

          <Button type="submit" size="sm" className="mt-1">
            {t('add')}
          </Button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {habits.map((habit) => (
          <HabitChainCard
            key={habit.id}
            habit={habit}
            log={habitLog[habit.id] || {}}
            onToggleToday={(note) => onToggleToday(habit.id, note)}
            onToggleDay={(dateISO) => onToggleDay(habit.id, dateISO)}
            onDelete={() => onDeleteHabit(habit.id)}
            onEdit={(name) => onEditHabit(habit.id, name)}
            onAddOption={(label) => onAddOption(habit.id, label)}
            onDeleteOption={(label) => onDeleteOption(habit.id, label)}
          />
        ))}
      </div>
    </div>
  )
}
