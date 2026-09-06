import { forwardRef, useEffect, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Check, X, Pencil } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import { CATEGORY_LABEL_KEYS, categoryStyles } from '../utils/categories'

function mergeRefs(refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return
      if (typeof ref === 'function') ref(node)
      else ref.current = node
    })
  }
}

const TaskCard = forwardRef(function TaskCard({ task, onStart, onBack, onComplete, onDelete, onEdit }, forwardedRef) {
  const { t } = useTranslation()
  const isDone = task.col === 'done'
  const cat = categoryStyles[task.category]
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select()
  }, [editing])

  function commitEdit() {
    onEdit(task.id, editValue)
    setEditing(false)
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : isDone ? 0.75 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }

  return (
    <div
      ref={mergeRefs([forwardedRef, setNodeRef])}
      style={style}
      className="p-3 rounded-2xl border-2 border-border bg-surface transition-colors hover:border-borderStrong touch-none"
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => !isDone && onComplete(task)}
          disabled={isDone}
          className={`mt-0.5 flex items-center justify-center rounded-full border-[2.5px] shrink-0 transition-all hover:border-accent hover:scale-110 ${
            isDone ? 'border-accent bg-accent' : 'border-borderStrong'
          }`}
          style={{ width: 22, height: 22 }}
        >
          {isDone && <Check size={13} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                else if (e.key === 'Escape') {
                  setEditValue(task.name)
                  setEditing(false)
                }
              }}
              onBlur={commitEdit}
              className="w-full text-[14px] font-semibold outline-none bg-transparent border-b-2 border-accent"
            />
          ) : (
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
              <div className={`text-[14px] font-semibold ${isDone ? 'text-textMuted line-through' : 'text-textPrimary'}`}>
                {task.name}
              </div>
            </div>
          )}
          <span
            className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
            style={{ background: cat.bg, color: cat.text }}
          >
            {t(CATEGORY_LABEL_KEYS[task.category])}
          </span>

          {!isDone && (
            <div className="flex gap-3 mt-2">
              {task.col === 'todo' && (
                <button onClick={() => onStart(task.id)} className="text-[12px] font-bold text-textSecondary">
                  {t('start')}
                </button>
              )}
              {task.col === 'inprog' && (
                <>
                  <button onClick={() => onBack(task.id)} className="text-[12px] font-bold text-textSecondary">
                    {t('back')}
                  </button>
                  <button onClick={() => onComplete(task)} className="text-[12px] font-bold text-accent">
                    {t('doneAction')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center shrink-0 gap-0.5">
          {!isDone && !editing && (
            <button
              onClick={() => {
                setEditValue(task.name)
                setEditing(true)
              }}
              className="-mt-0.5 flex items-center justify-center rounded-lg text-textMuted transition-colors hover:bg-bg hover:text-textSecondary"
              style={{ width: 22, height: 22 }}
              aria-label="Edit task"
            >
              <Pencil size={12} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="-mt-0.5 -mr-0.5 flex items-center justify-center rounded-lg text-textMuted transition-colors hover:bg-bg hover:text-coral"
            style={{ width: 22, height: 22 }}
            aria-label="Delete task"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
})

export default TaskCard
