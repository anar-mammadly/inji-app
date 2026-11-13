// One definition of "today" for the whole app.
//
// The clock in the header is pinned to Baku time, so the day has to roll over
// on Baku time too — otherwise someone travelling sees the jar reset, the
// streak tick and the habit chain move at a different moment than the date
// shown on screen. Every store and page takes its dates from here.
const BAKU_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Baku',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// "2026-11-12" for the given instant, as the calendar reads in Baku
export function isoDay(date = new Date()) {
  const parts = Object.fromEntries(BAKU_PARTS.formatToParts(date).map((p) => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function todayISO() {
  return isoDay(new Date())
}

// Pure calendar arithmetic on a YYYY-MM-DD key (no time zones involved).
export function addDaysISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  return shifted.toISOString().slice(0, 10)
}

export function yesterdayISO() {
  return addDaysISO(todayISO(), -1)
}

// A local Date at midnight of a YYYY-MM-DD key — for date-fns formatting and
// calendar grids, where only the calendar day matters.
export function dateFromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
