import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import Column from './Column'

const COLUMN_IDS = ['todo', 'inprog', 'done']

export default function KanbanBoard({ tasks, onStart, onBack, onComplete, onAdd, onDelete, onEdit, onDropTask, cardRefs }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return
    onDropTask(active.id, over.id)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
        {COLUMN_IDS.map((colId) => (
          <Column
            key={colId}
            colId={colId}
            tasks={tasks.filter((t) => t.col === colId)}
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
    </DndContext>
  )
}
