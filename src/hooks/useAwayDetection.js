import { useEffect, useRef } from 'react'
import { AWAY_MINUTES } from '../lib/focusRun'

const AWAY_MS = AWAY_MINUTES * 60_000

export const awayDetectionSupported = typeof window !== 'undefined' && 'IdleDetector' in window

// Must be called from a click: the browser shows its own permission prompt.
export async function requestAwayPermission() {
  if (!awayDetectionSupported) return 'unsupported'
  try {
    return await window.IdleDetector.requestPermission()
  } catch {
    return 'denied'
  }
}

// "Notice when I get up": with the browser's permission, a computer left
// untouched for three minutes during a focus block starts the break by itself
// — counted from the moment the user left — and coming back ends it.
// (Idle Detection exists in Chromium browsers on desktop only.)
export function useAwayDetection(enabled, timer) {
  const latest = useRef(timer)
  latest.current = timer

  useEffect(() => {
    if (!enabled || !awayDetectionSupported) return
    const abort = new AbortController()

    ;(async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'idle-detection' })
        if (permission.state !== 'granted') return
        const detector = new window.IdleDetector()
        detector.addEventListener('change', () => {
          const { activeSession: session, stepAway, backToFocus } = latest.current
          const away = detector.userState === 'idle' || detector.screenState === 'locked'
          if (away) {
            if (session?.mode === 'focus' && session.status === 'running') stepAway(Date.now() - AWAY_MS)
          } else if (session?.mode === 'break' && session.auto) {
            backToFocus()
          }
        })
        await detector.start({ threshold: AWAY_MS, signal: abort.signal })
      } catch {
        // not allowed or not available: the timer simply works without it
      }
    })()

    return () => abort.abort()
  }, [enabled])
}
