import { format } from 'date-fns'
import { generateId } from '../utils/id'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function usePlanStore(state, setState) {
  const planDays = state.planDays || []
  const planGoals = state.planGoals || []

  function setDayTitle(dayId, title) {
    setState((s) => ({
      ...s,
      planDays: (s.planDays || []).map((d) => (d.id === dayId ? { ...d, title: title.trim() } : d)),
    }))
  }

  function addTodo(dayId, text, time) {
    const trimmed = text.trim()
    if (!trimmed) return
    const todo = { id: generateId(), text: trimmed, done: false, time: time || null }
    setState((s) => ({
      ...s,
      planDays: (s.planDays || []).map((d) => (d.id === dayId ? { ...d, todos: [...(d.todos || []), todo] } : d)),
    }))
  }

  function toggleTodo(dayId, todoId) {
    setState((s) => ({
      ...s,
      planDays: (s.planDays || []).map((d) =>
        d.id === dayId
          ? { ...d, todos: (d.todos || []).map((t) => (t.id === todoId ? { ...t, done: !t.done } : t)) }
          : d,
      ),
    }))
  }

  function editTodo(dayId, todoId, text) {
    const trimmed = text.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      planDays: (s.planDays || []).map((d) =>
        d.id === dayId
          ? { ...d, todos: (d.todos || []).map((t) => (t.id === todoId ? { ...t, text: trimmed } : t)) }
          : d,
      ),
    }))
  }

  function setTodoTime(dayId, todoId, time) {
    setState((s) => ({
      ...s,
      planDays: (s.planDays || []).map((d) =>
        d.id === dayId
          ? { ...d, todos: (d.todos || []).map((t) => (t.id === todoId ? { ...t, time: time || null } : t)) }
          : d,
      ),
    }))
  }

  function deleteTodo(dayId, todoId) {
    setState((s) => ({
      ...s,
      planDays: (s.planDays || []).map((d) =>
        d.id === dayId ? { ...d, todos: (d.todos || []).filter((t) => t.id !== todoId) } : d,
      ),
    }))
  }

  function addGoal({ title, targetDate, targetProgress, unit }) {
    const trimmed = title.trim()
    if (!trimmed) return
    const goal = {
      id: generateId(),
      title: trimmed,
      startDate: todayISO(),
      targetDate: targetDate || null,
      currentProgress: 0,
      targetProgress: Math.max(1, Number(targetProgress) || 1),
      unit: unit || 'percent',
    }
    setState((s) => ({ ...s, planGoals: [...(s.planGoals || []), goal] }))
    return goal.id
  }

  function updateGoalProgress(id, current) {
    setState((s) => ({
      ...s,
      planGoals: (s.planGoals || []).map((g) =>
        g.id === id ? { ...g, currentProgress: Math.max(0, Math.min(g.targetProgress, current)) } : g,
      ),
    }))
  }

  function deleteGoal(id) {
    setState((s) => ({ ...s, planGoals: (s.planGoals || []).filter((g) => g.id !== id) }))
  }

  return {
    planDays,
    planGoals,
    setDayTitle,
    addTodo,
    toggleTodo,
    editTodo,
    setTodoTime,
    deleteTodo,
    addGoal,
    updateGoalProgress,
    deleteGoal,
  }
}
