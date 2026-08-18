import type { ProgramGoal, ProgramTemplate } from './types'

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