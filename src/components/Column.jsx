import { useState } from 'react'
import TaskCard from './TaskCard'
import AddTaskForm from './AddTaskForm'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

const COLUMN_LABEL_KEYS = {
  todo: 'waiting',
  inprog: 'inProgress',
  done: 'done',
}

export default function Column({ colId, tasks, onStart, onBack, onComplete, onAdd, onDelete, onDropTask, cardRefs }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const canAdd = colId === 'todo' || colId === 'inprog'

  function handleAdd(name, category) {
    onAdd(name, category, colId)
    setAdding(false)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId && onDropTask) onDropTask(taskId, colId)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className="flex-1 flex flex-col rounded-[10px] border p-3 min-h-[200px] transition-colors"
      style={{
        borderTopColor: dragOver ? colors.accent : colors.border,
        borderRightColor: dragOver ? colors.accent : colors.border,
        borderBottomColor: dragOver ? colors.accent : colors.border,
        borderLeftColor:
          colId === 'inprog' && tasks.length > 0 ? colors.accent : dragOver ? colors.accent : colors.border,
        borderLeftWidth: colId === 'inprog' && tasks.length > 0 ? '2px' : undefined,
        background: dragOver ? '#F1F8F5' : colors.surface,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase font-medium" style={{ color: colors.textMuted }}>
          {t(COLUMN_LABEL_KEYS[colId])}
        </span>
        <span
          className="text-[11px] px-2 py-0.5 rounded-[8px]"
          style={{ background: colors.bg, color: colors.textSecondary }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {colId === 'done' && tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-8">
            <div className="text-3xl">🫙</div>
            <div className="text-[13px]" style={{ color: colors.textMuted }}>
              {t('emptyDone')}
            </div>
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
              className="w-full text-[12px] py-2 rounded-[8px] border border-dashed"
              style={{ borderColor: colors.borderStrong, color: colors.textSecondary }}
            >
              {t('addTask')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
