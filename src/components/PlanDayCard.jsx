import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'

const DAY_LABEL_KEYS = {
  mon: 'planDayMon',
  tue: 'planDayTue',
  wed: 'planDayWed',
  thu: 'planDayThu',
  fri: 'planDayFri',
  sat: 'planDaySat',
  sun: 'planDaySun',
}

export default function PlanDayCard({ day, onSetTitle, onAddTodo, onToggleTodo, onEditTodo, onDeleteTodo }) {
  const { t } = useTranslation()
  const [titleDraft, setTitleDraft] = useState(day.title)
  const [newTodo, setNewTodo] = useState('')
  const todos = day.todos || []

  function commitTitle() {
    onSetTitle(titleDraft)
  }

  function handleAddTodo(e) {
    e.preventDefault()
    if (!newTodo.trim()) return
    onAddTodo(newTodo)
    setNewTodo('')
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-3.5 flex flex-col gap-2 min-w-0 shadow-card">
      <div className="text-[10px] font-extrabold uppercase tracking-wide text-textMuted">
        {t(DAY_LABEL_KEYS[day.id])}
      </div>
      <input
        type="text"
        value={titleDraft}
        onChange={(e) => setTitleDraft(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        placeholder={t('planDayTitlePlaceholder')}
        className="w-full min-w-0 truncate px-2.5 py-1.5 font-extrabold rounded-xl border-2 border-border outline-none focus:border-accent"
      />

      <div className="flex flex-col gap-1.5 mt-0.5">
        {todos.map((todo) => (
          <PlanTodoRow
            key={todo.id}
            todo={todo}
            onToggle={() => onToggleTodo(todo.id)}
            onEdit={(text) => onEditTodo(todo.id, text)}
            onDelete={() => onDeleteTodo(todo.id)}
          />
        ))}
        {todos.length === 0 && <div className="text-[11px] font-bold text-textMuted py-0.5">{t('planNoTodos')}</div>}
      </div>

      <form onSubmit={handleAddTodo} className="flex items-center gap-1.5 mt-0.5">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder={t('planTodoPlaceholder')}
          className="flex-1 min-w-0 truncate px-2.5 py-1.5 text-[12px] font-semibold rounded-xl border-2 border-border outline-none focus:border-accent placeholder:text-[11px]"
        />
        <button
          type="submit"
          className="flex items-center justify-center rounded-xl bg-accentSoft text-accentDark shrink-0"
          style={{ width: 28, height: 28 }}
          aria-label={t('planAddTodo')}
        >
          <Plus size={15} strokeWidth={3} />
        </button>
      </form>
    </div>
  )
}

function PlanTodoRow({ todo, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)

  function commit() {
    if (!draft.trim()) {
      setDraft(todo.text)
    } else {
      onEdit(draft)
    }
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        className={`flex items-center justify-center rounded-md border-2 shrink-0 transition-colors ${
          todo.done ? 'bg-accent border-accent text-white' : 'border-borderStrong text-transparent'
        }`}
        style={{ width: 18, height: 18 }}
        aria-label="toggle"
      >
        ✓
      </button>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="flex-1 min-w-0 px-1.5 py-1 text-[12px] font-semibold rounded-lg border-2 border-border outline-none focus:border-accent"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className={`flex-1 min-w-0 truncate text-[12px] font-semibold cursor-text ${
            todo.done ? 'line-through text-textMuted' : 'text-textPrimary'
          }`}
        >
          {todo.text}
        </div>
      )}
      <button
        onClick={onDelete}
        className="text-textMuted hover:text-coral transition-colors shrink-0"
        aria-label="delete"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  )
}
