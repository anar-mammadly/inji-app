export const CURRENT_SCHEMA_VERSION = 2

const BUILTIN_BOARDS = [
  { id: 'work', name: 'Work', builtIn: true },
  { id: 'personal', name: 'Personal', builtIn: true },
  { id: 'general', name: 'General', builtIn: true },
]

function boardIdForTask(task) {
  if (task.category === 'work') return 'work'
  if (task.category === 'personal') return 'personal'
  return 'general'
}

const migrations = {
  1: (state) => ({
    ...state,
    schemaVersion: 2,
    boards: BUILTIN_BOARDS.map((b) => ({ ...b, createdAt: state.lastActiveDate || new Date().toISOString() })),
    tasks: (state.tasks || []).map((t) => ({ ...t, boardId: t.boardId || boardIdForTask(t) })),
  }),
}

export function migrate(rawState) {
  let state = rawState
  let version = state.schemaVersion || 1

  if (version >= CURRENT_SCHEMA_VERSION) return state

  while (migrations[version] && version < CURRENT_SCHEMA_VERSION) {
    state = migrations[version](state)
    version = state.schemaVersion
  }

  return state
}
