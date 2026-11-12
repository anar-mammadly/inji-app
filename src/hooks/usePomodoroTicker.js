import { useEffect, useRef } from 'react'
import { computeSecondsLeft } from './usePomodoroStore'
import { playTimerEndSound } from '../utils/sound'

// Ends the running focus/break session when its time is up — from anywhere in
// the app. (This used to live inside the timer card, so the timer only moved
// on while the Board page happened to be open.)
//
// One timeout aimed at the end of the session instead of polling; a tab that
// was asleep past the deadline catches up as soon as it wakes.
export function usePomodoroTicker(activeSession, onModeComplete, notify) {
  const callbacks = useRef({ onModeComplete, notify })
  callbacks.current = { onModeComplete, notify }

  const id = activeSession?.id
  const status = activeSession?.status
  const startedAt = activeSession?.startedAt
  const sessionRef = useRef(activeSession)
  sessionRef.current = activeSession

  useEffect(() => {
    if (!id || status !== 'running') return
    let timeout

    function finish() {
      const session = sessionRef.current
      if (!session || session.id !== id || session.status !== 'running') return
      if (computeSecondsLeft(session) > 0) {
        arm() // woke up early (throttled timers): wait out the remainder
        return
      }
      playTimerEndSound()
      callbacks.current.notify?.(session.mode)
      callbacks.current.onModeComplete()
    }

    function arm() {
      clearTimeout(timeout)
      timeout = setTimeout(finish, computeSecondsLeft(sessionRef.current) * 1000 + 30)
    }

    arm()
    const onVisible = () => document.visibilityState === 'visible' && finish()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id, status, startedAt])
}
