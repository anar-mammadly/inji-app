import { useEffect, useRef, useState } from 'react'
import { applyDateRollover, todayISO } from './useStreak'
import { supabase } from '../lib/supabase'

const DEFAULT_DAILY_GOAL = 20
const DEFAULT_WEEKLY_GOAL = 100
const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

function defaultState() {
  return {
    tasks: [],
    beadCount: 0,
    lastActiveDate: todayISO(),
    streakDays: 0,
    history: [],
    dailyGoal: DEFAULT_DAILY_GOAL,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    categoryCounts: DEFAULT_CATEGORY_COUNTS,
    todayBeadCategories: [],
    completedTasks: [],
    learnings: {},            // { 'YYYY-MM-DD': [{ id, text, createdAt, categoryId? }] }
    learningCategories: [],  // [{ id, name, color }]
    goals: [],
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
    if (!userId || userId === 'guest') { setLoaded(true); return }
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
          const rolled = applyDateRollover(merged)
          setState({ ...merged, ...rolled })
        }
        setLoaded(true)
      })
      .catch(() => {
        if (!active) return
        setLoaded(true)
      })

    return () => { active = false }
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
        .upsert(
          { user_id: userId, data: state, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Supabase sync failed:', error.message)
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

  function editTask(id, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, name: trimmed } : t)),
    }))
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

  function addGoal(text, type, dueDate) {
    const goal = {
      id: String(Date.now()),
      text,
      type,
      dueDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
      done: false,
    }
    setState((s) => ({ ...s, goals: [...(s.goals || []), goal] }))
  }

  function completeGoal(id) {
    setState((s) => ({
      ...s,
      goals: (s.goals || []).map((g) =>
        g.id === id ? { ...g, done: true, completedAt: new Date().toISOString() } : g
      ),
    }))
  }

  function uncompleteGoal(id) {
    setState((s) => ({
      ...s,
      goals: (s.goals || []).map((g) =>
        g.id === id ? { ...g, done: false, completedAt: null } : g
      ),
    }))
  }

  function deleteGoal(id) {
    setState((s) => ({ ...s, goals: (s.goals || []).filter((g) => g.id !== id) }))
  }

  function addLearning(dateISO, text, categoryId = null) {
    const item = { id: String(Date.now()), text, createdAt: new Date().toISOString(), categoryId }
    setState((s) => ({
      ...s,
      learnings: {
        ...s.learnings,
        [dateISO]: [...(s.learnings[dateISO] || []), item],
      },
    }))
  }

  function addLearningCategory(name, color) {
    const cat = { id: String(Date.now()), name, color }
    setState((s) => ({ ...s, learningCategories: [...(s.learningCategories || []), cat] }))
  }

  function deleteLearningCategory(id) {
    setState((s) => ({
      ...s,
      learningCategories: (s.learningCategories || []).filter((c) => c.id !== id),
      // Remove categoryId from items that belonged to this category
      learnings: Object.fromEntries(
        Object.entries(s.learnings).map(([date, items]) => [
          date,
          items.map((item) => item.categoryId === id ? { ...item, categoryId: null } : item),
        ])
      ),
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
    learningCategories: state.learningCategories || [],
    goals: state.goals || [],
    addTask,
    moveTask,
    completeTask,
    deleteTask,
    editTask,
    resetJar,
    resetStats,
    setDailyGoal,
    setWeeklyGoal,
    addLearning,
    deleteLearning,
    addLearningCategory,
    deleteLearningCategory,
    addGoal,
    completeGoal,
    uncompleteGoal,
    deleteGoal,
  }
}
