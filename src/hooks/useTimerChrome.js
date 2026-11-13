import { useEffect } from 'react'
import { remainingSeconds } from '../lib/focusRun'

function clock(seconds) {
  const whole = Math.floor(Math.abs(seconds))
  return `${seconds < 0 ? '+' : ''}${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

// Two things outside the page itself while a session runs:
//   • the tab title shows the clock, so it can be read from another tab;
//   • on phones and tablets the screen is kept awake, like a desk clock.
export function useTimerChrome(session) {
  const id = session?.id
  const running = session?.status === 'running'

  useEffect(() => {
    if (!session) return
    const base = 'inji'
    const paint = () => {
      document.title = `${clock(remainingSeconds(session))} · ${base}`
    }
    paint()
    const interval = running ? setInterval(paint, 1000) : null
    return () => {
      clearInterval(interval)
      document.title = base
    }
    // the session object changes identity on every state update; its id and
    // status are what matter here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, running, session?.startedAt, session?.secondsLeftAtStart])

  useEffect(() => {
    if (!running || !('wakeLock' in navigator) || !window.matchMedia('(pointer: coarse)').matches) return
    let lock = null
    let stopped = false
    const acquire = async () => {
      if (stopped || lock || document.visibilityState !== 'visible') return
      try {
        lock = await navigator.wakeLock.request('screen')
        lock.addEventListener('release', () => {
          lock = null
        })
      } catch {
        // battery saver or no permission: the screen may dim, nothing else changes
      }
    }
    acquire()
    document.addEventListener('visibilitychange', acquire) // the lock is dropped when the tab is hidden
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', acquire)
      lock?.release()
    }
  }, [running])
}
