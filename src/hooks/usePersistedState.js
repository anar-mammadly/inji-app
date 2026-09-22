import { useEffect, useRef, useState } from 'react'
import { applyDateRollover, todayISO } from './useStreak'
import { supabase } from '../lib/supabase'

const DEFAULT_DAILY_GOAL = 20
const DEFAULT_WEEKLY_GOAL = 100
const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

const DEFAULT_BOARDS = [
  { id: 'work', name: 'Work', builtIn: true, createdAt: new Date().toISOString() },
  { id: 'personal', name: 'Personal', builtIn: true, createdAt: new Date().toISOString() },
]

const DEFAULT_SPORT_OPTIONS = ['Qaçış', 'İdman zalı', 'Gəzinti', 'Yoqa', 'Digər']

const DEFAULT_PLAN_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((id) => ({
  id,
  title: '',
  todos: [],
}))

function defaultState() {
  return {
    tasks: [],
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
    habits: [],
    habitLog: {},
    learningGoals: [],
    journalEntries: [],
    events: [],
    notes: [],
    planDays: DEFAULT_PLAN_DAYS,
    planGoals: [],
  }
}

function ensureSportHabit(habits) {
  const list = habits || []
  return list.map((h) => ({
    ...h,
    targetDays: h.targetDays || 30,
    startDate: h.startDate || todayISO(),
    subOptions: h.subOptions || (h.kind === 'sport' ? DEFAULT_SPORT_OPTIONS : []),
  }))
}

function buildState(rawData) {
  const merged = { ...defaultState(), ...(rawData || {}) }
  merged.habits = ensureSportHabit(merged.habits)
  const rolled = applyDateRollover(merged)
  return { ...merged, ...rolled }
}

// Local cache entries are wrapped with a `savedAt` timestamp so a reload can
// tell whether the browser's copy or the server's copy is more recent —
// without it, a slow/aborted Supabase write (e.g. a hard refresh right after
// an edit) gets silently overwritten by the stale server copy on next load.
function loadStoredEntry(storageKey) {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.savedAt && parsed.data && typeof parsed.data === 'object') {
      return { data: parsed.data, savedAt: parsed.savedAt }
    }
    // Legacy (pre-timestamp) cache: still usable as data, just treat it as
    // maximally stale so a real server record always wins the comparison.
    if (parsed && typeof parsed === 'object') {
      return { data: parsed, savedAt: null }
    }
    return null
  } catch {
    return null
  }
}

function saveStoredEntry(storageKey, data, savedAt = new Date().toISOString()) {
  localStorage.setItem(storageKey, JSON.stringify({ data, savedAt }))
}

export function usePersistedState(userId) {
  const storageKey = `inji_state_${userId}`
  const isGuest = userId === 'guest'
  const [state, setState] = useState(() => buildState(loadStoredEntry(storageKey)?.data))
  const stateRef = useRef(state)
  const savedAtRef = useRef(loadStoredEntry(storageKey)?.savedAt ?? null)
  const [loaded, setLoaded] = useState(false)
  const prevUserIdRef = useRef(userId)
  const skipSaveRef = useRef(false)
  const persistQueueRef = useRef(Promise.resolve())
  const persistenceReadyRef = useRef(isGuest)

  function persistState(nextState, targetUserId = userId) {
    if (!targetUserId || targetUserId === 'guest') return
    const savedAt = new Date().toISOString()
    persistQueueRef.current = persistQueueRef.current
      .catch(() => {})
      .then(() => supabase
        .from('user_data')
        .upsert({ user_id: targetUserId, data: nextState, updated_at: savedAt }, { onConflict: 'user_id' }))
      .then(({ error }) => {
        if (error) console.error('Supabase sync failed:', error.message)
        else savedAtRef.current = savedAt
      })
  }

  useEffect(() => {
    if (prevUserIdRef.current === userId) return
    const prevUserId = prevUserIdRef.current
    prevUserIdRef.current = userId
    setLoaded(false)
    persistenceReadyRef.current = false
    skipSaveRef.current = true
    if (prevUserId === 'guest' && userId !== 'guest') {
      const userRaw = localStorage.getItem(storageKey)
      if (!userRaw) {
        const guestRaw = localStorage.getItem('inji_state_guest')
        if (guestRaw) {
          localStorage.setItem(storageKey, guestRaw)
        }
      }
      localStorage.removeItem('inji_state_guest')
    }
    const entry = loadStoredEntry(storageKey)
    savedAtRef.current = entry?.savedAt ?? null
    setState(buildState(entry?.data))
  }, [userId, storageKey])

  useEffect(() => {
    if (!userId || userId === 'guest') {
      setLoaded(true)
      return
    }
    let active = true

    supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        persistenceReadyRef.current = !error
        if (!error) {
          const serverUpdatedAt = data?.updated_at ? new Date(data.updated_at).getTime() : -1
          const localSavedAt = savedAtRef.current ? new Date(savedAtRef.current).getTime() : -1

          if (data?.data && typeof data.data === 'object' && serverUpdatedAt > localSavedAt) {
            // Server has a newer copy (e.g. edited from another device) — adopt it.
            const nextState = buildState(data.data)
            stateRef.current = nextState
            savedAtRef.current = data.updated_at
            saveStoredEntry(storageKey, nextState, data.updated_at)
            setState(nextState)
          } else if (localSavedAt > serverUpdatedAt) {
            // Our local copy is newer than what the server has — a previous
            // write likely never completed (e.g. refreshed mid-save). Re-send it.
            persistState(stateRef.current)
          }
        }
        setLoaded(true)
      })
      .catch(() => {
        if (!active) return
        persistenceReadyRef.current = false
        setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    stateRef.current = state
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    saveStoredEntry(storageKey, state, savedAtRef.current ?? undefined)
  }, [state, storageKey])

  function updateState(update) {
    const nextState = typeof update === 'function' ? update(stateRef.current) : update
    stateRef.current = nextState
    const savedAt = new Date().toISOString()
    savedAtRef.current = savedAt
    saveStoredEntry(storageKey, nextState, savedAt)
    setState(nextState)
    if (!isGuest && loaded && persistenceReadyRef.current) persistState(nextState)
  }

  return [state, updateState]
}
