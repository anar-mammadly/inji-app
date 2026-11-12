import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BellOff, Bell, Settings2 } from 'lucide-react'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { isMuted, plannedSeconds, remainingSeconds, runProgress } from '../lib/focusRun'
import Button from './ui/Button'
import { iconButtonClass } from './ui/styles'
import FocusSettingsModal from './FocusSettingsModal'

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function clock(seconds) {
  const whole = Math.floor(Math.max(0, seconds))
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

// The run as a string of pearls: one per block, threaded as breaks are taken.
function Route({ progress, total, label }) {
  const pct = total > 0 ? Math.min(100, (progress / total) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.floor(progress)}
      className="relative mx-1.5 h-4"
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
      <div
        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent transition-[width] duration-700 ease-linear"
        style={{ width: `${pct}%` }}
      />
      {Array.from({ length: total }, (_, i) => {
        const threaded = progress >= i + 1 - 1e-6
        return (
          <span
            key={i}
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors ${
              threaded ? 'nacre border-greenDark' : 'border-borderStrong bg-white'
            }`}
            style={{ left: `${((i + 1) / total) * 100}%` }}
          />
        )
      })}
    </div>
  )
}

// `timer` is the object from usePomodoroStore.
export default function PomodoroTimer({ timer, tasks = [], onCancel, footer = null }) {
  const { t } = useTranslation()
  const [, forceTick] = useState(0)
  const [taskId, setTaskId] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { activeSession: session, settings, run } = timer
  const running = session?.status === 'running'
  const mode = session?.mode || 'focus'
  const muted = isMuted({ focusMuteUntil: timer.muteUntil })

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => forceTick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [running])

  const planned = session ? plannedSeconds(session) : settings.focusMin * 60
  const left = session ? remainingSeconds(session) : planned
  const overtime = mode === 'focus' && session && left < 0
  const breakOver = mode === 'break' && left <= 0
  const progress = overtime ? 1 : 1 - Math.max(left, 0) / planned
  const routeNow = runProgress({ focusSettings: settings, focusRun: run, activeSession: session })
  const blockNumber = Math.min(settings.blocks, run.blocks + (mode === 'focus' ? 1 : 0))

  const tone = overtime
    ? { ring: colors.coral, text: '#BE1F1F', soft: '#FFE3E3' }
    : mode === 'break'
      ? { ring: colors.yellow, text: '#7A5A00', soft: '#FFF4C2' }
      : { ring: colors.accent, text: '#2A6E00', soft: '#DFFAB8' }

  const chip = !session
    ? t('pomodoroFocus')
    : overtime
      ? t('focusOvertime')
      : mode === 'focus'
        ? t('pomodoroFocus')
        : breakOver
          ? t('breakOverLabel')
          : session.atDesk
            ? t('breakAtDesk')
            : session.long
              ? t('breakLong')
              : t('breakLabel')

  const heading = session || run.progress > 0
    ? t('focusBlockOf', { n: Math.max(1, blockNumber), total: settings.blocks })
    : t('focusRunIdle', { total: settings.blocks, focus: settings.focusMin })

  const linkedTask = session?.taskId ? tasks.find((tsk) => tsk.id === session.taskId) : null
  const hasFocusProgress = mode === 'focus' && session && left < planned

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3.5 lg:short:gap-2.5">
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[13px] font-extrabold text-textSecondary">{heading}</span>
          <span className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={timer.toggleMute}
              aria-pressed={muted}
              title={muted ? t('muteOff') : t('muteOn')}
              aria-label={muted ? t('muteOff') : t('muteOn')}
              className={`${iconButtonClass} hit ${muted ? '!text-coralInk' : ''}`}
            >
              {muted ? <BellOff size={16} strokeWidth={2.4} /> : <Bell size={16} strokeWidth={2.4} />}
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title={t('focusSettingsTitle')}
              aria-label={t('focusSettingsTitle')}
              className={`${iconButtonClass} hit`}
            >
              <Settings2 size={16} strokeWidth={2.4} />
            </button>
          </span>
        </div>
        <Route progress={routeNow} total={settings.blocks} label={t('routeLabel', { done: Math.floor(routeNow), total: settings.blocks })} />
      </div>

      <div className="relative w-[150px] h-[150px] md:w-[132px] md:h-[132px] lg:w-[148px] lg:h-[148px] lg:short:w-[112px] lg:short:h-[112px] shrink-0">
        <svg viewBox="0 0 88 88" className="w-full h-full" aria-hidden="true">
          <circle cx="44" cy="44" r={RADIUS} fill="none" stroke={colors.surfaceAlt} strokeWidth="7" />
          <motion.circle
            cx="44"
            cy="44"
            r={RADIUS}
            fill="none"
            stroke={tone.ring}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE, opacity: 0 }}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress), opacity: progress > 0 ? 1 : 0 }}
            transition={{ duration: 0.4, ease: 'linear' }}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <span
            role="timer"
            className={`font-extrabold leading-none tabular-nums tracking-tight ${
              overtime
                ? 'text-[28px] md:text-[25px] lg:text-[28px] lg:short:text-[21px] text-coralInk'
                : 'text-[34px] md:text-[30px] lg:text-[34px] lg:short:text-[26px] text-textPrimary'
            }`}
          >
            {overtime ? `+${clock(-left)}` : clock(left)}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-extrabold" style={{ color: tone.text, background: tone.soft }}>
            {chip}
          </span>
        </div>
      </div>

      {linkedTask && (
        <div className="max-w-full -mt-1 text-[13px] font-semibold text-textSecondary truncate" title={linkedTask.name}>
          {linkedTask.name}
        </div>
      )}

      {!session && tasks.length > 0 && (
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

      {/* one main action at every moment: start → stand up → start again */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        {!session ? (
          <Button onClick={() => timer.startSession(taskId || null)} className="col-span-2 w-full">
            {t('pomodoroStart')}
          </Button>
        ) : mode === 'break' ? (
          <Button onClick={timer.backToFocus} variant={breakOver ? 'primary' : 'secondary'} className="col-span-2 w-full">
            {t('backToWork')}
          </Button>
        ) : !running ? (
          <>
            <Button onClick={timer.toggleRunning} className="w-full !px-2">
              {t('pomodoroResume')}
            </Button>
            <Button onClick={onCancel} variant="secondary" className="w-full !px-2 !text-coralInk" title={t('pomodoroCancelHint')}>
              {t('pomodoroCancel')}
            </Button>
          </>
        ) : overtime ? (
          <>
            <Button onClick={timer.standUp} className={`w-full !px-2 ${session.snoozed ? 'col-span-2' : ''}`}>
              {t('standUp')}
            </Button>
            {!session.snoozed && (
              <Button onClick={timer.snooze} variant="secondary" className="w-full !px-2">
                {t('snooze5')}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={timer.standUp} variant="soft" className="w-full !px-2">
              {t('standUp')}
            </Button>
            <Button onClick={timer.toggleRunning} variant="secondary" className="w-full !px-2">
              {t('pomodoroPause')}
            </Button>
          </>
        )}
      </div>

      {mode === 'break' && session && !breakOver && (
        <button
          type="button"
          onClick={timer.toggleAtDesk}
          aria-pressed={!!session.atDesk}
          title={t('atDeskHint')}
          className={`-mt-1 rounded-xl border-2 px-3 py-1.5 text-[12px] font-extrabold transition-colors ${
            session.atDesk ? 'border-yellow bg-yellowSoft text-yellowInk' : 'border-border text-textSecondary hover:bg-surfaceAlt'
          }`}
        >
          {t('atDesk')}
        </button>
      )}

      {hasFocusProgress && running && !overtime && (
        <button
          type="button"
          onClick={onCancel}
          title={t('pomodoroCancelHint')}
          className="-mt-1 text-[12px] font-semibold text-textMuted underline decoration-1 underline-offset-2 hover:text-coralInk"
        >
          {t('stopBlock')}
        </button>
      )}
      {/* on short desktop windows the card has no room for it; the sidebar has the same button */}
      {footer && <div className="lg:short:hidden">{footer}</div>}

      <FocusSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} timer={timer} />
    </div>
  )
}
