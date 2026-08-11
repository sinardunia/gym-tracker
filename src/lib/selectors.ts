import { EXERCISE_LIBRARY } from './data'
import type {
  ExerciseUnit,
  LibraryExercise,
  Routine,
  RoutineDay,
  Weekday,
  Workout,
  WorkoutSet,
} from './types'

export function findLastSessionSet(
  sessions: Workout[],
  exerciseName: string,
): { reps: number; weightKg: number; unit: ExerciseUnit } | null {
  const name = exerciseName.trim().toLowerCase()
  for (const session of sessions) {
    let lastSet: WorkoutSet | undefined
    let lastUnit: ExerciseUnit = 'kg'
    for (const exercise of session.exercises) {
      if (exercise.name.trim().toLowerCase() === name) {
        const workingSets = exercise.sets.filter((set) => set.type === 'working')
        const lastWorking = workingSets[workingSets.length - 1]
        if (lastWorking) {
          lastSet = lastWorking
          lastUnit = exercise.unit
        }
      }
    }
    if (lastSet) return { reps: lastSet.reps, weightKg: lastSet.weightKg, unit: lastUnit }
  }
  return null
}

export function findPreviousExercise(
  sessions: Workout[],
  exerciseName: string,
): { finishedAt: string; sets: WorkoutSet[]; unit: ExerciseUnit } | null {
  const name = exerciseName.trim().toLowerCase()
  for (const session of sessions) {
    if (session.finishedAt === null) continue
    for (const exercise of session.exercises) {
      if (exercise.name.trim().toLowerCase() !== name) continue
      if (exercise.sets.length === 0) continue
      return {
        finishedAt: session.finishedAt,
        sets: exercise.sets,
        unit: exercise.unit,
      }
    }
  }
  return null
}

export function findPersonalBest(
  sessions: Workout[],
  exerciseName: string,
  unit: ExerciseUnit,
): { weightKg: number; reps: number } | null {
  const name = exerciseName.trim().toLowerCase()
  let best: { weightKg: number; reps: number } | null = null
  for (const session of sessions) {
    if (session.finishedAt === null) continue
    for (const exercise of session.exercises) {
      if (exercise.unit !== unit) continue
      if (exercise.name.trim().toLowerCase() !== name) continue
      for (const set of exercise.sets) {
        if (set.type !== 'working') continue
        if (
          !best ||
          set.weightKg > best.weightKg ||
          (set.weightKg === best.weightKg && set.reps > best.reps)
        ) {
          best = { weightKg: set.weightKg, reps: set.reps }
        }
      }
    }
  }
  return best
}

export type RecommendationResult = {
  recommended: { routine: Routine; day: RoutineDay } | null
  calendarScheduled: { routine: Routine; day: RoutineDay } | null
  isSequenceMismatch: boolean
}

export function getRecommendedWorkout(
  routines: Routine[],
  sessions: Workout[],
): RecommendationResult {
  if (routines.length === 0) {
    return { recommended: null, calendarScheduled: null, isSequenceMismatch: false }
  }

  const todayCalendar = findTodayWorkout(routines)
  const primaryRoutine = routines[0]
  if (!primaryRoutine || primaryRoutine.days.length === 0) {
    return {
      recommended: todayCalendar,
      calendarScheduled: todayCalendar,
      isSequenceMismatch: false,
    }
  }

  // Find the last completed session that matched a routine day
  const finishedSessions = sessions.filter((s) => s.finishedAt !== null)
  let lastDayIndex = -1

  for (const session of finishedSessions) {
    if (session.routineId === primaryRoutine.id && session.dayId) {
      const idx = primaryRoutine.days.findIndex((d) => d.id === session.dayId)
      if (idx !== -1) {
        lastDayIndex = idx
        break
      }
    }
    // Fallback: match by day name or exercise overlap if dayId wasn't stored
    if (lastDayIndex === -1 && session.exercises.length > 0) {
      const sessionExNames = new Set(session.exercises.map((e) => e.name.toLowerCase()))
      const matchedIdx = primaryRoutine.days.findIndex((d) =>
        d.exerciseNames.some((name) => sessionExNames.has(name.toLowerCase())),
      )
      if (matchedIdx !== -1) {
        lastDayIndex = matchedIdx
        break
      }
    }
  }

  const nextIndex = (lastDayIndex + 1) % primaryRoutine.days.length
  const recommendedDay = primaryRoutine.days[nextIndex]
  const recommended = { routine: primaryRoutine, day: recommendedDay }

  const isSequenceMismatch = Boolean(
    todayCalendar &&
      (todayCalendar.routine.id !== recommended.routine.id ||
        todayCalendar.day.id !== recommended.day.id),
  )

  return {
    recommended,
    calendarScheduled: todayCalendar,
    isSequenceMismatch,
  }
}

export function findTodayWorkout(
  routines: Routine[],
): { routine: Routine; day: RoutineDay } | null {
  const today = new Date().getDay() as Weekday
  for (const routine of routines) {
    const dayId = routine.schedule[today]
    if (!dayId) continue
    const day = routine.days.find((d) => d.id === dayId)
    if (day) return { routine, day }
  }
  return null
}

/**
 * The next scheduled workout after today, scanning from tomorrow forward for a
 * full week. Returns null when no routine has any scheduled day in that window.
 */
export function findNextScheduledWorkout(
  routines: Routine[],
): { routine: Routine; day: RoutineDay; weekday: Weekday } | null {
  const today = new Date().getDay() as Weekday
  for (let offset = 1; offset <= 7; offset += 1) {
    const weekday = ((today + offset) % 7) as Weekday
    for (const routine of routines) {
      const dayId = routine.schedule[weekday]
      if (!dayId) continue
      const day = routine.days.find((d) => d.id === dayId)
      if (day) return { routine, day, weekday }
    }
  }
  return null
}

export function findLibraryMatches(query: string): LibraryExercise[] {
  if (!query) return []
  return EXERCISE_LIBRARY.filter((exercise) =>
    [exercise.name, ...exercise.aliases].some((alias) =>
      alias.toLowerCase().includes(query),
    ),
  )
}

/** Distinct exercise names from the most recent finished sessions, newest first. */
export function recentExerciseNames(
  sessions: Workout[],
  limit = 8,
): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (const session of sessions) {
    if (session.finishedAt === null) continue
    for (const exercise of session.exercises) {
      const key = exercise.name.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      names.push(exercise.name)
      if (names.length >= limit) return names
    }
  }
  return names
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

/**
 * Suggested weight for the next dropset step, relative to the set it drops from.
 * kg → ~85% rounded to the nearest 2.5, at least one step lighter than the parent.
 * plate → one plate lighter. bodyweight → null (drops don't apply).
 */
export function suggestDrop(parent: WorkoutSet, unit: ExerciseUnit): number | null {
  if (unit === 'bodyweight') return null
  if (unit === 'plate') return Math.max(0, parent.weightKg - 1)
  const rounded = roundToStep(parent.weightKg * 0.85, 2.5)
  const maxLighter = Math.max(0, parent.weightKg - 2.5)
  return Math.min(rounded, maxLighter)
}

/** A working set (or standalone set) plus the dropset steps grouped under it. */
export type SetRow = { set: WorkoutSet; drops: WorkoutSet[] }

/**
 * Groups a flat set list into rows: a dropset carrying `parentId` is collected
 * under the immediately preceding row when that row's set is its parent.
 * Dropsets without a matching parent (legacy data) become standalone rows.
 */
export function groupSetRows(sets: WorkoutSet[]): SetRow[] {
  const rows: SetRow[] = []
  for (const s of sets) {
    if (s.type === 'dropset' && s.parentId) {
      const last = rows[rows.length - 1]
      if (last && last.set.id === s.parentId) {
        last.drops.push(s)
        continue
      }
    }
    rows.push({ set: s, drops: [] })
  }
  return rows
}

/** The nearest working set scanning from the end of the list. */
export function nearestWorkingParent(sets: WorkoutSet[]): WorkoutSet | null {
  for (let i = sets.length - 1; i >= 0; i--) {
    if (sets[i].type === 'working') return sets[i]
  }
  return null
}

/**
 * Context for the "Drop" action: the working set that anchors the sequence and
 * the set to base the next drop suggestion on (the last set when it is a working
 * set or a drop, otherwise the anchor itself).
 */
export function dropContext(
  sets: WorkoutSet[],
): { parentId: string; base: WorkoutSet } | null {
  const parent = nearestWorkingParent(sets)
  if (!parent) return null
  const last = sets[sets.length - 1]
  const base =
    last && (last.type === 'working' || last.type === 'dropset') ? last : parent
  return { parentId: parent.id, base }
}

/**
 * Progressive-overload target (reps-only MVP): "match your last top working set's
 * weight, beat the rep count by one."
 *
 * Reference = the best working set (highest weight, tie-break highest reps) of the
 * most recent finished session containing the exercise. Returns null when there is
 * no such reference or the session has no working sets.
 */
export function overloadTarget(
  exerciseName: string,
  sessions: Workout[],
): { weightKg: number; reps: number; targetReps: number; unit: ExerciseUnit } | null {
  const prev = findPreviousExercise(sessions, exerciseName)
  if (!prev) return null
  let best: WorkoutSet | null = null
  for (const set of prev.sets) {
    if (set.type !== 'working') continue
    if (
      !best ||
      set.weightKg > best.weightKg ||
      (set.weightKg === best.weightKg && set.reps > best.reps)
    ) {
      best = set
    }
  }
  if (!best) return null
  return {
    weightKg: best.weightKg,
    reps: best.reps,
    targetReps: best.reps + 1,
    unit: prev.unit,
  }
}

/** One session's best working set for an exercise. */
export type ExerciseHistoryEntry = {
  finishedAt: string
  name: string
  unit: ExerciseUnit
  best: WorkoutSet
}

/** A single exercise's timeline across finished sessions, oldest first. */
export type ExerciseHistory = {
  name: string
  entries: ExerciseHistoryEntry[]
  best: { weightKg: number; reps: number; unit: ExerciseUnit } | null
}

/**
 * Aggregates finished sessions into per-exercise timelines of the best working
 * set each session. Exercises are grouped by lowercased name (a rename breaks
 * the link — a documented limitation). The exercise list is sorted by most
 * recent activity.
 */
export function exerciseHistory(sessions: Workout[]): ExerciseHistory[] {
  const byKey = new Map<string, ExerciseHistoryEntry[]>()
  const displayNames = new Map<string, string>()
  for (const session of sessions) {
    if (session.finishedAt === null) continue
    for (const exercise of session.exercises) {
      let best: WorkoutSet | null = null
      for (const set of exercise.sets) {
        if (set.type !== 'working') continue
        if (
          !best ||
          set.weightKg > best.weightKg ||
          (set.weightKg === best.weightKg && set.reps > best.reps)
        ) {
          best = set
        }
      }
      if (!best) continue
      const key = exercise.name.trim().toLowerCase()
      if (!byKey.has(key)) displayNames.set(key, exercise.name)
      const list = byKey.get(key) ?? []
      list.push({
        finishedAt: session.finishedAt,
        name: exercise.name,
        unit: exercise.unit,
        best,
      })
      byKey.set(key, list)
    }
  }

  const result: ExerciseHistory[] = []
  for (const [key, entries] of byKey) {
    entries.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    let bestEntry: ExerciseHistoryEntry | null = null
    for (const entry of entries) {
      if (
        !bestEntry ||
        entry.best.weightKg > bestEntry.best.weightKg ||
        (entry.best.weightKg === bestEntry.best.weightKg &&
          entry.best.reps > bestEntry.best.reps)
      ) {
        bestEntry = entry
      }
    }
    result.push({
      name: displayNames.get(key) ?? key,
      entries,
      best: bestEntry
        ? {
            weightKg: bestEntry.best.weightKg,
            reps: bestEntry.best.reps,
            unit: bestEntry.unit,
          }
        : null,
    })
  }
  result.sort(
    (a, b) =>
      b.entries[b.entries.length - 1].finishedAt.localeCompare(
        a.entries[a.entries.length - 1].finishedAt,
      ),
  )
  return result
}
