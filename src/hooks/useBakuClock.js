import { useEffect, useRef, useState } from 'react'

const TIME_API_URL = 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Baku'
const BAKU_UTC_OFFSET_MS = 4 * 60 * 60 * 1000
const RESYNC_INTERVAL_MS = 5 * 60 * 1000

// Baku has no DST, so its offset from UTC is always +4h.
function bakuEpochFromApiResponse(data) {
  const utcMs = Date.UTC(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds)
  return utcMs - BAKU_UTC_OFFSET_MS
}

// Tracks the real current instant, corrected against an internet time API
// rather than trusting the device clock. Falls back to the local clock
// (offset 0) if the network request fails.
export function useBakuClock() {
  const [now, setNow] = useState(() => new Date())
  const offsetRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function sync() {
      try {
        const res = await fetch(TIME_API_URL)
        const data = await res.json()
        const epoch = bakuEpochFromApiResponse(data)
        if (!cancelled) offsetRef.current = epoch - Date.now()
      } catch {
        // keep using the previous (or zero) offset on failure
      }
    }

    sync()
    const resync = setInterval(sync, RESYNC_INTERVAL_MS)
    const tick = setInterval(() => setNow(new Date(Date.now() + offsetRef.current)), 1000)

    return () => {
      cancelled = true
      clearInterval(resync)
      clearInterval(tick)
    }
  }, [])

  return now
}
