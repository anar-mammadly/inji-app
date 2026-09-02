// The built-in "Work"/"Personal" boards store an English literal name (used
// as the fallback before translations existed / for custom-board parity),
// but should display translated in the active language. Custom boards keep
// whatever name the user typed.
const BUILTIN_BOARD_LABEL_KEYS = {
  work: 'boardWork',
  personal: 'boardPersonal',
  general: 'boardGeneral',
}

export function getBoardName(board, t) {
  const key = board.builtIn ? BUILTIN_BOARD_LABEL_KEYS[board.id] : null
  return key ? t(key) : board.name
}
