import { useEffect, useState } from 'react'
import { seedTasks } from '../utils/seed'
import { applyDateRollover, todayISO } from './useStreak'
import { supabase } from '../lib/supabase'

const DEFAULT_DAILY_GOAL = 20
const DEFAULT_WEEKLY_GOAL = 100
const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

function defaultState() {
  return {
    tasks: seedTasks,
    beadCount: 0,
    lastActiveDate: todayISO(),
    streakDays: 0,
    history: [],
    dailyGoal: DEFAULT_DAILY_GOAL,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    categoryCounts: DEFAULT_CATEGORY_COUNTS,
    todayBeadCategories: [],
    completedTasks: [],
    learnings: {},   // { 'YYYY-MM-DD': [{ id, text, createdAt }] }
  }
}

function loadInitialState(storageKey) {
  const raw = localStorage.getItem(storageKey)
  const base = raw ? JSON.parse(raw) : defaultState()

  const rolled = applyDateRollover(base)
  return {
    ...defaultState(),
    ...base,
    ...rolled,
  }
}

export function useTaskStore(userId) {
  const storageKey = `inji_state_${userId}`
  const [state, setState] = useState(() => loadInitialState(storageKey))
  const [loaded, setLoaded] = useState(false)

  // Pull the latest saved state for this user from Supabase once on login.
  useEffect(() => {
    if (!userId) return
    let active = true

    supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        if (data?.data) {
          const rolled = applyDateRollover({ ...defaultState(), ...data.data })
          setState({ ...defaultState(), ...data.data, ...rolled })
        }
        setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  // Debounced sync to Supabase so every keystroke doesn't fire a request.
  useEffect(() => {
    if (!userId || !loaded) return
    const timeout = setTimeout(() => {
      supabase.from('user_data').upsert({
        user_id: userId,
        data: state,
        updated_at: new Date().toISOString(),
      })
    }, 500)
    return () => clearTimeout(timeout)
  }, [state, userId, loaded])

  function addTask(name, category, col = 'todo') {
    const task = {
      id: String(Date.now()),
      name,
      category,
      col,
      createdAt: new Date().toISOString(),
      completedAt: null,
    }
    setState((s) => ({ ...s, tasks: [...s.tasks, task] }))
  }

  function moveTask(id, toCol) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, col: toCol } : t)),
    }))
  }

  function completeTask(id) {
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id)
      return {
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, col: 'done', completedAt: new Date().toISOString() } : t,
        ),
        beadCount: s.beadCount + 1,
        categoryCounts: task
          ? { ...s.categoryCounts, [task.category]: (s.categoryCounts[task.category] || 0) + 1 }
          : s.categoryCounts,
        todayBeadCategories: task
          ? [...s.todayBeadCategories, task.category]
          : s.todayBeadCategories,
        completedTasks: task
          ? [
              ...s.completedTasks,
              { id: task.id, name: task.name, category: task.category, completedAt: new Date().toISOString() },
            ]
          : s.completedTasks,
      }
    })
  }

  function deleteTask(id) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
  }

  function resetJar() {
    setState((s) => ({ ...s, beadCount: 0, todayBeadCategories: [] }))
  }

  function resetStats() {
    setState((s) => ({ ...s, categoryCounts: DEFAULT_CATEGORY_COUNTS, completedTasks: [] }))
  }

  function setDailyGoal(goal) {
    setState((s) => ({ ...s, dailyGoal: Math.max(1, goal) }))
  }

  function setWeeklyGoal(goal) {
    setState((s) => ({ ...s, weeklyGoal: Math.max(1, goal) }))
  }

  function addLearning(dateISO, text) {
    const item = { id: String(Date.now()), text, createdAt: new Date().toISOString() }
    setState((s) => ({
      ...s,
      learnings: {
        ...s.learnings,
        [dateISO]: [...(s.learnings[dateISO] || []), item],
      },
    }))
  }

  function deleteLearning(dateISO, id) {
    setState((s) => ({
      ...s,
      learnings: {
        ...s.learnings,
        [dateISO]: (s.learnings[dateISO] || []).filter((l) => l.id !== id),
      },
    }))
  }

  const weeklyCount = state.beadCount + state.history.reduce((sum, h) => sum + h.count, 0)

  return {
    tasks: state.tasks,
    beadCount: state.beadCount,
    weeklyCount,
    streakDays: state.streakDays,
    dailyGoal: state.dailyGoal,
    weeklyGoal: state.weeklyGoal,
    categoryCounts: state.categoryCounts,
    todayBeadCategories: state.todayBeadCategories,
    completedTasks: state.completedTasks,
    learnings: state.learnings || {},
    addTask,
    moveTask,
    completeTask,
    deleteTask,
    resetJar,
    resetStats,
    setDailyGoal,
    setWeeklyGoal,
    addLearning,
    deleteLearning,
  }
}
