import { useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import { requestNotificationPermission } from '../hooks/useReminders'
import ProgressBar from './ui/ProgressBar'

const REMINDER_OPTIONS = [
  { value: '', minutes: null },
  { value: '60', minutes: 60 },
  { value: '180', minutes: 180 },
  { value: '360', minutes: 360 },
  { value: '1440', minutes: 1440 },
]

export default function LearningGoalCard({ goal, onUpdateProgress, onSetReminder, onDelete }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(goal.currentProgress)

  function commitProgress() {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n)) onUpdateProgress(n)
  }

  async function handleReminderChange(e) {
    const minutes = e.target.value ? Number(e.target.value) : null
    if (minutes) {
      const granted = await requestNotificationPermission()
      if (!granted) return
    }
    onSetReminder(minutes)
  }

  return (
    <div className="rounded-3xl border-2 border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[15px] font-extrabold text-textPrimary">{goal.title}</div>
        <button onClick={onDelete} className="text-textMuted hover:text-coral transition-colors shrink-0">
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>

      <div className="text-[11px] font-bold text-textMuted mb-3">
        {format(new Date(goal.startDate), 'd MMM')}
        {goal.targetDate && ` → ${format(new Date(goal.targetDate), 'd MMM yyyy')}`}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="number"
          min="0"
          max={goal.targetProgress}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commitProgress}
          onKeyDown={(e) => e.key === 'Enter' && commitProgress()}
          className="w-16 text-[13px] font-bold px-2 py-1.5 rounded-xl border-2 border-border outline-none text-right focus:border-accent"
        />
        <span className="text-[12px] font-bold text-textMuted">/ {goal.targetProgress} {goal.unit}</span>
      </div>

      <ProgressBar value={goal.currentProgress} max={goal.targetProgress} color="#CE82FF" showLabel />

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] font-bold text-textMuted">{t('reminderEvery')}</span>
        <select
          value={goal.reminderIntervalMinutes || ''}
          onChange={handleReminderChange}
          className="text-[11px] font-bold px-2 py-1 rounded-xl border-2 border-border outline-none text-textSecondary"
        >
          {REMINDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.minutes ? t('reminderHours', { n: opt.minutes / 60 }) : t('reminderNone')}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
