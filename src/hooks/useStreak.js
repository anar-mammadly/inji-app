import { format, subDays } from 'date-fns'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

function yesterdayISO() {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd')
}

const HISTORY_LIMIT = 6

export function applyDateRollover({ beadCount, lastActiveDate, streakDays, history = [], todayBeadCategories = [] }) {
  const today = todayISO()

  if (lastActiveDate === today) {
    return { beadCount, lastActiveDate, streakDays, history, todayBeadCategories }
  }

  const yesterday = yesterdayISO()
  let nextStreak = streakDays
  let nextHistory = history

  if (lastActiveDate) {
    nextHistory = [...history, { date: lastActiveDate, count: beadCount }].slice(-HISTORY_LIMIT)
  }

  if (lastActiveDate === yesterday && beadCount > 0) {
    nextStreak = streakDays + 1
  } else if (lastActiveDate === yesterday && beadCount === 0) {
    nextStreak = 0
  } else if (lastActiveDate && lastActiveDate < yesterday) {
    nextStreak = 0
  }

  return {
    beadCount: 0,
    lastActiveDate: today,
    streakDays: nextStreak,
    history: nextHistory,
    todayBeadCategories: [],
  }
}

export { todayISO, yesterdayISO }
