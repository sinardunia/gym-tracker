export type SetType = 'working' | 'warmup' | 'dropset'
export type ExerciseUnit = 'kg' | 'plate' | 'bodyweight'

export const SET_TYPES: readonly SetType[] = ['working', 'warmup', 'dropset']

export const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const

export type WorkoutSet = {
  id: string
  reps: number
  weightKg: number
  type: SetType
  /** If this set is a dropset step, the id of the working set it belongs to. */
  parentId?: string
}

export type Exercise = {
  id: string
  name: string
  sets: WorkoutSet[]
  unit: ExerciseUnit
  note?: string
}

export type Workout = {
  id: string
  routineId?: string
  dayId?: string
  startedAt: string
  finishedAt: string | null
  exercises: Exercise[]
  note?: string
}

export type RoutineDay = {
  id: string
  name: string
  exerciseNames: string[]
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Routine = {
  id: string
  name: string
  days: RoutineDay[]
  schedule: Partial<Record<Weekday, string>>
}

export type ScheduleConflict = {
  routineName: string
  dayName: string
}

export type PersistedState = {
  activeWorkout: Workout | null
  sessions: Workout[]
  routines: Routine[]
}

export type BackupMessage = {
  kind: 'error' | 'info'
  text: string
}

export type LibraryExercise = {
  name: string
  aliases: string[]
}

export type ProgramGoal = 'beginner' | 'aesthetic' | 'strength' | 'athletic'

export type ProgramTemplate = {
  id: string
  title: string
  description: string
  goal: ProgramGoal
  days: { name: string; exerciseNames: string[] }[]
}

export function isSetType(value: unknown): value is SetType {
  return value === 'working' || value === 'warmup' || value === 'dropset'
}

export function isExerciseUnit(value: unknown): value is ExerciseUnit {
  return value === 'kg' || value === 'plate' || value === 'bodyweight'
}

export function isWorkout(value: unknown): value is Workout {
  if (typeof value !== 'object' || value === null) return false
  const workout = value as Record<string, unknown>
  if (typeof workout.id !== 'string' || typeof workout.startedAt !== 'string') {
    return false
  }
  if (workout.finishedAt !== null &&
    typeof workout.finishedAt !== 'string'
  ) {
    return false
  }
  if (workout.note !== undefined && typeof workout.note !== 'string') {
    return false
  }
  if (!Array.isArray(workout.exercises)) return false
  return workout.exercises.every((exercise) => {
    if (typeof exercise !== 'object' || exercise === null) return false
    const entry = exercise as Record<string, unknown>
    if (typeof entry.id !== 'string' || typeof entry.name !== 'string') {
      return false
    }
    if (entry.note !== undefined && typeof entry.note !== 'string') {
      return false
    }
    if (entry.unit !== undefined && !isExerciseUnit(entry.unit)) {
      return false
    }
    if (!Array.isArray(entry.sets)) return false
    return entry.sets.every((set) => {
      if (typeof set !== 'object' || set === null) return false
      const setEntry = set as Record<string, unknown>
      return (
        typeof setEntry.id === 'string' &&
        typeof setEntry.reps === 'number' &&
        Number.isFinite(setEntry.reps) &&
        typeof setEntry.weightKg === 'number' &&
        Number.isFinite(setEntry.weightKg) &&
        (setEntry.type === undefined || isSetType(setEntry.type)) &&
        (setEntry.parentId === undefined || typeof setEntry.parentId === 'string')
      )
    })
  })
}

export function isRoutineDay(value: unknown): value is RoutineDay {
  if (typeof value !== 'object' || value === null) return false
  const day = value as Record<string, unknown>
  if (typeof day.id !== 'string' || typeof day.name !== 'string') {
    return false
  }
  return (
    Array.isArray(day.exerciseNames) &&
    day.exerciseNames.every((name) => typeof name === 'string')
  )
}

export function isSchedule(
  value: unknown,
): value is Partial<Record<Weekday, string>> {
  if (typeof value !== 'object' || value === null) return false
  const schedule = value as Record<string, unknown>
  return Object.entries(schedule).every(([key, dayId]) => {
    const weekday = Number(key)
    return (
      Number.isInteger(weekday) &&
      weekday >= 0 &&
      weekday <= 6 &&
      typeof dayId === 'string'
    )
  })
}

export function isRoutine(value: unknown): value is Routine {
  if (typeof value !== 'object' || value === null) return false
  const routine = value as Record<string, unknown>
  if (typeof routine.id !== 'string' || typeof routine.name !== 'string') {
    return false
  }
  if (routine.schedule !== undefined && !isSchedule(routine.schedule)) {
    return false
  }
  return Array.isArray(routine.days) && routine.days.every(isRoutineDay)
}

export function normalizeRoutine(routine: Routine): Routine {
  return { ...routine, schedule: routine.schedule ?? {} }
}

export function normalizeSet(set: WorkoutSet): WorkoutSet {
  return { ...set, type: set.type ?? 'working' }
}

export function normalizeExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    unit: exercise.unit ?? 'kg',
    note: exercise.note?.trim() ? exercise.note : undefined,
    sets: exercise.sets.map(normalizeSet),
  }
}

export function normalizeWorkout(workout: Workout): Workout {
  return {
    ...workout,
    note: workout.note?.trim() ? workout.note : undefined,
    exercises: workout.exercises.map(normalizeExercise),
  }
}

export function isPersistedState(value: unknown): value is PersistedState {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  const activeWorkoutIsValid =
    data.activeWorkout === null || isWorkout(data.activeWorkout)
  const routinesAreValid =
    data.routines === undefined ||
    (Array.isArray(data.routines) && data.routines.every(isRoutine))
  return (
    activeWorkoutIsValid &&
    Array.isArray(data.sessions) &&
    data.sessions.every(isWorkout) &&
    routinesAreValid
  )
}
