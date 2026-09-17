import { useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import ProgressBar from './ui/ProgressBar'

export default function PlanGoalCard({ goal, onUpdateProgress, onDelete }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(goal.currentProgress)

  function commitProgress() {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n)) onUpdateProgress(n)
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[14px] font-extrabold text-textPrimary">{goal.title}</div>
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

      <ProgressBar value={goal.currentProgress} max={goal.targetProgress} color="#1CB0F6" showLabel />
    </div>
  )
}
