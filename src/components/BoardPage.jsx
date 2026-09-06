import { useParams, useNavigate, Navigate } from 'react-router-dom'
import Jar from './Jar'
import Stats from './Stats'
import PomodoroTimer from './PomodoroTimer'
import KanbanBoard from './KanbanBoard'
import BoardSwitcher from './BoardSwitcher'

export default function BoardPage({
  boards,
  tasks,
  beadCount,
  weeklyCount,
  dailyGoal,
  weeklyGoal,
  onSetDailyGoal,
  onSetWeeklyGoal,
  onResetWeeklyGoal,
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onComplete,
  onDropTask,
  onAddBoard,
  onDeleteBoard,
  onResetJar,
  jarRef,
  cardRefs,
  activeSession,
  computeSecondsLeft,
  onPomodoroStart,
  onPomodoroToggle,
  onPomodoroModeComplete,
  onPomodoroReset,
  onPomodoroCancel,
}) {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const activeBoard = boards.find((b) => b.id === boardId)

  if (!activeBoard) {
    return <Navigate to={`/board/${boards[0]?.id}`} replace />
  }

  const boardTasks = tasks.filter((t) => t.boardId === boardId)

  function handleDeleteBoard(id) {
    if (id === boardId) navigate(`/board/${boards.find((b) => b.id !== id)?.id}`)
    onDeleteBoard(id)
  }

  return (
    <div className="flex flex-col flex-1">
      <BoardSwitcher
        boards={boards}
        activeBoardId={boardId}
        onSelect={(id) => navigate(`/board/${id}`)}
        onAddBoard={onAddBoard}
        onDeleteBoard={handleDeleteBoard}
      />

      <div className="flex flex-col sm:flex-row flex-1">
        <div className="flex flex-col items-center pt-6 px-4 pb-4 sm:pb-0 border-b sm:border-b-0 sm:border-r border-border w-full sm:w-[220px] shrink-0 bg-bg">
          <Jar beadCount={beadCount} jarRef={jarRef} onReset={onResetJar} />
          <Stats
            beadCount={beadCount}
            weeklyCount={weeklyCount}
            dailyGoal={dailyGoal}
            weeklyGoal={weeklyGoal}
            onSetDailyGoal={onSetDailyGoal}
            onSetWeeklyGoal={onSetWeeklyGoal}
            onResetWeeklyGoal={onResetWeeklyGoal}
          />
          <div className="w-full mt-3">
            <PomodoroTimer
              activeSession={activeSession}
              computeSecondsLeft={computeSecondsLeft}
              tasks={boardTasks.filter((t) => t.col === 'inprog')}
              onStart={onPomodoroStart}
              onToggle={onPomodoroToggle}
              onModeComplete={onPomodoroModeComplete}
              onReset={onPomodoroReset}
              onCancel={onPomodoroCancel}
            />
          </div>
        </div>

        <KanbanBoard
          tasks={boardTasks}
          onStart={(id) => onMoveTask(id, 'inprog')}
          onBack={(id) => onMoveTask(id, 'todo')}
          onComplete={onComplete}
          onAdd={(name, category, col) => onAddTask(name, category, boardId, col)}
          onDelete={onDeleteTask}
          onDropTask={onDropTask}
          cardRefs={cardRefs}
        />
      </div>
    </div>
  )
}
