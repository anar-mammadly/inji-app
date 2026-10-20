import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { X, BookOpen, GraduationCap, Sparkles, Bell, CalendarDays } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import { requestNotificationPermission } from '../hooks/useReminders'
import ProgressBar from './ui/ProgressBar'
import { chipClass, iconButtonClass } from './ui/styles'

// each learning sub-category gets its own candy color + icon
export const SUB_CATEGORY_STYLES = {
  books: { icon: BookOpen, color: '#FF9600', dark: '#E07C00', soft: '#FFE8CC' },
  courses: { icon: GraduationCap, color: '#1CB0F6', dark: '#0E8FCE', soft: '#DDF4FF' },
  skills: { icon: Sparkles, color: '#CE82FF', dark: '#A855F7', soft: '#F3E4FF' },
}

const REMINDER_OPTIONS = [
  { minutes: null },
  { minutes: 60 },
  { minutes: 180 },
  { minutes: 360 },
  { minutes: 1440 },
]

export default function LearningGoalCard({ goal, onUpdateProgress, onSetReminder, onDelete }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(goal.currentProgress)
  const s = SUB_CATEGORY_STYLES[goal.subCategory] ?? SUB_CATEGORY_STYLES.skills
  const Icon = s.icon
  const isComplete = goal.targetProgress > 0 && goal.currentProgress >= goal.targetProgress

  function commitProgress() {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n)) onUpdateProgress(n)
  }

  async function handleReminderChange(minutes) {
    if (minutes) {
      const granted = await requestNotificationPermission()
      if (!granted) return
    }
    onSetReminder(minutes)
  }

  return (
    <article className="rounded-3xl border-2 border-border bg-surface p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: s.soft }}>
          <Icon size={22} strokeWidth={2.5} style={{ color: s.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] leading-snug font-extrabold text-textPrimary break-words">{goal.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-textMuted">
            <CalendarDays size={13} strokeWidth={2.5} className="shrink-0" />
            <span className="tabular-nums">
              {format(parseISO(goal.startDate), 'd MMM')}
              {goal.targetDate && ` → ${format(parseISO(goal.targetDate), 'd MMM yyyy')}`}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className={`${iconButtonClass} -mr-1.5 -mt-1 shrink-0 hover:!bg-pomSoft hover:!text-coral`}
          aria-label={t('delete')}
        >
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>

      <div className="rounded-2xl bg-surfaceAlt p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max={goal.targetProgress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commitProgress}
            onKeyDown={(e) => e.key === 'Enter' && commitProgress()}
            className="w-20 h-9 px-2.5 rounded-xl border-2 border-border bg-white text-right text-[14px] font-bold tabular-nums text-textPrimary outline-none transition-colors focus:border-blue"
          />
          <span className="min-w-0 truncate text-[14px] font-semibold text-textSecondary">
            / <span className="tabular-nums">{goal.targetProgress}</span> {goal.unit}
          </span>
          {isComplete && (
            <span className={`${chipClass} ml-auto shrink-0 bg-accentSoft text-accentDark`}>{t('goalsDone')}</span>
          )}
        </div>
        <ProgressBar
          value={goal.currentProgress}
          max={goal.targetProgress}
          color={isComplete ? '#58CC02' : s.color}
          trackClassName="bg-white"
          showLabel
        />
      </div>

      <div>
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-textSecondary mb-2">
          <Bell size={14} strokeWidth={2.5} className="text-yellowDark" />
          {t('reminderEvery')}
        </div>
        <div className="flex flex-wrap gap-2">
          {REMINDER_OPTIONS.map((opt) => {
            const active = (goal.reminderIntervalMinutes || null) === opt.minutes
            return (
              <button
                key={opt.minutes ?? 'off'}
                type="button"
                onClick={() => handleReminderChange(opt.minutes)}
                aria-pressed={active}
                className={`h-9 min-w-[48px] px-3 rounded-xl border-2 text-[13px] font-bold tabular-nums transition-colors ${
                  active
                    ? 'bg-yellowSoft border-yellow text-[#9A6B00]'
                    : 'bg-white border-border text-textMuted hover:text-textSecondary hover:border-borderStrong'
                }`}
              >
                {opt.minutes ? t('reminderHours', { n: opt.minutes / 60 }) : t('reminderNone')}
              </button>
            )
          })}
        </div>
      </div>
    </article>
  )
}
