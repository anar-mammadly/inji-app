import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { playTimerEndSound } from '../utils/sound'

const FOCUS_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60
const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function PomodoroTimer() {
  const { t } = useTranslation()
  const [mode, setMode] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)

  const totalSeconds = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
  const color = mode === 'focus' ? colors.accent : colors.amber

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (secondsLeft > 0) return
    playTimerEndSound()
    setMode((m) => (m === 'focus' ? 'break' : 'focus'))
  }, [secondsLeft])

  useEffect(() => {
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS)
  }, [mode])

  function toggleRunning() {
    setRunning((r) => !r)
  }

  function reset() {
    setRunning(false)
    setSecondsLeft(totalSeconds)
  }

  const mm = String(Math.floor(Math.max(secondsLeft, 0) / 60)).padStart(2, '0')
  const ss = String(Math.max(secondsLeft, 0) % 60).padStart(2, '0')
  const progress = 1 - Math.max(secondsLeft, 0) / totalSeconds

  return (
    <div
      className="w-full rounded-[10px] border p-3 flex flex-col items-center"
      style={{ borderColor: colors.border, background: colors.surface }}
    >
      <span className="text-[11px] uppercase font-medium self-start mb-2" style={{ color: colors.textMuted }}>
        Pomodoro
      </span>

      <div className="relative" style={{ width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={RADIUS} fill="none" stroke={colors.bg} strokeWidth="6" />
          <motion.circle
            cx="44"
            cy="44"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{
              strokeDashoffset: CIRCUMFERENCE * (1 - progress),
              opacity: progress > 0 ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: 'linear' }}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-medium leading-none" style={{ color: colors.textPrimary }}>
            {mm}:{ss}
          </span>
          <span className="text-[10px] uppercase mt-0.5" style={{ color }}>
            {mode === 'focus' ? t('pomodoroFocus') : t('pomodoroBreak')}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-3 w-full">
        <button
          onClick={toggleRunning}
          className="flex-1 text-[12px] py-2 rounded-[8px]"
          style={{ background: color, color: '#fff' }}
        >
          {running ? t('pomodoroPause') : t('pomodoroStart')}
        </button>
        <button
          onClick={reset}
          className="flex-1 text-[12px] py-2 rounded-[8px] border"
          style={{ borderColor: colors.border, color: colors.textSecondary }}
        >
          {t('pomodoroReset')}
        </button>
      </div>
    </div>
  )
}
