import { useState } from 'react'
import { Plus, X, Clock } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import TimeInput24 from './TimeInput24'

const DAY_LABEL_KEYS = {
  mon: 'planDayMon',
  tue: 'planDayTue',
  wed: 'planDayWed',
  thu: 'planDayThu',
  fri: 'planDayFri',
  sat: 'planDaySat',
  sun: 'planDaySun',
}

const DAY_ACCENTS = {
  mon: '#FF4B4B',
  tue: '#1CB0F6',
  wed: '#CE82FF',
  thu: '#FF9600',
  fri: '#58CC02',
  sat: '#FFC800',
  sun: '#FF4B4B',
}

function sortTodos(todos) {
  return [...todos].map((t, i) => ({ t, i })).sort((a, b) => {
    if (a.t.time && b.t.time) return a.t.time.localeCompare(b.t.time) || a.i - b.i
    if (a.t.time) return -1
    if (b.t.time) return 1
    return a.i - b.i
  }).map(({ t }) => t)
}

export default function PlanDayCard({ day, onSetTitle, onAddTodo, onToggleTodo, onEditTodo, onSetTodoTime, onDeleteTodo }) {
  const { t } = useTranslation()
  const [titleDraft, setTitleDraft] = useState(day.title)
  const [newTodo, setNewTodo] = useState('')
  const [newTime, setNewTime] = useState('')
  const [showTimePicker, setShowTimePicker] = useState(false)
  const todos = sortTodos(day.todos || [])
  const accent = DAY_ACCENTS[day.id]

  function commitTitle() {
    onSetTitle(titleDraft)
  }

  function handleAddTodo(e) {
    e.preventDefault()
    if (!newTodo.trim()) return
    onAddTodo(newTodo, newTime || null)
    setNewTodo('')
    setNewTime('')
    setShowTimePicker(false)
  }

  return (
    <div
      className="rounded-2xl border-2 border-border bg-surface p-3.5 flex flex-col gap-2.5 min-w-0 shadow-card border-l-4"
      style={{ borderLeftColor: accent }}
    >
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

      <div className="flex flex-col gap-1 mt-0.5">
        {todos.map((todo) => (
          <PlanTodoRow
            key={todo.id}
            todo={todo}
            onToggle={() => onToggleTodo(todo.id)}
            onEdit={(text) => onEditTodo(todo.id, text)}
            onSetTime={(time) => onSetTodoTime(todo.id, time)}
            onDelete={() => onDeleteTodo(todo.id)}
          />
        ))}
        {todos.length === 0 && <div className="text-[11px] font-bold text-textMuted py-0.5">{t('planNoTodos')}</div>}
      </div>

      <div className="flex flex-col gap-1.5 mt-0.5 pt-2 border-t border-border">
        {showTimePicker && (
          <div className="flex items-center gap-1.5">
            <TimeInput24 value={newTime} onChange={setNewTime} size="sm" />
            <button
              type="button"
              onClick={() => {
                setNewTime('')
                setShowTimePicker(false)
              }}
              className="text-textMuted hover:text-coral transition-colors"
              aria-label={t('planClearTime')}
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}
        <form onSubmit={handleAddTodo} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowTimePicker((v) => !v)}
            className={`flex items-center justify-center rounded-xl border-2 shrink-0 transition-colors ${
              showTimePicker || newTime ? 'border-accent text-accent bg-accentSoft' : 'border-border text-textMuted'
            }`}
            style={{ width: 30, height: 30 }}
            aria-label={t('planAddTime')}
          >
            <Clock size={14} strokeWidth={2.5} />
          </button>
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
            style={{ width: 30, height: 30 }}
            aria-label={t('planAddTodo')}
          >
            <Plus size={15} strokeWidth={3} />
          </button>
        </form>
      </div>
    </div>
  )
}

function PlanTodoRow({ todo, onToggle, onEdit, onSetTime, onDelete }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const [timeDraft, setTimeDraft] = useState(todo.time || '')

  function commit() {
    if (draft.trim()) onEdit(draft)
    else setDraft(todo.text)
    onSetTime(timeDraft || null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 py-0.5">
        <TimeInput24 value={timeDraft} onChange={setTimeDraft} size="sm" />
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="flex-1 min-w-0 px-1.5 py-1 text-[12px] font-semibold rounded-lg border-2 border-border outline-none focus:border-accent"
        />
        {timeDraft && (
          <button
            onClick={() => setTimeDraft('')}
            className="text-textMuted hover:text-coral transition-colors shrink-0"
            aria-label={t('planClearTime')}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>
    )
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
      {todo.time && (
        <span
          className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums ${
            todo.done ? 'bg-surfaceAlt text-textMuted' : 'bg-blue/10 text-blueDark'
          }`}
        >
          {todo.time}
        </span>
      )}
      <div
        onClick={() => setEditing(true)}
        className={`flex-1 min-w-0 truncate text-[12px] font-semibold cursor-text ${
          todo.done ? 'line-through text-textMuted' : 'text-textPrimary'
        }`}
      >
        {todo.text}
      </div>
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
