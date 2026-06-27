import { useEffect, useState } from 'react'
import { seedTasks } from '../utils/seed'
import { applyDateRollover, todayISO } from './useStreak'

const STORAGE_KEY = 'boncuk_state'
const DEFAULT_DAILY_GOAL = 20
const DEFAULT_WEEKLY_GOAL = 100

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
      }

  const rolled = applyDateRollover(base)
  return {
    dailyGoal: DEFAULT_DAILY_GOAL,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    history: [],
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
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, col: 'done', completedAt: new Date().toISOString() } : t,
      ),
      beadCount: s.beadCount + 1,
    }))
  }

  function deleteTask(id) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
  }

  function resetJar() {
    setState((s) => ({ ...s, beadCount: 0 }))
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
    addTask,
    moveTask,
    completeTask,
    deleteTask,
    resetJar,
    setDailyGoal,
    setWeeklyGoal,
  }
}
