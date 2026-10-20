import { useState } from 'react'
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useTranslation } from '../i18n/LanguageContext'
import Column, { COLUMN_LABEL_KEYS } from './Column'
import Segmented from './ui/Segmented'

const COLUMN_IDS = ['todo', 'inprog', 'done']

export default function KanbanBoard({ tasks, onStart, onBack, onComplete, onAdd, onDelete, onEdit, onDropTask, cardRefs }) {
  const { t } = useTranslation()
  // phones show one column at a time; tablets and up show all three
  const [mobileCol, setMobileCol] = useState('todo')
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
    </DndContext>
  )
}
