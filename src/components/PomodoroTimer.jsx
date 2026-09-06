import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { playTimerEndSound } from '../utils/sound'
import { FOCUS_SECONDS, BREAK_SECONDS } from '../hooks/usePomodoroStore'
import Button from './ui/Button'

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function PomodoroTimer({
  activeSession,
  computeSecondsLeft,
  tasks = [],
  onStart,
  onToggle,
  onReset,
  onModeComplete,
  onCancel,
}) {
  const { t } = useTranslation()
  const [, forceTick] = useState(0)
  const [taskId, setTaskId] = useState('')

  const mode = activeSession?.mode || 'focus'
  const status = activeSession?.status || 'paused'
  const running = status === 'running'
  const totalSeconds = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
  const secondsLeft = activeSession ? computeSecondsLeft(activeSession) : totalSeconds
  const color = mode === 'focus' ? colors.accent : colors.yellow
  const shadowColor = mode === 'focus' ? colors.accentDark : colors.yellowDark

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => forceTick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (!activeSession || !running) return
    if (secondsLeft > 0) return
    playTimerEndSound()
    onModeComplete()
  }, [secondsLeft, running, activeSession, onModeComplete])

  function handlePrimaryAction() {
    if (!activeSession) {
      onStart(taskId || null)
    } else {
      onToggle()
    }
  }

  const hasFocusProgress = mode === 'focus' && activeSession && secondsLeft < totalSeconds
  const wholeSecondsLeft = Math.floor(Math.max(secondsLeft, 0))
  const mm = String(Math.floor(wholeSecondsLeft / 60)).padStart(2, '0')
  const ss = String(wholeSecondsLeft % 60).padStart(2, '0')
  const progress = 1 - Math.max(secondsLeft, 0) / totalSeconds

  return (
    <div className="w-full rounded-2xl border-2 border-border bg-surface p-3 flex flex-col items-center">
      <span className="text-[11px] uppercase font-extrabold tracking-wide self-start mb-2 text-textMuted">
        Pomodoro
      </span>

      <div className="relative" style={{ width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={RADIUS} fill="none" stroke={colors.surfaceAlt} strokeWidth="7" />
          <motion.circle
            cx="44"
            cy="44"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE, opacity: 0 }}
            animate={{
              strokeDashoffset: CIRCUMFERENCE * (1 - progress),
              opacity: progress > 0 ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: 'linear' }}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-extrabold leading-none text-textPrimary">
            {mm}:{ss}
          </span>
          <span className="text-[10px] font-extrabold uppercase mt-0.5" style={{ color }}>
            {mode === 'focus' ? t('pomodoroFocus') : t('pomodoroBreak')}
          </span>
        </div>
      </div>

      {!activeSession && tasks.length > 0 && (
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="w-full mt-3 text-[12px] font-bold px-2 py-1.5 rounded-xl border-2 border-border outline-none text-textSecondary"
        >
          <option value="">{t('pomodoroNoTask')}</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      )}

      {activeSession?.taskId && (
        <div className="w-full mt-3 text-[11px] font-bold text-textSecondary truncate">
          {t('pomodoroLinkedTo')} {tasks.find((tsk) => tsk.id === activeSession.taskId)?.name || ''}
        </div>
      )}

      <div className="flex gap-2 mt-3 w-full">
        <Button
          onClick={handlePrimaryAction}
          size="sm"
          className="flex-1"
          style={{ background: color, boxShadow: `0 4px 0 ${shadowColor}` }}
        >
          {running ? t('pomodoroPause') : activeSession ? t('pomodoroResume') : t('pomodoroStart')}
        </Button>
        {hasFocusProgress ? (
          <Button onClick={onCancel} variant="danger" size="sm" className="flex-1">
            {t('pomodoroCancel')}
          </Button>
        ) : (
          <Button onClick={onReset} variant="secondary" size="sm" className="flex-1">
            {t('pomodoroReset')}
          </Button>
        )}
      </div>
      {hasFocusProgress && <div className="w-full mt-1.5 text-[10px] text-textMuted">{t('pomodoroCancelHint')}</div>}
    </div>
  )
}
