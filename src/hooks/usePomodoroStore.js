import { generateId } from '../utils/id'

export const FOCUS_SECONDS = 25 * 60
export const BREAK_SECONDS = 5 * 60

export function durationFor(mode) {
  return mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
}

// Standalone (non-hook) version so usePersistedState can resolve a stale
// session on load without needing a component instance.
export function computeSecondsLeft(session) {
  if (!session) return 0
  if (session.status === 'paused') return session.secondsLeftAtStart
  const elapsed = (Date.now() - new Date(session.startedAt).getTime()) / 1000
  return Math.max(0, session.secondsLeftAtStart - elapsed)
}

// Unclamped: how far past its natural end this running session is. Used to
// tell "just finished while the tab was away" (small overshoot, handled by
// the normal onModeComplete flow) apart from "left running and never came
// back" (large overshoot, resolved as abandoned on next load).
export function computeOvershootSeconds(session) {
  if (!session || session.status !== 'running') return 0
  const elapsed = (Date.now() - new Date(session.startedAt).getTime()) / 1000
  return elapsed - session.secondsLeftAtStart
}

export function usePomodoroStore(state, setState) {
  const activeSession = state.activeSession || null
  const pomodoroHistory = state.pomodoroHistory || []

  function startSession(taskId = null) {
    setState((s) => ({
      ...s,
      activeSession: {
        id: generateId(),
        taskId,
        mode: 'focus',
        startedAt: new Date().toISOString(),
        secondsLeftAtStart: FOCUS_SECONDS,
        status: 'running',
      },
    }))
  }

  function toggleRunning() {
    setState((s) => {
      const session = s.activeSession
      if (!session) return s
      if (session.status === 'running') {
        return {
          ...s,
          activeSession: { ...session, status: 'paused', secondsLeftAtStart: computeSecondsLeft(session) },
        }
      }
      return {
        ...s,
        activeSession: { ...session, status: 'running', startedAt: new Date().toISOString() },
      }
    })
  }

  function advanceToNextMode() {
    setState((s) => {
      const session = s.activeSession
      if (!session) return s

      const nextHistory =
        session.mode === 'focus'
          ? [
              ...(s.pomodoroHistory || []),
              {
                id: session.id,
                taskId: session.taskId,
                startedAt: session.startedAt,
                endedAt: new Date().toISOString(),
                completed: true,
                mode: 'focus',
              },
            ]
          : s.pomodoroHistory || []

      const nextMode = session.mode === 'focus' ? 'break' : 'focus'
      return {
        ...s,
        pomodoroHistory: nextHistory,
        activeSession: {
          id: generateId(),
          taskId: nextMode === 'focus' ? session.taskId : null,
          mode: nextMode,
          startedAt: new Date().toISOString(),
          secondsLeftAtStart: durationFor(nextMode),
          status: 'running',
        },
      }
    })
  }

  function resetSession() {
    setState((s) => {
      const mode = s.activeSession?.mode || 'focus'
      const taskId = s.activeSession?.taskId ?? null
      return {
        ...s,
        activeSession: {
          id: generateId(),
          taskId,
          mode,
          startedAt: new Date().toISOString(),
          secondsLeftAtStart: durationFor(mode),
          status: 'paused',
        },
      }
    })
  }

  // Abandons the current focus session: logs it as not-completed and clears
  // it (no fresh session is started, unlike resetSession). The caller is
  // responsible for deciding whether this counts as a "break the pending
  // bead" event — see App.jsx's handlePomodoroCancel.
  function cancelSession() {
    setState((s) => {
      const session = s.activeSession
      if (!session) return s
      const hadProgress = computeSecondsLeft(session) < durationFor(session.mode)
      const nextHistory =
        session.mode === 'focus' && hadProgress
          ? [
              ...(s.pomodoroHistory || []),
              {
                id: session.id,
                taskId: session.taskId,
                startedAt: session.startedAt,
                endedAt: new Date().toISOString(),
                completed: false,
                mode: 'focus',
              },
            ]
          : s.pomodoroHistory || []
      return { ...s, activeSession: null, pomodoroHistory: nextHistory }
    })
  }

  return {
    activeSession,
    pomodoroHistory,
    computeSecondsLeft,
    startSession,
    toggleRunning,
    advanceToNextMode,
    resetSession,
    cancelSession,
  }
}
