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
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 lg:short:gap-3">
      <div className="relative w-[150px] h-[150px] md:w-[132px] md:h-[132px] lg:w-[148px] lg:h-[148px] lg:short:w-[112px] lg:short:h-[112px] shrink-0">
        <svg viewBox="0 0 88 88" className="w-full h-full">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <span className="text-[34px] md:text-[30px] lg:text-[34px] lg:short:text-[26px] font-extrabold leading-none tabular-nums tracking-tight text-textPrimary">
            {mm}:{ss}
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-[12px] font-extrabold"
            style={{ color, background: mode === 'focus' ? '#DFFAB8' : '#FFF4C2' }}
          >
            {mode === 'focus' ? t('pomodoroFocus') : t('pomodoroBreak')}
          </span>
        </div>
      </div>

      {linkedTask && (
        <div className="max-w-full -mt-1 text-[13px] font-semibold text-textSecondary truncate" title={linkedTask.name}>
          {linkedTask.name}
        </div>
      )}

      {!activeSession && tasks.length > 0 && (
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          aria-label={t('pomodoroNoTask')}
          className="w-full h-10 px-3 rounded-xl border-2 border-border bg-white text-[13px] font-bold text-textSecondary outline-none focus:border-blue"
        >
          <option value="">{t('pomodoroNoTask')}</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      )}

      <div className="w-full grid grid-cols-2 gap-2.5">
        <Button onClick={handlePrimaryAction} variant={running ? 'secondary' : 'primary'} className="w-full !px-2">
          {running ? t('pomodoroPause') : activeSession ? t('pomodoroResume') : t('pomodoroStart')}
        </Button>
        {hasFocusProgress ? (
          <Button onClick={onCancel} variant="secondary" className="w-full !px-2 !text-coral" title={t('pomodoroCancelHint')}>
            {t('pomodoroCancel')}
          </Button>
        ) : (
          <Button onClick={onReset} variant="secondary" className="w-full !px-2">
            {t('pomodoroReset')}
          </Button>
        )}
      </div>
      {hasFocusProgress && <p className="-mt-1 text-center text-[12px] font-semibold text-textMuted">{t('pomodoroCancelHint')}</p>}
    </div>
  )
}
