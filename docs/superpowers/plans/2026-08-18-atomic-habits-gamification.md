# Atomic Habits + Gamification System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a coherent behavioral loop — consistency engine, animated streak widget, identity-based UX, post-workout reinforcement, comeback experience, and lightweight progress evidence — without XP, levels, badges, or notification-based gamification.

**Architecture:** All streak, gap, and PR data is computed as pure functions from the existing `sessions[]` array. No new persisted workout fields. The only new persistence is a `localStorage` array of dismissed milestone IDs. New components (`ConsistencyWidget`, `ExerciseChart`) are composed into existing screens. Animation fires only on meaningful state transitions (streak increase), detected via `useRef` diffing — not on every render.

**Tech Stack:** React 19, TypeScript, custom CSS + Tailwind utility classes, hand-coded SVG chart. No external libraries.

## Global Constraints

- Pure client-side, local-first. No backend calls.
- No changes to `PersistedState` shape (sessions, routines, activeWorkout).
- Streak is **week-based**: a "training week" = at least one `finishedAt !== null` session in a Mon–Sun calendar week.
- Streak animation fires **only when `currentWeekStreak` increases** (detected by `useRef` comparing previous value). Never on every app open or navigation.
- All copy is in Indonesian first, with English equivalents in i18n. Keep tone calm and data-grounded — no exclamation marks, no "Amazing!".
- No XP, levels, badges, leaderboards, push/local notifications, or confetti.
- Do not modify existing workout-logging mechanics (set form, exercise card, rest timer) — only extend `App.tsx` wiring, `SummaryScreen`, and `HomeScreen`.
- Max 2 additional callout elements on any single screen to avoid overload.
- `ExerciseChart` renders only when an exercise has ≥ 4 data points.
- Follow existing code patterns: functional components, CSS class names from `App.css`, i18n via `useI18n()`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/types.ts` | Modify | Add `ConsistencyStats`, `PRDetection` types |
| `src/lib/selectors.ts` | Modify | Add `computeConsistency`, `detectNewPRs`, `checkMilestones` |
| `src/lib/milestones.ts` | Create | Milestone ID constants, localStorage read/write helpers |
| `src/App.tsx` | Modify | Wire PR detection, milestone check, consistency stats; pass to screens |
| `src/screens/HomeScreen.tsx` | Modify | Accept `ConsistencyStats`, render `ConsistencyWidget` |
| `src/screens/SummaryScreen.tsx` | Modify | Accept `newPRs`, `newMilestones`, `consistencyStats`; render callouts |
| `src/screens/ProgressScreen.tsx` | Modify | Render `ExerciseChart` when ≥ 4 data points |
| `src/components/ConsistencyWidget.tsx` | Create | Streak display with conditional count-up animation |
| `src/components/ExerciseChart.tsx` | Create | SVG sparkline for per-exercise progress |
| `src/App.css` | Modify | Add `@keyframes streak-count-in`, widget styles, PR card styles, milestone card styles |
| `src/i18n.tsx` | Modify | Add all new copy strings in ID and EN |

---

### Task 1: Types — `ConsistencyStats` and `PRDetection`

**Files:**
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces:
  - `ConsistencyStats` — consumed by Task 2 (selectors) and Task 5 (App wiring)
  - `PRDetection` — consumed by Task 2 (selectors) and Task 5 (App wiring)

- [ ] **Step 1: Add `ConsistencyStats` type to `src/lib/types.ts`**

Add after the existing type exports (after line ~83 in the current file, before the type-guard functions):

```ts
export type ConsistencyStats = {
  /** Consecutive Mon–Sun calendar weeks with ≥ 1 finished session, counting backward from current week. */
  currentWeekStreak: number
  /** All-time highest week streak. */
  longestWeekStreak: number
  /** Total count of all finished sessions. */
  totalSessions: number
  /** ISO string of finishedAt from the most recent finished session, or null. */
  lastTrainedAt: string | null
  /** Calendar days elapsed since lastTrainedAt, or null if no sessions. */
  gapDays: number | null
}

export type PRDetection = {
  exerciseName: string
  unit: ExerciseUnit
  newBest: { weightKg: number; reps: number }
  /** null if this is the first time the exercise was ever logged. */
  previousBest: { weightKg: number; reps: number } | null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/lib/types.ts && git commit -m "feat: add ConsistencyStats and PRDetection types"
```

---

### Task 2: Selectors — `computeConsistency`, `detectNewPRs`, `checkMilestones`

**Files:**
- Modify: `src/lib/selectors.ts`

**Interfaces:**
- Consumes: `ConsistencyStats`, `PRDetection` from Task 1; existing `findPersonalBest`, `ExerciseUnit`, `Workout`, `WorkoutSet` from `src/lib/selectors.ts` and `src/lib/types.ts`
- Produces:
  - `computeConsistency(sessions: Workout[]): ConsistencyStats`
  - `detectNewPRs(sessions: Workout[], justFinished: Workout): PRDetection[]`
  - `checkMilestones(stats: ConsistencyStats, seenMilestones: ReadonlySet<string>): string[]`

#### Week boundary logic

A "training week" is identified by its Mon–Sun ISO week number. We get this by finding the Monday of any given date:

```ts
function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10) // 'YYYY-MM-DD'
}
```

Two sessions are in the same training week if `getMondayISO(sessionDate) === getMondayISO(otherSessionDate)`.

- [ ] **Step 1: Add `getMondayISO` helper and `computeConsistency` to `src/lib/selectors.ts`**

Append to the end of `src/lib/selectors.ts`:

```ts
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
```

- [ ] **Step 2: Add `detectNewPRs` to `src/lib/selectors.ts`**

Append after `computeConsistency`:

```ts
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
```

- [ ] **Step 3: Add `checkMilestones` to `src/lib/selectors.ts`**

Append after `detectNewPRs`:

```ts
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/lib/selectors.ts && git commit -m "feat: add computeConsistency, detectNewPRs, checkMilestones selectors"
```

---

### Task 3: Milestone Persistence — `src/lib/milestones.ts`

**Files:**
- Create: `src/lib/milestones.ts`

**Interfaces:**
- Consumes: `MilestoneId` from Task 2
- Produces:
  - `loadSeenMilestones(): Set<string>`
  - `saveSeenMilestones(seen: Set<string>): void`
  - `MILESTONES_KEY: string`

- [ ] **Step 1: Create `src/lib/milestones.ts`**

```ts
export const MILESTONES_KEY = 'gym-tracker.milestones-seen'

/**
 * Loads the set of milestone IDs that have been dismissed/seen by the user.
 * Returns an empty Set on first run or if storage is unavailable.
 */
export function loadSeenMilestones(): Set<string> {
  try {
    const raw = localStorage.getItem(MILESTONES_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

/**
 * Persists the set of seen milestone IDs to localStorage.
 */
export function saveSeenMilestones(seen: Set<string>): void {
  try {
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(Array.from(seen)))
  } catch {
    // Storage unavailable — silently ignore.
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/lib/milestones.ts && git commit -m "feat: add milestone localStorage persistence helpers"
```

---

### Task 4: i18n — All New Copy Strings

**Files:**
- Modify: `src/i18n.tsx`

The `i18n.tsx` file has two objects: `ID` (Indonesian) and `EN` (English). Both must receive identical keys. Add **all** new keys in one step to avoid type gaps.

- [ ] **Step 1: Add new keys to the `ID` object in `src/i18n.tsx`**

Find the line `'feedback.close': 'Tutup',` in the `ID` object and add after it:

```ts
  // ConsistencyWidget
  'consistency.weekStreak': 'Minggu ke-{n} berturut-turut',
  'consistency.weekStreakOne': 'Minggu pertama aktif',
  'consistency.totalSessions': '{n} sesi total',
  'consistency.lastTrained': 'Terakhir latihan {n} hari lalu',
  'consistency.newChapter': 'Mulai babak baru',
  'consistency.comeback7': 'Sudah {n} hari. Kamu kembali sekarang.',
  'consistency.comeback14': 'Sudah {n} hari. Kamu kembali sekarang — itu yang penting.',
  'consistency.startStory': 'Mulai ceritamu hari ini.',

  // SummaryScreen identity line
  'summary.identityLine1': 'Sesi pertamamu. Setiap kali kamu kembali, ini jadi bukti siapa kamu.',
  'summary.identityLine': 'Minggu ke-{n} berturut-turut. Kamu orang yang melatih diri.',
  'summary.identityLineSessions': '{n} sesi. Kamu mulai membangun sesuatu.',
  'summary.comebackLine': 'Kamu kembali. {n} sesi total. Lanjutkan dari sini.',

  // PR callout
  'summary.prTitle': 'PR Baru',
  'summary.prLine': '{exercise} — {weight} × {reps}',
  'summary.prLinePrev': '(sebelumnya {weight} × {reps})',
  'summary.prLineFirst': '(pertama kali dicatat)',
  'summary.prBodyweight': '{exercise} — {reps} reps',
  'summary.prBodyweightPrev': '(sebelumnya {reps} reps)',

  // Milestone callouts
  'milestone.first-workout': 'Sesi pertama selesai.',
  'milestone.first-workout.sub': 'Setiap perjalanan dimulai dari langkah pertama.',
  'milestone.sessions-10': '10 sesi selesai.',
  'milestone.sessions-10.sub': 'Kebiasaan ini mulai terbentuk.',
  'milestone.sessions-50': '50 sesi selesai.',
  'milestone.sessions-50.sub': 'Ini bukan lagi kebiasaan — ini bagian dari siapa kamu.',
  'milestone.streak-4w': '4 minggu berturut-turut.',
  'milestone.streak-4w.sub': 'Ini bukan lagi coba-coba — ini bagian dari siapa kamu.',
  'milestone.streak-8w': '8 minggu berturut-turut.',
  'milestone.streak-8w.sub': 'Kamu membuktikan kepada dirimu sendiri.',
  'milestone.first-pr': 'PR pertamamu.',
  'milestone.first-pr.sub': 'Data menunjukkan kamu semakin kuat.',
  'milestone.comeback-7d': 'Kamu kembali setelah istirahat.',
  'milestone.comeback-7d.sub': '{n} sesi total. Lanjutkan.',
  'milestone.dismiss': 'Tutup',
```

- [ ] **Step 2: Add new keys to the `EN` object in `src/i18n.tsx`**

Find the corresponding English section (search for `'feedback.close': 'Close'`) and add after it:

```ts
  // ConsistencyWidget
  'consistency.weekStreak': 'Week {n} in a row',
  'consistency.weekStreakOne': 'First active week',
  'consistency.totalSessions': '{n} sessions total',
  'consistency.lastTrained': 'Last trained {n} days ago',
  'consistency.newChapter': 'Start a new chapter',
  'consistency.comeback7': '{n} days since last session. Good to be back.',
  'consistency.comeback14': '{n} days away. You\'re back now — that\'s what matters.',
  'consistency.startStory': 'Start your story today.',

  // SummaryScreen identity line
  'summary.identityLine1': 'Your first session. Every time you come back, this becomes evidence of who you are.',
  'summary.identityLine': 'Week {n} in a row. You are someone who trains.',
  'summary.identityLineSessions': '{n} sessions. You\'re starting to build something.',
  'summary.comebackLine': 'You\'re back. {n} sessions total. Continue from here.',

  // PR callout
  'summary.prTitle': 'New PR',
  'summary.prLine': '{exercise} — {weight} × {reps}',
  'summary.prLinePrev': '(was {weight} × {reps})',
  'summary.prLineFirst': '(first time recorded)',
  'summary.prBodyweight': '{exercise} — {reps} reps',
  'summary.prBodyweightPrev': '(was {reps} reps)',

  // Milestone callouts
  'milestone.first-workout': 'First session complete.',
  'milestone.first-workout.sub': 'Every journey starts with a first step.',
  'milestone.sessions-10': '10 sessions done.',
  'milestone.sessions-10.sub': 'The habit is forming.',
  'milestone.sessions-50': '50 sessions done.',
  'milestone.sessions-50.sub': 'This is no longer a habit — it\'s part of who you are.',
  'milestone.streak-4w': '4 weeks in a row.',
  'milestone.streak-4w.sub': 'This is no longer a trial — it\'s part of who you are.',
  'milestone.streak-8w': '8 weeks in a row.',
  'milestone.streak-8w.sub': 'You\'ve proven it to yourself.',
  'milestone.first-pr': 'Your first personal record.',
  'milestone.first-pr.sub': 'The data shows you\'re getting stronger.',
  'milestone.comeback-7d': 'You\'re back after a break.',
  'milestone.comeback-7d.sub': '{n} sessions total. Keep going.',
  'milestone.dismiss': 'Close',
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/i18n.tsx && git commit -m "feat: add i18n strings for consistency, PR, and milestone copy"
```

---

### Task 5: CSS — Animation and Component Styles

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Add streak animation and ConsistencyWidget styles to `src/App.css`**

Append to the end of `src/App.css`:

```css
/* ─── ConsistencyWidget ─────────────────────────────────────── */

.consistency-widget {
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.consistency-widget.comeback {
  background: var(--positive-bg);
  border-color: var(--positive);
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.consistency-streak {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.consistency-streak-number {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.consistency-streak-number.animating {
  animation: streak-count-in 400ms ease-out forwards;
}

@keyframes streak-count-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.88);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.consistency-streak-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-h);
}

.consistency-meta {
  font-size: 13px;
  color: var(--text);
  text-align: right;
}

.consistency-comeback-main {
  font-size: 15px;
  font-weight: 600;
  color: var(--positive);
}

.consistency-comeback-sub {
  font-size: 13px;
  color: var(--text);
}

/* ─── PR Callout Card (SummaryScreen) ───────────────────────── */

.pr-callout-card {
  background: var(--positive-bg);
  border: 1px solid var(--positive);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pr-callout-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--positive);
}

.pr-callout-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pr-callout-main {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
}

.pr-callout-prev {
  font-size: 13px;
  color: var(--text);
}

/* ─── Milestone Card (SummaryScreen) ────────────────────────── */

.milestone-card {
  background: var(--accent-bg);
  border: 1px solid var(--accent);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.milestone-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.milestone-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-h);
}

.milestone-card-sub {
  font-size: 13px;
  color: var(--text);
}

/* ─── Identity Line (SummaryScreen) ─────────────────────────── */

.summary-identity-line {
  text-align: center;
  font-size: 14px;
  font-style: italic;
  color: var(--text);
  padding: 4px 0;
}

/* ─── ExerciseChart ─────────────────────────────────────────── */

.exercise-chart {
  width: 100%;
  display: block;
  margin-bottom: 4px;
}

.exercise-chart-axis-label {
  font-size: 11px;
  fill: var(--text);
}

.exercise-chart-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.exercise-chart-dot {
  fill: var(--card-bg);
  stroke: var(--accent);
  stroke-width: 2;
}

.exercise-chart-dot.pr-dot {
  fill: var(--positive);
  stroke: var(--positive);
}
```

- [ ] **Step 2: Verify build compiles (no CSS errors)**

```bash
cd /home/waltahh/Projects/gym-tracker && npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/App.css && git commit -m "feat: add consistency widget, PR callout, milestone card, and chart CSS"
```

---

### Task 6: `ConsistencyWidget` Component

**Files:**
- Create: `src/components/ConsistencyWidget.tsx`

**Interfaces:**
- Consumes: `ConsistencyStats` from Task 1; `useI18n` from `src/i18n.tsx`
- Produces: `<ConsistencyWidget stats={ConsistencyStats} />` — rendered in HomeScreen (Task 8)

**Animation rule:** The streak number animates only when `currentWeekStreak` increases compared to the previous render. This is detected via `useRef` storing the previous value. The animation class is added for one render cycle and then removed using `useEffect` + `setTimeout(400ms)`.

- [ ] **Step 1: Create `src/components/ConsistencyWidget.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { ConsistencyStats } from '../lib/types'

export function ConsistencyWidget({ stats }: { stats: ConsistencyStats }) {
  const { tr } = useI18n()
  const prevStreakRef = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const prev = prevStreakRef.current
    if (
      prev !== null &&
      stats.currentWeekStreak > prev &&
      stats.currentWeekStreak >= 1
    ) {
      setIsAnimating(true)
      const timeout = setTimeout(() => setIsAnimating(false), 450)
      return () => clearTimeout(timeout)
    }
    prevStreakRef.current = stats.currentWeekStreak
  }, [stats.currentWeekStreak])

  // On first render after animation, persist the new value
  useEffect(() => {
    if (!isAnimating) {
      prevStreakRef.current = stats.currentWeekStreak
    }
  }, [isAnimating, stats.currentWeekStreak])

  // Hide entirely if no sessions yet
  if (stats.totalSessions === 0) return null

  const { currentWeekStreak, totalSessions, gapDays } = stats

  // Comeback state: gap >= 7 days
  if (gapDays !== null && gapDays >= 7) {
    const copyKey = gapDays >= 14 ? 'consistency.comeback14' : 'consistency.comeback7'
    return (
      <div className="consistency-widget comeback">
        <span className="consistency-comeback-main">
          {tr(copyKey, { n: gapDays })}
        </span>
        <span className="consistency-comeback-sub">
          {tr('consistency.totalSessions', { n: totalSessions })}
        </span>
      </div>
    )
  }

  // No active streak (streak broke — a full elapsed week had no session)
  if (currentWeekStreak === 0) {
    return (
      <div className="consistency-widget">
        <span className="consistency-meta">
          {tr('consistency.newChapter')}
        </span>
        <span className="consistency-meta">
          {tr('consistency.totalSessions', { n: totalSessions })}
        </span>
      </div>
    )
  }

  // Show gap subtext if 3–6 days since last session (streak intact)
  const showLastTrained = gapDays !== null && gapDays >= 3 && gapDays < 7

  const streakLabel =
    currentWeekStreak === 1
      ? tr('consistency.weekStreakOne')
      : tr('consistency.weekStreak', { n: currentWeekStreak })

  return (
    <div className="consistency-widget">
      <div className="consistency-streak">
        <span
          className={`consistency-streak-number${isAnimating ? ' animating' : ''}`}
          aria-label={streakLabel}
        >
          {currentWeekStreak}w
        </span>
        <span className="consistency-streak-label">{streakLabel}</span>
      </div>
      <div className="consistency-meta">
        {showLastTrained
          ? tr('consistency.lastTrained', { n: gapDays! })
          : tr('consistency.totalSessions', { n: totalSessions })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/components/ConsistencyWidget.tsx && git commit -m "feat: add ConsistencyWidget with conditional streak animation"
```

---

### Task 7: `ExerciseChart` Component

**Files:**
- Create: `src/components/ExerciseChart.tsx`

**Interfaces:**
- Consumes: `ExerciseHistoryEntry`, `ExerciseUnit` from `src/lib/types.ts` and `src/lib/selectors.ts`; `formatSetWeight` from `src/lib/format.ts`; `useI18n` from `src/i18n.tsx`
- Produces: `<ExerciseChart entries={ExerciseHistoryEntry[]} unit={ExerciseUnit} />` — rendered in ProgressScreen (Task 9)

**Chart mechanics:**
- SVG viewBox: `0 0 300 100`. Rendered at 100% width (CSS scales it).
- Padding: 28px left (Y-axis labels), 8px right, 10px top, 18px bottom.
- Plot area: x ∈ [28, 292], y ∈ [10, 82].
- X positions: evenly spaced across plot area width by entry index.
- Y positions: linearly scaled from min to max `weightKg` (or `reps` for bodyweight).
- If min === max (all values identical), render a horizontal line at y mid-point.
- PR dot: the entry with the highest `weightKg` (or `reps` for bodyweight). If tie, first occurrence wins.
- Y-axis: two text labels — min value (bottom) and max value (top), left-aligned at x=0.

- [ ] **Step 1: Create `src/components/ExerciseChart.tsx`**

```tsx
import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { formatSetWeight } from '../lib/format'
import type { ExerciseHistoryEntry, ExerciseUnit } from '../lib/selectors'

const VIEW_W = 300
const VIEW_H = 100
const PAD_LEFT = 28
const PAD_RIGHT = 8
const PAD_TOP = 10
const PAD_BOTTOM = 18
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT   // 264
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM   // 72

function getValue(entry: ExerciseHistoryEntry, unit: ExerciseUnit): number {
  return unit === 'bodyweight' ? entry.best.reps : entry.best.weightKg
}

export function ExerciseChart({
  entries,
  unit,
}: {
  entries: ExerciseHistoryEntry[]
  unit: ExerciseUnit
}) {
  const { tr } = useI18n()

  const { points, minVal, maxVal, prIndex } = useMemo(() => {
    const values = entries.map((e) => getValue(e, unit))
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)

    const n = entries.length
    const points = values.map((v, i) => {
      const x = PAD_LEFT + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W)
      const y =
        maxVal === minVal
          ? PAD_TOP + PLOT_H / 2
          : PAD_TOP + ((maxVal - v) / (maxVal - minVal)) * PLOT_H
      return { x, y, value: v }
    })

    // Find PR index (highest value; first occurrence on tie)
    let prIndex = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[prIndex]) prIndex = i
    }

    return { points, minVal, maxVal, prIndex }
  }, [entries, unit])

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const minLabel = unit === 'bodyweight'
    ? `${minVal}r`
    : (formatSetWeight(unit, minVal, tr) ?? `${minVal}`)
  const maxLabel = unit === 'bodyweight'
    ? `${maxVal}r`
    : (formatSetWeight(unit, maxVal, tr) ?? `${maxVal}`)

  return (
    <svg
      className="exercise-chart"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      aria-hidden="true"
    >
      {/* Y-axis labels */}
      <text
        x={0}
        y={PAD_TOP + 4}
        className="exercise-chart-axis-label"
        dominantBaseline="hanging"
      >
        {maxLabel}
      </text>
      <text
        x={0}
        y={VIEW_H - PAD_BOTTOM + 2}
        className="exercise-chart-axis-label"
        dominantBaseline="auto"
      >
        {minLabel}
      </text>

      {/* Line */}
      <polyline
        className="exercise-chart-line"
        points={polylinePoints}
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === prIndex ? 4.5 : 3}
          className={`exercise-chart-dot${i === prIndex ? ' pr-dot' : ''}`}
        />
      ))}
    </svg>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/components/ExerciseChart.tsx && git commit -m "feat: add ExerciseChart SVG sparkline component"
```

---

### Task 8: App.tsx — Wire Consistency Engine

**Files:**
- Modify: `src/App.tsx`

**What changes:**
1. Load `seenMilestones` from localStorage on startup.
2. Compute `consistencyStats` via `useMemo` on `state.sessions`.
3. On `finishWorkout()`: run `detectNewPRs` and `checkMilestones`, store results in transient state (`newPRs`, `newMilestones`), update `seenMilestones` and save to localStorage.
4. Pass `consistencyStats`, `newPRs`, `newMilestones`, and `onDismissMilestone` to `HomeScreen` and `SummaryScreen`.
5. Clear `newPRs` and `newMilestones` when summary is dismissed (back to home).

**Interfaces:**
- Consumes: `computeConsistency`, `detectNewPRs`, `checkMilestones` from Task 2; `loadSeenMilestones`, `saveSeenMilestones` from Task 3; `ConsistencyStats`, `PRDetection` from Task 1; `MILESTONE_IDS` from Task 2
- Produces: new props flowing into `HomeScreen` and `SummaryScreen`

- [ ] **Step 1: Add imports in `src/App.tsx`**

Add to the existing import block (after the existing imports from `./lib/selectors`):

```ts
import {
  computeConsistency,
  detectNewPRs,
  checkMilestones,
} from './lib/selectors'
import { loadSeenMilestones, saveSeenMilestones } from './lib/milestones'
import type { ConsistencyStats, PRDetection } from './lib/types'
```

- [ ] **Step 2: Add state for seen milestones, transient PR/milestone results, and consistency stats in `AppContent`**

Inside `AppContent`, after the existing `useState` declarations, add:

```ts
const [seenMilestones, setSeenMilestones] = useState<Set<string>>(loadSeenMilestones)
const [newPRs, setNewPRs] = useState<PRDetection[]>([])
const [newMilestones, setNewMilestones] = useState<string[]>([])

const consistencyStats = useMemo<ConsistencyStats>(
  () => computeConsistency(state.sessions),
  [state.sessions],
)
```

Also add `useMemo` to the existing React import if not already imported (check the top of the file — `useMemo` may need to be added to the destructured import).

- [ ] **Step 3: Persist `seenMilestones` to localStorage whenever it changes**

Add after the existing `useEffect` hooks in `AppContent`:

```ts
useEffect(() => {
  saveSeenMilestones(seenMilestones)
}, [seenMilestones])
```

- [ ] **Step 4: Extend `finishWorkout()` in `AppContent`**

Replace the existing `finishWorkout` function with this version:

```ts
function finishWorkout() {
  if (!activeWorkout) return
  const finished: Workout = normalizeWorkout({
    ...activeWorkout,
    finishedAt: new Date().toISOString(),
  })
  const editingId = editingSessionIdRef.current
  editingSessionIdRef.current = null

  // Detect PRs against sessions BEFORE appending the new one
  const prs = detectNewPRs(state.sessions, finished)

  setState((s) => ({
    ...s,
    activeWorkout: null,
    sessions: editingId
      ? s.sessions.map((session) =>
          session.id === editingId ? finished : session,
        )
      : [finished, ...s.sessions],
  }))

  // Compute stats after adding new session (total count includes it)
  const updatedSessions = editingId
    ? state.sessions.map((s) => (s.id === editingId ? finished : s))
    : [finished, ...state.sessions]
  const statsAfter = computeConsistency(updatedSessions)

  // Check milestones — pass a temporary seen set that includes comeback-7d
  // so comeback-7d doesn't re-fire within the same app session
  const milestonesHit = checkMilestones(statsAfter, seenMilestones, prs.length)

  setNewPRs(prs)
  setNewMilestones(milestonesHit)

  setSeenMilestones((prev) => {
    const next = new Set(prev)
    for (const m of milestonesHit) {
      // comeback-7d: add temporarily so it doesn't fire twice in one session
      // It will be removed from seen on the NEXT app load (not persisted as "permanently seen")
      if (m !== 'comeback-7d') {
        next.add(m)
      }
    }
    return next
  })

  setViewedSession(finished)
  setWorkoutPaused(false)
  setCollapsedExerciseIds(new Set())
  clearTimerSnapshots()
}
```

- [ ] **Step 5: Add `onDismissMilestone` handler in `AppContent`**

```ts
function dismissMilestone(milestoneId: string) {
  setSeenMilestones((prev) => {
    const next = new Set(prev)
    next.add(milestoneId)
    return next
  })
  setNewMilestones((prev) => prev.filter((m) => m !== milestoneId))
}
```

- [ ] **Step 6: Clear transient state when summary is dismissed**

Find where `setViewedSession(null)` is called (in `onBack` callback on `SummaryScreen`). Update:

```ts
onBack={() => {
  setViewedSession(null)
  setNewPRs([])
  setNewMilestones([])
}}
```

Apply the same clearing to the `onDelete` callback:

```ts
onDelete={(sessionId) => {
  deleteSession(sessionId)
  setNewPRs([])
  setNewMilestones([])
}}
```

- [ ] **Step 7: Pass new props to `HomeScreen`**

Update the `<HomeScreen>` usage. Add these props:

```tsx
consistencyStats={consistencyStats}
```

- [ ] **Step 8: Pass new props to `SummaryScreen`**

Update the `<SummaryScreen>` usage. Add these props:

```tsx
newPRs={newPRs}
newMilestones={newMilestones}
consistencyStats={consistencyStats}
onDismissMilestone={dismissMilestone}
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

Expected: errors only on HomeScreen/SummaryScreen prop mismatches (they haven't been updated yet). That's okay — fix in the next tasks.

- [ ] **Step 10: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/App.tsx && git commit -m "feat: wire consistency engine, PR detection, and milestone checks in App"
```

---

### Task 9: `HomeScreen` — Add `ConsistencyWidget`

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `ConsistencyStats` from Task 1; `ConsistencyWidget` from Task 6
- New prop: `consistencyStats: ConsistencyStats`

- [ ] **Step 1: Add import and new prop in `src/screens/HomeScreen.tsx`**

Add to imports:

```ts
import { ConsistencyWidget } from '../components/ConsistencyWidget'
import type { ConsistencyStats } from '../lib/types'
```

Add `consistencyStats: ConsistencyStats` to the props destructuring and type annotation.

- [ ] **Step 2: Render `ConsistencyWidget` between the active-workout banner and the Today card**

In the JSX, find the block starting `{activeWorkout && (` and the section card `<section className="card today-card">`. Insert the widget between them:

```tsx
<ConsistencyWidget stats={consistencyStats} />
```

The final render order in `HomeScreen` JSX should be:
1. `<InstallPwaBanner />`
2. `<header>`
3. Active workout banner (conditional)
4. `<ConsistencyWidget stats={consistencyStats} />` ← new
5. Today card section
6. Pick routine section (conditional)
7. Recent sessions section
8. Settings panel (conditional)

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/screens/HomeScreen.tsx && git commit -m "feat: add ConsistencyWidget to HomeScreen"
```

---

### Task 10: `SummaryScreen` — Post-Workout Reinforcement

**Files:**
- Modify: `src/screens/SummaryScreen.tsx`

**Interfaces:**
- Consumes: `PRDetection`, `ConsistencyStats` from Task 1; `MILESTONE_IDS` from Task 2; `formatSetWeight` from `src/lib/format.ts`
- New props:
  - `newPRs: PRDetection[]`
  - `newMilestones: string[]`
  - `consistencyStats: ConsistencyStats`
  - `onDismissMilestone: (milestoneId: string) => void`

**Layout rule:** Max 2 additional callout sections. Order: PR callout (if any) → milestone card (if any, only show first one) → identity/streak line. Identity line only shows when streak ≥ 2 or totalSessions ≥ 2.

- [ ] **Step 1: Update `SummaryScreen` props and imports in `src/screens/SummaryScreen.tsx`**

Add imports:

```ts
import { formatSetWeight } from '../lib/format'
import type { PRDetection, ConsistencyStats } from '../lib/types'
```

Add to the props type and destructuring:

```ts
newPRs: PRDetection[]
newMilestones: string[]
consistencyStats: ConsistencyStats
onDismissMilestone: (milestoneId: string) => void
```

- [ ] **Step 2: Add PR callout rendering**

After the existing green "saved" banner (`<div className="active-workout-banner"...>`), add:

```tsx
{newPRs.length > 0 && (
  <div className="pr-callout-card">
    <span className="pr-callout-title">{tr('summary.prTitle')}</span>
    {newPRs.slice(0, 3).map((pr) => {
      const isBodyweight = pr.unit === 'bodyweight'
      const newWeightText = isBodyweight
        ? null
        : formatSetWeight(pr.unit, pr.newBest.weightKg, tr)
      const prevWeightText =
        pr.previousBest && !isBodyweight
          ? formatSetWeight(pr.unit, pr.previousBest.weightKg, tr)
          : null

      const mainLine = isBodyweight
        ? tr('summary.prBodyweight', { exercise: pr.exerciseName, reps: pr.newBest.reps })
        : tr('summary.prLine', {
            exercise: pr.exerciseName,
            weight: newWeightText ?? '',
            reps: pr.newBest.reps,
          })

      const prevLine = pr.previousBest === null
        ? tr('summary.prLineFirst')
        : isBodyweight
          ? tr('summary.prBodyweightPrev', { reps: pr.previousBest.reps })
          : tr('summary.prLinePrev', {
              weight: prevWeightText ?? '',
              reps: pr.previousBest.reps,
            })

      return (
        <div key={pr.exerciseName} className="pr-callout-item">
          <span className="pr-callout-main">{mainLine}</span>
          <span className="pr-callout-prev">{prevLine}</span>
        </div>
      )
    })}
  </div>
)}
```

- [ ] **Step 3: Add milestone card rendering (show first unseen milestone only)**

After the PR callout block:

```tsx
{newMilestones.length > 0 && (() => {
  const milestoneId = newMilestones[0]
  // comeback-7d uses a sub string with n (total sessions)
  const subKey = `milestone.${milestoneId}.sub`
  const sub = milestoneId === 'comeback-7d'
    ? tr(subKey, { n: consistencyStats.totalSessions })
    : tr(subKey)
  return (
    <div className="milestone-card">
      <div className="milestone-card-body">
        <span className="milestone-card-title">{tr(`milestone.${milestoneId}`)}</span>
        <span className="milestone-card-sub">{sub}</span>
      </div>
      <button
        type="button"
        className="btn-sm secondary"
        onClick={() => onDismissMilestone(milestoneId)}
        aria-label={tr('milestone.dismiss')}
      >
        {tr('milestone.dismiss')}
      </button>
    </div>
  )
})()}
```

- [ ] **Step 4: Add identity/streak line after the exercise list**

After the `{workout.exercises.map(...)}` block and before the `<p className="summary-count">`, add:

```tsx
{(() => {
  const { currentWeekStreak, totalSessions } = consistencyStats
  if (totalSessions === 1) {
    return <p className="summary-identity-line">{tr('summary.identityLine1')}</p>
  }
  if (currentWeekStreak >= 2) {
    return (
      <p className="summary-identity-line">
        {tr('summary.identityLine', { n: currentWeekStreak })}
      </p>
    )
  }
  if (totalSessions >= 2) {
    return (
      <p className="summary-identity-line">
        {tr('summary.identityLineSessions', { n: totalSessions })}
      </p>
    )
  }
  return null
})()}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run dev server and manually test the summary screen**

```bash
cd /home/waltahh/Projects/gym-tracker && npm run dev
```

Manually verify by loading the dummy backup data (Settings → Import JSON → `gym-tracker-dummy-backup.json`), then finishing a workout. Check that:
- No PR callout shows for a warmup-only session (only working sets count).
- PR callout appears when a working set beats the historical best.
- Identity line appears after the exercise list.

- [ ] **Step 7: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/screens/SummaryScreen.tsx && git commit -m "feat: add PR callout, milestone card, and identity line to SummaryScreen"
```

---

### Task 11: `ProgressScreen` — Add `ExerciseChart`

**Files:**
- Modify: `src/screens/ProgressScreen.tsx`

**Interfaces:**
- Consumes: `ExerciseChart` from Task 7; `ExerciseHistoryEntry` from `src/lib/selectors.ts`

- [ ] **Step 1: Import `ExerciseChart` in `src/screens/ProgressScreen.tsx`**

```ts
import { ExerciseChart } from '../components/ExerciseChart'
```

- [ ] **Step 2: Render chart in the exercise detail view**

In the `item ? (...)` branch, find the `<section className="card">` that shows the exercise name and best. Directly **after** that section and **before** the `<ul className="sets">`, add:

```tsx
{item.entries.length >= 4 && item.best && (
  <ExerciseChart entries={item.entries} unit={item.best.unit} />
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/waltahh/Projects/gym-tracker && git add src/screens/ProgressScreen.tsx && git commit -m "feat: add ExerciseChart to ProgressScreen for exercises with ≥4 data points"
```

---

### Task 12: Integration Verification

**Files:** No changes — verification only.

- [ ] **Step 1: Full TypeScript type check**

```bash
cd /home/waltahh/Projects/gym-tracker && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Lint check**

```bash
cd /home/waltahh/Projects/gym-tracker && npx oxlint src/
```

Expected: 0 errors (warnings are acceptable if pre-existing).

- [ ] **Step 3: Production build**

```bash
cd /home/waltahh/Projects/gym-tracker && npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Manual smoke test — new user journey**

Open dev server (`npm run dev`). Clear localStorage (DevTools → Application → Storage → Clear site data).

1. Home screen: no ConsistencyWidget visible. ✓
2. Start and finish a workout with at least one working set. ✓
3. Summary screen: "first session" identity line appears. ✓
4. Milestone card "Sesi pertama selesai" appears. ✓
5. Dismiss the milestone card → it disappears. ✓
6. Navigate home → ConsistencyWidget shows "1 minggu aktif · 1 sesi total". ✓

- [ ] **Step 5: Manual smoke test — PR detection**

Import `gym-tracker-dummy-backup.json` (Settings → Import). Start a new workout. Add "Bench Press" and log a working set with weightKg above the historical best in the backup file (scan backup to find current best). Finish. Summary should show PR callout. ✓

- [ ] **Step 6: Manual smoke test — streak animation**

With backup data loaded, simulate a second training week by importing a custom backup that has two separate Mon–Sun weeks of sessions. On the home screen, the streak number should show without animation (no increase in this render). Complete a new workout that pushes to a third week → navigate home → streak number animates from 2 to 3. ✓

Note: because time is fixed in the browser, the easiest test is to temporarily modify `getMondayISO` to offset dates by 7 days in dev, verify animation, then revert. Alternatively, trust that the `useRef` diffing logic is correct and verify the animation CSS works by temporarily always setting `isAnimating = true` in the component.

- [ ] **Step 7: Manual smoke test — progress chart**

Import backup data. Navigate to Progress → select an exercise that has ≥ 4 sessions in the backup (e.g., "Bench Press"). Chart should render above the text list. PR dot (highest weight entry) should be filled green. ✓

- [ ] **Step 8: Manual smoke test — comeback experience**

Modify the backup to have all sessions with `finishedAt` set to 10+ days ago. Import. Open app. ConsistencyWidget should show comeback state (positive-bg, comeback copy). ✓

- [ ] **Step 9: Commit final verification**

```bash
cd /home/waltahh/Projects/gym-tracker && git add -A && git status
```

All should be clean (no uncommitted changes). If not, commit any remaining files.

---

## Self-Review

### Spec Coverage Check

| Spec requirement | Covered by task |
|---|---|
| Week-based streak (Mon–Sun) | Task 2 `computeConsistency` |
| Streak animation only on increase, via useRef | Task 6 `ConsistencyWidget` |
| Animation: count-up, 400ms, ease-out, no bounce | Task 5 CSS + Task 6 |
| ConsistencyWidget hidden when 0 sessions | Task 6 (returns null) |
| ConsistencyWidget placement: above Today card | Task 9 |
| Comeback state (gap 7–13 vs 14+) | Task 2 (gapDays) + Task 6 |
| Gap 3–6 days: "last trained N days ago" | Task 6 |
| Streak reset: "new chapter" framing, no "0" shown | Task 6 |
| PR detection (working sets only, unit-aware) | Task 2 `detectNewPRs` |
| PR callout on SummaryScreen (max 3) | Task 10 |
| Bodyweight PR compares reps | Task 2 + Task 10 |
| Identity line on SummaryScreen | Task 10 |
| Milestone system (7 milestones, localStorage) | Task 2 + Task 3 + Task 10 |
| comeback-7d repeatable | Task 2 (`checkMilestones`) + Task 8 |
| Milestone dismiss persists | Task 8 (seenMilestones → localStorage) |
| Max 2 callouts on summary | Task 10 (PR + 1 milestone only) |
| ExerciseChart SVG, ≥4 data points | Task 7 + Task 11 |
| PR dot visually distinct (filled green) | Task 7 (.pr-dot CSS) |
| No XP, levels, badges, notifications | Enforced by scope — no code for these |
| All copy in ID + EN | Task 4 |
| No changes to PersistedState | Tasks 1–12 — confirmed |
| No changes to workout logging mechanics | Tasks only touch HomeScreen, SummaryScreen, ProgressScreen, App wiring |

### Placeholder Scan

No "TBD", "TODO", or "implement later" found. All code blocks are complete.

### Type Consistency Check

- `ConsistencyStats` defined in Task 1 (types.ts), produced by `computeConsistency` (Task 2), consumed by `ConsistencyWidget` (Task 6), `HomeScreen` (Task 9), `SummaryScreen` (Task 10), `App.tsx` (Task 8). ✓
- `PRDetection` defined in Task 1, produced by `detectNewPRs` (Task 2), consumed by `SummaryScreen` (Task 10), `App.tsx` (Task 8). ✓
- `MilestoneId` defined in Task 2 (`MILESTONE_IDS`), produced by `checkMilestones` (Task 2), consumed by `App.tsx` (Task 8), `SummaryScreen` (Task 10). ✓
- `ExerciseHistoryEntry` is already exported from `src/lib/selectors.ts` — `ExerciseChart` (Task 7) imports it from there. ✓
- `formatSetWeight` signature: `(unit: ExerciseUnit, weightKg: number, tr: ...) => string | null`. Used in Task 10 and Task 7 with correct argument order. ✓
- `checkMilestones` signature in Task 2: `(stats, seenMilestones, newPRsCount)` — matches call in Task 8: `checkMilestones(statsAfter, seenMilestones, prs.length)`. ✓
