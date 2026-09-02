import { format } from 'date-fns'
import { generateId } from '../utils/id'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function useLearningStore(state, setState) {
  const learningGoals = state.learningGoals || []
  const journalEntries = state.journalEntries || []

  function addLearningGoal({ title, subCategory, targetDate, targetProgress, unit }) {
    const trimmed = title.trim()
    if (!trimmed) return
    const goal = {
      id: generateId(),
      title: trimmed,
      subCategory,
      startDate: todayISO(),
      targetDate: targetDate || null,
      currentProgress: 0,
      targetProgress: Math.max(1, Number(targetProgress) || 1),
      unit: unit || 'percent',
      reminderIntervalMinutes: null,
      lastReminderAt: null,
    }
    setState((s) => ({ ...s, learningGoals: [...(s.learningGoals || []), goal] }))
    return goal.id
  }

  function updateProgress(id, current) {
    setState((s) => ({
      ...s,
      learningGoals: (s.learningGoals || []).map((g) =>
        g.id === id ? { ...g, currentProgress: Math.max(0, Math.min(g.targetProgress, current)) } : g,
      ),
    }))
  }

  function deleteLearningGoal(id) {
    setState((s) => ({ ...s, learningGoals: (s.learningGoals || []).filter((g) => g.id !== id) }))
  }

  function setReminderInterval(id, minutes) {
    setState((s) => ({
      ...s,
      learningGoals: (s.learningGoals || []).map((g) =>
        g.id === id ? { ...g, reminderIntervalMinutes: minutes, lastReminderAt: new Date().toISOString() } : g,
      ),
    }))
  }

  function markReminded(id) {
    setState((s) => ({
      ...s,
      learningGoals: (s.learningGoals || []).map((g) => (g.id === id ? { ...g, lastReminderAt: new Date().toISOString() } : g)),
    }))
  }

  function addJournalEntry(dateISO, text) {
    const trimmed = text.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      journalEntries: [
        ...(s.journalEntries || []),
        { id: generateId(), date: dateISO, text: trimmed, createdAt: new Date().toISOString() },
      ],
    }))
  }

  function editJournalEntry(id, text) {
    const trimmed = text.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      journalEntries: (s.journalEntries || []).map((e) => (e.id === id ? { ...e, text: trimmed } : e)),
    }))
  }

  function deleteJournalEntry(id) {
    setState((s) => ({ ...s, journalEntries: (s.journalEntries || []).filter((e) => e.id !== id) }))
  }

  return {
    learningGoals,
    journalEntries,
    addLearningGoal,
    updateProgress,
    deleteLearningGoal,
    setReminderInterval,
    markReminded,
    addJournalEntry,
    editJournalEntry,
    deleteJournalEntry,
  }
}
