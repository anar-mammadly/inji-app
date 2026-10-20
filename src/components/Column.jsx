import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Plus, PackageOpen } from 'lucide-react'
import TaskCard from './TaskCard'
import AddTaskForm from './AddTaskForm'
import { useTranslation } from '../i18n/LanguageContext'

const EMPTY_KEYS = { todo: 'emptyTodo', inprog: 'emptyInprog', done: 'emptyDone' }

export const COLUMN_LABEL_KEYS = {
  todo: 'waiting',
  inprog: 'inProgress',
  done: 'done',
}

const COLUMN_COLORS = {
  todo: { text: '#0E8FCE', bg: '#DDF4FF' },
  inprog: { text: '#E07C00', bg: '#FFE8CC' },
  done: { text: '#46A302', bg: '#DFFAB8' },
}

export default function Column({ colId, tasks, onStart, onBack, onComplete, onAdd, onDelete, onEdit, cardRefs, className = '' }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const canAdd = colId === 'todo' || colId === 'inprog'
  const { setNodeRef, isOver } = useDroppable({ id: colId })
  const c = COLUMN_COLORS[colId]

  function handleAdd(name, category) {
    onAdd(name, category, colId)
    setAdding(false)
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={t(COLUMN_LABEL_KEYS[colId])}
      className={`flex flex-col min-h-[200px] md:min-h-0 rounded-3xl border-2 p-3 transition-colors ${
        isOver ? 'border-accent bg-accentSoft' : 'border-border bg-surface'
      } ${className}`}
    >
      <header className="hidden md:flex items-center justify-between gap-2 mb-3">
        <span className="text-[12px] font-extrabold px-3 py-1 rounded-full" style={{ color: c.text, background: c.bg }}>
          {t(COLUMN_LABEL_KEYS[colId])}
        </span>
        <span className="min-w-[26px] h-[26px] px-2 rounded-full text-[12px] font-extrabold tabular-nums inline-flex items-center justify-center bg-surfaceAlt text-textSecondary">
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-col gap-2.5 flex-1 md:min-h-0 md:overflow-y-auto -mx-1 px-1 pb-1">
        {adding && <AddTaskForm onAdd={handleAdd} onCancel={() => setAdding(false)} />}

        {tasks.length === 0 && !adding && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
            {colId === 'done' && <PackageOpen size={30} strokeWidth={1.8} className="text-borderStrong" />}
            <p className="text-[13px] font-bold leading-relaxed text-textMuted">{t(EMPTY_KEYS[colId])}</p>
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            ref={(el) => {
              if (cardRefs) cardRefs.current[task.id] = el
            }}
            task={task}
            onStart={onStart}
            onBack={onBack}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {canAdd && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center justify-center gap-1.5 h-11 rounded-2xl border-2 border-dashed border-borderStrong text-[13px] font-extrabold text-textSecondary hover:bg-surfaceAlt hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={16} strokeWidth={3} />
          {t('addTask')}
        </button>
      )}
    </section>
  )
}
