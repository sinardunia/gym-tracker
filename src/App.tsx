import { useEffect, useState } from 'react'
import { I18nProvider, useI18n, LANG_KEY, type Lang } from './i18n'
import { HomeScreen } from './screens/HomeScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { RoutineEditorScreen } from './screens/RoutineEditorScreen'
import { ProgramPickerScreen } from './screens/ProgramPickerScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { clearTimerSnapshots } from './lib/timer'
import {
  normalizeWorkout,
  type ExerciseUnit,
  type PersistedState,
  type ProgramTemplate,
  type Routine,
  type SetType,
  type Weekday,
  type Workout,
} from './lib/types'
import {
  createWorkout,
  loadState,
  newId,
  saveState,
} from './lib/data'
import './App.css'

function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'id'
    } catch {
      return 'id'
    }
  })

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
      <AppContent lang={lang} onToggleLang={() => setLang((cur) => (cur === 'id' ? 'en' : 'id'))} />
    </I18nProvider>
  )
}

function AppContent({
  lang,
  onToggleLang,
}: {
  lang: Lang
  onToggleLang: () => void
}) {
  const { tr } = useI18n()
  const [state, setState] = useState<PersistedState>(loadState)
  const [viewedSession, setViewedSession] = useState<Workout | null>(null)
  const [routinesOpen, setRoutinesOpen] = useState(false)
  const [programsOpen, setProgramsOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressExercise, setProgressExercise] = useState<string | null>(null)
  const [workoutPaused, setWorkoutPaused] = useState(false)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  )

  const activeWorkout = state.activeWorkout

  useEffect(() => {
    saveState(state)
  }, [state])

  function startWorkout(exerciseNames: string[] = []) {
    setState((s) => ({
      ...s,
      activeWorkout: {
        ...createWorkout(),
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
    setState((s) => ({
      ...s,
      activeWorkout: null,
      sessions: [finished, ...s.sessions],
    }))
    setViewedSession(finished)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
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
                  ? { ...e, sets: e.sets.filter((set) => set.id !== setId) }
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
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId
                  ? {
                      ...e,
                      sets: e.sets.map((set) =>
                        set.id === setId
                          ? {
                              ...set,
                              reps,
                              weightKg,
                              type,
                              // A non-dropset set never has a parent reference.
                              ...(type === 'dropset' ? {} : { parentId: undefined }),
                            }
                          : set,
                      ),
                    }
                  : e,
              ),
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

  function updateWorkoutNote(note: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: { ...s.activeWorkout, note: note.trim() ? note : undefined },
          }
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
    setState((s) => ({ ...s, activeWorkout: null }))
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function toggleExerciseCollapsed(exerciseId: string) {
    setCollapsedExerciseIds((ids) => {
      const next = new Set(ids)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
      } else {
        next.add(exerciseId)
      }
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
    const routine: Routine = {
      id: newId(),
      name: tr(template.title),
      days: template.days.map((day) => ({
        id: newId(),
        name: tr(day.name),
        exerciseNames: [...day.exerciseNames],
      })),
      schedule: {},
    }
    setState((s) => ({
      ...s,
      routines: [routine, ...s.routines],
    }))
    setProgramsOpen(false)
    setRoutinesOpen(true)
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

  if (viewedSession) {
    return (
      <SummaryScreen
        workout={viewedSession}
        onStartAnother={startWorkout}
        onBack={() => setViewedSession(null)}
      />
    )
  }

  if (routinesOpen) {
    return (
      <RoutineEditorScreen
        routines={state.routines}
        onBack={() => setRoutinesOpen(false)}
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
      />
    )
  }

  if (programsOpen) {
    return (
      <ProgramPickerScreen
        onBack={() => setProgramsOpen(false)}
        onApply={applyTemplate}
      />
    )
  }

  if (progressOpen) {
    return (
      <ProgressScreen
        sessions={state.sessions}
        selected={progressExercise}
        onSelect={setProgressExercise}
        onBack={() => {
          setProgressOpen(false)
          setProgressExercise(null)
        }}
      />
    )
  }

  return (
    <HomeScreen
      sessions={state.sessions}
      routines={state.routines}
      activeWorkout={activeWorkout}
      onResumeWorkout={() => setWorkoutPaused(false)}
      onStart={() => startWorkout()}
      onStartWithExercises={(names) => startWorkout(names)}
      onViewSession={setViewedSession}
      onOpenRoutines={() => setRoutinesOpen(true)}
      onOpenPrograms={() => setProgramsOpen(true)}
      onOpenProgress={() => setProgressOpen(true)}
      backupState={state}
      onImportBackup={importBackup}
      lang={lang}
      onToggleLang={onToggleLang}
    />
  )
}

export default App
