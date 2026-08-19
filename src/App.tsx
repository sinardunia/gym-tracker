import { useEffect, useState } from 'react'
import { Agentation } from 'agentation'
import { I18nProvider, LANG_KEY, type Lang } from './i18n'
import { HomeScreen } from './screens/HomeScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { PlanningScreen } from './screens/PlanningScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { BottomNav, type TabKey } from './components/BottomNav'
import { Screen } from './components/ui'
import { UpdateBanner } from './components/UpdateBanner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { clearTimerSnapshots } from './lib/timer'
import type { ConsistencyStats, PersistedState, PRDetection, Workout } from './lib/types'
import { useTheme, type Theme } from './lib/theme'
import { computeConsistency, detectNewPRs, checkMilestones } from './lib/selectors'
import { loadSeenMilestones, saveSeenMilestones } from './lib/milestones'
import { useDevSeedData } from './hooks/useDevSeedData'
import { AppStore } from './store/AppStore'
import { useApp } from './store/AppContext'

function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'id'
    } catch {
      return 'id'
    }
  })
  const [theme, setTheme] = useTheme()

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
      document.documentElement.lang = lang
    } catch {
      // Storage unavailable.
    }
  }, [lang])

  return (
    <I18nProvider lang={lang}>
      <AppStore>
        <ErrorBoundary>
          <AppContent
            lang={lang}
            onToggleLang={() => setLang((cur) => (cur === 'id' ? 'en' : 'id'))}
            theme={theme}
            onSetTheme={setTheme}
          />
        </ErrorBoundary>
      </AppStore>
      <UpdateBanner />
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </I18nProvider>
  )
}

function AppContent({
  lang,
  onToggleLang,
  theme,
  onSetTheme,
}: {
  lang: Lang
  onToggleLang: () => void
  theme: Theme
  onSetTheme: (theme: Theme) => void
}) {
  const { state, setState, workoutActions, routineActions } = useApp()
  const { takeLastFinished } = workoutActions
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [viewedSession, setViewedSession] = useState<Workout | null>(null)
  const [progressExercise, setProgressExercise] = useState<string | null>(null)
  const [workoutPaused, setWorkoutPaused] = useState(false)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [consistencyStats, setConsistencyStats] = useState<ConsistencyStats>({
    currentWeekStreak: 0,
    longestWeekStreak: 0,
    totalSessions: 0,
    lastTrainedAt: null,
    gapDays: null,
  })
  const [newPRs, setNewPRs] = useState<PRDetection[]>([])

  useDevSeedData(state, setState)

  useEffect(() => {
    const stats = computeConsistency(state.sessions)
    setConsistencyStats(stats)
    const justFinished = takeLastFinished()
    if (justFinished) {
      const priorSessions = state.sessions.filter(
        (session) => session.id !== justFinished.id,
      )
      const prs = detectNewPRs(priorSessions, justFinished)
      setNewPRs(prs)
    }
  }, [state.sessions, takeLastFinished])

  useEffect(() => {
    if (state.sessions.length === 0) return
    const stats = computeConsistency(state.sessions)
    const seen = loadSeenMilestones()
    const milestones = checkMilestones(stats, seen, newPRs.length)
    if (milestones.length > 0) {
      const next = new Set(seen)
      for (const m of milestones) next.add(m)
      saveSeenMilestones(next)
    }
  }, [state.sessions, newPRs.length])

  function startWorkout(
    exerciseNames: string[] = [],
    routineId?: string,
    dayId?: string,
  ) {
    workoutActions.startWorkout(exerciseNames, routineId, dayId)
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function finishWorkout() {
    const finished = workoutActions.finishWorkout()
    if (!finished) return
    setViewedSession(finished)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function editSession(session: Workout) {
    workoutActions.editSession(session)
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
  }

  function discardWorkout() {
    workoutActions.discardWorkout()
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function deleteSession(sessionId: string) {
    workoutActions.deleteSession(sessionId)
    setViewedSession(null)
  }

  function importBackup(nextState: PersistedState) {
    setState(nextState)
    setViewedSession(null)
  }

  function toggleExerciseCollapsed(exerciseId: string) {
    setCollapsedExerciseIds((ids) => {
      const isCollapsed = ids.has(exerciseId)
      if (isCollapsed) {
        const allIds = state.activeWorkout?.exercises.map((e) => e.id) ?? []
        return new Set(allIds.filter((id) => id !== exerciseId))
      }
      const next = new Set(ids)
      next.add(exerciseId)
      return next
    })
  }

  const activeWorkout = state.activeWorkout

  if (activeWorkout && !workoutPaused) {
    return (
      <WorkoutScreen
        workout={activeWorkout}
        onAddExercise={workoutActions.addExercise}
        onAddSet={workoutActions.addSet}
        onRemoveSet={workoutActions.removeSet}
        onUpdateSet={workoutActions.updateSet}
        onRemoveExercise={workoutActions.removeExercise}
        onRenameExercise={workoutActions.renameExercise}
        onChangeUnit={workoutActions.changeExerciseUnit}
        onMoveExercise={workoutActions.moveExercise}
        onUpdateWorkoutNote={workoutActions.updateWorkoutNote}
        onUpdateExerciseNote={workoutActions.updateExerciseNote}
        onExit={() => setWorkoutPaused(true)}
        onDiscard={discardWorkout}
        onFinish={finishWorkout}
        sessions={state.sessions}
        collapsedExerciseIds={collapsedExerciseIds}
        onToggleCollapsed={toggleExerciseCollapsed}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-dvh pb-[72px]">
      {viewedSession ? (
        <SummaryScreen
          workout={viewedSession}
          onStartAnother={startWorkout}
          onBack={() => setViewedSession(null)}
          onEdit={editSession}
          onDelete={deleteSession}
          newPRs={newPRs}
          sessions={state.sessions}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <HomeScreen
              sessions={state.sessions}
              routines={state.routines}
              activeWorkout={activeWorkout}
              onResumeWorkout={() => setWorkoutPaused(false)}
              onStart={() => startWorkout()}
              onStartWithExercises={(names, routineId, dayId) =>
                startWorkout(names, routineId, dayId)
              }
              onViewSession={setViewedSession}
              onOpenHistory={() => setActiveTab('history')}
              backupState={state}
              onImportBackup={importBackup}
              lang={lang}
              onToggleLang={onToggleLang}
              theme={theme}
              onSetTheme={onSetTheme}
              consistencyStats={consistencyStats}
            />
          )}

          {activeTab === 'planning' && (
            <Screen>
              <PlanningScreen
                routines={state.routines}
                onAddRoutine={routineActions.addRoutine}
                onRenameRoutine={routineActions.renameRoutine}
                onDeleteRoutine={routineActions.deleteRoutine}
                onAddDay={routineActions.addDay}
                onRenameDay={routineActions.renameDay}
                onRemoveDay={routineActions.removeDay}
                onMoveDay={routineActions.moveDay}
                onAddExercise={routineActions.addExerciseToDay}
                onRemoveExercise={routineActions.removeExerciseFromDay}
                onMoveExercise={routineActions.moveExerciseInDay}
                onSetSchedule={routineActions.setDaySchedule}
                onApplyTemplate={routineActions.applyTemplate}
              />
            </Screen>
          )}

          {activeTab === 'history' && (
            <Screen>
              <HistoryScreen
                sessions={state.sessions}
                routines={state.routines}
                onViewSession={setViewedSession}
                lang={lang}
              />
            </Screen>
          )}

          {activeTab === 'progress' && (
            <ProgressScreen
              sessions={state.sessions}
              selected={progressExercise}
              onSelect={setProgressExercise}
              onBack={() => {
                setProgressExercise(null)
                setActiveTab('home')
              }}
            />
          )}
        </>
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setViewedSession(null)
          setActiveTab(tab)
        }}
      />
    </div>
  )
}

export default App