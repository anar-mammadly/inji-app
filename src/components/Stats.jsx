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
      width="24"
      height="24"
      viewBox="0 0 22 22"
      animate={reached ? { y: [0, -3, 0], rotate: [0, -8, 8, 0] } : { y: [0, -2, 0] }}
      transition={{ duration: reached ? 0.6 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
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
    <div className="w-full rounded-2xl border-2 border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] uppercase font-extrabold tracking-wide text-textMuted">{label}</span>
        {editing ? (
          <input
            type="number"
            min="1"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="w-12 shrink-0 text-[11px] px-1 py-0.5 rounded-md border-2 border-border text-right outline-none"
          />
        ) : (
          <button
            onClick={startEditing}
            className="shrink-0 whitespace-nowrap text-[11px] font-bold flex items-center gap-1 text-textSecondary hover:opacity-70 transition-opacity"
          >
            {t('goalLabel', { n: goal })}
            <Pencil size={10} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <BeadIcon color={color} reached={reached} />
        <motion.span
          key={count}
          initial={{ scale: 0.5, opacity: 0.3 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="text-[22px] font-extrabold leading-none text-textPrimary"
        >
          {count}
        </motion.span>
        <span className="text-[12px] font-bold text-textMuted">/ {goal}</span>
      </div>

      <div className="mt-2.5">
        <ProgressBar value={count} max={goal} color={color} showLabel />
      </div>

      {resetSlot && <div className="mt-2 text-right">{resetSlot}</div>}
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
    <div className="w-full mt-4 flex flex-col gap-3">
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
