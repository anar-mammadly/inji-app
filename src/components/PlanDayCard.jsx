import { useState } from 'react'
import { Plus, X, Clock, Check } from 'lucide-react'
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

// each day gets its own candy color: solid dot, soft pill bg, dark pill text
const DAY_ACCENTS = {
  mon: { main: '#FF4B4B', soft: '#FFE3E3', dark: '#EA2B2B' },
  tue: { main: '#1CB0F6', soft: '#DDF4FF', dark: '#0E8FCE' },
  wed: { main: '#CE82FF', soft: '#F3E4FF', dark: '#A855F7' },
  thu: { main: '#FF9600', soft: '#FFE8CC', dark: '#E07C00' },
  fri: { main: '#58CC02', soft: '#DFFAB8', dark: '#46A302' },
  sat: { main: '#FFC800', soft: '#FFF4C2', dark: '#B88A00' },
  sun: { main: '#FF86D0', soft: '#FFE4F4', dark: '#E5559F' },
}

function sortTodos(todos) {
  return [...todos].map((t, i) => ({ t, i })).sort((a, b) => {
    if (a.t.time && b.t.time) return a.t.time.localeCompare(b.t.time) || a.i - b.i
    if (a.t.time) return -1
    if (b.t.time) return 1
    return a.i - b.i
  }).map(({ t }) => t)
}

const smallInput =
  'h-9 px-3 rounded-xl border-2 border-border bg-white text-[14px] font-medium text-textPrimary placeholder:text-textMuted outline-none transition-colors focus:border-blue'

export default function PlanDayCard({ day, onSetTitle, onAddTodo, onToggleTodo, onEditTodo, onSetTodoTime, onDeleteTodo }) {
  const { t } = useTranslation()
  const [titleDraft, setTitleDraft] = useState(day.title)
  const [newTodo, setNewTodo] = useState('')
  const [newTime, setNewTime] = useState('')
  const [showTimePicker, setShowTimePicker] = useState(false)
  const todos = sortTodos(day.todos || [])
  const accent = DAY_ACCENTS[day.id] ?? DAY_ACCENTS.tue
  const doneCount = todos.filter((td) => td.done).length

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
    <div className="rounded-3xl border-2 border-border bg-surface p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-extrabold min-w-0"
          style={{ background: accent.soft, color: accent.dark }}
        >
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: accent.main }} />
          <span className="truncate">{t(DAY_LABEL_KEYS[day.id])}</span>
        </span>
        {todos.length > 0 && (
          <span className="shrink-0 h-7 px-2.5 inline-flex items-center rounded-full bg-surfaceAlt text-[12px] font-extrabold tabular-nums text-textSecondary">
            {doneCount}/{todos.length}
          </span>
        )}
      </div>

      <input
        type="text"
        value={titleDraft}
        onChange={(e) => setTitleDraft(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        placeholder={t('planDayTitlePlaceholder')}
        className="w-full min-w-0 truncate h-11 px-3.5 rounded-xl border-2 border-border bg-white text-[16px] font-extrabold text-textPrimary placeholder:text-textMuted placeholder:font-semibold outline-none transition-colors focus:border-blue"
      />

      <div className="flex flex-col gap-1.5 flex-1">
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
        {todos.length === 0 && <div className="text-[13px] font-semibold text-textMuted py-1">{t('planNoTodos')}</div>}
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t-2 border-border">
        {showTimePicker && (
          <div className="flex items-center gap-1.5">
            <TimeInput24 value={newTime} onChange={setNewTime} size="sm" />
            <button
              type="button"
              onClick={() => {
                setNewTime('')
                setShowTimePicker(false)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-textMuted transition-colors hover:bg-pomSoft hover:text-coral"
              aria-label={t('planClearTime')}
            >
              <X size={15} strokeWidth={2.6} />
            </button>
          </div>
        )}
        <form onSubmit={handleAddTodo} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowTimePicker((v) => !v)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-colors ${
              showTimePicker || newTime
                ? 'border-blue text-blueDark bg-blueSoft'
                : 'border-border text-textMuted hover:border-borderStrong hover:text-textSecondary'
            }`}
            aria-label={t('planAddTime')}
            aria-pressed={showTimePicker}
          >
            <Clock size={16} strokeWidth={2.5} />
          </button>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder={t('planTodoPlaceholder')}
            className={`flex-1 min-w-0 truncate ${smallInput}`}
          />
          <button
            type="submit"
            className="press flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shrink-0 shadow-[0_3px_0_#46A302] hover:bg-[#61D90A] transition-colors"
            aria-label={t('planAddTodo')}
          >
            <Plus size={18} strokeWidth={3} />
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
      <div
        className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border-2 border-blue bg-blueSoft/40"
        // commit only when focus leaves the whole row — moving from the text
        // field to the time selects must not close the editor mid-click
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && commit()}
      >
        <TimeInput24 value={timeDraft} onChange={setTimeDraft} size="sm" />
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className={`flex-1 min-w-[120px] ${smallInput}`}
        />
        {timeDraft && (
          <button
            onMouseDown={(e) => e.preventDefault()} // keep focus inside the row (Safari doesn't focus buttons)
            onClick={() => setTimeDraft('')}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-textMuted transition-colors hover:bg-pomSoft hover:text-coral shrink-0"
            aria-label={t('planClearTime')}
          >
            <X size={15} strokeWidth={2.6} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`group flex items-center gap-2 min-h-[40px] pl-2 pr-1 rounded-2xl border-2 transition-colors ${
        todo.done ? 'border-transparent bg-surfaceAlt' : 'border-border bg-white hover:border-borderStrong'
      }`}
    >
      <button
        onClick={onToggle}
        className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-all ${
          todo.done ? 'bg-accent border-2 border-accentDark' : 'border-[2.5px] border-borderStrong hover:border-accent hover:scale-110'
        }`}
        aria-label="toggle"
        aria-pressed={!!todo.done}
      >
        {todo.done && <Check size={14} strokeWidth={3.5} className="text-white" />}
      </button>
      {todo.time && (
        <span
          className={`shrink-0 h-6 px-2 inline-flex items-center rounded-full text-[12px] font-bold tabular-nums ${
            todo.done ? 'bg-white text-textMuted' : 'bg-blueSoft text-blueDark'
          }`}
        >
          {todo.time}
        </span>
      )}
      <div
        onClick={() => {
          setDraft(todo.text)
          setTimeDraft(todo.time || '')
          setEditing(true)
        }}
        className={`flex-1 min-w-0 truncate py-2 text-[14px] font-medium cursor-text ${
          todo.done ? 'line-through text-textMuted' : 'text-textPrimary'
        }`}
      >
        {todo.text}
      </div>
      <button
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-textMuted transition-colors hover:bg-pomSoft hover:text-coral shrink-0"
        aria-label="delete"
      >
        <X size={15} strokeWidth={2.6} />
      </button>
    </div>
  )
}
