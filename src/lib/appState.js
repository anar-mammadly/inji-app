// Shape, defaults and pure transforms of the single app-state object that is
// cached in localStorage and synced to Supabase. No React, no I/O — so every
// rule in here can be unit-tested.
import { applyDateRollover, todayISO } from '../hooks/useStreak'

export const DEFAULT_DAILY_GOAL = 20
export const DEFAULT_WEEKLY_GOAL = 100
export const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

// How much history the synced blob keeps. The whole object is re-sent on every
// save, so lists that only ever grow need a ceiling.
export const COMPLETED_TASKS_LIMIT = 300
export const POMODORO_HISTORY_LIMIT = 200

const DEFAULT_SPORT_OPTIONS = ['Qaçış', 'İdman zalı', 'Gəzinti', 'Yoqa', 'Digər']
const PLAN_DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function defaultBoards() {
  const createdAt = new Date().toISOString()
  return [
    { id: 'work', name: 'Work', builtIn: true, createdAt },
    { id: 'personal', name: 'Personal', builtIn: true, createdAt },
  ]
}

export function defaultState() {
  return {
    tasks: [],
    boards: defaultBoards(),
    beadCount: 0,
    lastActiveDate: todayISO(),
    streakDays: 0,
    history: [],
    dailyGoal: DEFAULT_DAILY_GOAL,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    categoryCounts: { ...DEFAULT_CATEGORY_COUNTS },
    todayBeadCategories: [],
    completedTasks: [],
    activeSession: null,
    pomodoroHistory: [],
    habits: [],
    habitLog: {},
    learningGoals: [],
    journalEntries: [],
    events: [],
    notes: [],
    planDays: PLAN_DAY_IDS.map((id) => ({ id, title: '', todos: [] })),
    planGoals: [],
  }
}

function normalizeHabits(habits) {
  return (habits || []).map((h) => ({
    ...h,
    targetDays: h.targetDays || 30,
    startDate: h.startDate || todayISO(),
    subOptions: h.subOptions || (h.kind === 'sport' ? DEFAULT_SPORT_OPTIONS : []),
  }))
}

// Roll the day over if the stored state is from an earlier day.
export function withRollover(state) {
  return state.lastActiveDate === todayISO() ? state : { ...state, ...applyDateRollover(state) }
}

// Raw stored/server data → a complete, current state object.
export function buildState(rawData) {
  const merged = { ...defaultState(), ...(rawData && typeof rawData === 'object' ? rawData : {}) }
  merged.habits = normalizeHabits(merged.habits)
  merged.completedTasks = (merged.completedTasks || []).slice(-COMPLETED_TASKS_LIMIT)
  merged.pomodoroHistory = (merged.pomodoroHistory || []).slice(-POMODORO_HISTORY_LIMIT)
  return withRollover(merged)
}

// Whether a state holds anything the user actually made (as opposed to the
// untouched defaults every fresh browser starts with).
export function hasUserContent(data) {
  if (!data || typeof data !== 'object') return false
  const lists = ['tasks', 'notes', 'events', 'habits', 'learningGoals', 'journalEntries', 'planGoals', 'completedTasks']
  if (lists.some((key) => Array.isArray(data[key]) && data[key].length > 0)) return true
  if ((data.boards || []).some((b) => !b.builtIn)) return true
  if ((data.planDays || []).some((d) => d.title || (d.todos || []).length > 0)) return true
  return false
}

// A short inventory of guest data, for the "add it to your account?" prompt.
export function summarizeContent(data) {
  const count = (key) => (Array.isArray(data?.[key]) ? data[key].length : 0)
  return {
    tasks: count('tasks'),
    notes: count('notes'),
    events: count('events'),
    habits: count('habits'),
    goals: count('learningGoals') + count('planGoals'),
    journal: count('journalEntries'),
    todos: (data?.planDays || []).reduce((sum, d) => sum + (d.todos || []).length, 0),
  }
}

function appendById(target = [], incoming = []) {
  const seen = new Set(target.map((item) => item.id))
  return [...target, ...incoming.filter((item) => item && !seen.has(item.id))]
}

// Fold what someone made as a guest into the account they just signed in to.
// Additive only: nothing already in the account is changed or removed.
export function mergeGuestData(state, guest) {
  if (!guest || typeof guest !== 'object') return state

  const boards = appendById(state.boards, (guest.boards || []).filter((b) => !b.builtIn))
  const boardIds = new Set(boards.map((b) => b.id))
  const fallbackBoardId = boards[0]?.id
  const guestTasks = (guest.tasks || []).map((t) => (boardIds.has(t.boardId) ? t : { ...t, boardId: fallbackBoardId }))

  const knownCompleted = new Set((state.completedTasks || []).map((c) => c.id))
  const newlyCompleted = (guest.completedTasks || []).filter((c) => c && !knownCompleted.has(c.id))
  const categoryCounts = { ...state.categoryCounts }
  newlyCompleted.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1
  })

  // today's pearls only carry over if the guest earned them today
  const sameDay = guest.lastActiveDate === state.lastActiveDate
  const guestDays = new Map((guest.planDays || []).map((d) => [d.id, d]))

  return {
    ...state,
    boards,
    tasks: appendById(state.tasks, guestTasks),
    completedTasks: [...(state.completedTasks || []), ...newlyCompleted].slice(-COMPLETED_TASKS_LIMIT),
    categoryCounts,
    beadCount: state.beadCount + (sameDay ? guest.beadCount || 0 : 0),
    todayBeadCategories: sameDay
      ? [...(state.todayBeadCategories || []), ...(guest.todayBeadCategories || [])]
      : state.todayBeadCategories,
    notes: appendById(state.notes, guest.notes),
    events: appendById(state.events, guest.events),
    habits: appendById(state.habits, normalizeHabits(guest.habits)),
    habitLog: { ...(guest.habitLog || {}), ...(state.habitLog || {}) },
    learningGoals: appendById(state.learningGoals, guest.learningGoals),
    journalEntries: appendById(state.journalEntries, guest.journalEntries),
    planGoals: appendById(state.planGoals, guest.planGoals),
    planDays: (state.planDays || []).map((day) => {
      const other = guestDays.get(day.id)
      if (!other) return day
      return { ...day, title: day.title || other.title || '', todos: appendById(day.todos, other.todos) }
    }),
    pomodoroHistory: appendById(state.pomodoroHistory, guest.pomodoroHistory).slice(-POMODORO_HISTORY_LIMIT),
  }
}
