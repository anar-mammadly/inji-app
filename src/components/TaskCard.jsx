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
  const cat = categoryStyles[task.category] ?? categoryStyles.personal
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
    zIndex: isDragging ? 10 : 'auto',
  }

  return (
    <article
      ref={mergeRefs([forwardedRef, setNodeRef])}
      style={style}
      className={`group rounded-2xl border-2 bg-white p-3 touch-none transition-colors ${
        isDragging ? 'border-blue shadow-[0_6px_0_#D1D5DB]' : 'border-border shadow-[0_2px_0_#E5E7EB] hover:border-borderStrong'
      } ${isDone ? 'opacity-80' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => !isDone && onComplete(task)}
          disabled={isDone}
          aria-label={t('doneAction')}
          className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-all ${
            isDone ? 'bg-accent border-2 border-accentDark' : 'border-[2.5px] border-borderStrong hover:border-accent hover:scale-110'
          }`}
        >
          {isDone && <Check size={14} strokeWidth={3.5} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
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
              className="w-full text-[15px] font-bold outline-none bg-transparent border-b-2 border-blue"
            />
          ) : (
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
              <p className={`text-[15px] leading-snug font-bold break-words ${isDone ? 'text-textMuted line-through' : 'text-textPrimary'}`}>
                {task.name}
              </p>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold" style={{ background: cat.bg, color: cat.text }}>
              {t(CATEGORY_LABEL_KEYS[task.category])}
            </span>
            {task.col === 'todo' && (
              <button
                onClick={() => onStart(task.id)}
                className="press h-7 px-3 rounded-xl bg-blue text-white text-[12px] font-extrabold shadow-[0_3px_0_#0E8FCE]"
              >
                {t('start')}
              </button>
            )}
            {task.col === 'inprog' && (
              <>
                <button
                  onClick={() => onComplete(task)}
                  className="press h-7 px-3 rounded-xl bg-accent text-white text-[12px] font-extrabold shadow-[0_3px_0_#46A302]"
                >
                  {t('doneAction')}
                </button>
                <button onClick={() => onBack(task.id)} className="h-7 px-1.5 text-[12px] font-extrabold text-textMuted hover:text-textSecondary">
                  {t('back')}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0 -mr-1 -mt-1">
          {!isDone && !editing && (
            <button
              onClick={() => {
                setEditValue(task.name)
                setEditing(true)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-textMuted transition-colors hover:bg-surfaceAlt hover:text-textSecondary"
              aria-label={t('edit')}
            >
              <Pencil size={13} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-textMuted transition-colors hover:bg-pomSoft hover:text-coral"
            aria-label={t('delete')}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  )
})

export default TaskCard
