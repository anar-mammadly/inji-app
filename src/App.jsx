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
import CalendarPage from './components/CalendarPage'
import NotesPage from './components/NotesPage'
import PlanPage from './components/PlanPage'
import ProfilePage from './components/ProfilePage'
import AuthModal from './components/AuthModal'
import ResetPasswordModal from './components/ResetPasswordModal'
import PullToRefreshIndicator from './components/PullToRefreshIndicator'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import { usePersistedState } from './hooks/usePersistedState'
import { useTaskStore } from './hooks/useTaskStore'
import { usePomodoroStore, durationFor } from './hooks/usePomodoroStore'
import { useHabitStore } from './hooks/useHabitStore'
import { useLearningStore } from './hooks/useLearningStore'
import { useCalendarStore } from './hooks/useCalendarStore'
import { useNotesStore } from './hooks/useNotesStore'
import { usePlanStore } from './hooks/usePlanStore'
import { useReminders } from './hooks/useReminders'
import { useProfile } from './hooks/useProfile'
import { useAuth } from './contexts/AuthContext'
import { beadColors, colors } from './utils/colors'
import { pearlBackground } from './components/Jar'
import { formatBakuDay } from './utils/bakuDate'
import { useBakuClock } from './hooks/useBakuClock'
import { scheduleDropSound, playBeadBreakSound } from './utils/sound'
import { authErrorMessage } from './utils/authErrors'
import { useTranslation } from './i18n/LanguageContext'

// isolated so the clock's per-second tick doesn't re-render the whole app
function BakuToday() {
  const { lang } = useTranslation()
  const now = useBakuClock()
  return formatBakuDay(lang, now)
}

export default function App() {
  const { user, loading, signOut, passwordRecovery, linkError, clearLinkError } = useAuth()
  const { t } = useTranslation()
  // a failed email link (e.g. an expired reset link) opens the auth modal with the reason
  const [showAuth, setShowAuth] = useState(() => !!linkError)

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

  const { events, addEvent, editEvent, deleteEvent, toggleEventDone } = useCalendarStore(state, setState)

  const { notes, addNote, editNote, deleteNote } = useNotesStore(state, setState)

  const {
    planDays,
    planGoals,
    setDayTitle,
    addTodo,
    toggleTodo,
    editTodo,
    setTodoTime,
    deleteTodo,
    addGoal,
    updateGoalProgress,
    deleteGoal,
  } = usePlanStore(state, setState)

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
    const alreadyCounted = completedTasks.some((c) => c.id === task.id)
    if (!cardEl || !jarEl || alreadyCounted) {
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
    <div className="min-h-dvh bg-bg md:flex">
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

      {/* on tablet/desktop the board fits the window; its panels scroll inside */}
      <main className={`flex-1 min-w-0 flex flex-col pb-tabbar md:pb-0 ${page === 'board' ? 'md:h-dvh md:overflow-hidden' : ''}`}>
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
        ) : page === 'calendar' ? (
          <CalendarPage
            events={events}
            onAddEvent={addEvent}
            onEditEvent={editEvent}
            onDeleteEvent={deleteEvent}
            onToggleEventDone={toggleEventDone}
          />
        ) : page === 'plan' ? (
          <PlanPage
            planDays={planDays}
            planGoals={planGoals}
            onSetDayTitle={setDayTitle}
            onAddTodo={addTodo}
            onToggleTodo={toggleTodo}
            onEditTodo={editTodo}
            onSetTodoTime={setTodoTime}
            onDeleteTodo={deleteTodo}
            onAddGoal={addGoal}
            onUpdateGoalProgress={updateGoalProgress}
            onDeleteGoal={deleteGoal}
          />
        ) : page === 'notes' ? (
          <NotesPage
            notes={notes}
            onAddNote={addNote}
            onEditNote={editNote}
            onDeleteNote={deleteNote}
          />
        ) : (
          <div className="flex-1 md:min-h-0 flex flex-col w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 md:pt-7 pb-5 md:pb-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4 md:mb-5">
              <div>
                <h1 className="font-display text-[26px] sm:text-[30px] leading-tight text-textPrimary">{t('navBoard')}</h1>
                <p className="mt-0.5 text-[14px] font-bold text-textMuted"><BakuToday /></p>
              </div>
              <BoardSwitcher
                boards={boards}
                activeBoardId={activeBoardId}
                onSelect={setActiveBoardId}
                onAddBoard={addBoard}
                onDeleteBoard={handleDeleteBoard}
              />
            </div>

            {/* phones: today → columns → timer · tablet: today | timer over columns · desktop: today + timer beside columns */}
            <div className="flex-1 md:min-h-0 flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] md:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-3">
              <section
                aria-label={t('todayPanel')}
                className="rounded-3xl bg-surface border-2 border-border p-4 sm:p-5 flex flex-col sm:flex-row lg:flex-col gap-5 sm:items-center lg:items-stretch md:col-start-1 md:row-start-1"
              >
                <Jar beadCount={beadCount} jarRef={jarRef} onReset={resetJar} />
                <div className="hidden sm:block lg:hidden w-0.5 self-stretch bg-border rounded-full" />
                <div className="h-0.5 bg-border rounded-full sm:hidden lg:block" />
                <div className="flex-1 min-w-0">
                  <Stats
                    beadCount={beadCount}
                    weeklyCount={weeklyCount}
                    dailyGoal={dailyGoal}
                    weeklyGoal={weeklyGoal}
                    onSetDailyGoal={setDailyGoal}
                    onSetWeeklyGoal={setWeeklyGoal}
                    onResetWeeklyGoal={resetWeeklyGoal}
                  />
                </div>
              </section>

              <section
                aria-label={t('focusSession')}
                className="order-3 md:order-none flex rounded-3xl bg-surface border-2 border-border p-4 sm:p-5 md:col-start-2 md:row-start-1 lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:overflow-y-auto no-scrollbar"
              >
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
              </section>

              <div className="order-2 md:order-none flex md:min-h-0 md:col-span-2 md:row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:row-span-2">
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
          </div>
        )}
      </main>

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
              background: pearlBackground(bead.color), pointerEvents: 'none', zIndex: 50,
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
                  style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: colors.pom }}
                />
              )
            })}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {passwordRecovery && user ? (
          <ResetPasswordModal key="reset" />
        ) : showAuth && (
          <AuthModal
            key="auth"
            initialMode={linkError ? 'forgot' : 'login'}
            initialError={authErrorMessage(linkError, t)}
            onClose={() => {
              setShowAuth(false)
              clearLinkError()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
