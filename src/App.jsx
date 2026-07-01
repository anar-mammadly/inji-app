import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Jar from './components/Jar'
import Stats from './components/Stats'
import PomodoroTimer from './components/PomodoroTimer'
import KanbanBoard from './components/KanbanBoard'
import StatsPage from './components/StatsPage'
import LearnPage from './components/LearnPage'
import AuthPage from './components/AuthPage'
import { useTaskStore } from './hooks/useTaskStore'
import { useAuth } from './contexts/AuthContext'
import { beadColors, colors } from './utils/colors'
import { scheduleDropSound } from './utils/sound'

export default function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) return null
  if (!user) return <AuthPage />

  return <Board userId={user.id} onSignOut={signOut} />
}

function Board({ userId, onSignOut }) {
  const {
    tasks,
    beadCount,
    weeklyCount,
    streakDays,
    dailyGoal,
    weeklyGoal,
    categoryCounts,
    completedTasks,
    learnings,
    addTask,
    moveTask,
    completeTask,
    deleteTask,
    resetJar,
    resetStats,
    setDailyGoal,
    setWeeklyGoal,
    addLearning,
    deleteLearning,
  } = useTaskStore(userId)
  const jarRef = useRef(null)
  const cardRefs = useRef({})
  const [flyingBeads, setFlyingBeads] = useState([])
  const [page, setPage] = useState('board')

  function handleComplete(task) {
    const cardEl = cardRefs.current[task.id]
    const jarEl = jarRef.current
    if (!cardEl || !jarEl) {
      completeTask(task.id)
      return
    }

    const cardRect = cardEl.getBoundingClientRect()
    const jarRect = jarEl.getBoundingClientRect()

    const beadId = `${task.id}-${Date.now()}`
    const startX = cardRect.left + cardRect.width / 2 - 8
    const startY = cardRect.top + cardRect.height / 2 - 8
    const endX = jarRect.left + jarRect.width / 2 - 8
    const endY = jarRect.top + jarRect.height / 2 - 8

    setFlyingBeads((beads) => [
      ...beads,
      {
        id: beadId,
        startX,
        startY,
        endX,
        endY,
        color: beadColors[beadCount % beadColors.length],
      },
    ])

    scheduleDropSound(0.6)
    completeTask(task.id)
  }

  function handleFlightComplete(beadId) {
    setFlyingBeads((beads) => beads.filter((b) => b.id !== beadId))
  }

  function handleDropTask(taskId, targetCol) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.col === targetCol) return

    if (targetCol === 'done') {
      handleComplete(task)
    } else {
      moveTask(taskId, targetCol)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: colors.bg }}>
      <Navbar streakDays={streakDays} page={page} onNavigate={setPage} onSignOut={onSignOut} />

      {page === 'stats' ? (
        <StatsPage categoryCounts={categoryCounts} completedTasks={completedTasks} onResetStats={resetStats} />
      ) : page === 'learn' ? (
        <LearnPage learnings={learnings} onAdd={addLearning} onDelete={deleteLearning} />
      ) : (
        <div className="flex flex-col sm:flex-row flex-1">
          <div
            className="flex flex-col items-center pt-6 px-4 pb-4 sm:pb-0 border-b sm:border-b-0 sm:border-r w-full sm:w-[220px] shrink-0"
            style={{ background: colors.bg, borderColor: colors.border }}
          >
            <Jar beadCount={beadCount} jarRef={jarRef} onReset={resetJar} />
            <Stats
              beadCount={beadCount}
              weeklyCount={weeklyCount}
              dailyGoal={dailyGoal}
              weeklyGoal={weeklyGoal}
              onSetDailyGoal={setDailyGoal}
              onSetWeeklyGoal={setWeeklyGoal}
            />
            <div className="w-full mt-3">
              <PomodoroTimer />
            </div>
          </div>

          <KanbanBoard
            tasks={tasks}
            onStart={(id) => moveTask(id, 'inprog')}
            onBack={(id) => moveTask(id, 'todo')}
            onComplete={handleComplete}
            onAdd={addTask}
            onDelete={deleteTask}
            onDropTask={handleDropTask}
            cardRefs={cardRefs}
          />
        </div>
      )}

      <AnimatePresence>
        {flyingBeads.map((bead) => (
          <motion.div
            key={bead.id}
            initial={{ x: bead.startX, y: bead.startY, opacity: 1 }}
            animate={{ x: bead.endX, y: bead.endY, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onAnimationComplete={() => handleFlightComplete(bead.id)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: bead.color,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
