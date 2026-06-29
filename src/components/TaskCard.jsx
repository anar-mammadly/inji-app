import { forwardRef, useState } from 'react'
import { colors, categoryStyles } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

const CATEGORY_LABEL_KEYS = {
  study: 'categoryStudy',
  work: 'categoryWork',
  personal: 'categoryPersonal',
}

const isCoarsePointer =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

const TaskCard = forwardRef(function TaskCard({ task, onStart, onBack, onComplete, onDelete }, ref) {
  const { t } = useTranslation()
  const isDone = task.col === 'done'
  const cat = categoryStyles[task.category]
  const [dragging, setDragging] = useState(false)

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
  }

  return (
    <div
      ref={ref}
      draggable={!isCoarsePointer}
      onDragStart={handleDragStart}
      onDragEnd={() => setDragging(false)}
      className={`p-2.5 rounded-[10px] border transition-colors hover:border-borderStrong select-none ${
        isCoarsePointer ? '' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{
        borderColor: colors.border,
        background: colors.surface,
        opacity: dragging ? 0.4 : isDone ? 0.75 : 1,
      }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => !isDone && onComplete(task)}
          disabled={isDone}
          aria-label="Toggle complete"
          className="-m-2 p-2 flex items-center justify-center shrink-0"
        >
          <span
            className="flex items-center justify-center rounded-full border-2 transition-colors hover:border-accent"
            style={{
              width: 18,
              height: 18,
              borderColor: isDone ? colors.accent : colors.borderStrong,
              background: isDone ? colors.accent : 'transparent',
            }}
          >
            {isDone && (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M1 5 L4 8 L9 1.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>

        <div className="flex-1">
          <div
            className="text-[13px]"
            style={{
              color: isDone ? colors.textMuted : colors.textPrimary,
              textDecoration: isDone ? 'line-through' : 'none',
            }}
          >
            {task.name}
          </div>
          <span
            className="inline-block mt-1.5 px-2 py-0.5 rounded-[8px] text-[11px]"
            style={{ background: cat.bg, color: cat.text }}
          >
            {t(CATEGORY_LABEL_KEYS[task.category])}
          </span>

          {!isDone && (
            <div className="flex gap-4 mt-2 -ml-1">
              {task.col === 'todo' && (
                <button
                  onClick={() => onStart(task.id)}
                  className="text-[12px] py-1 px-1"
                  style={{ color: colors.textSecondary }}
                >
                  {t('start')}
                </button>
              )}
              {task.col === 'inprog' && (
                <>
                  <button
                    onClick={() => onBack(task.id)}
                    className="text-[12px] py-1 px-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {t('back')}
                  </button>
                  <button
                    onClick={() => onComplete(task)}
                    className="text-[12px] py-1 px-1"
                    style={{ color: colors.accent }}
                  >
                    {t('doneAction')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="shrink-0 -m-1.5 p-2.5 flex items-center justify-center rounded-[6px] transition-colors hover:bg-bg"
          style={{ color: colors.textMuted }}
          aria-label="Delete task"
        >
          <svg width="11" height="11" viewBox="0 0 11 11">
            <path
              d="M1 1 L10 10 M10 1 L1 10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
})

export default TaskCard
