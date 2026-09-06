import { useEffect, useRef, useState } from 'react'
import { seedTasks } from '../utils/seed'
import { applyDateRollover, todayISO } from './useStreak'
import { migrate, CURRENT_SCHEMA_VERSION } from './migrations'
import { BREAK_SECONDS, computeOvershootSeconds } from './usePomodoroStore'

// A running focus session found stale (overshot its end by more than a full
// break's worth of time) almost certainly means the tab was closed and never
// reopened, rather than the user legitimately still being on that session —
// resolve it as abandoned instead of letting it silently auto-advance.
// Best-effort only: there is no way to distinguish this from "closed the tab
// and came back a week later intending to resume," so a generous threshold
// is used and this only ever fires on app load.
const STALE_SESSION_THRESHOLD_SECONDS = BREAK_SECONDS

function resolveStaleSession(state) {
  const session = state.activeSession
  if (!session || session.mode !== 'focus' || session.status !== 'running') return state
  const overshoot = computeOvershootSeconds(session)
  if (overshoot < STALE_SESSION_THRESHOLD_SECONDS) return state

  return {
    ...state,
    activeSession: null,
    pomodoroHistory: [
      ...(state.pomodoroHistory || []),
      {
        id: session.id,
        taskId: session.taskId,
        startedAt: session.startedAt,
        endedAt: new Date().toISOString(),
        completed: false,
        mode: 'focus',
        abandonedByStaleness: true,
      },
    ],
  }
}

const STORAGE_KEY = 'inji_state'
const DEFAULT_DAILY_GOAL = 20
const DEFAULT_WEEKLY_GOAL = 100
const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

const DEFAULT_BOARDS = [
  { id: 'work', name: 'Work', builtIn: true, createdAt: new Date().toISOString() },
  { id: 'personal', name: 'Personal', builtIn: true, createdAt: new Date().toISOString() },
]

const DEFAULT_SPORT_OPTIONS = ['Qaçış', 'İdman zalı', 'Gəzinti', 'Yoqa', 'Digər']

const DEFAULT_HABITS = [
  {
    id: 'sport',
    name: 'Sport',
    kind: 'sport',
    color: null,
    targetDays: 30,
    startDate: todayISO(),
    subOptions: DEFAULT_SPORT_OPTIONS,
    createdAt: new Date().toISOString(),
  },
]

function ensureSportHabit(habits) {
  const hasSport = habits.some((h) => h.kind === 'sport')
  const withSport = hasSport ? habits : [...habits, DEFAULT_HABITS[0]]
  // backfill fields for habits created before the chain-challenge / sub-option features existed
  return withSport.map((h) => ({
    ...h,
    targetDays: h.targetDays || 30,
    startDate: h.startDate || todayISO(),
    subOptions: h.subOptions || (h.kind === 'sport' ? DEFAULT_SPORT_OPTIONS : []),
  }))
}

function loadInitialState() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tasks: seedTasks.map((t) => ({ ...t, boardId: t.category === 'personal' ? 'personal' : 'work' })),
      boards: DEFAULT_BOARDS,
      beadCount: 0,
      lastActiveDate: todayISO(),
      streakDays: 0,
      history: [],
      dailyGoal: DEFAULT_DAILY_GOAL,
      weeklyGoal: DEFAULT_WEEKLY_GOAL,
      categoryCounts: DEFAULT_CATEGORY_COUNTS,
      todayBeadCategories: [],
      completedTasks: [],
      activeSession: null,
      pomodoroHistory: [],
      habits: DEFAULT_HABITS,
      habitLog: {},
      learningGoals: [],
      journalEntries: [],
      events: [],
    }
  }

  const parsed = JSON.parse(raw)
  const version = parsed.schemaVersion || 1

  if (version < CURRENT_SCHEMA_VERSION) {
    localStorage.setItem(`inji_state_backup_v${version}`, raw)
  }

  const migrated = migrate(parsed)
  const rolled = applyDateRollover(migrated)

  const merged = {
    dailyGoal: DEFAULT_DAILY_GOAL,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    history: [],
    categoryCounts: DEFAULT_CATEGORY_COUNTS,
    todayBeadCategories: [],
    completedTasks: [],
    boards: DEFAULT_BOARDS,
    activeSession: null,
    pomodoroHistory: [],
    habits: [],
    habitLog: {},
    learningGoals: [],
    journalEntries: [],
    events: [],
    ...migrated,
    ...rolled,
  }

  merged.habits = ensureSportHabit(merged.habits)
  return resolveStaleSession(merged)
}

export function usePersistedState() {
  const [state, setState] = useState(loadInitialState)
  const stateRef = useRef(state)

  function updateState(update) {
    const nextState = typeof update === 'function' ? update(stateRef.current) : update
    stateRef.current = nextState
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
    setState(nextState)
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return [state, updateState]
}
