import { format } from 'date-fns'
import { generateId } from '../utils/id'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function useHabitStore(state, setState) {
  const habits = state.habits || []
  const habitLog = state.habitLog || {}

  function addHabit(name, { color = null, kind = 'custom', targetDays = 30 } = {}) {
    const trimmed = name.trim()
    if (!trimmed) return
    const habit = {
      id: generateId(),
      name: trimmed,
      color,
      kind,
      targetDays: Math.max(1, Number(targetDays) || 30),
      startDate: todayISO(),
      createdAt: new Date().toISOString(),
    }
    setState((s) => ({ ...s, habits: [...(s.habits || []), habit] }))
    return habit.id
  }

  function deleteHabit(id) {
    setState((s) => {
      const nextLog = { ...(s.habitLog || {}) }
      delete nextLog[id]
      return { ...s, habits: (s.habits || []).filter((h) => h.id !== id), habitLog: nextLog }
    })
  }

  function toggleHabitDay(habitId, dateISO, entry = true) {
    setState((s) => {
      const habitLogState = s.habitLog || {}
      const dayMap = { ...(habitLogState[habitId] || {}) }
      if (dayMap[dateISO]) {
        delete dayMap[dateISO]
      } else {
        dayMap[dateISO] = entry
      }
      return { ...s, habitLog: { ...habitLogState, [habitId]: dayMap } }
    })
  }

  function toggleHabitToday(habitId, entry = true) {
    toggleHabitDay(habitId, todayISO(), entry)
  }

  function addHabitOption(habitId, label) {
    const trimmed = label.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      habits: (s.habits || []).map((h) =>
        h.id === habitId && !(h.subOptions || []).includes(trimmed)
          ? { ...h, subOptions: [...(h.subOptions || []), trimmed] }
          : h,
      ),
    }))
  }

  function deleteHabitOption(habitId, label) {
    setState((s) => ({
      ...s,
      habits: (s.habits || []).map((h) =>
        h.id === habitId ? { ...h, subOptions: (h.subOptions || []).filter((o) => o !== label) } : h,
      ),
    }))
  }

  return {
    habits,
    habitLog,
    addHabit,
    deleteHabit,
    toggleHabitDay,
    toggleHabitToday,
    addHabitOption,
    deleteHabitOption,
  }
}
