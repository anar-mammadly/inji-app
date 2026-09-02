import { generateId } from '../utils/id'

export function useCalendarStore(state, setState) {
  const events = state.events || []

  function addEvent(date, title, time = null) {
    const trimmed = title.trim()
    if (!trimmed) return
    const event = { id: generateId(), date, title: trimmed, time: time || null, done: false, createdAt: new Date().toISOString() }
    setState((s) => ({ ...s, events: [...(s.events || []), event] }))
  }

  function editEvent(id, { title, time }) {
    setState((s) => ({
      ...s,
      events: (s.events || []).map((e) =>
        e.id === id
          ? {
              ...e,
              ...(title !== undefined ? { title } : {}),
              ...(time !== undefined ? { time: time || null } : {}),
            }
          : e,
      ),
    }))
  }

  function deleteEvent(id) {
    setState((s) => ({ ...s, events: (s.events || []).filter((e) => e.id !== id) }))
  }

  function toggleEventDone(id) {
    setState((s) => ({
      ...s,
      events: (s.events || []).map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
    }))
  }

  return { events, addEvent, editEvent, deleteEvent, toggleEventDone }
}
