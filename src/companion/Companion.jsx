import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Minus, PersonStanding, PictureInPicture2, Play, Plus, X } from 'lucide-react'
import CompanionCharacter from './CompanionCharacter'
import { SIZE_LIMITS } from './useCompanionPrefs'
import { greetingEvent, pickLine } from './lines'
import { useTranslation } from '../i18n/LanguageContext'
import { isMuted, overtimeMinutes, plannedSeconds, remainingSeconds, wearLevel, wearStage } from '../lib/focusRun'
import { playCompanionSound } from '../utils/sound'
import { colors } from '../utils/colors'

const EDGE = 8 // closest it may sit to the screen edge
const DRAG_THRESHOLD = 5 // px of movement before a press becomes a drag
const KEY_STEP = 24
const TICKLE_TAPS = 5
const TICKLE_WINDOW_MS = 2200
const AMBIENT_GAP_MS = 8 * 60_000 // small talk (a reply to a tap) at most this often
const SAID_KEY = 'inji_companion_said' // milestones already celebrated on this device
const PIP_SIZE = { width: 240, height: 320 }

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// A floating always-on-top window outside the browser (Document
// Picture-in-Picture). Chromium desktop browsers only, and only from the top page.
const pipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window && window.top === window

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

function useWindowSize(target) {
  const [size, setSize] = useState(() => ({ w: target.innerWidth, h: target.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: target.innerWidth, h: target.innerHeight })
    onResize()
    target.addEventListener('resize', onResize)
    return () => target.removeEventListener('resize', onResize)
  }, [target])
  return size
}

// the floating window is a separate document: give it the page's styles
function copyStyles(doc) {
  for (const sheet of document.styleSheets) {
    try {
      const style = doc.createElement('style')
      style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join('\n')
      doc.head.append(style)
    } catch {
      // a stylesheet from another origin (the web font): link to it instead
      if (sheet.href) {
        const link = doc.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        doc.head.append(link)
      }
    }
  }
}

// Sədəf: a small companion that follows the focus timer on every page.
//
//   • She sits wherever you drag her, at whatever size you choose — or in a
//     window of her own outside the browser, which stays on top of everything
//     and can be moved and resized like any window.
//   • While you focus she is quiet.
//   • When a block is over she asks you to stand up — and the longer you stay
//     seated, the more she dries out: the water in her shell sinks away, the
//     shell pales and cracks, the pearl turns matte. Then the shell starts to
//     close, and finally it shuts. Standing up brings the water back.
//   • During the break she suggests something to do, walking or at the desk.
//   • She speaks only when something happens, never to fill a silence.
//
// `timer` is the object from usePomodoroStore; `timerEvent` is the latest
// reminder fired by usePomodoroTicker ({ type, at }); `onPulse` asks that
// ticker to check the clock now (used from the floating window).
export default function Companion({
  initialPos,
  initialSize,
  onMove,
  onResize,
  onDismiss,
  timer,
  timerEvent,
  onPulse,
  beadCount,
  dailyGoal,
}) {
  const { t, lang } = useTranslation()
  const { activeSession, settings, run, totals, lastRun } = timer
  const muted = isMuted({ focusMuteUntil: timer.muteUntil })
  const viewport = useWindowSize(window)
  const [pos, setPos] = useState(initialPos)
  const [size, setSize] = useState(initialSize)
  const [dragging, setDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [speech, setSpeech] = useState(null) // { text, id }
  const [flash, setFlash] = useState(null) // short-lived mood: 'cheer' | 'dizzy'
  const [pipWin, setPipWin] = useState(null)
  const [, setTick] = useState(0)

  const rootRef = useRef(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const lineMemory = useRef({})
  const taps = useRef([])
  const timers = useRef({})
  const lastAmbient = useRef(0)
  const live = useRef({})
  live.current = { lang, settings, run, totals, lastRun, audible: settings.sound && !muted }

  const spanX = Math.max(1, viewport.w - size - EDGE * 2)
  const spanY = Math.max(1, viewport.h - size - EDGE * 2)
  const x = EDGE + clamp01(pos.x) * spanX
  const y = EDGE + clamp01(pos.y) * spanY

  // ---- voice ----------------------------------------------------------------

  const sound = useCallback((name) => {
    if (live.current.audible) playCompanionSound(name)
  }, [])

  const say = useCallback(
    (event, vars, ms = 4600) => {
      const text = pickLine(live.current.lang, event, lineMemory.current, vars)
      if (!text) return
      clearTimeout(timers.current.speech)
      setSpeech({ text, id: Date.now() })
      sound('drop')
      timers.current.speech = setTimeout(() => setSpeech(null), ms)
    },
    [sound],
  )

  const react = useCallback((mood, ms = 1300) => {
    clearTimeout(timers.current.flash)
    setFlash(mood)
    timers.current.flash = setTimeout(() => setFlash(null), ms)
  }, [])

  useEffect(() => {
    const pending = timers.current
    const now = new Date()
    const hello = setTimeout(() => say(greetingEvent(now.getHours(), now.getDay())), 450)
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
    const f = live.current
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
      sound('tap')
      if (!before) say(f.run.blocks === f.settings.blocks - 1 ? 'lastBlock' : 'focusStart', { min: f.settings.focusMin })
      else say(left <= 1 ? 'lastBlock' : Math.random() < 0.25 ? 'fact' : 'backToFocus', { left })
      return
    }
    if (now.mode === 'break' && before?.mode === 'focus') {
      react('cheer', 1600)
      sound('splash')
      const milestone =
        now.earned &&
        ((f.totals.blocks === 50 && !saidBefore('blocks50') && 'blocks50') ||
          (f.totals.blocks === 100 && !saidBefore('blocks100') && 'blocks100') ||
          (f.totals.streak?.days >= 7 && !saidBefore('streak7') && 'streak7'))
      const event = milestone || (now.auto ? 'awayBreak' : now.long ? 'longBreak' : now.earned ? 'standUp' : 'standUpEarly')
      say(event, { min: Math.round(plannedSeconds(now) / 60) }, 6000)
      return
    }
    if (before && before.id === now.id) {
      if (!before.snoozed && now.snoozed) say('snooze')
      else if (before.status !== now.status) say(now.status === 'paused' ? 'paused' : 'resumed', undefined, 3000)
    }
  }, [activeSession, say, react, sound])

  // reminders from the app's ticker: block nearly over, over, still sitting
  useEffect(() => {
    if (!timerEvent) return
    if (timerEvent.type === 'focusSoon') say('focusSoon')
    else if (timerEvent.type === 'focusDone') {
      react('cheer', 900)
      say('focusDone', { min: live.current.settings.breakMin }, 6500)
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
  // drying once, and offer three things to do during a break. In her own
  // window the clock is driven by that window's timers — the page behind may
  // be a background tab whose timers the browser slows down.
  const spoken = useRef({ id: null, marks: new Set() })
  const running = activeSession?.status === 'running'
  const speed = activeSession?.speed || 1
  useEffect(() => {
    if (!running) return
    const host = pipWin || window
    const id = host.setInterval(() => {
      setTick((n) => n + 1)
      if (pipWin) onPulse?.()
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
        if (stage === 'dry') once('dry', () => say('wearDry', undefined, 5500))
        else if (stage === 'closing') once('closing', () => say('wearClosing', undefined, 6500))
        else if (stage === 'shut') once('shut', () => say('wearShut', undefined, 7000))
      } else {
        const done = 1 - remainingSeconds(session) / plannedSeconds(session)
        const tip = session.atDesk ? 'stretchTip' : 'walkTip'
        ;[0.2, 0.5, 0.8].forEach((mark) => {
          if (done >= mark && done < 1) once(`tip${mark}`, () => say(tip, undefined, 7000))
        })
      }
    }, speed > 1 ? 250 : 1000)
    return () => host.clearInterval(id)
  }, [running, speed, say, pipWin, onPulse])

  // ---- her own window ---------------------------------------------------------

  async function openWindow() {
    if (pipWin) {
      pipWin.focus()
      return
    }
    try {
      const win = await window.documentPictureInPicture.requestWindow(PIP_SIZE)
      copyStyles(win.document)
      win.document.title = lang === 'az' ? 'Sədəf' : 'Sadaf'
      win.document.documentElement.lang = lang
      win.addEventListener('pagehide', () => setPipWin(null), { once: true })
      setMenuOpen(false)
      setPipWin(win)
      say('pipOpen')
    } catch {
      // the browser refused (no user gesture, or already open elsewhere)
    }
  }

  // sending her away closes her window too
  useEffect(() => () => pipWin?.close(), [pipWin])

  const pipViewport = useWindowSize(pipWin || window)

  // ---- pointer + keyboard -----------------------------------------------------

  function moveTo(nextX, nextY) {
    const next = { x: clamp01((nextX - EDGE) / spanX), y: clamp01((nextY - EDGE) / spanY) }
    setPos(next)
    return next
  }

  function resize(direction) {
    const next = Math.min(SIZE_LIMITS.max, Math.max(SIZE_LIMITS.min, size + SIZE_LIMITS.step * direction))
    if (next === size) return
    // grow and shrink around her centre, so she stays where she is
    const cx = x + size / 2
    const cy = y + size / 2
    const nextSpanX = Math.max(1, viewport.w - next - EDGE * 2)
    const nextSpanY = Math.max(1, viewport.h - next - EDGE * 2)
    const nextPos = { x: clamp01((cx - next / 2 - EDGE) / nextSpanX), y: clamp01((cy - next / 2 - EDGE) / nextSpanY) }
    setSize(next)
    setPos(nextPos)
    onResize(next)
    onMove(nextPos)
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, x, y, moved: false, last: pos }
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
    d.last = moveTo(d.x + dx, d.y + dy)
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
    sound('tap')
    if (!pipWin) setMenuOpen((open) => !open)
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
      onMove(moveTo(x + delta[0], y + delta[1]))
    } else if (e.key === '+' || e.key === '=') {
      resize(1)
    } else if (e.key === '-') {
      resize(-1)
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

  // one action, the same one the timer card offers at this moment
  const primary = !activeSession
    ? { label: t('companionStart'), icon: Play, action: () => timer.startSession() }
    : activeSession.mode === 'break'
      ? { label: t('backToWork'), icon: Play, action: timer.backToFocus }
      : running
        ? { label: t('standUp'), icon: PersonStanding, action: timer.standUp }
        : { label: t('pomodoroResume'), icon: Play, action: timer.toggleRunning }
  const PrimaryIcon = primary.icon
  const canSnooze = over && running && !activeSession.snoozed

  const character = (px) => (
    <CompanionCharacter
      mood={mood}
      progress={progress}
      ringColor={over ? colors.coral : activeSession?.mode === 'break' ? colors.yellow : colors.accent}
      dry={dragging ? 0 : wear.dry}
      lid={flash === 'cheer' ? 0 : wear.lid}
      size={px}
    />
  )

  // ---- in her own window ----
  if (pipWin) {
    const px = Math.round(Math.min(Math.max(pipViewport.w - 40, 48), Math.max(pipViewport.h - 176, 48), 420))
    return (
      <>
        <div
          role="status"
          className="fixed z-[45] rounded-2xl border-2 border-border bg-surface px-3 py-2 text-[12px] font-bold text-textSecondary shadow-[0_3px_0_#E5E7EB]"
          style={{ right: 16, bottom: 96, maxWidth: 240 }}
        >
          {t('companionPipBack')}
        </div>
        {createPortal(
          <div className="flex h-screen select-none flex-col items-center justify-between gap-2 bg-bg p-3 font-sans text-textPrimary">
            <p role="status" aria-live="polite" className="flex min-h-[3.4em] w-full items-center justify-center text-center text-[13px] font-bold leading-snug">
              {speech?.text}
            </p>
            <button type="button" onClick={onTap} aria-label={t('companionAria')} className="shrink-0 rounded-full">
              {character(px)}
            </button>
            <div className="flex w-full flex-col items-stretch gap-2">
              <span className={`text-center text-[20px] font-extrabold leading-none tabular-nums ${over ? 'text-coralInk' : 'text-textPrimary'}`}>
                {activeSession ? clock : '\u00a0'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={primary.action}
                  className="press inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-[14px] font-extrabold text-onAccent shadow-[0_3px_0_#46A302]"
                >
                  <PrimaryIcon size={16} strokeWidth={2.8} />
                  {primary.label}
                </button>
                {canSnooze && (
                  <button
                    type="button"
                    onClick={timer.snooze}
                    className="press h-10 rounded-xl border-2 border-border bg-white px-2.5 text-[12px] font-extrabold text-textSecondary shadow-[0_3px_0_#E5E7EB]"
                  >
                    {t('snooze5')}
                  </button>
                )}
              </div>
            </div>
          </div>,
          pipWin.document.body,
        )}
      </>
    )
  }

  // ---- on the page ----

  // bubble and menu open towards the middle of the screen
  const above = y > viewport.h * 0.42
  const alignRight = x + size / 2 > viewport.w / 2
  const iconButton = 'inline-flex h-9 w-9 items-center justify-center rounded-xl text-textSecondary hover:bg-surfaceAlt disabled:opacity-35 disabled:pointer-events-none'

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
    <div className="flex w-max max-w-[calc(100vw-24px)] flex-col gap-1.5 rounded-2xl border-2 border-border bg-surface p-1.5 shadow-[0_3px_0_#E5E7EB]">
      <button
        type="button"
        onClick={() => {
          primary.action()
          setMenuOpen(false)
        }}
        className="press inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-[13px] font-extrabold text-onAccent shadow-[0_3px_0_#46A302]"
      >
        <PrimaryIcon size={15} strokeWidth={2.8} />
        {primary.label}
      </button>
      <div className="flex items-center justify-between gap-0.5">
        <button type="button" onClick={() => resize(-1)} disabled={size <= SIZE_LIMITS.min} title={t('companionSmaller')} aria-label={t('companionSmaller')} className={iconButton}>
          <Minus size={16} strokeWidth={2.8} />
        </button>
        <button type="button" onClick={() => resize(1)} disabled={size >= SIZE_LIMITS.max} title={t('companionBigger')} aria-label={t('companionBigger')} className={iconButton}>
          <Plus size={16} strokeWidth={2.8} />
        </button>
        {pipSupported && (
          <button type="button" onClick={openWindow} title={t('companionPip')} aria-label={t('companionPip')} className={iconButton}>
            <PictureInPicture2 size={16} strokeWidth={2.4} />
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          title={t('companionDismiss')}
          aria-label={t('companionDismiss')}
          className={`${iconButton} hover:!bg-pomSoft hover:text-coralInk`}
        >
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )

  return (
    <motion.div
      ref={rootRef}
      className="fixed z-[45]"
      style={{ left: x, top: y, width: size, height: size }}
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
        {character(size)}
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
