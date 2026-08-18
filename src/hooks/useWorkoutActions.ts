import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import { createWorkout, newId } from '../lib/storage'
import { normalizeWorkout } from '../lib/types'
import type {
  ExerciseUnit,
  PersistedState,
  SetType,
  Workout,
} from '../lib/types'

export function useWorkoutActions(
  state: PersistedState,
  setState: Dispatch<SetStateAction<PersistedState>>,
) {
  const editingSessionIdRef = useRef<string | null>(null)
  const lastFinishedRef = useRef<Workout | null>(null)

  function startWorkout(
    exerciseNames: string[] = [],
    routineId?: string,
    dayId?: string,
  ) {
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
  }

  function finishWorkout(): Workout | null {
    if (!state.activeWorkout) return null
    const finished: Workout = normalizeWorkout({
      ...state.activeWorkout,
      finishedAt: new Date().toISOString(),
    })
    lastFinishedRef.current = finished
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
    return finished
  }

  function editSession(session: Workout) {
    editingSessionIdRef.current = session.id
    setState((s) => ({
      ...s,
      activeWorkout: normalizeWorkout({ ...session, finishedAt: null }),
    }))
  }

  function deleteSession(sessionId: string) {
    setState((s) => ({
      ...s,
      sessions: s.sessions.filter((session) => session.id !== sessionId),
    }))
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
                        {
                          id: newId(),
                          reps,
                          weightKg,
                          type,
                          ...(parentId ? { parentId } : {}),
                        },
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
            activeWorkout: {
              ...s.activeWorkout,
              note: note.trim() ? note : undefined,
            },
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
    editingSessionIdRef.current = null
    setState((s) => ({ ...s, activeWorkout: null }))
  }

  const takeLastFinished = useCallback((): Workout | null => {
    const finished = lastFinishedRef.current
    lastFinishedRef.current = null
    return finished
  }, [])

  return {
    startWorkout,
    finishWorkout,
    editSession,
    deleteSession,
    addExercise,
    addSet,
    removeSet,
    updateSet,
    removeExercise,
    renameExercise,
    changeExerciseUnit,
    moveExercise,
    updateWorkoutNote,
    updateExerciseNote,
    discardWorkout,
    takeLastFinished,
  }
}