import { generateId } from '../utils/id'

const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

export function useTaskStore(state, setState) {
  function addTask(name, category, boardId, col = 'todo') {
    const task = {
      id: generateId(),
      name,
      category,
      boardId,
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
              { id: task.id, name: task.name, category: task.category, boardId: task.boardId, completedAt: new Date().toISOString() },
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

  function resetWeeklyGoal() {
    setState((s) => ({ ...s, history: [], weeklyGoalResetAt: new Date().toISOString() }))
  }

  function addBoard(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    const board = { id: generateId(), name: trimmed, builtIn: false, createdAt: new Date().toISOString() }
    setState((s) => ({ ...s, boards: [...s.boards, board] }))
    return board.id
  }

  function deleteBoard(id) {
    setState((s) => {
      const board = s.boards.find((b) => b.id === id)
      if (!board || board.builtIn) return s
      const fallbackId = s.boards.find((b) => b.id !== id)?.id
      return {
        ...s,
        boards: s.boards.filter((b) => b.id !== id),
        tasks: s.tasks.map((t) => (t.boardId === id ? { ...t, boardId: fallbackId } : t)),
      }
    })
  }

  const weeklyCount = state.beadCount + state.history.reduce((sum, h) => sum + h.count, 0)

  return {
    tasks: state.tasks,
    boards: state.boards,
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
    editTask,
    resetJar,
    resetStats,
    setDailyGoal,
    setWeeklyGoal,
    resetWeeklyGoal,
    addBoard,
    deleteBoard,
  }
}
