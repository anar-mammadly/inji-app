import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, X } from 'lucide-react'
import CompanionCharacter from './CompanionCharacter'
import { greetingEvent, pickLine } from './lines'
import { useTranslation } from '../i18n/LanguageContext'
import { BREAK_SECONDS, FOCUS_SECONDS, computeSecondsLeft, durationFor } from '../hooks/usePomodoroStore'
import { colors } from '../utils/colors'

const SIZE = 76
const EDGE = 8 // closest it may sit to the screen edge
const DRAG_THRESHOLD = 5 // px of movement before a press becomes a drag
const KEY_STEP = 24
const TICKLE_TAPS = 5
const TICKLE_WINDOW_MS = 2200

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

// Sədəf: a small companion that sits wherever you drag it, follows the focus
// timer on every page, and speaks only when something happens — a session
// starting or ending, a break, a finished task. During focus it stays quiet.
export default function Companion({
  initialPos,
  onMove,
  onDismiss,
  activeSession,
  beadCount,
  dailyGoal,
  onStartFocus,
  onToggleTimer,
}) {
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

  const spanX = Math.max(1, viewport.w - SIZE - EDGE * 2)
  const spanY = Math.max(1, viewport.h - SIZE - EDGE * 2)
  const left = EDGE + clamp01(pos.x) * spanX
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

  // session changes: started, switched to a break, back to focus, paused, stopped
  const seen = useRef({ session: activeSession, beadCount })
  useEffect(() => {
    const before = seen.current.session
    const now = activeSession
    seen.current.session = now
    if (before === now) return
    if (!before && now) {
      if (now.status === 'running' && now.mode === 'focus') say('focusStart', { min: FOCUS_SECONDS / 60 })
    } else if (before && !now) {
      say('cancelled')
    } else if (before.mode !== now.mode) {
      if (now.mode === 'break') {
        react('cheer', 1600)
        say('breakStart', { min: BREAK_SECONDS / 60 }, 6500)
      } else {
        say('focusResume')
      }
    } else if (before.status !== now.status) {
      say(now.status === 'paused' ? 'paused' : 'resumed', undefined, 3000)
    }
  }, [activeSession, say, react])

  // a finished task drops a pearl in the jar — worth a cheer
  useEffect(() => {
    const before = seen.current.beadCount
    seen.current.beadCount = beadCount
    if (beadCount > before) {
      react('cheer')
      say(beadCount === dailyGoal ? 'goalReached' : 'taskDone')
    }
  }, [beadCount, dailyGoal, say, react])

  // While a session runs: redraw the ring every second, and speak at a few
  // fixed moments (last minute of focus; twice during a break).
  const spoken = useRef({ id: null, marks: new Set() })
  const running = activeSession?.status === 'running'
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setTick((n) => n + 1)
      const session = seen.current.session
      if (!session || session.status !== 'running') return
      if (spoken.current.id !== session.id) spoken.current = { id: session.id, marks: new Set() }
      const total = durationFor(session.mode)
      const leftSec = computeSecondsLeft(session)
      const done = 1 - leftSec / total
      const once = (mark, fn) => {
        if (spoken.current.marks.has(mark)) return
        spoken.current.marks.add(mark)
        fn()
      }
      if (session.mode === 'focus') {
        if (leftSec <= 60 && leftSec > 3 && total > 120) once('almost', () => say('focusAlmost'))
      } else {
        if (done >= 0.2) once('tip1', () => say('breakTip', undefined, 7000))
        if (done >= 0.6) once('tip2', () => say('breakTip', undefined, 7000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running, say])

  // ---- pointer + keyboard -----------------------------------------------------

  function moveTo(nextLeft, nextTop) {
    const next = { x: clamp01((nextLeft - EDGE) / spanX), y: clamp01((nextTop - EDGE) / spanY) }
    setPos(next)
    return next
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, left, top, moved: false, last: pos }
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
    if (taps.current.length === 1 && !speech) say('tap', undefined, 2200)
  }

  function onKeyDown(e) {
    const step = e.shiftKey ? KEY_STEP * 4 : KEY_STEP
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (delta) {
      e.preventDefault()
      onMove(moveTo(left + delta[0], top + delta[1]))
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

  const secondsLeft = activeSession ? computeSecondsLeft(activeSession) : 0
  const total = activeSession ? durationFor(activeSession.mode) : FOCUS_SECONDS
  const progress = activeSession ? 1 - secondsLeft / total : null
  const mood = dragging
    ? 'held'
    : flash || (!activeSession ? 'idle' : activeSession.status === 'paused' ? 'sleepy' : activeSession.mode)

  const whole = Math.floor(Math.max(0, secondsLeft))
  const clock = `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`

  // bubble and menu open towards the middle of the screen
  const above = top > viewport.h * 0.42
  const alignRight = left + SIZE / 2 > viewport.w / 2

  const primary = !activeSession
    ? { label: t('companionStart'), icon: Play, action: onStartFocus }
    : running
      ? { label: t('pomodoroPause'), icon: Pause, action: onToggleTimer }
      : { label: t('pomodoroResume'), icon: Play, action: onToggleTimer }
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
        <PrimaryIcon size={14} strokeWidth={3} fill="currentColor" />
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
      style={{ left, top, width: SIZE, height: SIZE }}
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
          ringColor={activeSession?.mode === 'break' ? colors.yellow : colors.accent}
          size={SIZE}
        />
        {activeSession && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-border bg-surface px-1.5 text-[11px] font-extrabold leading-[18px] tabular-nums text-textPrimary">
            {clock}
          </span>
        )}
      </button>
    </motion.div>
  )
}
