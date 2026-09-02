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
    habits: DEFAULT_HABITS,
    habitLog: {},
    learningGoals: [],
    journalEntries: [],
    events: [],
  }
}

function ensureSportHabit(habits) {
  const list = habits || []
  const hasSport = list.some((h) => h.kind === 'sport')
  const withSport = hasSport ? list : [...list, DEFAULT_HABITS[0]]
  return withSport.map((h) => ({
    ...h,
    targetDays: h.targetDays || 30,
    startDate: h.startDate || todayISO(),
    subOptions: h.subOptions || (h.kind === 'sport' ? DEFAULT_SPORT_OPTIONS : []),
  }))
}

function loadInitialState(storageKey) {
  const raw = localStorage.getItem(storageKey)
  const base = raw ? JSON.parse(raw) : defaultState()
  const merged = { ...defaultState(), ...base }
  merged.habits = ensureSportHabit(merged.habits)
  const rolled = applyDateRollover(merged)
  return { ...merged, ...rolled }
}

export function usePersistedState(userId) {
  const storageKey = `inji_state_${userId}`
  const [state, setState] = useState(() => loadInitialState(storageKey))
  const [loaded, setLoaded] = useState(false)
  const prevUserIdRef = useRef(userId)
  const skipSaveRef = useRef(false)

  useEffect(() => {
    if (prevUserIdRef.current === userId) return
    const prevUserId = prevUserIdRef.current
    prevUserIdRef.current = userId
    setLoaded(false)
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
    setState(loadInitialState(storageKey))
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
        setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  useEffect(() => {
    if (!userId || userId === 'guest' || !loaded) return
    const timeout = setTimeout(() => {
      supabase
        .from('user_data')
        .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.error('Supabase sync failed:', error.message)
        })
    }, 500)
    return () => clearTimeout(timeout)
  }, [state, userId, loaded])

  return [state, setState]
}
