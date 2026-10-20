import { useState } from 'react'
import { Link2, Plus, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import HabitChainCard from './HabitChainCard'
import Button from './ui/Button'
import Card from './ui/Card'
import Page from './ui/Page'
import PageHeader from './ui/PageHeader'
import Segmented from './ui/Segmented'
import { inputClass, labelClass, chipClass } from './ui/styles'

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
    <Page width="normal">
      <PageHeader
        title={t('habitsTitle')}
        subtitle={t('habitsSubtitle')}
        actions={
          <Button size="sm" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
            {adding ? <X size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
            {adding ? t('cancel') : t('addHabit')}
          </Button>
        }
      />

      {adding && (
        <Card as="form" onSubmit={handleSubmit} className="mb-5 sm:mb-6 max-w-[640px] flex flex-col gap-4">
          <div>
            <label htmlFor="habit-name" className={labelClass}>
              {t('habitNamePlaceholder')}
            </label>
            <input
              id="habit-name"
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('habitNamePlaceholder')}
              className={inputClass}
            />
          </div>

          <div>
            <div className={labelClass}>{t('challengeLength')}</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Segmented
                className="w-full sm:flex-1"
                value={customDays ? null : targetDays}
                onChange={(d) => {
                  setTargetDays(d)
                  setCustomDays('')
                }}
                options={PRESET_DAYS.map((d) => ({ value: d, label: t('challengeDays', { n: d }) }))}
              />
              <input
                type="number"
                min="1"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder={t('customDaysPlaceholder')}
                aria-label={t('customDaysPlaceholder')}
                className={`${inputClass} sm:!w-28 ${customDays ? '!border-blue' : ''}`}
              />
            </div>
          </div>

          <div>
            <div className={labelClass}>{t('subOptionsLabel')}</div>
            {subOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subOptions.map((opt) => (
                  <span key={opt} className={`${chipClass} h-8 pl-3 pr-1 max-w-full bg-accentSoft text-accentDark`}>
                    <span className="truncate">{opt}</span>
                    <button
                      type="button"
                      onClick={() => removeSubOption(opt)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-white/60"
                      aria-label={t('deleteOption')}
                    >
                      <X size={12} strokeWidth={2.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
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
                className={`${inputClass} flex-1 min-w-0`}
              />
              <Button type="button" variant="secondary" onClick={addSubOption} className="shrink-0">
                <Plus size={16} strokeWidth={3} />
                {t('addOption')}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1 sm:flex-none">
              {t('add')}
            </Button>
          </div>
        </Card>
      )}

      {habits.length === 0 && !adding ? (
        <Card className="flex flex-col items-center text-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orangeSoft">
            <Link2 size={28} strokeWidth={2.6} className="text-orange" />
          </div>
          <p className="text-[16px] font-bold text-textPrimary">{t('noHabitsYet')}</p>
          <Button onClick={() => setAdding(true)}>
            <Plus size={18} strokeWidth={3} />
            {t('addHabit')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
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
      )}
    </Page>
  )
}
