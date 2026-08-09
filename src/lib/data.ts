import { get, set } from 'idb-keyval'
import {
  isPersistedState,
  isRoutine,
  isWorkout,
  normalizeRoutine,
  normalizeWorkout,
  type LibraryExercise,
  type PersistedState,
  type ProgramGoal,
  type ProgramTemplate,
  type Workout,
} from './types'

export const STORAGE_KEY = 'gym-tracker.state.v2'
export const STORAGE_KEY_V1 = 'gym-tracker.state.v1'

export const EXERCISE_LIBRARY: LibraryExercise[] = [
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

export const PROGRAM_GOALS: readonly ProgramGoal[] = [
  'beginner',
  'aesthetic',
  'strength',
  'athletic',
]

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'fullbody-3x',
    title: 'program.fullbody.title',
    description: 'program.fullbody.desc',
    goal: 'beginner',
    days: [
      {
        name: 'program.fullbody.dayA',
        exerciseNames: ['Squat', 'Bench Press', 'Lat Pulldown', 'Plank', 'Calf Raise'],
      },
      {
        name: 'program.fullbody.dayB',
        exerciseNames: [
          'Romanian Deadlift',
          'Push-Up',
          'Seated Cable Row',
          'Lateral Raise',
          'Crunch',
        ],
      },
      {
        name: 'program.fullbody.dayC',
        exerciseNames: ['Leg Press', 'Overhead Press', 'Dumbbell Row', 'Plank', 'Hip Thrust'],
      },
    ],
  },
  {
    id: 'upperlower-4x',
    title: 'program.upperlower.title',
    description: 'program.upperlower.desc',
    goal: 'aesthetic',
    days: [
      {
        name: 'program.upperlower.dayU1',
        exerciseNames: [
          'Bench Press',
          'Barbell Row',
          'Overhead Press',
          'Lateral Raise',
          'Bicep Curl',
          'Tricep Pushdown',
        ],
      },
      {
        name: 'program.upperlower.dayL1',
        exerciseNames: ['Squat', 'Romanian Deadlift', 'Leg Extension', 'Leg Curl', 'Calf Raise'],
      },
      {
        name: 'program.upperlower.dayU2',
        exerciseNames: [
          'Incline Bench Press',
          'Lat Pulldown',
          'Dumbbell Shoulder Press',
          'Face Pull',
          'Hammer Curl',
          'Skull Crusher',
        ],
      },
      {
        name: 'program.upperlower.dayL2',
        exerciseNames: [
          'Deadlift',
          'Leg Press',
          'Lunge',
          'Leg Curl',
          'Calf Raise',
          'Hanging Leg Raise',
        ],
      },
    ],
  },
  {
    id: 'ppl-6x',
    title: 'program.ppl.title',
    description: 'program.ppl.desc',
    goal: 'athletic',
    days: [
      {
        name: 'program.ppl.dayPush1',
        exerciseNames: ['Bench Press', 'Overhead Press', 'Dips', 'Lateral Raise', 'Tricep Pushdown'],
      },
      {
        name: 'program.ppl.dayPull1',
        exerciseNames: ['Deadlift', 'Pull-Up', 'Barbell Row', 'Face Pull', 'Bicep Curl'],
      },
      {
        name: 'program.ppl.dayLegs1',
        exerciseNames: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
      },
      {
        name: 'program.ppl.dayPush2',
        exerciseNames: [
          'Incline Bench Press',
          'Dumbbell Shoulder Press',
          'Chest Fly',
          'Skull Crusher',
          'Front Raise',
        ],
      },
      {
        name: 'program.ppl.dayPull2',
        exerciseNames: ['Lat Pulldown', 'Seated Cable Row', 'Rear Delt Fly', 'Hammer Curl', 'Shrug'],
      },
      {
        name: 'program.ppl.dayLegs2',
        exerciseNames: [
          'Front Squat',
          'Lunge',
          'Hip Thrust',
          'Leg Extension',
          'Calf Raise',
          'Hanging Leg Raise',
        ],
      },
    ],
  },
  {
    id: 'strength-foundation',
    title: 'program.strength.title',
    description: 'program.strength.desc',
    goal: 'strength',
    days: [
      {
        name: 'program.strength.daySquat',
        exerciseNames: ['Squat', 'Leg Press', 'Leg Curl', 'Back Extension', 'Plank'],
      },
      {
        name: 'program.strength.dayBench',
        exerciseNames: ['Bench Press', 'Overhead Press', 'Dumbbell Row', 'Tricep Pushdown', 'Face Pull'],
      },
      {
        name: 'program.strength.dayDeadlift',
        exerciseNames: ['Deadlift', 'Romanian Deadlift', 'Pull-Up', 'Barbell Row', "Farmer's Carry"],
      },
    ],
  },
]

export const EMPTY_STATE: PersistedState = {
  activeWorkout: null,
  sessions: [],
  routines: [],
}

export const newId = (): string => crypto.randomUUID()

export function createWorkout(): Workout {
  return {
    id: newId(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: [],
  }
}

export function parseBackup(text: string): PersistedState | null {
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

export function loadState(): PersistedState {
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

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    void set(STORAGE_KEY, state)
  } catch {
    // Storage unavailable; keep working in memory.
  }
}

export async function loadAsyncState(): Promise<PersistedState | null> {
  try {
    const idbState = await get<PersistedState>(STORAGE_KEY)
    if (idbState && isPersistedState(idbState)) {
      return {
        activeWorkout: idbState.activeWorkout ? normalizeWorkout(idbState.activeWorkout) : null,
        sessions: idbState.sessions.map(normalizeWorkout),
        routines: (idbState.routines ?? []).map(normalizeRoutine),
      }
    }
  } catch {
    // IDB unavailable
  }
  return null
}
