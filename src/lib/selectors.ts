import { EXERCISE_LIBRARY } from './data'
import type {
  ConsistencyStats,
  ExerciseUnit,
  LibraryExercise,
  PRDetection,
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

/** Returns the ISO date string (YYYY-MM-DD) of the Monday starting the week containing `date`. */
function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/**
 * Computes consistency stats from finished sessions.
 *
 * Week streak logic:
 * - Collect the set of distinct Mon–Sun training weeks from finishedAt timestamps.
 * - Walking backward from the current week, count consecutive weeks that have at least one session.
 * - The current (ongoing) week does NOT break the streak even if it has no session yet.
 * - A fully elapsed past week with no session breaks the streak.
 */
export function computeConsistency(sessions: Workout[]): ConsistencyStats {
  const finished = sessions.filter((s) => s.finishedAt !== null)
  const totalSessions = finished.length

  if (finished.length === 0) {
    return {
      currentWeekStreak: 0,
      longestWeekStreak: 0,
      totalSessions: 0,
      lastTrainedAt: null,
      gapDays: null,
    }
  }

  // Sort finished sessions newest-first for gap calc
  const sorted = [...finished].sort((a, b) =>
    (b.finishedAt as string).localeCompare(a.finishedAt as string),
  )

  const lastTrainedAt = sorted[0].finishedAt as string
  const now = new Date()
  const lastDate = new Date(lastTrainedAt)
  const msPerDay = 1000 * 60 * 60 * 24
  const gapDays = Math.floor((now.getTime() - lastDate.getTime()) / msPerDay)

  // Build set of training week Mondays from all finished sessions
  const trainingWeeks = new Set<string>()
  for (const s of finished) {
    trainingWeeks.add(getMondayISO(new Date(s.finishedAt as string)))
  }

  // Count current streak: walk backward week by week from current week
  const currentWeekMonday = getMondayISO(now)
  let currentWeekStreak = 0
  let longestWeekStreak = 0
  let runLength = 0

  // Build a sorted list of all weeks that had training (newest-first)
  const allWeeks = Array.from(trainingWeeks).sort((a, b) => b.localeCompare(a))

  // Walk backward from the most recent trained week
  if (allWeeks.length === 0) {
    return { currentWeekStreak: 0, longestWeekStreak: 0, totalSessions, lastTrainedAt, gapDays }
  }

  // Determine starting week for streak count
  // If the most recent training week is the current week or last week, count from there.
  // Otherwise, streak is 0 (a full elapsed week was missed).
  const msPerWeek = msPerDay * 7
  const mostRecentWeek = allWeeks[0]
  const mostRecentWeekDate = new Date(mostRecentWeek + 'T00:00:00Z')
  const currentWeekDate = new Date(currentWeekMonday + 'T00:00:00Z')
  const weeksDiff = Math.round((currentWeekDate.getTime() - mostRecentWeekDate.getTime()) / msPerWeek)

  if (weeksDiff > 1) {
    // Most recent training was > 1 week ago — a full elapsed week was missed
    currentWeekStreak = 0
  } else {
    // Walk the sorted weeks backward, counting consecutive weeks
    let expectedWeekDate = mostRecentWeekDate
    for (const weekMonday of allWeeks) {
      const weekDate = new Date(weekMonday + 'T00:00:00Z')
      const diff = Math.round((expectedWeekDate.getTime() - weekDate.getTime()) / msPerWeek)
      if (diff === 0) {
        runLength += 1
        expectedWeekDate = new Date(weekDate.getTime() - msPerWeek)
      } else {
        break
      }
    }
    currentWeekStreak = runLength
  }

  // Compute longest streak across all time
  // Reset and do a full pass
  runLength = 0
  for (let i = 0; i < allWeeks.length; i++) {
    if (i === 0) {
      runLength = 1
    } else {
      const prev = new Date(allWeeks[i - 1] + 'T00:00:00Z')
      const cur = new Date(allWeeks[i] + 'T00:00:00Z')
      const diff = Math.round((prev.getTime() - cur.getTime()) / msPerWeek)
      if (diff === 1) {
        runLength += 1
      } else {
        runLength = 1
      }
    }
    if (runLength > longestWeekStreak) longestWeekStreak = runLength
  }

  return { currentWeekStreak, longestWeekStreak, totalSessions, lastTrainedAt, gapDays }
}

/**
 * Detects new personal records in `justFinished` compared to all prior finished sessions.
 * `sessions` should NOT include `justFinished` yet (pass the sessions array before prepending).
 * Only compares working sets. Bodyweight exercises compare reps; kg/plate compare weightKg.
 */
export function detectNewPRs(
  sessions: Workout[],
  justFinished: Workout,
): PRDetection[] {
  const results: PRDetection[] = []

  for (const exercise of justFinished.exercises) {
    let newBestSet: WorkoutSet | null = null
    for (const set of exercise.sets) {
      if (set.type !== 'working') continue
      if (
        !newBestSet ||
        set.weightKg > newBestSet.weightKg ||
        (set.weightKg === newBestSet.weightKg && set.reps > newBestSet.reps)
      ) {
        newBestSet = set
      }
    }
    if (!newBestSet) continue

    const previousBest = findPersonalBest(sessions, exercise.name, exercise.unit)

    const isNewPR =
      exercise.unit === 'bodyweight'
        ? !previousBest || newBestSet.reps > previousBest.reps
        : !previousBest || newBestSet.weightKg > previousBest.weightKg

    if (isNewPR) {
      results.push({
        exerciseName: exercise.name,
        unit: exercise.unit,
        newBest: { weightKg: newBestSet.weightKg, reps: newBestSet.reps },
        previousBest: previousBest
          ? { weightKg: previousBest.weightKg, reps: previousBest.reps }
          : null,
      })
    }
  }

  return results
}

export const MILESTONE_IDS = {
  FIRST_WORKOUT: 'first-workout',
  SESSIONS_10: 'sessions-10',
  SESSIONS_50: 'sessions-50',
  STREAK_4W: 'streak-4w',
  STREAK_8W: 'streak-8w',
  FIRST_PR: 'first-pr',
  COMEBACK_7D: 'comeback-7d',
} as const

export type MilestoneId = (typeof MILESTONE_IDS)[keyof typeof MILESTONE_IDS]

/**
 * Returns milestone IDs that newly apply and have not yet been seen.
 * `comeback-7d` is repeatable — it re-fires whenever gapDays >= 7 and a workout was just finished.
 * `newPRsCount` is the number of PRs detected in the just-finished workout.
 */
export function checkMilestones(
  stats: ConsistencyStats,
  seenMilestones: ReadonlySet<string>,
  newPRsCount: number,
): MilestoneId[] {
  const triggered: MilestoneId[] = []

  if (stats.totalSessions === 1 && !seenMilestones.has(MILESTONE_IDS.FIRST_WORKOUT)) {
    triggered.push(MILESTONE_IDS.FIRST_WORKOUT)
  }
  if (stats.totalSessions >= 10 && !seenMilestones.has(MILESTONE_IDS.SESSIONS_10)) {
    triggered.push(MILESTONE_IDS.SESSIONS_10)
  }
  if (stats.totalSessions >= 50 && !seenMilestones.has(MILESTONE_IDS.SESSIONS_50)) {
    triggered.push(MILESTONE_IDS.SESSIONS_50)
  }
  if (stats.currentWeekStreak >= 4 && !seenMilestones.has(MILESTONE_IDS.STREAK_4W)) {
    triggered.push(MILESTONE_IDS.STREAK_4W)
  }
  if (stats.currentWeekStreak >= 8 && !seenMilestones.has(MILESTONE_IDS.STREAK_8W)) {
    triggered.push(MILESTONE_IDS.STREAK_8W)
  }
  if (newPRsCount > 0 && !seenMilestones.has(MILESTONE_IDS.FIRST_PR)) {
    triggered.push(MILESTONE_IDS.FIRST_PR)
  }
  // comeback-7d is repeatable: only check seenMilestones for the current "batch"
  // The caller clears this from seen after each session completes.
  if (stats.gapDays !== null && stats.gapDays >= 7 && !seenMilestones.has(MILESTONE_IDS.COMEBACK_7D)) {
    triggered.push(MILESTONE_IDS.COMEBACK_7D)
  }

  return triggered
}
