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

function loadInitialState(storageKey, useLocalStorage = true) {
  const raw = useLocalStorage ? localStorage.getItem(storageKey) : null
  const base = raw ? JSON.parse(raw) : defaultState()
  const merged = { ...defaultState(), ...base }
  merged.habits = ensureSportHabit(merged.habits)
  const rolled = applyDateRollover(merged)
  return { ...merged, ...rolled }
}

export function usePersistedState(userId) {
  const storageKey = `inji_state_${userId}`
  const isGuest = userId === 'guest'
  const [state, setState] = useState(() => loadInitialState(storageKey, isGuest))
  const stateRef = useRef(state)
  const [loaded, setLoaded] = useState(false)
  const prevUserIdRef = useRef(userId)
  const skipSaveRef = useRef(false)
  const persistQueueRef = useRef(Promise.resolve())
  const persistenceReadyRef = useRef(isGuest)

  function persistState(nextState, targetUserId = userId) {
    if (!targetUserId || targetUserId === 'guest') return
    persistQueueRef.current = persistQueueRef.current
      .catch(() => {})
      .then(() => supabase
        .from('user_data')
        .upsert({ user_id: targetUserId, data: nextState, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }))
      .then(({ error }) => {
        if (error) console.error('Supabase sync failed:', error.message)
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
    setState(loadInitialState(storageKey, false))
  }, [userId, storageKey])

  useEffect(() => {
    if (!userId || userId === 'guest') {
      setLoaded(true)
      return
    }
    let active = true

    supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        persistenceReadyRef.current = !error
        if (!error && data?.data && typeof data.data === 'object') {
          const merged = { ...defaultState(), ...data.data }
          merged.habits = ensureSportHabit(merged.habits)
          const rolled = applyDateRollover(merged)
          setState({ ...merged, ...rolled })
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
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  useEffect(() => {
    if (!userId || userId === 'guest' || !loaded || !persistenceReadyRef.current) return
    persistState(stateRef.current)
  }, [userId, loaded])

  function updateState(update) {
    const nextState = typeof update === 'function' ? update(stateRef.current) : update
    stateRef.current = nextState
    localStorage.setItem(storageKey, JSON.stringify(nextState))
    setState(nextState)
    if (!isGuest && loaded && persistenceReadyRef.current) persistState(nextState)
  }

  return [state, updateState]
}
