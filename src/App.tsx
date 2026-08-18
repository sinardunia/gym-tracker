import { useEffect, useRef, useState } from 'react'
import { Agentation } from 'agentation'
import { I18nProvider, useI18n, LANG_KEY, type Lang } from './i18n'
import { HomeScreen } from './screens/HomeScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { PlanningScreen } from './screens/PlanningScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { BottomNav, type TabKey } from './components/BottomNav'
import { UpdateBanner } from './components/UpdateBanner'
import { clearTimerSnapshots } from './lib/timer'
import {
  normalizeWorkout,
  type ConsistencyStats,
  type ExerciseUnit,
  type PersistedState,
  type PRDetection,
  type ProgramTemplate,
  type Routine,
  type SetType,
  type Weekday,
  type Workout,
} from './lib/types'
import {
  createWorkout,
  loadAsyncState,
  loadState,
  newId,
  parseBackup,
  saveState,
} from './lib/data'
import { useTheme, type Theme } from './lib/theme'
import { computeConsistency, detectNewPRs, checkMilestones } from './lib/selectors'
import { loadSeenMilestones, saveSeenMilestones } from './lib/milestones'
import './App.css'

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
      <AppContent
        lang={lang}
        onToggleLang={() => setLang((cur) => (cur === 'id' ? 'en' : 'id'))}
        theme={theme}
        onSetTheme={setTheme}
      />
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
  const { tr } = useI18n()
  const [state, setState] = useState<PersistedState>(loadState)
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
  const [dismissedMilestoneId, setDismissedMilestoneId] = useState<string | null>(null)
  const [milestoneToDisplay, setMilestoneToDisplay] = useState<string | null>(null)
  const editingSessionIdRef = useRef<string | null>(null)

  const activeWorkout = state.activeWorkout

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const idb = await loadAsyncState()
      if (cancelled || !idb) return
      setState((current) => {
        const localSavedAt = current.savedAt ? Date.parse(current.savedAt) : NaN
        const idbSavedAt = idb.savedAt ? Date.parse(idb.savedAt) : NaN
        const idbEmpty =
          idb.sessions.length === 0 &&
          idb.routines.length === 0 &&
          idb.activeWorkout === null
        const localEmpty =
          current.sessions.length === 0 &&
          current.routines.length === 0 &&
          current.activeWorkout === null
        if (!Number.isFinite(idbSavedAt)) return current
        if (idbEmpty && !localEmpty) return current
        if (!Number.isFinite(localSavedAt)) return idb
        if (idbSavedAt > localSavedAt) return idb
        return current
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (state.sessions.length > 0 || state.routines.length > 0) return
    try {
      if (localStorage.getItem('gym-tracker.seeded') === '1') return
    } catch {
      return
    }
    let cancelled = false
    void fetch('gym-tracker-dummy-backup.json')
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return
        const backup = parseBackup(text)
        if (!backup) return
        try {
          localStorage.setItem('gym-tracker.seeded', '1')
        } catch {
          // Storage unavailable.
        }
        setState(backup)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [state.sessions.length, state.routines.length])

  useEffect(() => {
    const stats = computeConsistency(state.sessions)
    setConsistencyStats(stats)
    const prs = detectNewPRs(state.sessions)
    setNewPRs(prs)
  }, [state.sessions])

  useEffect(() => {
    if (state.sessions.length === 0) return
    const seen = loadSeenMilestones()
    const milestone = checkMilestones(state.sessions, seen)
    if (milestone) {
      setMilestoneToDisplay(milestone)
      saveSeenMilestones([...seen, milestone])
    }
  }, [state.sessions])

  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => {})
  }, [])

  function startWorkout(exerciseNames: string[] = [], routineId?: string, dayId?: string) {
    editingSessionIdRef.current = null
    setState((s) => ({
      ...s,
      activeWorkout: {
        ...createWorkout(),
        routineId,
        dayId,
        exercises: exerciseNames.map((name) => ({
          id: newId(),
          name,
          sets: [],
          unit: 'kg',
        })),
      },
    }))
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function finishWorkout() {
    if (!activeWorkout) return
    const finished: Workout = normalizeWorkout({
      ...activeWorkout,
      finishedAt: new Date().toISOString(),
    })
    const editingId = editingSessionIdRef.current
    editingSessionIdRef.current = null
    setState((s) => ({
      ...s,
      activeWorkout: null,
      sessions: editingId
        ? s.sessions.map((session) =>
            session.id === editingId ? finished : session,
          )
        : [finished, ...s.sessions],
    }))
    setViewedSession(finished)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function editSession(session: Workout) {
    editingSessionIdRef.current = session.id
    setState((s) => ({
      ...s,
      activeWorkout: normalizeWorkout({
        ...session,
        finishedAt: null,
      }),
    }))
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
  }

  function deleteSession(sessionId: string) {
    setState((s) => ({
      ...s,
      sessions: s.sessions.filter((session) => session.id !== sessionId),
    }))
    setViewedSession(null)
  }

  function addExercise(name: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
            exercises: [
              ...s.activeWorkout.exercises,
              { id: newId(), name, sets: [], unit: 'kg' },
            ],
            },
          }
        : s,
    )
  }

  function addSet(
    exerciseId: string,
    reps: number,
    weightKg: number,
    type: SetType,
    parentId?: string,
  ) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId
                  ? {
                      ...e,
                      sets: [
                        ...e.sets,
                        { id: newId(), reps, weightKg, type, ...(parentId ? { parentId } : {}) },
                      ],
                    }
                  : e,
              ),
            },
          }
        : s,
    )
  }

  function removeSet(exerciseId: string, setId: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId
                  ? {
                      ...e,
                      sets: e.sets.filter(
                        (set) => set.id !== setId && set.parentId !== setId,
                      ),
                    }
                  : e,
              ),
            },
          }
        : s,
    )
  }

  function updateSet(
    exerciseId: string,
    setId: string,
    reps: number,
    weightKg: number,
    type: SetType,
  ) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e
                const target = e.sets.find((set) => set.id === setId)
                let parentId = target?.parentId
                if (type === 'dropset' && !parentId) {
                  for (let i = e.sets.length - 1; i >= 0; i -= 1) {
                    if (e.sets[i].type === 'working' && e.sets[i].id !== setId) {
                      parentId = e.sets[i].id
                      break
                    }
                  }
                }
                return {
                  ...e,
                  sets: e.sets.map((set) =>
                    set.id === setId
                      ? {
                          ...set,
                          reps,
                          weightKg,
                          type,
                          // A non-dropset set never has a parent reference.
                          ...(type === 'dropset'
                            ? { parentId }
                            : { parentId: undefined }),
                        }
                      : set,
                  ),
                }
              }),
            },
          }
        : s,
    )
  }

  function removeExercise(exerciseId: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.filter(
                (e) => e.id !== exerciseId,
              ),
            },
          }
        : s,
    )
  }

  function renameExercise(exerciseId: string, name: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId ? { ...e, name } : e,
              ),
            },
          }
        : s,
    )
  }

  function changeExerciseUnit(exerciseId: string, unit: ExerciseUnit) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId ? { ...e, unit } : e,
              ),
            },
          }
        : s,
    )
  }

  function moveExercise(exerciseId: string, direction: -1 | 1) {
    setState((s) => {
      if (!s.activeWorkout) return s
      const exercises = [...s.activeWorkout.exercises]
      const index = exercises.findIndex((e) => e.id === exerciseId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= exercises.length) return s
      const [moved] = exercises.splice(index, 1)
      exercises.splice(target, 0, moved)
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises } }
    })
  }

  function updateWorkoutNote(note: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: { ...s.activeWorkout, note: note.trim() ? note : undefined },          }
        : s,
    )
  }

  function updateExerciseNote(exerciseId: string, note: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId
                  ? { ...e, note: note.trim() ? note : undefined }
                  : e,
              ),
            },
          }
        : s,
    )
  }

  function discardWorkout() {
    editingSessionIdRef.current = null
    setState((s) => ({ ...s, activeWorkout: null }))
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function toggleExerciseCollapsed(exerciseId: string) {
    setCollapsedExerciseIds((ids) => {
      const isCollapsed = ids.has(exerciseId)
      if (isCollapsed) {
        const allIds = activeWorkout?.exercises.map((e) => e.id) ?? []
        return new Set(allIds.filter((id) => id !== exerciseId))
      }
      const next = new Set(ids)
      next.add(exerciseId)
      return next
    })
  }

  function addRoutine() {
    setState((s) => ({
      ...s,
      routines: [
        ...s.routines,
        { id: newId(), name: tr('routine.newName'), days: [], schedule: {} },
      ],
    }))
  }

  function applyTemplate(template: ProgramTemplate) {
    const days = template.days.map((day) => ({
      id: day.id ?? newId(),
      name: tr(day.name),
      exerciseNames: [...day.exerciseNames],
    }))
    const schedule: Partial<Record<Weekday, string>> = {}
    for (const [weekday, dayId] of Object.entries(template.schedule ?? {})) {
      const day = days.find((d) => d.id === dayId)
      if (day) schedule[Number(weekday) as Weekday] = day.id
    }
    const routine: Routine = {
      id: newId(),
      name: tr(template.title),
      days,
      schedule,
    }
    setState((s) => ({
      ...s,
      routines: [routine, ...s.routines],
    }))
  }

  function renameRoutine(routineId: string, name: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId ? { ...r, name } : r,
      ),
    }))
  }

  function deleteRoutine(routineId: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.filter((r) => r.id !== routineId),
    }))
  }

  function addDay(routineId: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: [
                ...r.days,
                { id: newId(), name: tr('routine.newDayName'), exerciseNames: [] },
              ],
            }
          : r,
      ),
    }))
  }

  function renameDay(routineId: string, dayId: string, name: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) => (d.id === dayId ? { ...d, name } : d)),
            }
          : r,
      ),
    }))
  }

  function removeDay(routineId: string, dayId: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => {
        if (r.id !== routineId) return r
        const schedule: Partial<Record<Weekday, string>> = {}
        for (const [weekday, id] of Object.entries(r.schedule)) {
          if (id !== dayId) schedule[Number(weekday) as Weekday] = id
        }
        return {
          ...r,
          days: r.days.filter((d) => d.id !== dayId),
          schedule,
        }
      }),
    }))
  }

  function setDaySchedule(
    routineId: string,
    dayId: string,
    weekday: Weekday | null,
  ) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => {
        if (r.id !== routineId) return r
        if (weekday === null) {
          const schedule: Partial<Record<Weekday, string>> = {}
          for (const [w, id] of Object.entries(r.schedule)) {
            if (id !== dayId) schedule[Number(w) as Weekday] = id
          }
          return { ...r, schedule }
        }
        return { ...r, schedule: { ...r.schedule, [weekday]: dayId } }
      }),
    }))
  }

  function moveDay(routineId: string, dayId: string, direction: -1 | 1) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => {
        if (r.id !== routineId) return r
        const index = r.days.findIndex((d) => d.id === dayId)
        const target = index + direction
        if (index < 0 || target < 0 || target >= r.days.length) return r
        const days = [...r.days]
        const [moved] = days.splice(index, 1)
        days.splice(target, 0, moved)
        return { ...r, days }
      }),
    }))
  }

  function addExerciseToDay(routineId: string, dayId: string, name: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) =>
                d.id === dayId
                  ? { ...d, exerciseNames: [...d.exerciseNames, name] }
                  : d,
              ),
            }
          : r,
      ),
    }))
  }

  function removeExerciseFromDay(
    routineId: string,
    dayId: string,
    index: number,
  ) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      exerciseNames: d.exerciseNames.filter(
                        (_, i) => i !== index,
                      ),
                    }
                  : d,
              ),
            }
          : r,
      ),
    }))
  }

  function moveExerciseInDay(
    routineId: string,
    dayId: string,
    index: number,
    direction: -1 | 1,
  ) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) => {
                if (d.id !== dayId) return d
                const target = index + direction
                if (target < 0 || target >= d.exerciseNames.length) return d
                const names = [...d.exerciseNames]
                const [moved] = names.splice(index, 1)
                names.splice(target, 0, moved)
                return { ...d, exerciseNames: names }
              }),
            }
          : r,
      ),
    }))
  }

  function importBackup(nextState: PersistedState) {
    setState(nextState)
    setViewedSession(null)
  }

  if (activeWorkout && !workoutPaused) {
    return (
      <WorkoutScreen
        workout={activeWorkout}
        onAddExercise={addExercise}
        onAddSet={addSet}
        onRemoveSet={removeSet}
        onUpdateSet={updateSet}
        onRemoveExercise={removeExercise}
        onRenameExercise={renameExercise}
        onChangeUnit={changeExerciseUnit}
        onMoveExercise={moveExercise}
        onUpdateWorkoutNote={updateWorkoutNote}
        onUpdateExerciseNote={updateExerciseNote}
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
    <div className="app-layout flex flex-col min-h-dvh pb-[72px]">
      {viewedSession ? (
        <SummaryScreen
          workout={viewedSession}
          onStartAnother={startWorkout}
          onBack={() => setViewedSession(null)}
          onEdit={editSession}
          onDelete={deleteSession}
          newPRs={newPRs}
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
              onStartWithExercises={(names, routineId, dayId) => startWorkout(names, routineId, dayId)}
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
            <main className="screen">
              <PlanningScreen
                routines={state.routines}
                onAddRoutine={addRoutine}
                onRenameRoutine={renameRoutine}
                onDeleteRoutine={deleteRoutine}
                onAddDay={addDay}
                onRenameDay={renameDay}
                onRemoveDay={removeDay}
                onMoveDay={moveDay}
                onAddExercise={addExerciseToDay}
                onRemoveExercise={removeExerciseFromDay}
                onMoveExercise={moveExerciseInDay}
                onSetSchedule={setDaySchedule}
                onApplyTemplate={applyTemplate}
              />
            </main>
          )}

          {activeTab === 'history' && (
            <main className="screen">
              <HistoryScreen
                sessions={state.sessions}
                onViewSession={setViewedSession}
                lang={lang}
              />
            </main>
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

      <BottomNav activeTab={activeTab} onTabChange={(tab) => {
        setViewedSession(null)
        setActiveTab(tab)
      }} />
    </div>
  )
}

export default App
