# Smart Workout Recommendation Design Spec

## Overview
Separate calendar scheduling (which weekday a routine day is planned for) from program sequence rotation (which routine day should be performed next based on completion history). When a user skips a scheduled workout day (e.g. skipping Wednesday Pull in a Push/Pull/Legs program), the recommended workout remains the next incomplete session in the sequence (Pull), while still displaying the calendar scheduled day (Legs) with a quick switch toggle option.

## Core Domain & Algorithm

### 1. Workout Meta Data
Add optional `routineId` and `dayId` fields to `Workout` model in `src/lib/types.ts`:
```ts
export type Workout = {
  id: string
  routineId?: string
  dayId?: string
  startedAt: string
  finishedAt: string | null
  exercises: Exercise[]
  note?: string
}
```

### 2. Smart Recommendation Logic (`src/lib/selectors.ts`)
Create `getRecommendedWorkout(routines: Routine[], sessions: Workout[])`:
1. Find the active/primary routine (the routine with days).
2. Look at completed sessions (`finishedAt !== null`), sorted newest first.
3. Identify the last completed `routineId` & `dayId` (or fall back to matching completed exercise names against routine days).
4. Calculate the next `dayId` in sequence: `(lastIndex + 1) % routine.days.length`.
5. Check if today has a calendar-scheduled day via `routine.schedule[todayWeekday]`.
6. Return recommendation result:
```ts
export type RecommendationResult = {
  recommended: { routine: Routine; day: RoutineDay }
  calendarScheduled: { routine: Routine; day: RoutineDay } | null
  isSequenceMismatch: boolean
}
```

## User Experience (HomeScreen)

- **Primary Recommendation Card**: Displays the sequence-recommended workout day (e.g., Pull) with "Rekomendasi Lanjutan (Urutan Rotasi)" / "Next in Rotation".
- **Calendar Context Banner**: If `isSequenceMismatch` is true (e.g., Today is Saturday which is scheduled for Legs, but sequence recommends Pull), display a subtle badge/note: *"Jadwal Kalender Hari Ini: Legs"*.
- **Switch Action**: Provide a quick toggle button *"Switch ke Legs (Jadwal Hari Ini)"* allowing one-tap override to the calendar-scheduled day, or picking any other routine day.
- **Start Workout with Identifiers**: When starting a workout from a routine day, pass `routineId` and `dayId` into `onStartWithExercises(exerciseNames, routineId, dayId)`.

## Verification
- Unit/Logic test via pure functions in `selectors.ts`.
- Build verification via `tsc` and `oxlint`.
