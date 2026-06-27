function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayISO() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

const HISTORY_LIMIT = 6

export function applyDateRollover({ beadCount, lastActiveDate, streakDays, history = [] }) {
  const today = todayISO()

  if (lastActiveDate === today) {
    return { beadCount, lastActiveDate, streakDays, history }
  }

  const yesterday = yesterdayISO()
  let nextStreak = streakDays
  let nextHistory = history

  if (lastActiveDate) {
    nextHistory = [...history, { date: lastActiveDate, count: beadCount }].slice(-HISTORY_LIMIT)
  }

  if (lastActiveDate === yesterday && beadCount > 0) {
    nextStreak = streakDays + 1
  } else if (lastActiveDate && lastActiveDate < yesterday) {
    nextStreak = 0
  }

  return { beadCount: 0, lastActiveDate: today, streakDays: nextStreak, history: nextHistory }
}

export { todayISO, yesterdayISO }
