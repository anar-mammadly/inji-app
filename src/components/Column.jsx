import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { PackageOpen } from 'lucide-react'
import TaskCard from './TaskCard'
import AddTaskForm from './AddTaskForm'
import { useTranslation } from '../i18n/LanguageContext'

const COLUMN_LABEL_KEYS = {
  todo: 'waiting',
  inprog: 'inProgress',
  done: 'done',
}

const COLUMN_COLORS = {
  todo: { text: '#0E8FCE', bg: '#DDF4FF' },
  inprog: { text: '#E07C00', bg: '#FFE8CC' },
  done: { text: '#46A302', bg: '#DFFAB8' },
}

export default function Column({ colId, tasks, onStart, onBack, onComplete, onAdd, onDelete, onEdit, cardRefs }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const canAdd = colId === 'todo' || colId === 'inprog'
  const { setNodeRef, isOver } = useDroppable({ id: colId })

  function handleAdd(name, category) {
    onAdd(name, category, colId)
    setAdding(false)
  }

  const colColor = COLUMN_COLORS[colId]

  return (
    <div
      ref={setNodeRef}
      className={`w-full sm:flex-1 flex flex-col rounded-3xl border-2 p-3 min-h-[160px] sm:min-h-[200px] transition-colors ${
        isOver ? 'border-accent bg-accentSoft' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] uppercase font-extrabold tracking-wide px-2.5 py-1 rounded-full"
          style={{ color: colColor.text, background: colColor.bg }}
        >
          {t(COLUMN_LABEL_KEYS[colId])}
        </span>
        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-surfaceAlt text-textSecondary">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {colId === 'done' && tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
            <PackageOpen size={28} strokeWidth={1.5} className="text-textMuted" />
            <div className="text-[13px] font-bold text-textMuted">{t('emptyDone')}</div>
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

      {canAdd && (
        <div className="mt-2">
          {adding ? (
            <AddTaskForm onAdd={handleAdd} onCancel={() => setAdding(false)} />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-[12px] font-extrabold py-2.5 rounded-2xl border-2 border-dashed border-borderStrong text-textSecondary hover:bg-surfaceAlt hover:border-accent hover:text-accent transition-colors"
            >
              {t('addTask')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
