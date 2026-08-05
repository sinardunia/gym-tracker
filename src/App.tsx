import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'

type IconName =
  | 'trash'
  | 'pencil'
  | 'repeat'
  | 'chevron-down'
  | 'chevron-up'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'plus'

const ICON_PATHS: Record<IconName, string[]> = {
  trash: [
    'M3 6h18',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M10 11v6',
    'M14 11v6',
  ],
  pencil: ['M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'],
  repeat: [
    'm17 1 4 4-4 4',
    'M3 11V9a4 4 0 0 1 4-4h14',
    'm7 23-4-4 4-4',
    'M21 13v2a4 4 0 0 1-4 4H3',
  ],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-up': ['m18 15-6-6-6 6'],
  'arrow-up': ['M12 19V5', 'm5 12 7-7 7 7'],
  'arrow-down': ['M12 5v14', 'm19 12-7 7-7-7'],
  'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7'],
  plus: ['M5 12h14', 'M12 5v14'],
}

function Icon({
  name,
  size = 18,
}: {
  name: IconName
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

type SetType = 'working' | 'warmup' | 'dropset'
type ExerciseUnit = 'kg' | 'plate' | 'bodyweight'

const SET_TYPES: readonly SetType[] = ['working', 'warmup', 'dropset']

const SET_TYPE_LABELS: Record<SetType, string> = {
  working: 'Working',
  warmup: 'Warmup',
  dropset: 'Dropset',
}

type WorkoutSet = {
  id: string
  reps: number
  weightKg: number
  type: SetType
}

type Exercise = {
  id: string
  name: string
  sets: WorkoutSet[]
  unit: ExerciseUnit
  note?: string
}

type Workout = {
  id: string
  startedAt: string
  finishedAt: string | null
  exercises: Exercise[]
  note?: string
}

type RoutineDay = {
  id: string
  name: string
  exerciseNames: string[]
}

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

type Routine = {
  id: string
  name: string
  days: RoutineDay[]
  schedule: Partial<Record<Weekday, string>>
}

type ScheduleConflict = {
  routineName: string
  dayName: string
}

type PersistedState = {
  activeWorkout: Workout | null
  sessions: Workout[]
  routines: Routine[]
}

type BackupMessage = {
  kind: 'error' | 'info'
  text: string
}

const STORAGE_KEY = 'gym-tracker.state.v2'
const STORAGE_KEY_V1 = 'gym-tracker.state.v1'

type LibraryExercise = {
  name: string
  aliases: string[]
}

const EXERCISE_LIBRARY: LibraryExercise[] = [
  { name: 'Bench Press', aliases: ['barbell bench', 'bench'] },
  { name: 'Incline Bench Press', aliases: ['incline bench'] },
  { name: 'Dumbbell Bench Press', aliases: ['db bench'] },
  { name: 'Chest Press Machine', aliases: ['machine press'] },
  { name: 'Chest Fly', aliases: ['pec fly', 'pec deck', 'dumbbell fly'] },
  { name: 'Push-Up', aliases: ['pushup', 'press up'] },
  { name: 'Dips', aliases: ['chest dip', 'tricep dip'] },
  { name: 'Pull-Up', aliases: ['pullup', 'chin-up', 'chin up'] },
  { name: 'Lat Pulldown', aliases: ['lat pull down', 'pulldown'] },
  { name: 'Seated Cable Row', aliases: ['cable row', 'seated row'] },
  { name: 'Barbell Row', aliases: ['bent over row', 'barbell bent over row'] },
  { name: 'Dumbbell Row', aliases: ['db row', 'one arm row'] },
  { name: 'T-Bar Row', aliases: [] },
  { name: 'Face Pull', aliases: ['rear delt face pull'] },
  { name: 'Rear Delt Fly', aliases: ['reverse fly', 'reverse pec deck'] },
  { name: 'Squat', aliases: ['barbell squat', 'back squat'] },
  { name: 'Front Squat', aliases: [] },
  { name: 'Leg Press', aliases: ['leg press machine'] },
  { name: 'Leg Extension', aliases: ['quad extension'] },
  { name: 'Leg Curl', aliases: ['hamstring curl', 'lying leg curl', 'seated leg curl'] },
  { name: 'Romanian Deadlift', aliases: ['rdl', 'romanian deadlift'] },
  { name: 'Deadlift', aliases: ['conventional deadlift'] },
  { name: 'Lunge', aliases: ['walking lunge', 'reverse lunge'] },
  { name: 'Bulgarian Split Squat', aliases: ['split squat'] },
  { name: 'Hip Thrust', aliases: ['glute bridge', 'barbell hip thrust'] },
  { name: 'Calf Raise', aliases: ['standing calf raise', 'seated calf raise'] },
  { name: 'Overhead Press', aliases: ['ohp', 'military press', 'shoulder press'] },
  { name: 'Dumbbell Shoulder Press', aliases: ['db press', 'seated shoulder press'] },
  { name: 'Lateral Raise', aliases: ['side raise', 'side lateral raise'] },
  { name: 'Front Raise', aliases: [] },
  { name: 'Shrug', aliases: ['dumbbell shrug', 'barbell shrug'] },
  { name: 'Bicep Curl', aliases: ['barbell curl', 'dumbbell curl'] },
  { name: 'Hammer Curl', aliases: [] },
  { name: 'Preacher Curl', aliases: [] },
  { name: 'Tricep Pushdown', aliases: ['cable pushdown', 'pushdown'] },
  { name: 'Skull Crusher', aliases: ['lying tricep extension'] },
  { name: 'Overhead Tricep Extension', aliases: ['tricep extension'] },
  { name: 'Kettlebell Swing', aliases: ['kb swing'] },
  { name: 'Good Morning', aliases: [] },
  { name: 'Back Extension', aliases: ['hyperextension'] },
  { name: 'Crunch', aliases: ['sit up', 'situp'] },
  { name: 'Plank', aliases: ['front plank'] },
  { name: 'Hanging Leg Raise', aliases: ['leg raise', 'hanging knee raise'] },
  { name: 'Russian Twist', aliases: [] },
  { name: 'Cable Crunch', aliases: ['kneeling crunch'] },
  { name: 'Burpee', aliases: [] },
  { name: 'Mountain Climber', aliases: [] },
  { name: 'Step-Up', aliases: [] },
  { name: "Farmer's Carry", aliases: ['farmer walk'] },
  { name: 'Pullover', aliases: ['dumbbell pullover'] },
]

function findLibraryMatches(query: string): LibraryExercise[] {
  if (!query) return []
  return EXERCISE_LIBRARY.filter((exercise) =>
    [exercise.name, ...exercise.aliases].some((alias) =>
      alias.toLowerCase().includes(query),
    ),
  )
}

const EMPTY_STATE: PersistedState = {
  activeWorkout: null,
  sessions: [],
  routines: [],
}

const newId = (): string => crypto.randomUUID()

function createWorkout(): Workout {
  return {
    id: newId(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: [],
  }
}

function isSetType(value: unknown): value is SetType {
  return value === 'working' || value === 'warmup' || value === 'dropset'
}

function isExerciseUnit(value: unknown): value is ExerciseUnit {
  return value === 'kg' || value === 'plate' || value === 'bodyweight'
}

function isWorkout(value: unknown): value is Workout {
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
        (setEntry.type === undefined || isSetType(setEntry.type))
      )
    })
  })
}

function isRoutineDay(value: unknown): value is RoutineDay {
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

function isSchedule(
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

function isRoutine(value: unknown): value is Routine {
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

function normalizeRoutine(routine: Routine): Routine {
  return { ...routine, schedule: routine.schedule ?? {} }
}

function normalizeSet(set: WorkoutSet): WorkoutSet {
  return { ...set, type: set.type ?? 'working' }
}

function normalizeExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    unit: exercise.unit ?? 'kg',
    note: exercise.note?.trim() ? exercise.note : undefined,
    sets: exercise.sets.map(normalizeSet),
  }
}

function normalizeWorkout(workout: Workout): Workout {
  return {
    ...workout,
    note: workout.note?.trim() ? workout.note : undefined,
    exercises: workout.exercises.map(normalizeExercise),
  }
}

function isPersistedState(value: unknown): value is PersistedState {
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

function deriveRecentExercises(state: PersistedState): string[] {
  const seen = new Set<string>()
  const recent: string[] = []

  function add(name: string) {
    const key = name.trim().toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    recent.push(name.trim())
  }

  state.activeWorkout?.exercises.forEach((e) => add(e.name))
  state.sessions.forEach((session) => {
    session.exercises.forEach((e) => add(e.name))
  })

  return recent
}

function findLastSessionSet(
  sessions: Workout[],
  exerciseName: string,
): { reps: number; weightKg: number } | null {
  const name = exerciseName.trim().toLowerCase()
  for (const session of sessions) {
    let lastSet: WorkoutSet | undefined
    for (const exercise of session.exercises) {
      if (exercise.name.trim().toLowerCase() === name) {
        const workingSets = exercise.sets.filter((set) => set.type === 'working')
        const lastWorking = workingSets[workingSets.length - 1]
        if (lastWorking) lastSet = lastWorking
      }
    }
    if (lastSet) return { reps: lastSet.reps, weightKg: lastSet.weightKg }
  }
  return null
}

function findTodayWorkout(
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

function parseBackup(text: string): PersistedState | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (!isPersistedState(parsed)) return null
    return {
      ...parsed,
      activeWorkout: parsed.activeWorkout
        ? normalizeWorkout(parsed.activeWorkout)
        : null,
      sessions: parsed.sessions.map(normalizeWorkout),
      routines: (parsed.routines ?? []).map(normalizeRoutine),
    }
  } catch {
    return null
  }
}

function loadState(): PersistedState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY_V1)
    if (!raw) return EMPTY_STATE
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_STATE
    const data = parsed as Record<string, unknown>
    const activeWorkout = isWorkout(data.activeWorkout)
      ? normalizeWorkout(data.activeWorkout)
      : null
    const sessions = Array.isArray(data.sessions)
      ? data.sessions.filter(isWorkout).map(normalizeWorkout)
      : []
    const routines = Array.isArray(data.routines)
      ? data.routines.filter(isRoutine).map(normalizeRoutine)
      : []
    return { activeWorkout, sessions, routines }
  } catch {
    return EMPTY_STATE
  }
}

function App() {
  const [state, setState] = useState<PersistedState>(loadState)
  const [viewedSession, setViewedSession] = useState<Workout | null>(null)
  const [routinesOpen, setRoutinesOpen] = useState(false)
  const [workoutPaused, setWorkoutPaused] = useState(false)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  )

  const activeWorkout = state.activeWorkout
  const recentExercises = deriveRecentExercises(state)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage unavailable; keep working in memory.
    }
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
  }

  function finishWorkout() {
    if (!activeWorkout) return
    const finished: Workout = {
      ...activeWorkout,
      finishedAt: new Date().toISOString(),
    }
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
                      sets: [...e.sets, { id: newId(), reps, weightKg, type }],
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
            activeWorkout: { ...s.activeWorkout, note },
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
                e.id === exerciseId ? { ...e, note } : e,
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
        { id: newId(), name: 'New routine', days: [], schedule: {} },
      ],
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
                { id: newId(), name: 'New day', exerciseNames: [] },
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
        onRemoveExercise={removeExercise}
        onRenameExercise={renameExercise}
        onChangeUnit={changeExerciseUnit}
        onUpdateWorkoutNote={updateWorkoutNote}
        onUpdateExerciseNote={updateExerciseNote}
        onExit={() => setWorkoutPaused(true)}
        onDiscard={discardWorkout}
        onFinish={finishWorkout}
        recentExercises={recentExercises}
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
      backupState={state}
      onImportBackup={importBackup}
    />
  )
}

function HomeScreen({
  sessions,
  routines,
  activeWorkout,
  onResumeWorkout,
  onStart,
  onStartWithExercises,
  onViewSession,
  onOpenRoutines,
  backupState,
  onImportBackup,
}: {
  sessions: Workout[]
  routines: Routine[]
  activeWorkout: Workout | null
  onResumeWorkout: () => void
  onStart: () => void
  onStartWithExercises: (exerciseNames: string[]) => void
  onViewSession: (session: Workout) => void
  onOpenRoutines: () => void
  backupState: PersistedState
  onImportBackup: (state: PersistedState) => void
}) {
  const [pickingRoutine, setPickingRoutine] = useState(false)
  const [pickedRoutineId, setPickedRoutineId] = useState<string | null>(null)
  const today = findTodayWorkout(routines)

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Gym Tracker</h1>
        <p className="muted">Log your workout, one exercise and set at a time.</p>
      </header>

      {activeWorkout && (
        <section className="card resume-card">
          <h2>Workout in progress</h2>
          <p className="muted">
            Started at {formatTime(activeWorkout.startedAt)}
          </p>
          <button type="button" className="primary" onClick={onResumeWorkout}>
            Resume workout
          </button>
        </section>
      )}

      <section className="card today-card">
        <h2>Today's workout</h2>
        {today ? (
          <>
            <h3>{today.day.name}</h3>
            <p className="muted exercise-summary">{today.routine.name}</p>
            {today.day.exerciseNames.length === 0 ? (
              <p className="muted">This day has no exercises yet.</p>
            ) : (
              <ul className="today-exercises">
                {today.day.exerciseNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="primary"
              onClick={() => onStartWithExercises(today.day.exerciseNames)}
            >
              Start workout
            </button>
            <button type="button" className="secondary" onClick={onStart}>
              Start empty workout
            </button>
          </>
        ) : (
          <>
            <p className="muted">No workout scheduled today.</p>
            <div className="backup-actions">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setPickingRoutine(true)
                  setPickedRoutineId(null)
                }}
              >
                Pick a routine
              </button>
              <button type="button" className="secondary" onClick={onStart}>
                Start empty workout
              </button>
            </div>
          </>
        )}
      </section>

      {pickingRoutine && (
        <section className="card">
          <h3>Pick a routine</h3>
          {routines.length === 0 ? (
            <p className="muted">
              No routines yet. Create one in Routines first.
            </p>
          ) : (
            <ul className="days">
              {routines.map((routine) => (
                <li key={routine.id} className="day">
                  <button
                    type="button"
                    className="day-toggle"
                    onClick={() =>
                      setPickedRoutineId((cur) =>
                        cur === routine.id ? null : routine.id,
                      )
                    }
                  >
                    <span>{routine.name}</span>
                    <span className="muted">
                      {routine.days.length}{' '}
                      {routine.days.length === 1 ? 'day' : 'days'}
                    </span>
                  </button>
                  {pickedRoutineId === routine.id && (
                    <div className="day-body">
                      {routine.days.length === 0 ? (
                        <p className="muted">No days in this routine.</p>
                      ) : (
                        routine.days.map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            className="day-toggle pick-day"
                            onClick={() => {
                              onStartWithExercises(day.exerciseNames)
                              setPickingRoutine(false)
                              setPickedRoutineId(null)
                            }}
                          >
                            <span>{day.name}</span>
                            <span className="muted">
                              {day.exerciseNames.length}{' '}
                              {day.exerciseNames.length === 1
                                ? 'exercise'
                                : 'exercises'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <button
        type="button"
        className="secondary"
        onClick={onOpenRoutines}
      >
        Routines
      </button>

      <section className="recent">
        <h2>Recent sessions</h2>
        {sessions.length === 0 ? (
          <p className="muted">No completed sessions yet.</p>
        ) : (
          <ul className="session-list">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className="session-item"
                  onClick={() => onViewSession(session)}
                >
                  <span>{formatDate(session.startedAt)}</span>
                  <span className="muted">
                    {session.exercises.length} exercises ·{' '}
                    {countSets(session)} sets
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BackupControls state={backupState} onImport={onImportBackup} />
    </main>
  )
}

function WorkoutScreen({
  workout,
  onAddExercise,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onRenameExercise,
  onChangeUnit,
  onUpdateWorkoutNote,
  onUpdateExerciseNote,
  onExit,
  onDiscard,
  onFinish,
  recentExercises,
  sessions,
  collapsedExerciseIds,
  onToggleCollapsed,
}: {
  workout: Workout
  onAddExercise: (name: string) => void
  onAddSet: (
    exerciseId: string,
    reps: number,
    weightKg: number,
    type: SetType,
  ) => void
  onRemoveSet: (exerciseId: string, setId: string) => void
  onRemoveExercise: (exerciseId: string) => void
  onRenameExercise: (exerciseId: string, name: string) => void
  onChangeUnit: (exerciseId: string, unit: ExerciseUnit) => void
  onUpdateWorkoutNote: (note: string) => void
  onUpdateExerciseNote: (exerciseId: string, note: string) => void
  onExit: () => void
  onDiscard: () => void
  onFinish: () => void
  recentExercises: string[]
  sessions: Workout[]
  collapsedExerciseIds: Set<string>
  onToggleCollapsed: (exerciseId: string) => void
}) {
  const [confirmingExit, setConfirmingExit] = useState(false)
  const hasSet = workout.exercises.some((e) => e.sets.length > 0)
  const canFinish = workout.exercises.length > 0 && hasSet

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Workout</h1>
        <p className="muted">Started at {formatTime(workout.startedAt)}</p>
      </header>

      <NoteField
        value={workout.note ?? ''}
        onChange={onUpdateWorkoutNote}
        placeholder="Workout notes… (e.g. felt strong on bench)"
      />

      <div className="workout-actions">
        <div className="workout-actions-row">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setConfirmingExit(true)}
            aria-label="Back to home"
          >
            <Icon name="arrow-left" />
          </button>
          <button
            type="button"
            className="positive finish"
            onClick={onFinish}
            disabled={!canFinish}
          >
            Finish workout
          </button>
        </div>
        <RestTimer />
      </div>
      {!canFinish && (
        <p className="error hint">
          Add at least one exercise with a set to finish the workout.
        </p>
      )}

      {confirmingExit && (
        <div className="confirm-dialog" role="dialog" aria-modal="true">
          <div className="confirm-card">
            <h3>Exit workout?</h3>
            <p className="muted">
              Your progress is saved. Go home and resume anytime, or discard
              the workout.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setConfirmingExit(false)
                  onExit()
                }}
              >
                Go home
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setConfirmingExit(false)
                  onDiscard()
                }}
              >
                Discard workout
              </button>
            </div>
          </div>
        </div>
      )}

      {workout.exercises.length === 0 ? (
        <p className="muted empty">No exercises yet. Add your first one below.</p>
      ) : (
        workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onAddSet={(reps, weightKg, type) =>
              onAddSet(exercise.id, reps, weightKg, type)
            }
            onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
            onRemove={() => onRemoveExercise(exercise.id)}
            onRename={(name) => onRenameExercise(exercise.id, name)}
            onChangeUnit={(unit) => onChangeUnit(exercise.id, unit)}
            onUpdateNote={(note) => onUpdateExerciseNote(exercise.id, note)}
            sessions={sessions}
            collapsed={collapsedExerciseIds.has(exercise.id)}
            onToggleCollapsed={() => onToggleCollapsed(exercise.id)}
          />
        ))
      )}

      <AddExerciseForm onAdd={onAddExercise} recentExercises={recentExercises} />
    </main>
  )
}

const REST_PRESETS = [60, 90, 120]

function NoteField({
  value,
  onChange,
  placeholder,
  compact,
}: {
  value: string
  onChange: (note: string) => void
  placeholder: string
  compact?: boolean
}) {
  return (
    <textarea
      className={`note-field${compact ? ' compact' : ''}`}
      value={value}
      placeholder={placeholder}
      rows={compact ? 1 : 2}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function RestTimer() {
  const [duration, setDuration] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('2')
  const [doneFlash, setDoneFlash] = useState(false)
  const endAtRef = useRef(0)
  const audioRef = useRef<AudioContext | null>(null)
  const flashTimersRef = useRef<Set<number>>(new Set())

  useEffect(
    () => () => {
      for (const id of flashTimersRef.current) clearTimeout(id)
    },
    [],
  )

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      const left = Math.max(
        0,
        Math.round((endAtRef.current - Date.now()) / 1000),
      )
      setRemaining(left)
      if (left <= 0) {
        setRunning(false)
        setDoneFlash(true)
        playDoneBeep()
        navigator.vibrate?.([200, 100, 200, 100, 200])
        const flashTimer = setTimeout(() => setDoneFlash(false), 3000)
        flashTimersRef.current.add(flashTimer)
      }
    }, 250)
    return () => clearInterval(timer)
  }, [running])

  function warmAudio() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      if (audioRef.current.state === 'suspended') {
        void audioRef.current.resume()
      }
    } catch {
      // Audio unavailable.
    }
  }

  function playDoneBeep() {
    const ctx = audioRef.current
    if (!ctx) return
    try {
      const now = ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, now + i * 0.25)
        gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.25 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.25 + 0.2)
        osc.start(now + i * 0.25)
        osc.stop(now + i * 0.25 + 0.22)
      }
    } catch {
      // Audio unavailable; vibration/visual still work.
    }
  }

  function start(seconds: number) {
    warmAudio()
    setDuration(seconds)
    setRemaining(seconds)
    endAtRef.current = Date.now() + seconds * 1000
    setRunning(true)
    setDoneFlash(false)
  }

  function startCustom() {
    const minutes = Number(customMinutes)
    const seconds = Math.max(5, Math.round((Number.isFinite(minutes) ? minutes : 0) * 60))
    start(seconds)
  }

  function reset() {
    setRunning(false)
    setRemaining(duration)
    setDoneFlash(false)
  }

  const progress = duration > 0 ? (remaining / duration) * 100 : 0

  return (
    <div className={`rest-timer${doneFlash ? ' done' : ''}`}>
      {running ? (
        <>
          <span className="timer-display" role="timer">
            {formatTimer(remaining)}
          </span>
          <div className="timer-progress" aria-hidden="true">
            <div style={{ width: `${progress}%` }} />
          </div>
          <button type="button" className="btn-sm secondary" onClick={reset}>
            Reset
          </button>
        </>
      ) : (
        <>
          <span className="timer-label">Rest</span>
          {REST_PRESETS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={`timer-chip${duration === seconds ? ' active' : ''}`}
              onClick={() => start(seconds)}
            >
              {formatTimer(seconds)}
            </button>
          ))}
          <input
            type="number"
            min={0.1}
            step={0.5}
            inputMode="decimal"
            className="timer-custom"
            value={customMinutes}
            aria-label="Custom rest minutes"
            onChange={(e) => setCustomMinutes(e.target.value)}
          />
          <button type="button" className="btn-sm primary" onClick={startCustom}>
            Start
          </button>
        </>
      )}
      {doneFlash && <span className="timer-done-msg">Time's up!</span>}
    </div>
  )
}

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function BackupControls({
  state,
  onImport,
}: {
  state: PersistedState
  onImport: (state: PersistedState) => void
}) {
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null)
  const [message, setMessage] = useState<BackupMessage | null>(null)

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'info', text: 'Backup downloaded.' })
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const backup = parseBackup(await file.text())
    if (!backup) {
      setPendingImport(null)
      setMessage({
        kind: 'error',
        text: 'Backup file is invalid. Existing data was not changed.',
      })
      return
    }

    setPendingImport(backup)
    setMessage(null)
  }

  function confirmImport() {
    if (!pendingImport) return
    onImport(pendingImport)
    setPendingImport(null)
    setMessage({ kind: 'info', text: 'Backup imported.' })
  }

  return (
    <section className="card backup">
      <h2>Backup</h2>
      <p className="muted">Export or restore all local Gym Tracker data.</p>
      <div className="backup-actions">
        <button type="button" className="secondary" onClick={handleExport}>
          Export JSON
        </button>
        <label className="file-button">
          Import JSON
          <input type="file" accept="application/json,.json" onChange={handleImportFile} />
        </label>
      </div>

      {pendingImport && (
        <div className="import-confirm">
          <p>
            Importing this backup will replace all current local data, including
            any active workout and recent sessions.
          </p>
          <div className="backup-actions">
            <button type="button" className="danger" onClick={confirmImport}>
              Confirm import
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setPendingImport(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={message.kind === 'error' ? 'error' : 'muted'}>
          {message.text}
        </p>
      )}
    </section>
  )
}

function ExerciseCard({
  exercise,
  onAddSet,
  onRemoveSet,
  onRemove,
  onRename,
  onChangeUnit,
  onUpdateNote,
  sessions,
  collapsed,
  onToggleCollapsed,
}: {
  exercise: Exercise
  onAddSet: (reps: number, weightKg: number, type: SetType) => void
  onRemoveSet: (setId: string) => void
  onRemove: () => void
  onRename: (name: string) => void
  onChangeUnit: (unit: ExerciseUnit) => void
  onUpdateNote: (note: string) => void
  sessions: Workout[]
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [setType, setSetType] = useState<SetType>('working')
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [highlightedSetId, setHighlightedSetId] = useState<string | null>(null)
  const lastSetRef = useRef<HTMLLIElement | null>(null)
  const previousSetCount = useRef(exercise.sets.length)
  const lastSet = exercise.sets[exercise.sets.length - 1]
  let lastWorkingSet: WorkoutSet | undefined
  for (const set of exercise.sets) {
    if (set.type === 'working') lastWorkingSet = set
  }
  const previous = useMemo(
    () => lastWorkingSet ?? findLastSessionSet(sessions, exercise.name),
    [lastWorkingSet, sessions, exercise.name],
  )

  useEffect(() => {
    if (!previous) return
    setReps(String(previous.reps))
    setWeight(String(previous.weightKg))
  }, [previous])

  useEffect(() => {
    if (exercise.unit === 'bodyweight') setWeight('')
  }, [exercise.unit])

  useEffect(() => {
    const previousLength = previousSetCount.current
    previousSetCount.current = exercise.sets.length
    if (exercise.sets.length <= previousLength) return
    const added = exercise.sets[exercise.sets.length - 1]
    setHighlightedSetId(added.id)
    const node = lastSetRef.current
    if (node) {
      const rect = node.getBoundingClientRect()
      if (rect.bottom > window.innerHeight) {
        node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
    const timer = setTimeout(() => setHighlightedSetId(null), 1200)
    return () => clearTimeout(timer)
  }, [exercise.sets])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const repsValue = Number(reps)
    if (!Number.isInteger(repsValue) || repsValue < 1) {
      setError('Reps must be a whole number of at least 1.')
      return
    }
    let weightValue = 0
    if (exercise.unit === 'bodyweight') {
      weightValue = 0
    } else if (exercise.unit === 'plate') {
      weightValue = Number(weight)
      if (!Number.isInteger(weightValue) || weightValue < 0) {
        setError('Plate count must be a whole number of at least 0.')
        return
      }
    } else {
      weightValue = Number(weight)
      if (!Number.isFinite(weightValue) || weightValue < 0) {
        setError('Weight must be 0 or a positive number.')
        return
      }
    }
    onAddSet(repsValue, weightValue, setType)
    setReps(String(repsValue))
    setWeight(String(weightValue))
    setError(null)
  }

  function startRename() {
    setNameDraft(exercise.name)
    setNameError(null)
    setEditingName(true)
  }

  function handleRenameSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameError('Exercise name is required.')
      return
    }
    onRename(trimmed)
    setEditingName(false)
    setNameError(null)
  }

  const setCount = exercise.sets.length
  const lastSetWeight = lastSet
    ? formatSetWeight(exercise.unit, lastSet.weightKg)
    : null
  const lastSetSummary = lastSet
    ? `Last: ${lastSet.reps} reps${lastSetWeight ? ` · ${lastSetWeight}` : ''}`
    : 'No sets yet'

  return (
    <section className="card exercise">
      <div className="exercise-head">
        <button
          type="button"
          className="collapse-toggle"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand exercise' : 'Collapse exercise'}
        >
          <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} />
        </button>
        <div className="exercise-title">
          <h3>{exercise.name}</h3>
          <p className="exercise-summary">
            {setCount} {setCount === 1 ? 'set' : 'sets'} · {lastSetSummary}
          </p>
        </div>
        {!collapsed && (
          <div className="exercise-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={startRename}
              aria-label="Rename exercise"
            >
              <Icon name="pencil" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={onRemove}
              aria-label="Remove exercise"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        )}
      </div>

      {collapsed && (
        <div className="collapsed-actions">
          <p className="muted collapsed-hint">Tap the arrow to log sets.</p>
          {previous && (
            <button
              type="button"
              className="positive repeat-btn"
              onClick={() => onAddSet(previous.reps, previous.weightKg, 'working')}
            >
              <Icon name="repeat" size={16} />
              Repeat last set
            </button>
          )}
        </div>
      )}

      {!collapsed && (
        <>
      <NoteField
        value={exercise.note ?? ''}
        onChange={onUpdateNote}
        placeholder="Note… (seat position, form cue, dropset)"
        compact
      />

      {editingName && (
        <form onSubmit={handleRenameSubmit} className="rename-form">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => {
              setNameDraft(e.target.value)
              setNameError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                setEditingName(false)
              }
            }}
            autoFocus
          />
          <div className="rename-actions">
            <button type="submit" className="btn-sm secondary">
              Save
            </button>
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => setEditingName(false)}
            >
              Cancel
            </button>
          </div>
          {nameError && <p className="error">{nameError}</p>}
        </form>
      )}

      {exercise.sets.length === 0 ? (
        <p className="muted">No sets yet.</p>
      ) : (
        <ul className="sets">
          {exercise.sets.map((set, index) => {
            const weightText = formatSetWeight(exercise.unit, set.weightKg)
            return (
              <li
                key={set.id}
                ref={index === exercise.sets.length - 1 ? lastSetRef : undefined}
                className={highlightedSetId === set.id ? 'set-highlight' : ''}
              >
                <span>
                  Set {index + 1}
                  {set.type !== 'working' && (
                    <span className={`set-badge ${set.type}`}>
                      {SET_TYPE_LABELS[set.type]}
                    </span>
                  )}
                </span>
                <span>
                  {set.reps} reps{weightText ? ` · ${weightText}` : ''}
                </span>
                <button
                  type="button"
                  className="icon-btn danger set-remove"
                  onClick={() => onRemoveSet(set.id)}
                  aria-label={`Remove set ${index + 1}`}
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="set-form">
        {previous && (
          <button
            type="button"
            className="positive repeat-btn"
            onClick={() => onAddSet(previous.reps, previous.weightKg, 'working')}
          >
            <Icon name="repeat" size={16} />
            Repeat last set
          </button>
        )}
        <div className="set-form-meta">
          <div className="set-type-row" role="group" aria-label="Set type">
            {SET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`set-type-btn${setType === type ? ' active' : ''}`}
                onClick={() => setSetType(type)}
              >
                {SET_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <select
            className="unit-select"
            value={exercise.unit}
            onChange={(e) => onChangeUnit(e.target.value as ExerciseUnit)}
            aria-label="Weight unit"
          >
            <option value="kg">kg</option>
            <option value="plate">plates</option>
            <option value="bodyweight">bodyweight</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`reps-${exercise.id}`}>Reps</label>
          <input
            id={`reps-${exercise.id}`}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={reps}
            onChange={(e) => {
              setReps(e.target.value)
              setError(null)
            }}
            placeholder="10"
          />
        </div>
        {exercise.unit !== 'bodyweight' && (
          <div className="field">
            <label htmlFor={`weight-${exercise.id}`}>
              {exercise.unit === 'plate' ? 'Plates' : 'Weight (kg)'}
            </label>
            <input
              id={`weight-${exercise.id}`}
              type="number"
              min={0}
              step={exercise.unit === 'plate' ? 1 : 'any'}
              inputMode={exercise.unit === 'plate' ? 'numeric' : 'decimal'}
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value)
                setError(null)
              }}
              placeholder={exercise.unit === 'plate' ? '2' : '60'}
            />
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary">
          Add set
        </button>
      </form>
        </>
      )}
    </section>
  )
}

function AddExerciseForm({
  onAdd,
  recentExercises,
}: {
  onAdd: (name: string) => void
  recentExercises: string[]
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Exercise name is required.')
      return
    }
    onAdd(trimmed)
    setName('')
    setError(null)
  }

  const query = name.trim().toLowerCase()
  const matches = query
    ? recentExercises.filter((exercise) =>
        exercise.toLowerCase().includes(query),
      )
    : recentExercises
  const libraryMatches = findLibraryMatches(query)

  return (
    <form onSubmit={handleSubmit} className="card add-exercise">
      <h3>Add exercise</h3>
      <div className="field">
        <label htmlFor="exercise-name">Exercise name</label>
        <input
          id="exercise-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder="e.g. Bench Press"
          autoComplete="off"
        />
        {error && <p className="error">{error}</p>}
      </div>

      {recentExercises.length > 0 && (
        <div className="recent-exercises">
          <span className="recent-label">
            {query ? 'Matches' : 'Recent exercises'}
          </span>
          {matches.length === 0 ? (
            <p className="muted">No match. Type the name and tap Add exercise.</p>
          ) : (
            <ul className="recent-list">
              {matches.map((exercise) => (
                <li key={exercise}>
                  <button
                    type="button"
                    className="recent-item"
                    onClick={() => {
                      onAdd(exercise)
                      setName('')
                      setError(null)
                    }}
                  >
                    {exercise}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {query && libraryMatches.length > 0 && (
        <div className="recent-exercises">
          <span className="recent-label">Exercise library</span>
          <ul className="recent-list">
            {libraryMatches.slice(0, 10).map((exercise) => (
              <li key={exercise.name}>
                <button
                  type="button"
                  className="recent-item"
                  onClick={() => {
                    onAdd(exercise.name)
                    setName('')
                    setError(null)
                  }}
                >
                  {exercise.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" className="primary">
        Add exercise
      </button>
    </form>
  )
}

function InlineRename({
  value,
  onSave,
  onCancel,
}: {
  value: string
  onSave: (name: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Name is required.')
      return
    }
    onSave(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="rename-form inline-rename">
      <div className="inline-rename-row">
        <input
          type="text"
          value={draft}
          autoFocus
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onCancel()
            }
          }}
        />
        <button type="submit" className="btn-sm primary">
          Save
        </button>
        <button type="button" className="btn-sm secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

function AddRoutineExerciseForm({
  onAdd,
  existing,
}: {
  onAdd: (name: string) => void
  existing: string[]
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Exercise name is required.')
      return
    }
    if (
      existing.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())
    ) {
      setError('Exercise already in this day.')
      return
    }
    onAdd(trimmed)
    setName('')
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="add-exercise-day">
      <input
        type="text"
        value={name}
        placeholder="Exercise name"
        autoComplete="off"
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
      />
      <button type="submit" className="btn-sm primary">
        Add exercise
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

function DayScheduleSelect({
  assignedWeekday,
  takenWeekdays,
  getConflict,
  onSchedule,
}: {
  assignedWeekday: string
  takenWeekdays: number[]
  getConflict: (weekday: Weekday) => ScheduleConflict | null
  onSchedule: (weekday: Weekday | null) => void
}) {
  const [draft, setDraft] = useState(assignedWeekday)
  const [pending, setPending] = useState<{
    weekday: Weekday
    conflict: ScheduleConflict
  } | null>(null)

  useEffect(() => {
    setDraft(assignedWeekday)
    setPending(null)
  }, [assignedWeekday])

  function handleChange(raw: string) {
    setDraft(raw)
    if (raw === '') {
      onSchedule(null)
      return
    }
    const weekday = Number(raw) as Weekday
    const conflict = getConflict(weekday)
    if (conflict) {
      setPending({ weekday, conflict })
    } else {
      onSchedule(weekday)
    }
  }

  return (
    <div className="schedule-row">
      <label htmlFor={`weekday-${assignedWeekday}`} className="muted">
        Weekday
      </label>
      <select
        id={`weekday-${assignedWeekday}`}
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="">Not scheduled</option>
        {WEEKDAY_NAMES.map((name, w) => (
          <option
            key={name}
            value={String(w)}
            disabled={takenWeekdays.includes(w) && String(w) !== draft}
          >
            {name}
          </option>
        ))}
      </select>

      {pending && (
        <div className="import-confirm">
          <p>
            {WEEKDAY_NAMES[pending.weekday]} is already scheduled for{' '}
            {pending.conflict.routineName} / {pending.conflict.dayName}.
            Replace it?
          </p>
          <div className="backup-actions">
            <button
              type="button"
              className="danger"
              onClick={() => {
                onSchedule(pending.weekday)
                setPending(null)
              }}
            >
              Replace
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setDraft(assignedWeekday)
                setPending(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RoutineCard({
  routine,
  onRename,
  onDelete,
  onAddDay,
  onRenameDay,
  onRemoveDay,
  onMoveDay,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
  onSetSchedule,
  getConflict,
}: {
  routine: Routine
  onRename: (name: string) => void
  onDelete: () => void
  onAddDay: () => void
  onRenameDay: (dayId: string, name: string) => void
  onRemoveDay: (dayId: string) => void
  onMoveDay: (dayId: string, direction: -1 | 1) => void
  onAddExercise: (dayId: string, name: string) => void
  onRemoveExercise: (dayId: string, index: number) => void
  onMoveExercise: (dayId: string, index: number, direction: -1 | 1) => void
  onSetSchedule: (dayId: string, weekday: Weekday | null) => void
  getConflict: (weekday: Weekday, dayId: string) => ScheduleConflict | null
}) {
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renamingDayId, setRenamingDayId] = useState<string | null>(null)
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null)

  function toggleDay(dayId: string) {
    setExpandedDayId((cur) => (cur === dayId ? null : dayId))
  }

  return (
    <section className="card routine">
      <div className="routine-head">
        {renaming ? (
          <InlineRename
            value={routine.name}
            onSave={(name) => {
              onRename(name)
              setRenaming(false)
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <div className="routine-title">
              <h3>{routine.name}</h3>
              <p className="muted exercise-summary">
                {routine.days.length}{' '}
                {routine.days.length === 1 ? 'day' : 'days'}
              </p>
            </div>
            <div className="exercise-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setRenaming(true)}
                aria-label="Rename routine"
              >
                <Icon name="pencil" size={16} />
              </button>
              {confirmDelete ? (
                <span className="inline-confirm">
                  <button
                    type="button"
                    className="btn-sm danger"
                    onClick={onDelete}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn-sm secondary"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete routine"
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {routine.days.length === 0 && (
        <p className="muted collapsed-hint">No days yet. Add your first day.</p>
      )}

      {routine.days.length > 0 && (
        <ul className="days">
          {routine.days.map((day, dayIndex) => {
            const assignedWeekday =
              Object.entries(routine.schedule).find(([, id]) => id === day.id)?.[0] ??
              ''
            const takenWeekdays = Object.entries(routine.schedule)
              .filter(([, id]) => id !== day.id)
              .map(([w]) => Number(w))
            return (
              <li key={day.id} className="day">
                {renamingDayId === day.id ? (
                  <InlineRename
                    value={day.name}
                    onSave={(name) => {
                      onRenameDay(day.id, name)
                      setRenamingDayId(null)
                    }}
                    onCancel={() => setRenamingDayId(null)}
                  />
                ) : (
                  <div className="day-head">
                    <button
                      type="button"
                      className="day-toggle"
                      onClick={() => toggleDay(day.id)}
                    >
                      <span className="day-toggle-main">
                        <span>{day.name}</span>
                        <Icon
                          name={
                            expandedDayId === day.id
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          size={18}
                        />
                      </span>
                      <span className="muted">
                        {day.exerciseNames.length}{' '}
                        {day.exerciseNames.length === 1 ? 'exercise' : 'exercises'}
                      </span>
                    </button>
                    <div className="exercise-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={dayIndex === 0}
                        onClick={() => onMoveDay(day.id, -1)}
                        aria-label="Move day up"
                      >
                        <Icon name="arrow-up" size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={dayIndex === routine.days.length - 1}
                        onClick={() => onMoveDay(day.id, 1)}
                        aria-label="Move day down"
                      >
                        <Icon name="arrow-down" size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setRenamingDayId(day.id)}
                        aria-label="Rename day"
                      >
                        <Icon name="pencil" size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => onRemoveDay(day.id)}
                        aria-label="Remove day"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {expandedDayId === day.id && (
                  <div className="day-body">
                    {day.exerciseNames.length === 0 && (
                      <p className="muted">No exercises yet.</p>
                    )}
                    {day.exerciseNames.map((name, index) => (
                      <div key={`${name}-${index}`} className="exercise-row">
                        <span>
                          {index + 1}. {name}
                        </span>
                        <div className="exercise-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            disabled={index === 0}
                            onClick={() => onMoveExercise(day.id, index, -1)}
                            aria-label="Move exercise up"
                          >
                            <Icon name="arrow-up" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            disabled={index === day.exerciseNames.length - 1}
                            onClick={() => onMoveExercise(day.id, index, 1)}
                            aria-label="Move exercise down"
                          >
                            <Icon name="arrow-down" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => onRemoveExercise(day.id, index)}
                            aria-label="Remove exercise"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <AddRoutineExerciseForm
                      onAdd={(name) => onAddExercise(day.id, name)}
                      existing={day.exerciseNames}
                    />
                    <DayScheduleSelect
                      assignedWeekday={assignedWeekday}
                      takenWeekdays={takenWeekdays}
                      getConflict={(weekday) => getConflict(weekday, day.id)}
                      onSchedule={(weekday) => onSetSchedule(day.id, weekday)}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="btn-sm secondary" onClick={onAddDay}>
        Add day
      </button>
    </section>
  )
}

function RoutineEditorScreen({
  routines,
  onBack,
  onAddRoutine,
  onRenameRoutine,
  onDeleteRoutine,
  onAddDay,
  onRenameDay,
  onRemoveDay,
  onMoveDay,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
  onSetSchedule,
}: {
  routines: Routine[]
  onBack: () => void
  onAddRoutine: () => void
  onRenameRoutine: (routineId: string, name: string) => void
  onDeleteRoutine: (routineId: string) => void
  onAddDay: (routineId: string) => void
  onRenameDay: (routineId: string, dayId: string, name: string) => void
  onRemoveDay: (routineId: string, dayId: string) => void
  onMoveDay: (routineId: string, dayId: string, direction: -1 | 1) => void
  onAddExercise: (routineId: string, dayId: string, name: string) => void
  onRemoveExercise: (routineId: string, dayId: string, index: number) => void
  onMoveExercise: (
    routineId: string,
    dayId: string,
    index: number,
    direction: -1 | 1,
  ) => void
  onSetSchedule: (
    routineId: string,
    dayId: string,
    weekday: Weekday | null,
  ) => void
}) {
  const owners = useMemo(() => {
    const map = new Map<number, ScheduleConflict>()
    for (const routine of routines) {
      for (const [weekday, dayId] of Object.entries(routine.schedule)) {
        const day = routine.days.find((d) => d.id === dayId)
        if (day) {
          map.set(Number(weekday), {
            routineName: routine.name,
            dayName: day.name,
          })
        }
      }
    }
    return map
  }, [routines])

  function getScheduleConflict(
    weekday: Weekday,
    dayId: string,
  ): ScheduleConflict | null {
    for (const routine of routines) {
      if (routine.schedule[weekday] === dayId) return null
    }
    return owners.get(weekday) ?? null
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Routines</h1>
        <p className="muted">Prepare workout days and exercises ahead of time.</p>
      </header>

      <button type="button" className="btn-sm secondary" onClick={onBack}>
        Back
      </button>

      <button type="button" className="primary" onClick={onAddRoutine}>
        Add routine
      </button>

      {routines.length === 0 && (
        <p className="muted empty">
          No routines yet. Create one to plan your week.
        </p>
      )}

      {routines.map((routine) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          onRename={(name) => onRenameRoutine(routine.id, name)}
          onDelete={() => onDeleteRoutine(routine.id)}
          onAddDay={() => onAddDay(routine.id)}
          onRenameDay={(dayId, name) => onRenameDay(routine.id, dayId, name)}
          onRemoveDay={(dayId) => onRemoveDay(routine.id, dayId)}
          onMoveDay={(dayId, direction) => onMoveDay(routine.id, dayId, direction)}
          onAddExercise={(dayId, name) =>
            onAddExercise(routine.id, dayId, name)
          }
          onRemoveExercise={(dayId, index) =>
            onRemoveExercise(routine.id, dayId, index)
          }
          onMoveExercise={(dayId, index, direction) =>
            onMoveExercise(routine.id, dayId, index, direction)
          }
          onSetSchedule={(dayId, weekday) =>
            onSetSchedule(routine.id, dayId, weekday)
          }
          getConflict={getScheduleConflict}
        />
      ))}
    </main>
  )
}

function SummaryScreen({
  workout,
  onStartAnother,
  onBack,
}: {
  workout: Workout
  onStartAnother: () => void
  onBack: () => void
}) {
  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Workout complete</h1>
        <p className="muted">{formatDate(workout.startedAt)}</p>
      </header>

      {workout.note && (
        <p className="summary-note">{workout.note}</p>
      )}

      {workout.exercises.map((exercise) => (
        <section key={exercise.id} className="card">
          <h3>{exercise.name}</h3>
          {exercise.note && <p className="summary-note">{exercise.note}</p>}
          <ul className="sets">
            {exercise.sets.map((set, index) => {
              const weightText = formatSetWeight(exercise.unit, set.weightKg)
              return (
                <li key={set.id}>
                  <span>
                    Set {index + 1}
                    {set.type !== 'working' && (
                      <span className={`set-badge ${set.type}`}>
                        {SET_TYPE_LABELS[set.type]}
                      </span>
                    )}
                  </span>
                  <span>
                    {set.reps} reps{weightText ? ` · ${weightText}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <p className="summary-count">
        {workout.exercises.length} exercises · {countSets(workout)} sets
      </p>

      <button type="button" className="primary" onClick={onStartAnother}>
        Start another workout
      </button>
      <button type="button" className="secondary" onClick={onBack}>
        Back
      </button>
    </main>
  )
}

function countSets(workout: Workout): number {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
}

function formatSetWeight(unit: ExerciseUnit, weightKg: number): string | null {
  if (unit === 'bodyweight') return null
  if (unit === 'plate') return `${weightKg} plates`
  return `${weightKg} kg`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default App
