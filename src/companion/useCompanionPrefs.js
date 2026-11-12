import { useCallback, useState } from 'react'

const KEY = 'inji_companion'
// fractions of the free screen space, so the spot survives a window resize
const DEFAULT_POS = { x: 1, y: 0.8 }

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && typeof saved === 'object') {
      const pos = saved.pos && Number.isFinite(saved.pos.x) && Number.isFinite(saved.pos.y) ? saved.pos : DEFAULT_POS
      return { summoned: !!saved.summoned, pos }
    }
  } catch {
    // unreadable storage: start with the defaults
  }
  return { summoned: false, pos: DEFAULT_POS }
}

// Whether the companion is on screen and where it was left. Kept per device
// (not synced): a spot that suits a laptop screen means nothing on a phone.
export function useCompanionPrefs() {
  const [prefs, setPrefs] = useState(read)

  const update = useCallback((patch) => {
    setPrefs((current) => {
      const next = { ...current, ...patch }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // still works for this visit
      }
      return next
    })
  }, [])

  return {
    summoned: prefs.summoned,
    pos: prefs.pos,
    toggle: useCallback(() => setPrefs((current) => {
      const next = { ...current, summoned: !current.summoned }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // still works for this visit
      }
      return next
    }), []),
    dismiss: useCallback(() => update({ summoned: false }), [update]),
    setPos: useCallback((pos) => update({ pos }), [update]),
  }
}
