import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Jar from './components/Jar'
import Stats from './components/Stats'
import PomodoroTimer from './components/PomodoroTimer'
import KanbanBoard from './components/KanbanBoard'
import BoardSwitcher from './components/BoardSwitcher'
import StatsPage from './components/StatsPage'
import HabitsPage from './components/HabitsPage'
import LearningPage from './components/LearningPage'
import ProfilePage from './components/ProfilePage'
import AuthModal from './components/AuthModal'
import PullToRefreshIndicator from './components/PullToRefreshIndicator'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import { usePersistedState } from './hooks/usePersistedState'
import { useTaskStore } from './hooks/useTaskStore'
import { usePomodoroStore, durationFor } from './hooks/usePomodoroStore'
import { useHabitStore } from './hooks/useHabitStore'
import { useLearningStore } from './hooks/useLearningStore'
import { useReminders } from './hooks/useReminders'
import { useProfile } from './hooks/useProfile'
import { useAuth } from './contexts/AuthContext'
import { beadColors } from './utils/colors'
import { scheduleDropSound, playBeadBreakSound } from './utils/sound'

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  const userId = user?.id ?? 'guest'

  const [state, setState] = usePersistedState(userId)

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
    editTask,
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

  const { profile } = useProfile(userId)

  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])
  const { pullY, refreshing } = usePullToRefresh(handleRefresh)

  const jarRef = useRef(null)
  const cardRefs = useRef({})
  const [flyingBeads, setFlyingBeads] = useState([])
  const [breakingBeads, setBreakingBeads] = useState([])
  const [page, setPage] = useState('board')
  const [activeBoardId, setActiveBoardId] = useState(boards[0]?.id)

  useEffect(() => {
    if (!boards.some((b) => b.id === activeBoardId)) {
      setActiveBoardId(boards[0]?.id)
    }
  }, [boards, activeBoardId])

  if (loading) return null

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
      { id: beadId, startX, startY, aboveX, aboveY, landY, color: beadColors[beadCount % beadColors.length] },
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
    if (targetCol === 'done') handleComplete(task)
    else moveTask(taskId, targetCol)
  }

  function handleDeleteBoard(id) {
    if (id === activeBoardId) {
      setActiveBoardId(boards.find((b) => b.id !== id)?.id)
    }
    deleteBoard(id)
  }

  const boardTasks = tasks.filter((t) => t.boardId === activeBoardId)

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
      <Navbar
        streakDays={streakDays}
        page={page}
        onNavigate={setPage}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={signOut}
        profileName={`${profile.first_name} ${profile.last_name}`.trim()}
        profileAvatar={profile.avatar_url}
      />

      {page === 'profile' ? (
        <ProfilePage userId={userId} userEmail={user?.email} onSignOut={signOut} />
      ) : page === 'stats' ? (
        <StatsPage categoryCounts={categoryCounts} completedTasks={completedTasks} onResetStats={resetStats} boards={boards} tasks={tasks} />
      ) : page === 'habits' ? (
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
      ) : page === 'learning' ? (
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
      ) : (
        <div className="flex flex-col flex-1">
          <BoardSwitcher
            boards={boards}
            activeBoardId={activeBoardId}
            onSelect={setActiveBoardId}
            onAddBoard={addBoard}
            onDeleteBoard={handleDeleteBoard}
          />

          <div className="flex flex-col sm:flex-row flex-1">
            <div className="flex flex-col items-center pt-6 px-4 pb-4 sm:pb-0 border-b sm:border-b-0 sm:border-r border-border w-full sm:w-[220px] shrink-0 bg-bg">
              <Jar beadCount={beadCount} jarRef={jarRef} onReset={resetJar} />
              <Stats
                beadCount={beadCount}
                weeklyCount={weeklyCount}
                dailyGoal={dailyGoal}
                weeklyGoal={weeklyGoal}
                onSetDailyGoal={setDailyGoal}
                onSetWeeklyGoal={setWeeklyGoal}
                onResetWeeklyGoal={resetWeeklyGoal}
              />
              <div className="w-full mt-3">
                <PomodoroTimer
                  activeSession={activeSession}
                  computeSecondsLeft={computeSecondsLeft}
                  tasks={boardTasks.filter((t) => t.col === 'inprog')}
                  onStart={startSession}
                  onToggle={toggleRunning}
                  onModeComplete={advanceToNextMode}
                  onReset={resetSession}
                  onCancel={handlePomodoroCancel}
                />
              </div>
            </div>

            <KanbanBoard
              tasks={boardTasks}
              onStart={(id) => moveTask(id, 'inprog')}
              onBack={(id) => moveTask(id, 'todo')}
              onComplete={handleComplete}
              onAdd={(name, category, col) => addTask(name, category, activeBoardId, col)}
              onDelete={deleteTask}
              onEdit={editTask}
              onDropTask={handleDropTask}
              cardRefs={cardRefs}
            />
          </div>
        </div>
      )}

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
              position: 'fixed', top: 0, left: 0,
              width: 16, height: 16, borderRadius: '50%',
              background: bead.color, pointerEvents: 'none', zIndex: 50,
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
                  style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: '#FF4B4B' }}
                />
              )
            })}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  )
}
