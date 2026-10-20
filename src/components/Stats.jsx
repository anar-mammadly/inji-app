import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { colors, darken } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import ProgressBar from './ui/ProgressBar'
import ConfirmButton from './ui/ConfirmButton'

function BeadIcon({ color, reached }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      animate={reached ? { y: [0, -3, 0], rotate: [0, -8, 8, 0] } : { y: 0 }}
      transition={reached ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.2 } : undefined}
      className="shrink-0"
    >
      <circle cx="11" cy="11" r="9" fill={color} stroke={darken(color, 0.25)} strokeWidth="1" />
      <circle cx="8" cy="8" r="3" fill="#fff" fillOpacity="0.6" />
    </motion.svg>
  )
}

function GoalRow({ label, count, goal, onSetGoal, color, resetSlot }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(goal)
  const reached = count >= goal

  function startEditing() {
    setValue(goal)
    setEditing(true)
  }

  function commit() {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n) && n > 0) onSetGoal(n)
    setEditing(false)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-2 text-[13px] font-extrabold text-textSecondary">
          <BeadIcon color={color} reached={reached} />
          {label}
        </span>
        <span className="flex items-baseline gap-1 tabular-nums">
          <span className="text-[17px] font-extrabold text-textPrimary">{count}</span>
          <span className="text-[13px] font-bold text-textMuted">/</span>
          {editing ? (
            <input
              type="number"
              min="1"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              aria-label={t('goalLabel', { n: goal })}
              className="w-14 h-7 px-1.5 rounded-lg border-2 border-blue text-[13px] font-bold text-right outline-none"
            />
          ) : (
            <button
              onClick={startEditing}
              className="group inline-flex items-center gap-1 text-[13px] font-bold text-textMuted hover:text-textSecondary"
              title={t('goalLabel', { n: goal })}
            >
              {goal}
              <Pencil size={11} strokeWidth={2.5} className="opacity-70 group-hover:opacity-100" />
            </button>
          )}
        </span>
      </div>
      <ProgressBar value={count} max={goal} color={color} />
      {resetSlot && <div className="mt-1.5 text-right">{resetSlot}</div>}
    </div>
  )
}

export default function Stats({
  beadCount,
  weeklyCount,
  dailyGoal,
  weeklyGoal,
  onSetDailyGoal,
  onSetWeeklyGoal,
  onResetWeeklyGoal,
}) {
  const { t } = useTranslation()
  return (
    <div className="w-full flex flex-col gap-4">
      <GoalRow label={t('dailyGoal')} count={beadCount} goal={dailyGoal} onSetGoal={onSetDailyGoal} color={colors.accent} />
      <GoalRow
        label={t('weeklyGoal')}
        count={weeklyCount}
        goal={weeklyGoal}
        onSetGoal={onSetWeeklyGoal}
        color={colors.purple}
        resetSlot={
          <ConfirmButton
            onConfirm={onResetWeeklyGoal}
            triggerLabel={t('resetWeeklyGoal')}
            confirmMessage={t('resetWeeklyGoalConfirm')}
            align="end"
          />
        }
      />
    </div>
  )
}
