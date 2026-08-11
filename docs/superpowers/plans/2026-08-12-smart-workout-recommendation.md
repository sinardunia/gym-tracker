# Smart Workout Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement sequence-based smart workout recommendation with calendar context display and quick override toggle.

**Architecture:** Separate routine day sequence tracking from weekday calendar schedule. Use completed session history to determine the next routine day in sequence, while displaying any calendar schedule mismatch with a one-tap switch button on the Home screen.

**Tech Stack:** React 19, TypeScript, Tailwind CSS / Custom CSS, Vite.

## Global Constraints
- Pure client-side local-first architecture (localStorage + IndexedDB).
- Strictly maintain backwards compatibility for existing `Workout` sessions.
- No external libraries.

---

### Task 1: Extend Data Model & Selector Logic

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/selectors.ts`

**Interfaces:**
- Consumes: `Routine`, `RoutineDay`, `Workout` from `src/lib/types.ts`
- Produces: `getRecommendedWorkout(routines: Routine[], sessions: Workout[]): RecommendationResult`

- [ ] **Step 1: Update Workout type in `src/lib/types.ts`**

Add `routineId?: string` and `dayId?: string` to `Workout`:
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

- [ ] **Step 2: Add `RecommendationResult` and `getRecommendedWorkout` in `src/lib/selectors.ts`**

```ts
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
```

- [ ] **Step 3: Run TypeScript compiler to verify logic**

Run: `npx tsc -b`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add src/lib/types.ts src/lib/selectors.ts
git commit -m "feat: add routineId/dayId to Workout and implement getRecommendedWorkout selector"
```

---

### Task 2: Pass `routineId` & `dayId` when Starting Workouts

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `getRecommendedWorkout` from `src/lib/selectors.ts`
- Produces: `startWorkoutWithExercises(exerciseNames: string[], routineId?: string, dayId?: string)` in `src/App.tsx`

- [ ] **Step 1: Update `startWorkoutWithExercises` in `src/App.tsx`**

Update signature and implementation:
```ts
const startWorkoutWithExercises = useCallback(
  (exerciseNames: string[], routineId?: string, dayId?: string) => {
    setState((prev) => {
      const newWorkout: Workout = {
        id: crypto.randomUUID(),
        routineId,
        dayId,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        exercises: exerciseNames.map((name) => ({
          id: crypto.randomUUID(),
          name,
          sets: [],
          unit: 'kg',
        })),
      }
      return { ...prev, activeWorkout: newWorkout }
    })
  },
  [],
)
```

- [ ] **Step 2: Update `onStartWithExercises` prop type in `src/screens/HomeScreen.tsx`**

```ts
onStartWithExercises: (exerciseNames: string[], routineId?: string, dayId?: string) => void
```

- [ ] **Step 3: Run `npx tsc -b` to verify build**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 4: Commit changes**

```bash
git add src/App.tsx src/screens/HomeScreen.tsx
git commit -m "feat: pass routineId and dayId when starting workout from routine"
```

---

### Task 3: Update i18n & HomeScreen UI for Smart Recommendation

**Files:**
- Modify: `src/i18n.tsx`
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `getRecommendedWorkout` selector
- Produces: HomeScreen recommended workout card with sequence recommendation and switch toggle.

- [ ] **Step 1: Add i18n translation keys in `src/i18n.tsx`**

Add keys for Indonesian and English:
```ts
// Indonesian
'home.recommendedNext': 'Rekomendasi Lanjutan (Rotasi)',
'home.calendarContext': 'Jadwal Hari Ini: {day}',
'home.switchToCalendar': 'Ganti ke {day} (Jadwal Hari Ini)',
'home.switchToSequence': 'Kembali ke Rekomendasi ({day})',

// English
'home.recommendedNext': 'Recommended Next (Sequence)',
'home.calendarContext': "Today's Schedule: {day}",
'home.switchToCalendar': "Switch to {day} (Today's Schedule)",
'home.switchToSequence': 'Back to Recommendation ({day})',
```

- [ ] **Step 2: Update `HomeScreen.tsx` to use `getRecommendedWorkout` and handle override toggle**

Replace old `findTodayWorkout` logic in `HomeScreen`:
```tsx
const recommendation = getRecommendedWorkout(routines, sessions)
const [selectedPlan, setSelectedPlan] = useState<{ routine: Routine; day: RoutineDay } | null>(null)

const activePlan = selectedPlan ?? recommendation.recommended ?? recommendation.calendarScheduled
```

Add UI elements to render:
- Sequence Recommendation badge
- Context banner if `isSequenceMismatch`
- Switch button allowing user to switch between sequence recommendation and calendar schedule.

- [ ] **Step 3: Add CSS styles in `src/App.css`**

Add styles for `.recommendation-badge`, `.calendar-context-banner`, and `.switch-plan-btn`.

- [ ] **Step 4: Verify build & linting**

Run: `npx oxlint && npx tsc -b && npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/i18n.tsx src/screens/HomeScreen.tsx src/App.css
git commit -m "feat: render smart recommendation card with calendar switch on HomeScreen"
```
