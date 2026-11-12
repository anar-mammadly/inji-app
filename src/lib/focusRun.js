// The focus session: a run of several focus blocks with movement breaks
// between them. Pure state transitions — no React, no timers, no I/O.
//
// How a run goes:
//   • A focus block counts down. When it reaches zero it does NOT move on by
//     itself: the clock keeps running into overtime until the user stands up.
//     The longer the overtime, the more worn the companion looks (see WEAR).
//   • Standing up starts a break. A block only counts as done if at least
//     half of it was actually worked.
//   • A break fills one segment of the run — in proportion to how much of the
//     break was really taken. Coming back after one minute of a five-minute
//     break fills a fifth of the segment.
//   • After every `longEvery` counted blocks the break is a long one.
//   • When every segment is full the run is finished and summarised.
import { addDaysISO } from '../utils/day'

export const FOCUS_DEFAULTS = { blocks: 4, focusMin: 25, breakMin: 5, longBreakMin: 15, longEvery: 4, autoContinue: false }

// [min, max, step] for each adjustable setting
export const FOCUS_LIMITS = {
  blocks: [1, 10, 1],
  focusMin: [10, 90, 5],
  breakMin: [1, 20, 1],
  longBreakMin: [5, 40, 5],
}

export const COUNT_SHARE = 0.5 // share of a block that must be worked for it to count
export const SNOOZE_SECONDS = 5 * 60
export const MUTE_MINUTES = 60

// Reminders, in minutes relative to the end of a focus block. The first is a
// quiet heads-up before the end; the rest come further and further apart.
export const NUDGE_MINUTES = [-1, 0, 4, 8, 12, 16, 20, 30, 40, 60, 90]

// How the companion wears down with overtime (minutes past the end). The
// thresholds sit between the reminders above, so a new stage and a reminder
// never speak at the same moment.
export const WEAR = [
  { from: 0, stage: 'waiting' }, // time is up, still patient
  { from: 3, stage: 'dull' }, // losing its shine, gathering dust
  { from: 25, stage: 'closing' }, // the shell starts to close
  { from: 50, stage: 'shut' }, // closed until you stand up
]

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const EPS = 1e-6

export function emptyRun() {
  return { progress: 0, blocks: 0, focusMin: 0, moveMin: 0 }
}

export function emptyTotals() {
  return { blocks: 0, runs: 0, streak: { last: '', days: 0 } }
}

export function focusSettings(state) {
  return { ...FOCUS_DEFAULTS, ...(state.focusSettings || {}) }
}

// ---- reading the clock --------------------------------------------------------

// `speed` lets a test run a minute in a second; real sessions use 1.
const speedOf = (session) => session?.speed || 1

function elapsedSeconds(session, now) {
  return ((now - new Date(session.startedAt).getTime()) / 1000) * speedOf(session)
}

// Seconds until the session's end. Negative once it has run past it.
export function remainingSeconds(session, now = Date.now()) {
  if (!session) return 0
  if (session.status === 'paused') return session.secondsLeftAtStart
  return session.secondsLeftAtStart - elapsedSeconds(session, now)
}

export function plannedSeconds(session) {
  return session?.plannedSeconds || 25 * 60
}

// Minutes a focus block has run past its end (0 while there is time left).
export function overtimeMinutes(session, now = Date.now()) {
  if (!session || session.mode !== 'focus') return 0
  return Math.max(0, -remainingSeconds(session, now)) / 60
}

export function wearStage(overMin) {
  let stage = null
  for (const step of WEAR) if (overMin >= step.from) stage = step.stage
  return overMin > 0 ? stage : null
}

// How worn the companion should look: `dull` 0–1 (shine lost, dust), `lid`
// 0–1 (how far the shell has closed over the pearl).
export function wearLevel(overMin) {
  if (overMin <= 0) return { dull: 0, lid: 0 }
  const dull = clamp((overMin - 1) / 24, 0, 1)
  const lid = overMin < 25 ? 0 : overMin < 50 ? 0.42 + ((overMin - 25) / 25) * 0.2 : 1
  return { dull, lid }
}

// Minutes of the current break actually taken so far (capped at its length).
export function movedMinutes(session, now = Date.now()) {
  if (!session || session.mode !== 'break') return 0
  const planned = plannedSeconds(session)
  const taken = session.status === 'paused' ? planned - session.secondsLeftAtStart : elapsedSeconds(session, now)
  return clamp(taken, 0, planned) / 60
}

// Progress of the run in segments (0…blocks), including the break under way.
export function runProgress(state, now = Date.now()) {
  const settings = focusSettings(state)
  const run = state.focusRun || emptyRun()
  const session = state.activeSession
  const live = session?.mode === 'break' ? Math.min(1, movedMinutes(session, now) / settings.breakMin) : 0
  return Math.min(settings.blocks, run.progress + live)
}

export function isMuted(state, now = Date.now()) {
  return !!state.focusMuteUntil && new Date(state.focusMuteUntil).getTime() > now
}

// ---- transitions ----------------------------------------------------------------

function nextStreak(streak = { last: '', days: 0 }, today) {
  if (streak.last === today) return streak
  return { last: today, days: streak.last === addDaysISO(today, -1) ? streak.days + 1 : 1 }
}

function focusSession(state, { now, taskId, id, speed }) {
  const seconds = focusSettings(state).focusMin * 60
  return {
    id,
    taskId: taskId ?? null,
    mode: 'focus',
    status: 'running',
    startedAt: new Date(now).toISOString(),
    secondsLeftAtStart: seconds,
    plannedSeconds: seconds,
    snoozed: false,
    speed: speed || 1,
  }
}

export function startFocus(state, { now = Date.now(), taskId = null, id, speed = 1 }) {
  return { ...state, activeSession: focusSession(state, { now, taskId, id, speed }) }
}

// Leave the desk: end the focus block (whenever it is) and start the break.
export function standUp(state, { now = Date.now(), today, id, historyLimit = 200 }) {
  const session = state.activeSession
  if (!session || session.mode !== 'focus') return state
  const settings = focusSettings(state)
  const run = state.focusRun || emptyRun()
  const totals = state.focusTotals || emptyTotals()

  const planned = plannedSeconds(session)
  const worked = Math.max(0, planned + (session.snoozed ? SNOOZE_SECONDS : 0) - remainingSeconds(session, now))
  const counted = worked >= planned * COUNT_SHARE
  const blocks = run.blocks + (counted ? 1 : 0)
  const long = counted && blocks % settings.longEvery === 0 && blocks < settings.blocks
  const breakSeconds = (long ? settings.longBreakMin : settings.breakMin) * 60

  const entry = {
    id: session.id,
    taskId: session.taskId,
    startedAt: session.startedAt,
    endedAt: new Date(now).toISOString(),
    completed: counted,
    mode: 'focus',
    minutes: Math.round(worked / 60),
  }

  return {
    ...state,
    pomodoroHistory: [...(state.pomodoroHistory || []), entry].slice(-historyLimit),
    focusRun: { ...run, blocks, focusMin: run.focusMin + worked / 60 },
    focusTotals: counted
      ? { ...totals, blocks: totals.blocks + 1, streak: nextStreak(totals.streak, today) }
      : totals,
    activeSession: {
      id,
      taskId: session.taskId,
      mode: 'break',
      status: 'running',
      startedAt: new Date(now).toISOString(),
      secondsLeftAtStart: breakSeconds,
      plannedSeconds: breakSeconds,
      long,
      earned: counted, // did the block before this break count?
      atDesk: false,
      speed: speedOf(session),
    },
  }
}

function closeRun(state, run, now) {
  const totals = state.focusTotals || emptyTotals()
  return {
    ...state,
    activeSession: null,
    focusRun: emptyRun(),
    focusTotals: { ...totals, runs: totals.runs + 1 },
    lastFocusRun: {
      endedAt: new Date(now).toISOString(),
      blocks: run.blocks,
      focusMin: Math.round(run.focusMin),
      moveMin: Math.round(run.moveMin),
      streakDays: totals.streak?.days || 0,
      first: totals.runs === 0,
    },
  }
}

// Bank the break taken so far. → { state with the segment added, done? }
function bankBreak(state, now) {
  const session = state.activeSession
  const settings = focusSettings(state)
  const run = state.focusRun || emptyRun()
  const moved = movedMinutes(session, now)
  const progress = Math.min(settings.blocks, run.progress + Math.min(1, moved / settings.breakMin))
  return { run: { ...run, progress, moveMin: run.moveMin + moved }, done: progress >= settings.blocks - EPS }
}

// Come back from a break: next focus block, or the end of the run.
export function backToFocus(state, { now = Date.now(), id }) {
  const session = state.activeSession
  if (!session || session.mode !== 'break') return state
  const { run, done } = bankBreak(state, now)
  if (done) return closeRun(state, run, now)
  const next = { ...state, focusRun: run }
  return { ...next, activeSession: focusSession(next, { now, taskId: session.taskId, id, speed: speedOf(session) }) }
}

// The last segment filled up while the break is still running: finish now
// rather than making the user sit out the rest of the break.
export function finishIfComplete(state, { now = Date.now() }) {
  const session = state.activeSession
  if (!session || session.mode !== 'break') return state
  const { run, done } = bankBreak(state, now)
  return done ? closeRun(state, run, now) : state
}

// "Five more minutes" — once per block, only after the time is up.
export function snooze(state, { now = Date.now() }) {
  const session = state.activeSession
  if (!session || session.mode !== 'focus' || session.snoozed || remainingSeconds(session, now) > 0) return state
  return { ...state, activeSession: { ...session, snoozed: true, secondsLeftAtStart: session.secondsLeftAtStart + SNOOZE_SECONDS } }
}

export function togglePause(state, { now = Date.now() }) {
  const session = state.activeSession
  if (!session) return state
  if (session.status === 'running') {
    return { ...state, activeSession: { ...session, status: 'paused', secondsLeftAtStart: remainingSeconds(session, now) } }
  }
  return { ...state, activeSession: { ...session, status: 'running', startedAt: new Date(now).toISOString() } }
}

// Abandon the current focus block without a break (the run itself stays).
export function cancelFocus(state, { now = Date.now(), historyLimit = 200 }) {
  const session = state.activeSession
  if (!session) return state
  const worked = plannedSeconds(session) - remainingSeconds(session, now)
  const history =
    session.mode === 'focus' && worked > 0
      ? [
          ...(state.pomodoroHistory || []),
          {
            id: session.id,
            taskId: session.taskId,
            startedAt: session.startedAt,
            endedAt: new Date(now).toISOString(),
            completed: false,
            mode: 'focus',
            minutes: Math.round(Math.max(0, worked) / 60),
          },
        ].slice(-historyLimit)
      : state.pomodoroHistory || []
  return { ...state, activeSession: null, pomodoroHistory: history }
}

export function resetRun(state) {
  return { ...state, activeSession: null, focusRun: emptyRun() }
}

export function toggleAtDesk(state) {
  const session = state.activeSession
  if (!session || session.mode !== 'break') return state
  return { ...state, activeSession: { ...session, atDesk: !session.atDesk } }
}

// Move a setting one step up or down (direction ±1), or flip a boolean one.
export function changeSetting(state, key, direction) {
  const settings = focusSettings(state)
  let value
  if (key === 'autoContinue') {
    value = !settings.autoContinue
  } else {
    const [min, max, step] = FOCUS_LIMITS[key]
    value = clamp(settings[key] + step * direction, min, max)
  }
  const next = { ...state, focusSettings: { ...settings, [key]: value } }
  if (key === 'blocks') {
    const run = state.focusRun || emptyRun()
    next.focusRun = { ...run, progress: Math.min(run.progress, value) }
  }
  return next
}

export function toggleMute(state, { now = Date.now() }) {
  return {
    ...state,
    focusMuteUntil: isMuted(state, now) ? null : new Date(now + MUTE_MINUTES * 60_000).toISOString(),
  }
}

// Planned length of a whole run in minutes, for the settings summary.
export function runLengthMinutes(settings) {
  let total = settings.blocks * settings.focusMin
  for (let i = 1; i <= settings.blocks; i++) {
    total += i % settings.longEvery === 0 && i < settings.blocks ? settings.longBreakMin : settings.breakMin
  }
  return total
}
