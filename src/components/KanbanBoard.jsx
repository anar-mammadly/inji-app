import { useState } from 'react'
import { createPortal } from 'react-dom'
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useTranslation } from '../i18n/LanguageContext'
import Column, { COLUMN_LABEL_KEYS } from './Column'
import TaskCard from './TaskCard'
import Segmented from './ui/Segmented'

const COLUMN_IDS = ['todo', 'inprog', 'done']
const noop = () => {}

export default function KanbanBoard({ tasks, onStart, onBack, onComplete, onAdd, onDelete, onEdit, onDropTask, cardRefs }) {
  const { t } = useTranslation()
  // phones show one column at a time; tablets and up show all three
  const [mobileCol, setMobileCol] = useState('todo')
  // the card being dragged is drawn in an overlay on <body>, so it floats
  // above every column instead of being clipped/hidden behind them
  const [activeId, setActiveId] = useState(null)
  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  function handleDragEnd(event) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    onDropTask(active.id, over.id)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveId(event.active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex-1 min-w-0 md:min-h-0 flex flex-col">
        <Segmented
          className="md:hidden w-full mb-3"
          value={mobileCol}
          onChange={setMobileCol}
          options={COLUMN_IDS.map((id) => ({
            value: id,
            label: t(COLUMN_LABEL_KEYS[id]),
            count: tasks.filter((task) => task.col === id).length,
          }))}
        />
        <div className="flex-1 md:min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
          {COLUMN_IDS.map((colId) => (
            <Column
              key={colId}
              colId={colId}
              className={colId === mobileCol ? '' : 'hidden md:flex'}
              tasks={tasks.filter((task) => task.col === colId)}
              onStart={onStart}
              onBack={onBack}
              onComplete={onComplete}
              onAdd={onAdd}
              onDelete={onDelete}
              onEdit={onEdit}
              cardRefs={cardRefs}
            />
          ))}
        </div>
      </div>

      {createPortal(
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }} zIndex={1000}>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              overlay
              onStart={noop}
              onBack={noop}
              onComplete={noop}
              onDelete={noop}
              onEdit={noop}
            />
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
