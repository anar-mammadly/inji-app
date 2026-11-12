import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PersonStanding, Play, X } from 'lucide-react'
import CompanionCharacter from './CompanionCharacter'
import { greetingEvent, pickLine } from './lines'
import { useTranslation } from '../i18n/LanguageContext'
import { isMuted, overtimeMinutes, plannedSeconds, remainingSeconds, wearLevel, wearStage } from '../lib/focusRun'
import { colors } from '../utils/colors'

const SIZE = 76
const EDGE = 8 // closest it may sit to the screen edge
const DRAG_THRESHOLD = 5 // px of movement before a press becomes a drag
const KEY_STEP = 24
const TICKLE_TAPS = 5
const TICKLE_WINDOW_MS = 2200
const AMBIENT_GAP_MS = 8 * 60_000 // small talk (a reply to a tap) at most this often
const SAID_KEY = 'inji_companion_said' // milestones already celebrated on this device

function saidBefore(name) {
  try {
    const said = JSON.parse(localStorage.getItem(SAID_KEY) || '{}')
    if (said[name]) return true
    localStorage.setItem(SAID_KEY, JSON.stringify({ ...said, [name]: Date.now() }))
  } catch {
    // without storage a milestone may be repeated — harmless
  }
  return false
}

function clockText(seconds) {
  const whole = Math.floor(Math.max(0, seconds))
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

// Sədəf: a small companion that sits wherever you drag it and follows the
// focus timer on every page.
//
//   • While you focus it is quiet.
//   • When a block is over it asks you to stand up — and the longer you stay
//     seated, the worse it looks: first it loses its shine and gathers dust,
//     then its shell starts to close, and finally it shuts completely.
//     Standing up opens it again.
//   • During the break it suggests something to do, walking or at the desk.
//   • It speaks only when something happens, never just to fill a silence.
//
// `timer` is the object from usePomodoroStore; `timerEvent` is the latest
// reminder fired by usePomodoroTicker ({ type, at }).
export default function Companion({ initialPos, onMove, onDismiss, timer, timerEvent, beadCount, dailyGoal }) {
  const { activeSession, settings, run, totals, lastRun } = timer
  const muted = isMuted({ focusMuteUntil: timer.muteUntil })
  const { t, lang } = useTranslation()
  const viewport = useViewport()
  const [pos, setPos] = useState(initialPos)
  const [dragging, setDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [speech, setSpeech] = useState(null) // { text, id }
  const [flash, setFlash] = useState(null) // short-lived mood: 'cheer' | 'dizzy'
  const [, setTick] = useState(0)

  const rootRef = useRef(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const lineMemory = useRef({})
  const taps = useRef([])
  const timers = useRef({})
  const langRef = useRef(lang)
  langRef.current = lang
  const facts = useRef({ settings, run, totals, lastRun })
  facts.current = { settings, run, totals, lastRun }
  const lastAmbient = useRef(0)

  const spanX = Math.max(1, viewport.w - SIZE - EDGE * 2)
  const spanY = Math.max(1, viewport.h - SIZE - EDGE * 2)
  const left_ = EDGE + clamp01(pos.x) * spanX
  const top = EDGE + clamp01(pos.y) * spanY

  // ---- speech ---------------------------------------------------------------

  const say = useCallback((event, vars, ms = 4600) => {
    const text = pickLine(langRef.current, event, lineMemory.current, vars)
    if (!text) return
    clearTimeout(timers.current.speech)
    setSpeech({ text, id: Date.now() })
    timers.current.speech = setTimeout(() => setSpeech(null), ms)
  }, [])

  const react = useCallback((mood, ms = 1300) => {
    clearTimeout(timers.current.flash)
    setFlash(mood)
    timers.current.flash = setTimeout(() => setFlash(null), ms)
  }, [])

  useEffect(() => {
    const pending = timers.current
    const hello = setTimeout(() => say(greetingEvent(new Date().getHours())), 450)
    return () => {
      clearTimeout(hello)
      Object.values(pending).forEach(clearTimeout)
    }
  }, [say])

  // What just happened to the session? Start, stand-up, back to work, pause,
  // snooze, the end of the run, or a block that was abandoned.
  const seen = useRef({ session: activeSession, beadCount })
  useEffect(() => {
    const before = seen.current.session
    const now = activeSession
    seen.current.session = now
    if (before === now) return
    const f = facts.current
    const left = Math.max(0, f.settings.blocks - Math.round(f.run.progress))

    if (!now) {
      if (before?.mode === 'break') {
        react('cheer', 1800)
        say(f.lastRun?.first ? 'firstRun' : 'runDone', undefined, 6000)
      } else if (before) {
        say('cancelled')
      }
      return
    }
    if (now.mode === 'focus' && before?.mode !== 'focus') {
      if (now.status !== 'running') return
      if (!before) say(f.run.blocks === f.settings.blocks - 1 ? 'lastBlock' : 'focusStart', { min: f.settings.focusMin })
      else say(left <= 1 ? 'lastBlock' : Math.random() < 0.25 ? 'fact' : 'backToFocus', { left })
      return
    }
    if (now.mode === 'break' && before?.mode === 'focus') {
      react('cheer', 1600)
      const milestone =
        now.earned &&
        ((f.totals.blocks === 50 && !saidBefore('blocks50') && 'blocks50') ||
          (f.totals.blocks === 100 && !saidBefore('blocks100') && 'blocks100') ||
          (f.totals.streak?.days >= 7 && !saidBefore('streak7') && 'streak7'))
      const event = milestone || (now.long ? 'longBreak' : now.earned ? 'standUp' : 'standUpEarly')
      say(event, { min: Math.round(plannedSeconds(now) / 60) }, 6000)
      return
    }
    if (before && before.id === now.id) {
      if (!before.snoozed && now.snoozed) say('snooze')
      else if (before.status !== now.status) say(now.status === 'paused' ? 'paused' : 'resumed', undefined, 3000)
    }
  }, [activeSession, say, react])

  // reminders from the app's ticker: block nearly over, over, still sitting
  useEffect(() => {
    if (!timerEvent) return
    if (timerEvent.type === 'focusSoon') say('focusSoon')
    else if (timerEvent.type === 'focusDone') {
      react('cheer', 900)
      say('focusDone', { min: facts.current.settings.breakMin }, 6500)
    } else if (timerEvent.type === 'overtime') say('overtime', undefined, 6500)
    else if (timerEvent.type === 'breakDone') say('breakDone', undefined, 6000)
  }, [timerEvent, say, react])

  // quiet mode switched on or off
  const wasMuted = useRef(muted)
  useEffect(() => {
    if (wasMuted.current === muted) return
    wasMuted.current = muted
    const until = timer.muteUntil ? new Date(timer.muteUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
    say(muted ? 'muteOn' : 'muteOff', { time: until })
  }, [muted, timer.muteUntil, say])

  // a finished task drops a pearl in the jar — worth a cheer
  useEffect(() => {
    const before = seen.current.beadCount
    seen.current.beadCount = beadCount
    if (beadCount > before) {
      react('cheer')
      say(beadCount === dailyGoal ? 'goalReached' : 'taskDone')
    }
  }, [beadCount, dailyGoal, say, react])

  // While a session runs: redraw every second, announce each new stage of
  // wear once, and offer two things to do during a break.
  const spoken = useRef({ id: null, marks: new Set() })
  const running = activeSession?.status === 'running'
  const speed = activeSession?.speed || 1
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setTick((n) => n + 1)
      const session = seen.current.session
      if (!session || session.status !== 'running') return
      if (spoken.current.id !== session.id) spoken.current = { id: session.id, marks: new Set() }
      const once = (mark, fn) => {
        if (spoken.current.marks.has(mark)) return
        spoken.current.marks.add(mark)
        fn()
      }
      if (session.mode === 'focus') {
        const stage = wearStage(overtimeMinutes(session))
        if (stage === 'dull') once('dull', () => say('wearDull', undefined, 5500))
        else if (stage === 'closing') once('closing', () => say('wearClosing', undefined, 6500))
        else if (stage === 'shut') once('shut', () => say('wearShut', undefined, 7000))
      } else {
        const done = 1 - remainingSeconds(session) / plannedSeconds(session)
        const tip = session.atDesk ? 'stretchTip' : 'walkTip'
        if (done >= 0.2 && done < 1) once('tip1', () => say(tip, undefined, 7000))
        if (done >= 0.6 && done < 1) once('tip2', () => say(tip, undefined, 7000))
      }
    }, speed > 1 ? 250 : 1000)
    return () => clearInterval(id)
  }, [running, speed, say])

  // ---- pointer + keyboard -----------------------------------------------------

  function moveTo(nextLeft, nextTop) {
    const next = { x: clamp01((nextLeft - EDGE) / spanX), y: clamp01((nextTop - EDGE) / spanY) }
    setPos(next)
    return next
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, left: left_, top, moved: false, last: pos }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
      setMenuOpen(false)
    }
    d.last = moveTo(d.left + dx, d.top + dy)
  }

  function endDrag(e) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.moved) return
    // The click that follows this release is not a tap. Browsers don't agree on
    // whether that click fires at all after a drag, so the flag clears itself.
    suppressClick.current = true
    setTimeout(() => {
      suppressClick.current = false
    }, 0)
    setDragging(false)
    onMove(d.last)
    if (Math.random() < 0.4) say('moved', undefined, 2400)
  }

  function onTap() {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    const now = Date.now()
    taps.current = [...taps.current.filter((at) => now - at < TICKLE_WINDOW_MS), now]
    if (taps.current.length >= TICKLE_TAPS) {
      taps.current = []
      react('dizzy', 1400)
      say('tickle', undefined, 2600)
      return
    }
    setMenuOpen((open) => !open)
    if (taps.current.length === 1 && !speech && now - lastAmbient.current > AMBIENT_GAP_MS) {
      lastAmbient.current = now
      say('tap', undefined, 2200)
    }
  }

  function onKeyDown(e) {
    const step = e.shiftKey ? KEY_STEP * 4 : KEY_STEP
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (delta) {
      e.preventDefault()
      onMove(moveTo(left_ + delta[0], top + delta[1]))
    } else if (e.key === 'Escape') {
      if (menuOpen) setMenuOpen(false)
      else onDismiss()
    }
  }

  // close the menu on a press anywhere else
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

  // ---- what to show -----------------------------------------------------------

  const left = activeSession ? remainingSeconds(activeSession) : 0
  const total = activeSession ? plannedSeconds(activeSession) : settings.focusMin * 60
  const overMin = overtimeMinutes(activeSession)
  const over = activeSession?.mode === 'focus' && left < 0
  const wear = wearLevel(overMin)
  const progress = activeSession ? Math.min(1, 1 - Math.max(0, left) / total) : null

  const sessionMood = !activeSession
    ? 'idle'
    : activeSession.status === 'paused'
      ? 'sleepy'
      : activeSession.mode === 'break'
        ? activeSession.atDesk
          ? 'stretch'
          : 'break'
        : wearStage(overMin) || 'focus'
  const mood = dragging ? 'held' : flash || sessionMood

  const clock = over ? `+${clockText(-left)}` : clockText(left)

  // bubble and menu open towards the middle of the screen
  const above = top > viewport.h * 0.42
  const alignRight = left_ + SIZE / 2 > viewport.w / 2

  // one action, the same one the timer card offers at this moment
  const primary = !activeSession
    ? { label: t('companionStart'), icon: Play, action: () => timer.startSession() }
    : activeSession.mode === 'break'
      ? { label: t('backToWork'), icon: Play, action: timer.backToFocus }
      : running
        ? { label: t('standUp'), icon: PersonStanding, action: timer.standUp }
        : { label: t('pomodoroResume'), icon: Play, action: timer.toggleRunning }
  const PrimaryIcon = primary.icon

  const bubble = speech && !dragging && (
    <motion.p
      key={speech.id}
      initial={{ opacity: 0, scale: 0.94, y: above ? 4 : -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.16 }}
      className="w-max max-w-[min(232px,calc(100vw-32px))] rounded-2xl border-2 border-border bg-surface px-3 py-2 text-[13px] font-bold leading-snug text-textPrimary shadow-[0_3px_0_#E5E7EB]"
    >
      {speech.text}
    </motion.p>
  )

  const menu = menuOpen && !dragging && (
    <div className="flex w-max items-center gap-1.5 rounded-2xl border-2 border-border bg-surface p-1.5 shadow-[0_3px_0_#E5E7EB]">
      <button
        type="button"
        onClick={() => {
          primary.action()
          setMenuOpen(false)
        }}
        className="press inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-[13px] font-extrabold text-onAccent shadow-[0_3px_0_#46A302]"
      >
        <PrimaryIcon size={15} strokeWidth={2.8} />
        {primary.label}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        title={t('companionDismiss')}
        aria-label={t('companionDismiss')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:bg-pomSoft hover:text-coralInk"
      >
        <X size={16} strokeWidth={2.6} />
      </button>
    </div>
  )

  return (
    <motion.div
      ref={rootRef}
      className="fixed z-[45]"
      style={{ left: left_, top, width: SIZE, height: SIZE }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.18 }}
    >
      <div
        className={`absolute flex gap-2 ${above ? 'bottom-full mb-2 flex-col' : 'top-full mt-4 flex-col-reverse'} ${
          alignRight ? 'right-0 items-end' : 'left-0 items-start'
        }`}
      >
        {/* announced politely: the lines are companionship, never urgent */}
        <div role="status" aria-live="polite">
          {bubble}
        </div>
        {menu}
      </div>

      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onTap}
        onKeyDown={onKeyDown}
        aria-label={t('companionAria')}
        aria-expanded={menuOpen}
        className={`companion-handle relative block h-full w-full rounded-full ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <CompanionCharacter
          mood={mood}
          progress={progress}
          ringColor={over ? colors.coral : activeSession?.mode === 'break' ? colors.yellow : colors.accent}
          dull={dragging ? 0 : wear.dull}
          lid={flash === 'cheer' ? 0 : wear.lid}
          size={SIZE}
        />
        {activeSession && (
          <span
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 bg-surface px-1.5 text-[11px] font-extrabold leading-[18px] tabular-nums ${
              over ? 'border-[#FFB3B3] text-coralInk' : 'border-border text-textPrimary'
            }`}
          >
            {clock}
          </span>
        )}
      </button>
    </motion.div>
  )
}
