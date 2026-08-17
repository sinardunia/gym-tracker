import { isPersistedState } from '../src/lib/types'
import type {
  Exercise,
  Routine,
  Weekday,
  Workout,
  WorkoutSet,
} from '../src/lib/types'

type PlanExercise = {
  name: string
  unit: 'kg' | 'bodyweight'
  base: number
  inc: number
  periodWeeks: number
  sets: number
  repsMin: number
  repsMax: number
  warmup?: boolean
}

const DAYS: { id: string; name: string; schedule: Weekday; exercises: PlanExercise[] }[] = [
  {
    id: 'push-a',
    name: 'Push A',
    schedule: 1,
    exercises: [
      { name: 'Incline Barbell Bench Press', unit: 'kg', base: 60, inc: 2.5, periodWeeks: 2, sets: 4, repsMin: 8, repsMax: 10, warmup: true },
      { name: 'Pec Deck Fly', unit: 'kg', base: 45, inc: 2.5, periodWeeks: 3, sets: 3, repsMin: 12, repsMax: 15 },
      { name: 'Dumbbell Shoulder Press', unit: 'kg', base: 22, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Lateral Raise', unit: 'kg', base: 12, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 12, repsMax: 15 },
      { name: 'Triceps Pushdown', unit: 'kg', base: 35, inc: 2.5, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Hanging Leg Raise', unit: 'bodyweight', base: 0, inc: 0, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 15 },
    ],
  },
  {
    id: 'pull-a',
    name: 'Pull A',
    schedule: 2,
    exercises: [
      { name: 'Weighted Pull-Ups', unit: 'kg', base: 10, inc: 2.5, periodWeeks: 3, sets: 4, repsMin: 8, repsMax: 10, warmup: true },
      { name: 'Straight Arm Pull Down', unit: 'kg', base: 30, inc: 2.5, periodWeeks: 3, sets: 3, repsMin: 12, repsMax: 15 },
      { name: 'Incline Dumbbell Curls', unit: 'kg', base: 12, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Hammer Curls', unit: 'kg', base: 14, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Face Pulls', unit: 'kg', base: 35, inc: 2.5, periodWeeks: 3, sets: 3, repsMin: 12, repsMax: 15 },
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    schedule: 4,
    exercises: [
      { name: 'Romanian Deadlift', unit: 'kg', base: 80, inc: 2.5, periodWeeks: 2, sets: 4, repsMin: 8, repsMax: 10, warmup: true },
      { name: 'Smith Squat', unit: 'kg', base: 70, inc: 2.5, periodWeeks: 2, sets: 4, repsMin: 8, repsMax: 10, warmup: true },
      { name: 'Bulgarian Split Squat', unit: 'kg', base: 24, inc: 1.25, periodWeeks: 2, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Leg Curl Machine', unit: 'kg', base: 40, inc: 2.5, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Calf Raise', unit: 'kg', base: 60, inc: 2.5, periodWeeks: 3, sets: 4, repsMin: 12, repsMax: 15 },
      { name: 'Hanging Leg Raise', unit: 'bodyweight', base: 0, inc: 0, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 15 },
    ],
  },
  {
    id: 'push-b',
    name: 'Push B',
    schedule: 5,
    exercises: [
      { name: 'Chest Dips', unit: 'bodyweight', base: 0, inc: 0, periodWeeks: 2, sets: 4, repsMin: 8, repsMax: 12 },
      { name: 'Incline Dumbbell Press', unit: 'kg', base: 24, inc: 1.25, periodWeeks: 2, sets: 4, repsMin: 8, repsMax: 10, warmup: true },
      { name: 'Cable Lateral Raise', unit: 'kg', base: 12, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 12, repsMax: 15 },
      { name: 'Rear Delt Fly', unit: 'kg', base: 10, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 12, repsMax: 15 },
      { name: 'Triceps Overhead Extension', unit: 'kg', base: 25, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
    ],
  },
  {
    id: 'pull-b',
    name: 'Pull B',
    schedule: 6,
    exercises: [
      { name: 'Lat Pulldown', unit: 'kg', base: 65, inc: 2.5, periodWeeks: 2, sets: 4, repsMin: 8, repsMax: 10, warmup: true },
      { name: 'One Arm Seated Cable Row', unit: 'kg', base: 30, inc: 1.25, periodWeeks: 2, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Bent Over Barbell Row', unit: 'kg', base: 70, inc: 2.5, periodWeeks: 2, sets: 4, repsMin: 8, repsMax: 10, warmup: true },
      { name: 'Preacher Curls', unit: 'kg', base: 30, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Reverse Barbell Curls', unit: 'kg', base: 20, inc: 1.25, periodWeeks: 3, sets: 3, repsMin: 10, repsMax: 12 },
      { name: 'Dumbbell / Barbell Shrugs', unit: 'kg', base: 60, inc: 2.5, periodWeeks: 3, sets: 3, repsMin: 12, repsMax: 15 },
    ],
  },
]

const NOTES = [
  'Latihan terasa kuat hari ini.',
  'Form rapi, fokus pada tempo eksentrik.',
  'Porsi latihan cukup berat, rest singkat.',
  'Tambah beban kecil, masih nyaman.',
  'Sedikit lelah tapi semua set tuntas.',
]

const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const roundTo = (value: number, step: number): number => Math.round(value / step) * step

function makeSet(plan: PlanExercise, weekIndex: number, setId: string): WorkoutSet {
  if (plan.unit === 'bodyweight') {
    return { id: setId, reps: rand(plan.repsMin, plan.repsMax), weightKg: 0, type: 'working' }
  }
  const weight = roundTo(plan.base + plan.inc * Math.floor(weekIndex / plan.periodWeeks), 0.5)
  return { id: setId, reps: rand(plan.repsMin, plan.repsMax), weightKg: weight, type: 'working' }
}

function makeSession(
  day: (typeof DAYS)[number],
  weekIndex: number,
  date: Date,
): Workout {
  const startedAt = new Date(date)
  startedAt.setHours(rand(17, 20), rand(0, 59), rand(0, 59), 0)
  const finishedAt = new Date(startedAt.getTime() + rand(45, 90) * 60_000)

  const exercises: Exercise[] = []
  for (const plan of day.exercises) {
    if (Math.random() < 0.05) continue
    const sets: WorkoutSet[] = []
    if (plan.warmup) {
      sets.push({
        id: crypto.randomUUID(),
        reps: 8,
        weightKg: roundTo(plan.base * 0.5, 2.5),
        type: 'warmup',
      })
    }
    for (let i = 0; i < plan.sets; i++) {
      sets.push(makeSet(plan, weekIndex, crypto.randomUUID()))
    }
    exercises.push({ id: crypto.randomUUID(), name: plan.name, sets, unit: plan.unit })
  }

  return {
    id: crypto.randomUUID(),
    routineId: 'demo-ppl-5x',
    dayId: day.id,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    exercises,
    note: Math.random() < 0.15 ? NOTES[rand(0, NOTES.length - 1)] : undefined,
  }
}

function buildRoutine(): Routine {
  return {
    id: 'demo-ppl-5x',
    name: 'PPL 5x (Demo)',
    days: DAYS.map((day) => ({
      id: day.id,
      name: day.name,
      exerciseNames: day.exercises.map((e) => e.name),
    })),
    schedule: Object.fromEntries(DAYS.map((day) => [day.schedule, day.id])) as Partial<
      Record<Weekday, string>
    >,
  }
}

const weeks = Number(process.argv[2] ?? 16)
if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) {
  console.error('Usage: bun run scripts/generate-dummy-data.ts [weeks 1-52]')
  process.exit(1)
}

const today = new Date()
today.setHours(0, 0, 0, 0)
const start = new Date(today)
start.setDate(start.getDate() - weeks * 7)

const sessions: Workout[] = []
const weekCounters = new Map<string, number>()

for (let d = new Date(start); d < today; d.setDate(d.getDate() + 1)) {
  const weekday = d.getDay() as Weekday
  const day = DAYS.find((candidate) => candidate.schedule === weekday)
  if (!day) continue
  const weekIndex = weekCounters.get(day.id) ?? 0
  sessions.push(makeSession(day, weekIndex, d))
  weekCounters.set(day.id, weekIndex + 1)
}

const state = { activeWorkout: null, sessions, routines: [buildRoutine()] }

if (!isPersistedState(state)) {
  console.error('Generated state failed validation')
  process.exit(1)
}

const outPath = 'public/gym-tracker-dummy-backup.json'
await Bun.write(outPath, JSON.stringify(state, null, 2))

const totalSets = sessions.reduce(
  (sum, s) => sum + s.exercises.reduce((n, e) => n + e.sets.length, 0),
  0,
)
console.log(`Wrote ${outPath}`)
console.log(`  Weeks: ${weeks} · Sessions: ${sessions.length} · Exercises: ${sessions.reduce((n, s) => n + s.exercises.length, 0)} · Sets: ${totalSets}`)
console.log('Import via Settings → Backup → Import JSON (replaces current data).')