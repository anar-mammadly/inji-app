import { useEffect, useState } from 'react'
import { seedTasks } from '../utils/seed'
import { applyDateRollover, todayISO } from './useStreak'

const STORAGE_KEY = 'boncuk_state'
const DEFAULT_DAILY_GOAL = 20
const DEFAULT_WEEKLY_GOAL = 100
const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

function loadInitialState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  const base = raw
    ? JSON.parse(raw)
    : {
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
      }

  const rolled = applyDateRollover(base)
  return {
    dailyGoal: DEFAULT_DAILY_GOAL,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    history: [],
    categoryCounts: DEFAULT_CATEGORY_COUNTS,
    todayBeadCategories: [],
    completedTasks: [],
    ...base,
    ...rolled,
  }
}

export function useTaskStore() {
  const [state, setState] = useState(loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

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
    addTask,
    moveTask,
    completeTask,
    deleteTask,
    resetJar,
    resetStats,
    setDailyGoal,
    setWeeklyGoal,
  }
}
