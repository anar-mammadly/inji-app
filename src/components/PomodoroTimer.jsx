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

  const linkedTask = activeSession?.taskId ? tasks.find((tsk) => tsk.id === activeSession.taskId) : null

  return (
    <div className="w-full">
      <div className="flex items-center gap-4">
        <div className="relative w-[76px] h-[76px] shrink-0">
          <svg viewBox="0 0 88 88" className="w-full h-full">
            <circle cx="44" cy="44" r={RADIUS} fill="none" stroke={colors.surfaceAlt} strokeWidth="8" />
            <motion.circle
              cx="44"
              cy="44"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="8"
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
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[18px] font-extrabold leading-none tabular-nums tracking-tight text-textPrimary">
              {mm}:{ss}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="font-extrabold text-textPrimary">
              {mode === 'focus' ? t('pomodoroFocus') : t('pomodoroBreak')}
            </span>
          </div>
          {linkedTask && (
            <div className="mt-0.5 text-[12px] text-textMuted truncate" title={linkedTask.name}>
              {linkedTask.name}
            </div>
          )}
          <div className="flex gap-2 mt-2.5">
            <Button onClick={handlePrimaryAction} size="sm" variant={running ? 'secondary' : 'primary'} className="flex-1">
              {running ? t('pomodoroPause') : activeSession ? t('pomodoroResume') : t('pomodoroStart')}
            </Button>
            {hasFocusProgress ? (
              <Button onClick={onCancel} variant="ghost" size="sm" className="hover:!text-pom" title={t('pomodoroCancelHint')}>
                {t('pomodoroCancel')}
              </Button>
            ) : (
              <Button onClick={onReset} variant="ghost" size="sm">
                {t('pomodoroReset')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {!activeSession && tasks.length > 0 && (
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          aria-label={t('pomodoroNoTask')}
          className="w-full mt-3 h-10 px-3 rounded-xl border-2 border-border bg-white text-[13px] font-bold text-textSecondary outline-none focus:border-blue"
        >
          <option value="">{t('pomodoroNoTask')}</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      )}
      {hasFocusProgress && <div className="mt-2 text-[12px] text-textMuted">{t('pomodoroCancelHint')}</div>}
    </div>
  )
}
