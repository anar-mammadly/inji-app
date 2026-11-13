import { generateId } from '../utils/id'
import { todayISO } from '../utils/day'
import { POMODORO_HISTORY_LIMIT } from '../lib/appState'
import {
  backToFocus,
  cancelFocus,
  dayStats,
  stepAway,
  changeSetting,
  emptyRun,
  emptyTotals,
  finishIfComplete,
  focusSettings,
  plannedSeconds,
  remainingSeconds,
  resetRun,
  snooze,
  standUp,
  startFocus,
  toggleAtDesk,
  toggleMute,
  togglePause,
} from '../lib/focusRun'

// Seconds left on the clock, never below zero (overtime is read separately).
export function computeSecondsLeft(session) {
  return Math.max(0, remainingSeconds(session))
}

export { plannedSeconds }

// `?fast` in the address runs a minute in a second — for trying the whole
// flow (overtime, wear, breaks, the end of a run) without waiting.
const SPEED = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast') ? 60 : 1

// The focus timer's state and actions. All rules live in lib/focusRun.js;
// this hook only supplies "now", ids and today's date.
export function usePomodoroStore(state, setState) {
  const at = () => ({ now: Date.now(), id: generateId(), today: todayISO(), historyLimit: POMODORO_HISTORY_LIMIT })

  return {
    activeSession: state.activeSession || null,
    pomodoroHistory: state.pomodoroHistory || [],
    settings: focusSettings(state),
    run: state.focusRun || emptyRun(),
    totals: state.focusTotals || emptyTotals(),
    lastRun: state.lastFocusRun || null,
    muteUntil: state.focusMuteUntil || null,
    today: dayStats(state, todayISO()),
    computeSecondsLeft,

    startSession: (taskId = null) => setState((s) => startFocus(s, { ...at(), taskId, speed: SPEED })),
    standUp: () => setState((s) => standUp(s, at())),
    // the break began when the user walked away (`since`), see useAwayDetection
    stepAway: (since) => setState((s) => stepAway(s, { ...at(), since })),
    backToFocus: () => setState((s) => backToFocus(s, at())),
    finishIfComplete: () => setState((s) => finishIfComplete(s, at())),
    snooze: () => setState((s) => snooze(s, at())),
    toggleRunning: () => setState((s) => togglePause(s, at())),
    cancelSession: () => setState((s) => cancelFocus(s, at())),
    resetRun: () => setState((s) => resetRun(s)),
    toggleAtDesk: () => setState((s) => toggleAtDesk(s)),
    changeSetting: (key, direction) => setState((s) => changeSetting(s, key, direction)),
    toggleMute: () => setState((s) => toggleMute(s, at())),
    dismissSummary: () => setState((s) => (s.lastFocusRun ? { ...s, lastFocusRun: { ...s.lastFocusRun, seen: true } } : s)),
  }
}
