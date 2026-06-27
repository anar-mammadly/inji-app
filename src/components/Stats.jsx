import { useState } from 'react'
import { motion } from 'framer-motion'
import { colors, darken } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

function BeadIcon({ color, reached }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      animate={reached ? { y: [0, -3, 0], rotate: [0, -6, 6, 0] } : { y: [0, -2, 0] }}
      transition={{ duration: reached ? 0.6 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="11" cy="11" r="9" fill={color} stroke={darken(color, 0.2)} strokeWidth="0.75" />
      <circle cx="8" cy="8" r="3" fill="#fff" fillOpacity="0.5" />
    </motion.svg>
  )
}

function GoalRow({ label, count, goal, onSetGoal, color }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(goal)
  const pct = Math.min((count / goal) * 100, 100)
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
    <div
      className="w-full rounded-[10px] border p-3"
      style={{ borderColor: colors.border, background: colors.surface }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="text-[11px] uppercase font-medium leading-tight"
          style={{ color: colors.textMuted }}
        >
          {label}
        </span>
        {editing ? (
          <input
            type="number"
            min="1"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="w-12 shrink-0 text-[11px] px-1 py-0.5 rounded-[6px] border text-right outline-none"
            style={{ borderColor: colors.border }}
          />
        ) : (
          <button
            onClick={startEditing}
            className="shrink-0 whitespace-nowrap text-[11px] flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: colors.textSecondary }}
          >
            {t('goalLabel', { n: goal })}
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path
                d="M11.3 1.3a1.5 1.5 0 0 1 2.1 2.1l-8 8-3 .8.8-3 8-8Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
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
          className="text-[20px] font-medium leading-none"
          style={{ color: colors.textPrimary }}
        >
          {count}
        </motion.span>
        <span className="text-[12px]" style={{ color: colors.textMuted }}>
          / {goal}
        </span>
      </div>

      <div className="w-full rounded-full mt-2.5" style={{ height: 6, background: colors.bg }}>
        <motion.div
          className="rounded-full"
          style={{ height: 6, background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
      <div className="text-right text-[11px] mt-1" style={{ color: colors.textMuted }}>
        {Math.round(pct)}%{reached && ' 🎉'}
      </div>
    </div>
  )
}

export default function Stats({ beadCount, weeklyCount, dailyGoal, weeklyGoal, onSetDailyGoal, onSetWeeklyGoal }) {
  const { t } = useTranslation()
  return (
    <div className="w-full mt-4 flex flex-col gap-3">
      <GoalRow
        label={t('dailyGoal')}
        count={beadCount}
        goal={dailyGoal}
        onSetGoal={onSetDailyGoal}
        color={colors.accent}
      />
      <GoalRow
        label={t('weeklyGoal')}
        count={weeklyCount}
        goal={weeklyGoal}
        onSetGoal={onSetWeeklyGoal}
        color={colors.purple}
      />
    </div>
  )
}
