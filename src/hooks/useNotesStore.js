import { generateId } from '../utils/id'

export function useNotesStore(state, setState) {
  const notes = state.notes || []

  function addNote(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    const note = {
      id: generateId(),
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
    setState((s) => ({ ...s, notes: [note, ...(s.notes || [])] }))
    return note.id
  }

  function editNote(id, text) {
    const trimmed = text.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      notes: (s.notes || []).map((n) => (n.id === id ? { ...n, text: trimmed } : n)),
    }))
  }

  function deleteNote(id) {
    setState((s) => ({ ...s, notes: (s.notes || []).filter((n) => n.id !== id) }))
  }

  return { notes, addNote, editNote, deleteNote }
}
