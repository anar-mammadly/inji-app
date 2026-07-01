import { forwardRef, useEffect, useRef, useState } from 'react'
import { colors, categoryStyles } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'

const CATEGORY_LABEL_KEYS = {
  study: 'categoryStudy',
  work: 'categoryWork',
  personal: 'categoryPersonal',
}

const isCoarsePointer =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

const SWIPE_THRESHOLD = 60

const TaskCard = forwardRef(function TaskCard({ task, onStart, onBack, onComplete, onDelete }, ref) {
  const { t } = useTranslation()
  const isDone = task.col === 'done'
  const cat = categoryStyles[task.category]
  const [dragging, setDragging] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const touchStart = useRef(null)
  const cardRef = useRef(null)

  // Attach touchmove as non-passive so we can call preventDefault
  // (React synthetic events are passive by default, which blocks it).
  useEffect(() => {
    const el = cardRef.current
    if (!el || !isCoarsePointer) return
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', handleTouchMove)
  })

  // ── desktop drag-and-drop ──────────────────────────────────────────
  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
  }

  // ── touch swipe ────────────────────────────────────────────────────
  function handleTouchStart(e) {
    const t0 = e.touches[0]
    touchStart.current = { x: t0.clientX, y: t0.clientY }
    setSwiping(false)
    setSwipeX(0)
  }

  function handleTouchMove(e) {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    if (!swiping && Math.abs(dy) > Math.abs(dx)) return  // vertical scroll wins
    e.preventDefault()
    setSwiping(true)
    if (isDone) return  // done cards don't swipe
    // limit swipe: right only for non-done, left only for inprog
    const canRight = task.col === 'todo' || task.col === 'inprog'
    const canLeft  = task.col === 'inprog'
    const clamped = Math.max(canLeft ? -120 : 0, Math.min(canRight ? 120 : 0, dx))
    setSwipeX(clamped)
  }

  function handleTouchEnd() {
    if (!swiping) { touchStart.current = null; return }
    if (swipeX > SWIPE_THRESHOLD) {
      if (task.col === 'todo')    onStart(task.id)
      if (task.col === 'inprog')  onComplete(task)
    } else if (swipeX < -SWIPE_THRESHOLD) {
      if (task.col === 'inprog')  onBack(task.id)
    }
    touchStart.current = null
    setSwiping(false)
    setSwipeX(0)
  }

  // swipe hint colour: green = forward, coral = back
  const swipeColour =
    swipeX > SWIPE_THRESHOLD ? colors.accent :
    swipeX < -SWIPE_THRESHOLD ? colors.coral :
    null

  return (
    <div
      ref={ref}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 10 }}
    >
      {/* background hint that shows through as the card slides */}
      {swipeColour && (
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: 10,
            background: swipeColour, opacity: 0.15, pointerEvents: 'none',
          }}
        />
      )}

      <div
        ref={cardRef}
        draggable={!isCoarsePointer}
        onDragStart={handleDragStart}
        onDragEnd={() => setDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`p-2.5 rounded-[10px] border select-none ${
          isCoarsePointer ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{
          borderColor: swipeColour ?? colors.border,
          background: colors.surface,
          opacity: dragging ? 0.4 : isDone ? 0.75 : 1,
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease, border-color 0.15s',
          willChange: 'transform',
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
              className="flex items-center justify-center rounded-full border-2 transition-colors"
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
    </div>
  )
})

export default TaskCard
