import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { X, Target, CalendarDays } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import ProgressBar from './ui/ProgressBar'

export default function PlanGoalCard({ goal, onUpdateProgress, onDelete }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(goal.currentProgress)
  const reached = goal.targetProgress > 0 && goal.currentProgress >= goal.targetProgress

  function commitProgress() {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n)) onUpdateProgress(n)
  }

  return (
    <div className="rounded-3xl border-2 border-border bg-surface p-4 sm:p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 ${
            reached ? 'bg-accentSoft text-accentDark' : 'bg-purpleSoft text-purpleDark'
          }`}
        >
          <Target size={20} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-extrabold leading-snug text-textPrimary break-words">{goal.title}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-textMuted">
            <CalendarDays size={13} strokeWidth={2.5} />
            {format(parseISO(goal.startDate), 'd MMM')}
            {goal.targetDate && ` → ${format(parseISO(goal.targetDate), 'd MMM yyyy')}`}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-xl text-textMuted transition-colors hover:bg-pomSoft hover:text-coral shrink-0"
          aria-label={t('delete')}
        >
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max={goal.targetProgress}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commitProgress}
          onKeyDown={(e) => e.key === 'Enter' && commitProgress()}
          className="w-20 h-9 px-2.5 rounded-xl border-2 border-border bg-white text-[14px] font-bold tabular-nums text-right text-textPrimary outline-none transition-colors focus:border-blue"
        />
        <span className="min-w-0 truncate text-[13px] font-semibold text-textSecondary">
          / {goal.targetProgress} {goal.unit}
        </span>
      </div>

      <ProgressBar
        value={goal.currentProgress}
        max={goal.targetProgress}
        color={reached ? '#58CC02' : '#1CB0F6'}
        height={14}
        showLabel
      />
    </div>
  )
}
