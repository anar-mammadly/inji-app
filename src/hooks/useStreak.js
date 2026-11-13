import { addDaysISO, todayISO, yesterdayISO } from '../utils/day'

// the jar's "week" is today plus the six days before it
const WEEK_SPAN_DAYS = 6

// Entries of the per-day history that still fall inside the rolling week.
// History is appended once per *active* day, so after a break the last six
// entries can reach back for weeks — filter by date, never by position.
export function historyInWeek(history = [], today = todayISO()) {
  const oldest = addDaysISO(today, -WEEK_SPAN_DAYS)
  return history.filter((h) => h && h.date >= oldest && h.date < today)
}

export function weeklyBeadCount(state, today = todayISO()) {
  return (state.beadCount || 0) + historyInWeek(state.history, today).reduce((sum, h) => sum + (h.count || 0), 0)
}

export function applyDateRollover(
  { beadCount, lastActiveDate, streakDays, history = [], todayBeadCategories = [] },
  today = todayISO(),
) {
  if (lastActiveDate === today) {
    return { beadCount, lastActiveDate, streakDays, history, todayBeadCategories }
  }

  const yesterday = addDaysISO(today, -1)
  let nextStreak = streakDays
  let nextHistory = history

  if (lastActiveDate) {
    nextHistory = historyInWeek([...history, { date: lastActiveDate, count: beadCount }], today)
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
