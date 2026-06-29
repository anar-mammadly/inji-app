import Column from './Column'

const COLUMN_IDS = ['todo', 'inprog', 'done']

export default function KanbanBoard({ tasks, onStart, onBack, onComplete, onAdd, onDelete, onDropTask, cardRefs }) {
  return (
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
          onDropTask={onDropTask}
          cardRefs={cardRefs}
        />
      ))}
    </div>
  )
}
