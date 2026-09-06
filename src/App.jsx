import { useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import StatsPage from './components/StatsPage'
import BoardPage from './components/BoardPage'
import HabitsPage from './components/HabitsPage'
import LearningPage from './components/LearningPage'
import CalendarPage from './components/CalendarPage'
import { usePersistedState } from './hooks/usePersistedState'
import { useTaskStore } from './hooks/useTaskStore'
import { usePomodoroStore, durationFor } from './hooks/usePomodoroStore'
import { useHabitStore } from './hooks/useHabitStore'
import { useLearningStore } from './hooks/useLearningStore'
import { useCalendarStore } from './hooks/useCalendarStore'
import { useReminders } from './hooks/useReminders'
import { beadColors } from './utils/colors'
import { scheduleDropSound, playBeadBreakSound } from './utils/sound'

export default function App() {
  const [state, setState] = usePersistedState()
  const {
    tasks,
    boards,
    beadCount,
    weeklyCount,
    streakDays,
    dailyGoal,
    weeklyGoal,
    categoryCounts,
    completedTasks,
    addTask,
    moveTask,
    completeTask,
    deleteTask,
    resetJar,
    resetStats,
    setDailyGoal,
    setWeeklyGoal,
    resetWeeklyGoal,
    addBoard,
    deleteBoard,
  } = useTaskStore(state, setState)

  const {
    activeSession,
    computeSecondsLeft,
    startSession,
    toggleRunning,
    advanceToNextMode,
    resetSession,
    cancelSession,
  } = usePomodoroStore(state, setState)

  const {
    habits,
    habitLog,
    addHabit,
    editHabit,
    deleteHabit,
    toggleHabitToday,
    toggleHabitDay,
    addHabitOption,
    deleteHabitOption,
  } = useHabitStore(state, setState)

  const {
    learningGoals,
    journalEntries,
    addLearningGoal,
    updateProgress,
    deleteLearningGoal,
    setReminderInterval,
    markReminded,
    addJournalEntry,
    editJournalEntry,
    deleteJournalEntry,
  } = useLearningStore(state, setState)

  useReminders(learningGoals, markReminded)

  const { events, addEvent, editEvent, deleteEvent, toggleEventDone } = useCalendarStore(state, setState)

  const jarRef = useRef(null)
  const cardRefs = useRef({})
  const [flyingBeads, setFlyingBeads] = useState([])
  const [breakingBeads, setBreakingBeads] = useState([])

  function handlePomodoroCancel() {
    const session = activeSession
    const hadProgress = session && session.mode === 'focus' && computeSecondsLeft(session) < durationFor('focus')
    if (hadProgress && jarRef.current) {
      const rect = jarRef.current.getBoundingClientRect()
      const burstId = `break-${Date.now()}`
      setBreakingBeads((beads) => [...beads, { id: burstId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }])
      playBeadBreakSound()
    }
    cancelSession()
  }

  function handleBreakComplete(burstId) {
    setBreakingBeads((beads) => beads.filter((b) => b.id !== burstId))
  }

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
    // fly to a point above the jar's opening first, then drop straight down
    // into it — reads as "the bead falls into the jar" rather than a flat glide
    const aboveX = jarRect.left + jarRect.width / 2 - 8
    const aboveY = jarRect.top + jarRect.height * 0.05 - 8
    const landY = jarRect.top + jarRect.height * 0.32 - 8

    setFlyingBeads((beads) => [
      ...beads,
      {
        id: beadId,
        startX,
        startY,
        aboveX,
        aboveY,
        landY,
        color: beadColors[beadCount % beadColors.length],
      },
    ])

    scheduleDropSound(0.5)
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
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar streakDays={streakDays} />

      <Routes>
        <Route path="/" element={<Navigate to={`/board/${boards[0]?.id}`} replace />} />
        <Route
          path="/board/:boardId"
          element={
            <BoardPage
              boards={boards}
              tasks={tasks}
              beadCount={beadCount}
              weeklyCount={weeklyCount}
              dailyGoal={dailyGoal}
              weeklyGoal={weeklyGoal}
              onSetDailyGoal={setDailyGoal}
              onSetWeeklyGoal={setWeeklyGoal}
              onResetWeeklyGoal={resetWeeklyGoal}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onMoveTask={moveTask}
              onComplete={handleComplete}
              onDropTask={handleDropTask}
              onAddBoard={addBoard}
              onDeleteBoard={deleteBoard}
              onResetJar={resetJar}
              jarRef={jarRef}
              cardRefs={cardRefs}
              activeSession={activeSession}
              computeSecondsLeft={computeSecondsLeft}
              onPomodoroStart={startSession}
              onPomodoroToggle={toggleRunning}
              onPomodoroModeComplete={advanceToNextMode}
              onPomodoroReset={resetSession}
              onPomodoroCancel={handlePomodoroCancel}
            />
          }
        />
        <Route
          path="/stats"
          element={
            <StatsPage
              categoryCounts={categoryCounts}
              completedTasks={completedTasks}
              onResetStats={resetStats}
              boards={boards}
              tasks={tasks}
            />
          }
        />
        <Route
          path="/habits"
          element={
            <HabitsPage
              habits={habits}
              habitLog={habitLog}
              onAddHabit={addHabit}
              onEditHabit={editHabit}
              onDeleteHabit={deleteHabit}
              onToggleToday={toggleHabitToday}
              onToggleDay={toggleHabitDay}
              onAddOption={addHabitOption}
              onDeleteOption={deleteHabitOption}
            />
          }
        />
        <Route
          path="/learning/*"
          element={
            <LearningPage
              learningGoals={learningGoals}
              journalEntries={journalEntries}
              onAddGoal={addLearningGoal}
              onUpdateProgress={updateProgress}
              onSetReminder={setReminderInterval}
              onDeleteGoal={deleteLearningGoal}
              onAddJournalEntry={addJournalEntry}
              onEditJournalEntry={editJournalEntry}
              onDeleteJournalEntry={deleteJournalEntry}
            />
          }
        />
        <Route
          path="/calendar"
          element={
            <CalendarPage
              events={events}
              onAddEvent={addEvent}
              onEditEvent={editEvent}
              onDeleteEvent={deleteEvent}
              onToggleEventDone={toggleEventDone}
            />
          }
        />
      </Routes>

      <AnimatePresence>
        {flyingBeads.map((bead) => (
          <motion.div
            key={bead.id}
            initial={{ x: bead.startX, y: bead.startY, scale: 1, opacity: 1 }}
            animate={{
              x: [bead.startX, bead.aboveX, bead.aboveX, bead.aboveX, bead.aboveX],
              y: [bead.startY, bead.aboveY, bead.landY + 6, bead.landY - 3, bead.landY],
              scale: [1, 1.05, 1, 1.25, 0.6],
              opacity: [1, 1, 1, 1, 0],
            }}
            transition={{
              duration: 0.75,
              times: [0, 0.45, 0.7, 0.85, 1],
              ease: ['easeOut', 'easeIn', 'backOut', 'easeIn'],
            }}
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

      <AnimatePresence>
        {breakingBeads.map((burst) => (
          <motion.div
            key={burst.id}
            style={{ position: 'fixed', top: burst.y, left: burst.x, width: 0, height: 0, pointerEvents: 'none', zIndex: 50 }}
          >
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle) * 24, y: Math.sin(angle) * 24, opacity: 0, scale: 0.3 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  onAnimationComplete={i === 0 ? () => handleBreakComplete(burst.id) : undefined}
                  style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#FF4B4B',
                  }}
                />
              )
            })}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
