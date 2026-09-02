// crypto.randomUUID() only exists in secure contexts (HTTPS or localhost) —
// it's undefined when the app is opened over plain HTTP via a LAN IP (e.g.
// testing on a phone at http://192.168.x.x:5173), which silently breaks any
// handler that calls it. This falls back to a manual id in that case.
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
