import { useEffect, useRef } from 'react'
import { NUDGE_MINUTES, focusSettings, isMuted, remainingSeconds, runProgress } from '../lib/focusRun'
import { playTimerEndSound } from '../utils/sound'

// Watches the running session from the app shell, so it works on every page:
//   • focus: fires the reminders around and after the end of the block
//     (a block never ends by itself — the user stands up);
//   • break: announces its end, moves on by itself if that setting is on, and
//     closes the run as soon as its last segment is full.
//
// `onEvent(type, detail)` lets the app notify; sounds are played here.
export function usePomodoroTicker(state, actions, onEvent) {
  const latest = useRef({ state, actions, onEvent })
  latest.current = { state, actions, onEvent }
  const fired = useRef({ id: null, nudge: -1, breakEnded: false })

  const session = state.activeSession
  const id = session?.id
  const running = session?.status === 'running'
  const speed = session?.speed || 1

  useEffect(() => {
    if (!id || !running) return

    function tick() {
      const { state: current, actions: act, onEvent: emit } = latest.current
      const live = current.activeSession
      if (!live || live.id !== id || live.status !== 'running') return
      const muted = isMuted(current)
      const left = remainingSeconds(live)

      if (fired.current.id !== id) {
        // new session (or a reload in the middle of one): reminders whose
        // moment has already passed are not replayed
        const overMin = -left / 60
        let done = -1
        while (done + 1 < NUDGE_MINUTES.length && overMin > NUDGE_MINUTES[done + 1] + 0.1) done++
        fired.current = { id, nudge: done, breakEnded: live.mode === 'break' && left < -3 }
      }

      if (live.mode === 'focus') {
        const next = fired.current.nudge + 1
        if (next < NUDGE_MINUTES.length && -left / 60 >= NUDGE_MINUTES[next]) {
          fired.current.nudge = next
          const at = NUDGE_MINUTES[next]
          if (at >= 0 && !muted) playTimerEndSound()
          emit?.(at < 0 ? 'focusSoon' : at === 0 ? 'focusDone' : 'overtime', { muted })
        }
        return
      }

      // break
      const settings = focusSettings(current)
      if (runProgress(current) >= settings.blocks - 1e-6) {
        if (!muted) playTimerEndSound()
        emit?.('runDone', { muted })
        act.finishIfComplete()
        return
      }
      if (left <= 0 && !fired.current.breakEnded) {
        fired.current.breakEnded = true
        if (!muted) playTimerEndSound()
        emit?.('breakDone', { muted })
        if (settings.autoContinue) act.backToFocus()
      }
    }

    tick()
    const interval = setInterval(tick, speed > 1 ? 200 : 1000)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id, running, speed])
}
