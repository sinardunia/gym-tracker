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
  {
    name: 'Incline Barbell Bench Press',
    aliases: ['incline bench', 'incline barbell bench', 'bb incline bench'],
  },
  {
    name: 'Incline Dumbbell Press',
    aliases: ['incline db press', 'incline press', 'incline bench'],
  },
  { name: 'Dumbbell Bench Press', aliases: ['db bench'] },
  { name: 'Chest Press Machine', aliases: ['machine press'] },
  { name: 'Chest Fly', aliases: ['pec fly', 'pec deck', 'dumbbell fly'] },
  { name: 'Pec Deck Fly', aliases: ['pec fly', 'pec deck', 'chest fly'] },
  { name: 'Push-Up', aliases: ['pushup', 'press up'] },
  { name: 'Dips', aliases: ['chest dip', 'tricep dip'] },
  { name: 'Chest Dips', aliases: ['chest dip', 'dips', 'tricep dip'] },
  { name: 'Pull-Up', aliases: ['pullup', 'chin-up', 'chin up'] },
  {
    name: 'Weighted Pull-Ups',
    aliases: ['weighted pull up', 'pull up', 'pullups', 'weighted chin-up'],
  },
  { name: 'Lat Pulldown', aliases: ['lat pull down', 'pulldown'] },
  {
    name: 'Straight Arm Pull Down',
    aliases: ['straight arm pulldown', 'straight arm lat pulldown'],
  },
  { name: 'Seated Cable Row', aliases: ['cable row', 'seated row'] },
  {
    name: 'One Arm Seated Cable Row',
    aliases: ['one arm cable row', 'single arm cable row', 'seated cable row'],
  },
  { name: 'Barbell Row', aliases: ['bent over row', 'barbell bent over row'] },
  {
    name: 'Bent Over Barbell Row',
    aliases: ['bent over row', 'barbell bent over row', 'barbell row'],
  },
  { name: 'Dumbbell Row', aliases: ['db row', 'one arm row'] },
  { name: 'T-Bar Row', aliases: [] },
  { name: 'Face Pull', aliases: ['rear delt face pull'] },
  { name: 'Face Pulls', aliases: ['face pull', 'rear delt face pull'] },
  { name: 'Rear Delt Fly', aliases: ['reverse fly', 'reverse pec deck'] },
  { name: 'Squat', aliases: ['barbell squat', 'back squat'] },
  { name: 'Smith Squat', aliases: ['smith machine squat'] },
  { name: 'Front Squat', aliases: [] },
  { name: 'Leg Press', aliases: ['leg press machine'] },
  { name: 'Leg Extension', aliases: ['quad extension'] },
  { name: 'Leg Curl', aliases: ['hamstring curl', 'lying leg curl', 'seated leg curl'] },
  {
    name: 'Leg Curl Machine',
    aliases: ['leg curl', 'hamstring curl', 'seated leg curl'],
  },
  { name: 'Romanian Deadlift', aliases: ['rdl', 'romanian deadlift'] },
  { name: 'Deadlift', aliases: ['conventional deadlift'] },
  { name: 'Lunge', aliases: ['walking lunge', 'reverse lunge'] },
  { name: 'Bulgarian Split Squat', aliases: ['split squat'] },
  { name: 'Hip Thrust', aliases: ['glute bridge', 'barbell hip thrust'] },
  { name: 'Calf Raise', aliases: ['standing calf raise', 'seated calf raise'] },
  { name: 'Overhead Press', aliases: ['ohp', 'military press', 'shoulder press'] },
  { name: 'Dumbbell Shoulder Press', aliases: ['db press', 'seated shoulder press'] },
  { name: 'Lateral Raise', aliases: ['side raise', 'side lateral raise'] },
  { name: 'Cable Lateral Raise', aliases: ['cable side raise', 'lateral raise', 'side lateral raise'] },
  { name: 'Front Raise', aliases: [] },
  { name: 'Shrug', aliases: ['dumbbell shrug', 'barbell shrug'] },
  {
    name: 'Dumbbell / Barbell Shrugs',
    aliases: ['shrug', 'dumbbell shrug', 'barbell shrug'],
  },
  { name: 'Bicep Curl', aliases: ['barbell curl', 'dumbbell curl'] },
  { name: 'Incline Dumbbell Curls', aliases: ['incline db curl', 'incline curl'] },
  { name: 'Hammer Curl', aliases: [] },
  { name: 'Hammer Curls', aliases: ['hammer curl', 'db hammer curl'] },
  { name: 'Preacher Curl', aliases: [] },
  { name: 'Preacher Curls', aliases: ['preacher curl', 'ez bar preacher curl'] },
  { name: 'Reverse Barbell Curls', aliases: ['reverse curl', 'reverse barbell curl'] },
  { name: 'Tricep Pushdown', aliases: ['cable pushdown', 'pushdown'] },
  { name: 'Triceps Pushdown', aliases: ['tricep pushdown', 'cable pushdown', 'pushdown'] },
  { name: 'Skull Crusher', aliases: ['lying tricep extension'] },
  { name: 'Overhead Tricep Extension', aliases: ['tricep extension'] },
  {
    name: 'Triceps Overhead Extension',
    aliases: ['overhead tricep extension', 'tricep extension', 'overhead extension'],
  },
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
    id: 'ppl-5x',
    title: 'program.ppl5.title',
    description: 'program.ppl5.desc',
    goal: 'aesthetic',
    schedule: {
      1: 'push-a',
      2: 'pull-a',
      4: 'legs',
      5: 'push-b',
      6: 'pull-b',
    },
    days: [
      {
        id: 'push-a',
        name: 'program.ppl5.dayPushA',
        exerciseNames: [
          'Incline Barbell Bench Press',
          'Pec Deck Fly',
          'Dumbbell Shoulder Press',
          'Lateral Raise',
          'Triceps Pushdown',
          'Hanging Leg Raise',
        ],
      },
      {
        id: 'pull-a',
        name: 'program.ppl5.dayPullA',
        exerciseNames: [
          'Weighted Pull-Ups',
          'Straight Arm Pull Down',
          'Incline Dumbbell Curls',
          'Hammer Curls',
          'Face Pulls',
        ],
      },
      {
        id: 'legs',
        name: 'program.ppl5.dayLegs',
        exerciseNames: [
          'Romanian Deadlift',
          'Smith Squat',
          'Bulgarian Split Squat',
          'Leg Curl Machine',
          'Calf Raise',
          'Hanging Leg Raise',
        ],
      },
      {
        id: 'push-b',
        name: 'program.ppl5.dayPushB',
        exerciseNames: [
          'Chest Dips',
          'Incline Dumbbell Press',
          'Cable Lateral Raise',
          'Rear Delt Fly',
          'Triceps Overhead Extension',
        ],
      },
      {
        id: 'pull-b',
        name: 'program.ppl5.dayPullB',
        exerciseNames: [
          'Lat Pulldown',
          'One Arm Seated Cable Row',
          'Bent Over Barbell Row',
          'Preacher Curls',
          'Reverse Barbell Curls',
          'Dumbbell / Barbell Shrugs',
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
    return {
      activeWorkout,
      sessions,
      routines,
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : undefined,
    }
  } catch {
    return EMPTY_STATE
  }
}

export function saveState(state: PersistedState) {
  const stamped: PersistedState = {
    ...state,
    savedAt: new Date().toISOString(),
  }
  try {
    void set(STORAGE_KEY, stamped).catch(() => {})
  } catch {
    // Storage unavailable; keep working in memory.
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped))
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
        savedAt:
          typeof idbState.savedAt === 'string' ? idbState.savedAt : undefined,
      }
    }
  } catch {
    // IDB unavailable
  }
  return null
}
