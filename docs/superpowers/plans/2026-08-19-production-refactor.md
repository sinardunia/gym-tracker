# Production Readiness Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the monolith `App.tsx`/`data.ts`/`ExerciseCard.tsx`/`HomeScreen.tsx` into focused hooks, store, and components; add Vitest tests, an error boundary, and CI — with zero behavior change.

**Architecture:** Extract state mutations into `src/hooks/*`, wire them through `src/store/AppContext.tsx`, split `lib/data.ts` into `storage/backup/library/programs`, split oversized components, add test infra + CI.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest, Testing Library, oxlint, Bun.

## Global Constraints
- `bun run lint` must pass without errors.
- `bun run build` (`tsc -b && vite build`) must pass cleanly.
- Absolute paths for all file edits.
- **Zero behavior change** — pure extraction. Never alter logic while moving it.
- Screens keep existing prop interfaces.
- No new runtime dependencies. Dev deps allowed: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom.

---

### Task 1: Test Infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/lib/format.test.ts` (smoke test proving the pipeline works)

**Interfaces:**
- Produces: `bun test` / `bun test:watch` scripts; vitest runs `src/**/*.test.{ts,tsx}` in jsdom.

- [ ] **Step 1: Install dev dependencies**

```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Add test scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc -b"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Create smoke test `src/lib/format.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { countSets, formatTimer } from './format'
import type { Workout } from './types'

describe('countSets', () => {
  it('sums sets across exercises', () => {
    const workout = {
      id: '1',
      startedAt: '2026-01-01T00:00:00Z',
      finishedAt: null,
      exercises: [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [{ id: 's1', reps: 5, weightKg: 100, type: 'working' }],
        },
        {
          id: 'e2',
          name: 'Bench',
          unit: 'kg',
          sets: [
            { id: 's2', reps: 5, weightKg: 60, type: 'working' },
            { id: 's3', reps: 5, weightKg: 60, type: 'working' },
          ],
        },
      ],
    } as Workout
    expect(countSets(workout)).toBe(3)
  })
})

describe('formatTimer', () => {
  it('formats minutes and seconds', () => {
    expect(formatTimer(0)).toBe('0:00')
    expect(formatTimer(65)).toBe('1:05')
    expect(formatTimer(600)).toBe('10:00')
  })
})
```

- [ ] **Step 6: Run tests**

Run: `bun test`
Expected: 2 passing tests.

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock vitest.config.ts src/test/setup.ts src/lib/format.test.ts
git commit -m "test: add vitest + testing-library infrastructure"
```

---

### Task 2: Split `src/lib/data.ts`

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/backup.ts`
- Create: `src/lib/library.ts`
- Create: `src/lib/programs.ts`
- Delete: `src/lib/data.ts`
- Modify: `src/App.tsx` (imports), `src/screens/ProgramPickerScreen.tsx`, `src/lib/selectors.ts`, `src/components/BackupControls.tsx`

**Interfaces:**
- `storage.ts` exports: `STORAGE_KEY`, `STORAGE_KEY_V1`, `EMPTY_STATE`, `newId`, `createWorkout`, `loadState`, `saveState`, `loadAsyncState`
- `backup.ts` exports: `parseBackup`
- `library.ts` exports: `EXERCISE_LIBRARY`
- `programs.ts` exports: `PROGRAM_GOALS`, `PROGRAM_TEMPLATES`

- [ ] **Step 1: Create `src/lib/storage.ts`** — move verbatim from `data.ts`: imports (drop `parseBackup`-only deps: `isRoutine`, `isWorkout` stay; keep `isPersistedState`, `normalizeRoutine`, `normalizeWorkout`, types), `STORAGE_KEY`, `STORAGE_KEY_V1`, `EMPTY_STATE`, `newId`, `createWorkout`, `loadState`, `saveState`, `loadAsyncState`. Imports needed: `idb-keyval` (`get`, `set`), `isPersistedState`, `isRoutine`, `isWorkout`, `normalizeRoutine`, `normalizeWorkout`, types `PersistedState`, `Workout`.

- [ ] **Step 2: Create `src/lib/backup.ts`** — move `parseBackup` verbatim. Imports: `isPersistedState`, `normalizeRoutine`, `normalizeWorkout`, `PersistedState`.

- [ ] **Step 3: Create `src/lib/library.ts`** — move `EXERCISE_LIBRARY` verbatim. Import type `LibraryExercise`.

- [ ] **Step 4: Create `src/lib/programs.ts`** — move `PROGRAM_GOALS` and `PROGRAM_TEMPLATES` verbatim. Import types `ProgramGoal`, `ProgramTemplate`.

- [ ] **Step 5: Update import sites**

- `src/App.tsx` line 25-32: `import { createWorkout, newId } from './lib/storage'`, `import { loadAsyncState, loadState, saveState } from './lib/storage'`, `import { parseBackup } from './lib/backup'`
- `src/screens/ProgramPickerScreen.tsx` line 3: `from '../lib/programs'`
- `src/lib/selectors.ts` line 1: `from './library'`
- `src/components/BackupControls.tsx` line 3: `from '../lib/backup'`

- [ ] **Step 6: Delete `src/lib/data.ts`**

```bash
rm src/lib/data.ts
```

- [ ] **Step 7: Verify**

Run: `bun run build` — must pass cleanly. Run: `bun run lint` — must pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: split data.ts into storage/backup/library/programs"
```

---

### Task 3: Unit Tests for lib Modules

**Files:**
- Create: `src/lib/selectors.test.ts`
- Create: `src/lib/milestones.test.ts`
- Create: `src/lib/backup.test.ts`
- Create: `src/lib/storage.test.ts`

**Interfaces:**
- Consumes: functions from Task 2 modules, `computeConsistency`, `detectNewPRs`, `groupSetRows`, `suggestDrop`, `findPersonalBest`, `parseBackup`, `loadState`, `saveState`, `loadSeenMilestones`, `saveSeenMilestones`.

- [ ] **Step 1: Create `src/lib/selectors.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import {
  detectNewPRs,
  findPersonalBest,
  groupSetRows,
  suggestDrop,
} from './selectors'
import type { Workout, WorkoutSet } from './types'

function session(id: string, exercises: Workout['exercises']): Workout {
  return {
    id,
    startedAt: '2026-01-01T00:00:00Z',
    finishedAt: '2026-01-01T01:00:00Z',
    exercises,
  }
}

describe('groupSetRows', () => {
  it('groups dropsets under their parent working set', () => {
    const sets: WorkoutSet[] = [
      { id: 'w1', reps: 8, weightKg: 80, type: 'working' },
      { id: 'd1', reps: 6, weightKg: 60, type: 'dropset', parentId: 'w1' },
      { id: 'w2', reps: 8, weightKg: 80, type: 'working' },
    ]
    expect(groupSetRows(sets)).toEqual([
      { set: sets[0], drops: [sets[1]] },
      { set: sets[2], drops: [] },
    ])
  })

  it('orphan dropsets become standalone rows', () => {
    const sets: WorkoutSet[] = [
      { id: 'd1', reps: 6, weightKg: 60, type: 'dropset', parentId: 'missing' },
    ]
    expect(groupSetRows(sets)).toEqual([{ set: sets[0], drops: [] }])
  })
})

describe('suggestDrop', () => {
  it('suggests 85% of the parent weight rounded to 2.5', () => {
    const parent: WorkoutSet = { id: 'w', reps: 8, weightKg: 100, type: 'working' }
    expect(suggestDrop(parent, 'kg')).toBe(85)
  })

  it('suggests one plate lighter for plate unit', () => {
    const parent: WorkoutSet = { id: 'w', reps: 8, weightKg: 4, type: 'working' }
    expect(suggestDrop(parent, 'plate')).toBe(3)
  })

  it('returns null for bodyweight', () => {
    const parent: WorkoutSet = { id: 'w', reps: 8, weightKg: 0, type: 'working' }
    expect(suggestDrop(parent, 'bodyweight')).toBeNull()
  })
})

describe('findPersonalBest', () => {
  it('finds highest weight, tie-break by reps', () => {
    const sessions = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [
            { id: 'a', reps: 5, weightKg: 100, type: 'working' },
            { id: 'b', reps: 3, weightKg: 110, type: 'working' },
          ],
        },
      ]),
    ]
    expect(findPersonalBest(sessions, 'Squat', 'kg')).toEqual({
      weightKg: 110,
      reps: 3,
    })
  })

  it('ignores warmup and dropset sets', () => {
    const sessions = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [
            { id: 'a', reps: 10, weightKg: 60, type: 'warmup' },
            { id: 'b', reps: 8, weightKg: 120, type: 'dropset', parentId: 'x' },
            { id: 'c', reps: 5, weightKg: 100, type: 'working' },
          ],
        },
      ]),
    ]
    expect(findPersonalBest(sessions, 'Squat', 'kg')).toEqual({
      weightKg: 100,
      reps: 5,
    })
  })

  it('is case-insensitive on exercise name', () => {
    const sessions = [
      session('s1', [
        {
          id: 'e1',
          name: 'squat',
          unit: 'kg',
          sets: [{ id: 'a', reps: 5, weightKg: 100, type: 'working' }],
        },
      ]),
    ]
    expect(findPersonalBest(sessions, 'Squat', 'kg')).toEqual({
      weightKg: 100,
      reps: 5,
    })
  })
})

describe('detectNewPRs', () => {
  it('flags a heavier best as a new PR', () => {
    const prior = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [{ id: 'a', reps: 5, weightKg: 100, type: 'working' }],
        },
      ]),
    ]
    const finished = session('s2', [
      {
        id: 'e1',
        name: 'Squat',
        unit: 'kg',
        sets: [{ id: 'b', reps: 5, weightKg: 105, type: 'working' }],
      },
    ])
    const prs = detectNewPRs(prior, finished)
    expect(prs).toHaveLength(1)
    expect(prs[0]).toMatchObject({
      exerciseName: 'Squat',
      newBest: { weightKg: 105, reps: 5 },
    })
  })

  it('does not flag an equal or lighter weight', () => {
    const prior = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [{ id: 'a', reps: 5, weightKg: 100, type: 'working' }],
        },
      ]),
    ]
    const finished = session('s2', [
      {
        id: 'e1',
        name: 'Squat',
        unit: 'kg',
        sets: [{ id: 'b', reps: 5, weightKg: 100, type: 'working' }],
      },
    ])
    expect(detectNewPRs(prior, finished)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Create `src/lib/milestones.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadSeenMilestones, saveSeenMilestones } from './milestones'

describe('milestones storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('round-trips a set of ids', () => {
    saveSeenMilestones(new Set(['first-workout', 'sessions-10']))
    expect(loadSeenMilestones()).toEqual(
      new Set(['first-workout', 'sessions-10']),
    )
  })

  it('returns empty set when nothing stored', () => {
    expect(loadSeenMilestones()).toEqual(new Set())
  })

  it('ignores corrupt stored data', () => {
    localStorage.setItem('gym-tracker.milestones-seen', '{not json')
    expect(loadSeenMilestones()).toEqual(new Set())
  })
})
```

- [ ] **Step 3: Create `src/lib/backup.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'

describe('parseBackup', () => {
  it('returns null for invalid JSON', () => {
    expect(parseBackup('not json')).toBeNull()
  })

  it('returns null for wrong shape', () => {
    expect(parseBackup(JSON.stringify({ foo: 1 }))).toBeNull()
  })

  it('parses a valid backup and normalizes it', () => {
    const backup = JSON.stringify({
      activeWorkout: null,
      sessions: [],
      routines: [
        {
          id: 'r1',
          name: 'Push',
          days: [{ id: 'd1', name: 'Day A', exerciseNames: ['Bench Press'] }],
        },
      ],
      savedAt: '2026-01-01T00:00:00Z',
    })
    const result = parseBackup(backup)
    expect(result).not.toBeNull()
    expect(result?.routines[0]?.name).toBe('Push')
    expect(result?.routines[0]?.schedule).toEqual({})
  })

  it('rejects sessions with invalid sets', () => {
    const backup = JSON.stringify({
      activeWorkout: null,
      sessions: [
        {
          id: 's1',
          startedAt: '2026-01-01T00:00:00Z',
          finishedAt: null,
          exercises: [
            {
              id: 'e1',
              name: 'Squat',
              sets: [{ id: 'x', reps: 'five', weightKg: 100, type: 'working' }],
            },
          ],
        },
      ],
      routines: [],
    })
    expect(parseBackup(backup)).toBeNull()
  })
})
```

- [ ] **Step 4: Create `src/lib/storage.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_STATE, loadState, saveState, STORAGE_KEY } from './storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns EMPTY_STATE when nothing stored', () => {
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('round-trips state through localStorage with a savedAt stamp', () => {
    const state = { ...EMPTY_STATE, sessions: [] }
    saveState(state)
    const loaded = loadState()
    expect(loaded.sessions).toEqual([])
    expect(typeof loaded.savedAt).toBe('string')
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('returns EMPTY_STATE for corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{corrupt')
    expect(loadState()).toEqual(EMPTY_STATE)
  })
})
```

- [ ] **Step 5: Run all tests**

Run: `bun test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/*.test.ts
git commit -m "test: add unit tests for selectors, milestones, backup, storage"
```

---

### Task 4: Extract Hooks from `App.tsx`

**Files:**
- Create: `src/hooks/usePersistedState.ts`
- Create: `src/hooks/useDevSeedData.ts`
- Create: `src/hooks/useWorkoutActions.ts`
- Create: `src/hooks/useRoutineActions.ts`
- (Modify `App.tsx` in Task 5 — hooks must compile standalone first)

**Interfaces:**
- `usePersistedState(): { state, setState }` — state via `loadState`, auto-save on change, IDB merge on mount, `navigator.storage.persist()` call.
- `useDevSeedData(state, setState)` — dev-only dummy backup fetch (moved from App).
- `useWorkoutActions(state, setState): { startWorkout, finishWorkout, editSession, deleteSession, addExercise, addSet, removeSet, updateSet, removeExercise, renameExercise, changeExerciseUnit, moveExercise, updateWorkoutNote, updateExerciseNote, discardWorkout, takeLastFinished }`
- `useRoutineActions(state, setState): { addRoutine, applyTemplate, renameRoutine, deleteRoutine, addDay, renameDay, removeDay, setDaySchedule, moveDay, addExerciseToDay, removeExerciseFromDay, moveExerciseInDay }`

- [ ] **Step 1: Create `src/hooks/usePersistedState.ts`** — move from `App.tsx` lines 83 (state init), 104-134 (save + IDB merge), 177-179 (storage.persist):

```ts
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { loadAsyncState, loadState, saveState } from '../lib/storage'
import type { PersistedState } from '../lib/types'

export function usePersistedState(): {
  state: PersistedState
  setState: Dispatch<SetStateAction<PersistedState>>
} {
  const [state, setState] = useState<PersistedState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const idb = await loadAsyncState()
      if (cancelled || !idb) return
      setState((current) => {
        const localSavedAt = current.savedAt ? Date.parse(current.savedAt) : NaN
        const idbSavedAt = idb.savedAt ? Date.parse(idb.savedAt) : NaN
        const idbEmpty =
          idb.sessions.length === 0 &&
          idb.routines.length === 0 &&
          idb.activeWorkout === null
        const localEmpty =
          current.sessions.length === 0 &&
          current.routines.length === 0 &&
          current.activeWorkout === null
        if (!Number.isFinite(idbSavedAt)) return current
        if (idbEmpty && !localEmpty) return current
        if (!Number.isFinite(localSavedAt)) return idb
        if (idbSavedAt > localSavedAt) return idb
        return current
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => {})
  }, [])

  return { state, setState }
}
```

- [ ] **Step 2: Create `src/hooks/useDevSeedData.ts`** — move from `App.tsx` lines 136-152:

```ts
import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { parseBackup } from '../lib/backup'
import type { PersistedState } from '../lib/types'

export function useDevSeedData(
  state: PersistedState,
  setState: Dispatch<SetStateAction<PersistedState>>,
) {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (state.sessions.length > 0 || state.routines.length > 0) return
    let cancelled = false
    void fetch('gym-tracker-dummy-backup.json')
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return
        const backup = parseBackup(text)
        if (!backup) return
        setState(backup)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [state.sessions.length, state.routines.length, setState])
}
```

- [ ] **Step 3: Create `src/hooks/useWorkoutActions.ts`** — move the workout mutation functions verbatim from `App.tsx` (lines 181-464 minus `toggleExerciseCollapsed`). The `editingSessionIdRef` and `lastFinishedRef` move inside; expose `takeLastFinished()` that returns-and-clears the ref:

```ts
import { useRef, type Dispatch, type SetStateAction } from 'react'
import { useI18n } from '../i18n'
import { createWorkout, newId } from '../lib/storage'
import { normalizeWorkout } from '../lib/types'
import type {
  ExerciseUnit,
  PersistedState,
  SetType,
  Workout,
} from '../lib/types'

export function useWorkoutActions(
  state: PersistedState,
  setState: Dispatch<SetStateAction<PersistedState>>,
) {
  const editingSessionIdRef = useRef<string | null>(null)
  const lastFinishedRef = useRef<Workout | null>(null)

  function startWorkout(exerciseNames: string[] = [], routineId?: string, dayId?: string) {
    editingSessionIdRef.current = null
    setState((s) => ({
      ...s,
      activeWorkout: {
        ...createWorkout(),
        routineId,
        dayId,
        exercises: exerciseNames.map((name) => ({
          id: newId(),
          name,
          sets: [],
          unit: 'kg',
        })),
      },
    }))
  }

  function finishWorkout() {
    if (!state.activeWorkout) return
    const finished: Workout = normalizeWorkout({
      ...state.activeWorkout,
      finishedAt: new Date().toISOString(),
    })
    lastFinishedRef.current = finished
    const editingId = editingSessionIdRef.current
    editingSessionIdRef.current = null
    setState((s) => ({
      ...s,
      activeWorkout: null,
      sessions: editingId
        ? s.sessions.map((session) =>
            session.id === editingId ? finished : session,
          )
        : [finished, ...s.sessions],
    }))
  }

  function editSession(session: Workout) {
    editingSessionIdRef.current = session.id
    setState((s) => ({
      ...s,
      activeWorkout: normalizeWorkout({ ...session, finishedAt: null }),
    }))
  }

  function deleteSession(sessionId: string) {
    setState((s) => ({
      ...s,
      sessions: s.sessions.filter((session) => session.id !== sessionId),
    }))
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
    parentId?: string,
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
                      sets: [
                        ...e.sets,
                        { id: newId(), reps, weightKg, type, ...(parentId ? { parentId } : {}) },
                      ],
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
                  ? {
                      ...e,
                      sets: e.sets.filter(
                        (set) => set.id !== setId && set.parentId !== setId,
                      ),
                    }
                  : e,
              ),
            },
          }
        : s,
    )
  }

  function updateSet(
    exerciseId: string,
    setId: string,
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
              exercises: s.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e
                const target = e.sets.find((set) => set.id === setId)
                let parentId = target?.parentId
                if (type === 'dropset' && !parentId) {
                  for (let i = e.sets.length - 1; i >= 0; i -= 1) {
                    if (e.sets[i].type === 'working' && e.sets[i].id !== setId) {
                      parentId = e.sets[i].id
                      break
                    }
                  }
                }
                return {
                  ...e,
                  sets: e.sets.map((set) =>
                    set.id === setId
                      ? {
                          ...set,
                          reps,
                          weightKg,
                          type,
                          ...(type === 'dropset'
                            ? { parentId }
                            : { parentId: undefined }),
                        }
                      : set,
                  ),
                }
              }),
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

  function moveExercise(exerciseId: string, direction: -1 | 1) {
    setState((s) => {
      if (!s.activeWorkout) return s
      const exercises = [...s.activeWorkout.exercises]
      const index = exercises.findIndex((e) => e.id === exerciseId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= exercises.length) return s
      const [moved] = exercises.splice(index, 1)
      exercises.splice(target, 0, moved)
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises } }
    })
  }

  function updateWorkoutNote(note: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              note: note.trim() ? note : undefined,
            },
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
                e.id === exerciseId
                  ? { ...e, note: note.trim() ? note : undefined }
                  : e,
              ),
            },
          }
        : s,
    )
  }

  function discardWorkout() {
    editingSessionIdRef.current = null
    setState((s) => ({ ...s, activeWorkout: null }))
  }

  function takeLastFinished(): Workout | null {
    const finished = lastFinishedRef.current
    lastFinishedRef.current = null
    return finished
  }

  return {
    startWorkout,
    finishWorkout,
    editSession,
    deleteSession,
    addExercise,
    addSet,
    removeSet,
    updateSet,
    removeExercise,
    renameExercise,
    changeExerciseUnit,
    moveExercise,
    updateWorkoutNote,
    updateExerciseNote,
    discardWorkout,
    takeLastFinished,
  }
}
```

Note: `finishWorkout` reads `state.activeWorkout` from the closure — same behavior as App (it used the render-scope `activeWorkout`). Do NOT convert to functional setState; behavior must stay identical.

- [ ] **Step 4: Create `src/hooks/useRoutineActions.ts`** — move routine functions verbatim from `App.tsx` (lines 479-684). Uses `useI18n().tr` for default names:

```ts
import { type Dispatch, type SetStateAction } from 'react'
import { useI18n } from '../i18n'
import { newId } from '../lib/storage'
import type {
  PersistedState,
  ProgramTemplate,
  Routine,
  Weekday,
} from '../lib/types'

export function useRoutineActions(
  state: PersistedState,
  setState: Dispatch<SetStateAction<PersistedState>>,
) {
  const { tr } = useI18n()

  function addRoutine() {
    setState((s) => ({
      ...s,
      routines: [
        ...s.routines,
        { id: newId(), name: tr('routine.newName'), days: [], schedule: {} },
      ],
    }))
  }

  function applyTemplate(template: ProgramTemplate) {
    const days = template.days.map((day) => ({
      id: day.id ?? newId(),
      name: tr(day.name),
      exerciseNames: [...day.exerciseNames],
    }))
    const schedule: Partial<Record<Weekday, string>> = {}
    for (const [weekday, dayId] of Object.entries(template.schedule ?? {})) {
      const day = days.find((d) => d.id === dayId)
      if (day) schedule[Number(weekday) as Weekday] = day.id
    }
    const routine: Routine = {
      id: newId(),
      name: tr(template.title),
      days,
      schedule,
    }
    setState((s) => ({
      ...s,
      routines: [routine, ...s.routines],
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
                { id: newId(), name: tr('routine.newDayName'), exerciseNames: [] },
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

  return {
    addRoutine,
    applyTemplate,
    renameRoutine,
    deleteRoutine,
    addDay,
    renameDay,
    removeDay,
    setDaySchedule,
    moveDay,
    addExerciseToDay,
    removeExerciseFromDay,
    moveExerciseInDay,
  }
}
```

Note: `state` param is unused in this hook (all mutations are functional) — keep the param for signature symmetry with `useWorkoutActions`; prefix with underscore if lint complains.

- [ ] **Step 5: Verify hooks compile in isolation**

Run: `bunx tsc -b --noEmit` (App.tsx still uses its own copies; only `selectors.ts` import change from Task 2 affects compile).
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/
git commit -m "refactor: extract usePersistedState, useWorkoutActions, useRoutineActions hooks"
```

---

### Task 5: `AppContext` + Slim `App.tsx`

**Files:**
- Create: `src/store/AppContext.tsx`
- Rewrite: `src/App.tsx`

**Interfaces:**
- `AppProvider({ state, setState, workoutActions, routineActions, children })`
- `useApp(): AppContextValue` — throws if used outside provider.

- [ ] **Step 1: Create `src/store/AppContext.tsx`**

```tsx
import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { PersistedState } from '../lib/types'

export type WorkoutActions = ReturnType<
  typeof import('../hooks/useWorkoutActions').useWorkoutActions
>
export type RoutineActions = ReturnType<
  typeof import('../hooks/useRoutineActions').useRoutineActions
>

export type AppContextValue = {
  state: PersistedState
  setState: Dispatch<SetStateAction<PersistedState>>
  workoutActions: WorkoutActions
  routineActions: RoutineActions
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  state,
  setState,
  workoutActions,
  routineActions,
  children,
}: AppContextValue & { children: ReactNode }) {
  return (
    <AppContext.Provider
      value={{ state, setState, workoutActions, routineActions }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
```

Note: the `import('../hooks/...')` type-only trick avoids a runtime import cycle. If oxlint flags dynamic import types, replace with explicit named exports `export type WorkoutActions = {...}` from each hook file instead (add `export type WorkoutActions = ReturnType<typeof useWorkoutActions>` at the bottom of each hook file).

- [ ] **Step 2: Rewrite `src/App.tsx`** — keep `App()` (lang/theme + I18nProvider + UpdateBanner + Agentation) and write `AppContent` as a slim consumer:

```tsx
import { useEffect, useState } from 'react'
import { Agentation } from 'agentation'
import { I18nProvider, useI18n, LANG_KEY, type Lang } from './i18n'
import { HomeScreen } from './screens/HomeScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { PlanningScreen } from './screens/PlanningScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { BottomNav, type TabKey } from './components/BottomNav'
import { UpdateBanner } from './components/UpdateBanner'
import { clearTimerSnapshots } from './lib/timer'
import { normalizeWorkout, type ConsistencyStats, type PRDetection } from './lib/types'
import { useTheme, type Theme } from './lib/theme'
import { computeConsistency, detectNewPRs, checkMilestones } from './lib/selectors'
import { loadSeenMilestones, saveSeenMilestones } from './lib/milestones'
import { usePersistedState } from './hooks/usePersistedState'
import { useDevSeedData } from './hooks/useDevSeedData'
import { useWorkoutActions } from './hooks/useWorkoutActions'
import { useRoutineActions } from './hooks/useRoutineActions'
import { AppProvider, useApp } from './store/AppContext'
import './App.css'

function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'id'
    } catch {
      return 'id'
    }
  })
  const [theme, setTheme] = useTheme()

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
      document.documentElement.lang = lang
    } catch {
      // Storage unavailable.
    }
  }, [lang])

  return (
    <I18nProvider lang={lang}>
      <AppContent
        lang={lang}
        onToggleLang={() => setLang((cur) => (cur === 'id' ? 'en' : 'id'))}
        theme={theme}
        onSetTheme={setTheme}
      />
      <UpdateBanner />
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </I18nProvider>
  )
}

function AppContent({
  lang,
  onToggleLang,
  theme,
  onSetTheme,
}: {
  lang: Lang
  onToggleLang: () => void
  theme: Theme
  onSetTheme: (theme: Theme) => void
}) {
  const { state, setState, workoutActions, routineActions } = useApp()
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [viewedSession, setViewedSession] = useState<Workout | null>(null)
  const [progressExercise, setProgressExercise] = useState<string | null>(null)
  const [workoutPaused, setWorkoutPaused] = useState(false)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [consistencyStats, setConsistencyStats] = useState<ConsistencyStats>({
    currentWeekStreak: 0,
    longestWeekStreak: 0,
    totalSessions: 0,
    lastTrainedAt: null,
    gapDays: null,
  })
  const [newPRs, setNewPRs] = useState<PRDetection[]>([])
  const { tr } = useI18n()

  useDevSeedData(state, setState)

  useEffect(() => {
    const stats = computeConsistency(state.sessions)
    setConsistencyStats(stats)
    const justFinished = workoutActions.takeLastFinished()
    if (justFinished) {
      const prs = detectNewPRs(state.sessions, justFinished)
      setNewPRs(prs)
    }
  }, [state.sessions])

  useEffect(() => {
    if (state.sessions.length === 0) return
    const stats = computeConsistency(state.sessions)
    const seen = loadSeenMilestones()
    const milestones = checkMilestones(stats, seen, newPRs.length)
    if (milestones.length > 0) {
      const next = new Set(seen)
      for (const m of milestones) next.add(m)
      saveSeenMilestones(next)
    }
  }, [state.sessions, newPRs.length])

  function startWorkout(exerciseNames: string[] = [], routineId?: string, dayId?: string) {
    workoutActions.startWorkout(exerciseNames, routineId, dayId)
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function finishWorkout() {
    workoutActions.finishWorkout()
    const finished = state.activeWorkout
    if (!finished) return
    setViewedSession(normalizeWorkout({ ...finished, finishedAt: new Date().toISOString() }))
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function editSession(session: Workout) {
    workoutActions.editSession(session)
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
  }

  function discardWorkout() {
    workoutActions.discardWorkout()
    setViewedSession(null)
    setWorkoutPaused(false)
    setCollapsedExerciseIds(new Set())
    clearTimerSnapshots()
  }

  function deleteSession(sessionId: string) {
    workoutActions.deleteSession(sessionId)
    setViewedSession(null)
  }

  function importBackup(nextState: PersistedState) {
    setState(nextState)
    setViewedSession(null)
  }

  function toggleExerciseCollapsed(exerciseId: string) {
    setCollapsedExerciseIds((ids) => {
      const isCollapsed = ids.has(exerciseId)
      if (isCollapsed) {
        const allIds = state.activeWorkout?.exercises.map((e) => e.id) ?? []
        return new Set(allIds.filter((id) => id !== exerciseId))
      }
      const next = new Set(ids)
      next.add(exerciseId)
      return next
    })
  }

  const activeWorkout = state.activeWorkout

  if (activeWorkout && !workoutPaused) {
    return (
      <WorkoutScreen
        workout={activeWorkout}
        onAddExercise={workoutActions.addExercise}
        onAddSet={workoutActions.addSet}
        onRemoveSet={workoutActions.removeSet}
        onUpdateSet={workoutActions.updateSet}
        onRemoveExercise={workoutActions.removeExercise}
        onRenameExercise={workoutActions.renameExercise}
        onChangeUnit={workoutActions.changeExerciseUnit}
        onMoveExercise={workoutActions.moveExercise}
        onUpdateWorkoutNote={workoutActions.updateWorkoutNote}
        onUpdateExerciseNote={workoutActions.updateExerciseNote}
        onExit={() => setWorkoutPaused(true)}
        onDiscard={discardWorkout}
        onFinish={finishWorkout}
        sessions={state.sessions}
        collapsedExerciseIds={collapsedExerciseIds}
        onToggleCollapsed={toggleExerciseCollapsed}
      />
    )
  }

  return (
    <div className="app-layout flex flex-col min-h-dvh pb-[72px]">
      {viewedSession ? (
        <SummaryScreen
          workout={viewedSession}
          onStartAnother={startWorkout}
          onBack={() => setViewedSession(null)}
          onEdit={editSession}
          onDelete={deleteSession}
          newPRs={newPRs}
          sessions={state.sessions}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <HomeScreen
              sessions={state.sessions}
              routines={state.routines}
              activeWorkout={activeWorkout}
              onResumeWorkout={() => setWorkoutPaused(false)}
              onStart={() => startWorkout()}
              onStartWithExercises={(names, routineId, dayId) =>
                startWorkout(names, routineId, dayId)
              }
              onViewSession={setViewedSession}
              onOpenHistory={() => setActiveTab('history')}
              backupState={state}
              onImportBackup={importBackup}
              lang={lang}
              onToggleLang={onToggleLang}
              theme={theme}
              onSetTheme={onSetTheme}
              consistencyStats={consistencyStats}
            />
          )}

          {activeTab === 'planning' && (
            <main className="screen">
              <PlanningScreen
                routines={state.routines}
                onAddRoutine={routineActions.addRoutine}
                onRenameRoutine={routineActions.renameRoutine}
                onDeleteRoutine={routineActions.deleteRoutine}
                onAddDay={routineActions.addDay}
                onRenameDay={routineActions.renameDay}
                onRemoveDay={routineActions.removeDay}
                onMoveDay={routineActions.moveDay}
                onAddExercise={routineActions.addExerciseToDay}
                onRemoveExercise={routineActions.removeExerciseFromDay}
                onMoveExercise={routineActions.moveExerciseInDay}
                onSetSchedule={routineActions.setDaySchedule}
                onApplyTemplate={routineActions.applyTemplate}
              />
            </main>
          )}

          {activeTab === 'history' && (
            <main className="screen">
              <HistoryScreen
                sessions={state.sessions}
                routines={state.routines}
                onViewSession={setViewedSession}
                lang={lang}
              />
            </main>
          )}

          {activeTab === 'progress' && (
            <ProgressScreen
              sessions={state.sessions}
              selected={progressExercise}
              onSelect={setProgressExercise}
              onBack={() => {
                setProgressExercise(null)
                setActiveTab('home')
              }}
            />
          )}
        </>
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setViewedSession(null)
          setActiveTab(tab)
        }}
      />
    </div>
  )
}

export default App
```

- [ ] **Step 3: Fix the `finishWorkout`/`deleteSession` import gap**

Add the missing `PersistedState` and `Workout` type imports to `App.tsx` (`Workout` used by `viewedSession` and `editSession`; `PersistedState` by `importBackup`).

- [ ] **Step 4: Wire provider in `main.tsx`** — wrap `<App />` with the store hooks. Simplest: create `src/store/AppStore.tsx` exporting a component that runs the three hooks and renders `AppProvider`:

```tsx
import { type ReactNode } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'
import { useWorkoutActions } from '../hooks/useWorkoutActions'
import { useRoutineActions } from '../hooks/useRoutineActions'
import { AppProvider } from './AppContext'

export function AppStore({ children }: { children: ReactNode }) {
  const { state, setState } = usePersistedState()
  const workoutActions = useWorkoutActions(state, setState)
  const routineActions = useRoutineActions(state, setState)
  return (
    <AppProvider
      state={state}
      setState={setState}
      workoutActions={workoutActions}
      routineActions={routineActions}
    >
      {children}
    </AppProvider>
  )
}
```

Update `src/main.tsx` to render `<AppStore><App /></AppStore>` (AppStore must be inside `I18nProvider`? — `useRoutineActions` calls `useI18n`, so `AppStore` MUST be inside `I18nProvider`. Place it in `App()` wrapping `AppContent` instead of main.tsx to keep i18n scope clear.)

- [ ] **Step 5: Run build + lint**

Run: `bun run build` and `bun run lint`. Fix any unused imports (`tr` may be unused in AppContent — remove if so; keep `clearTimerSnapshots` import).

- [ ] **Step 6: Manual smoke test**

Run: `bun run dev` — verify home loads, start a workout, add a set, finish, view summary. (If Agentation not active, spot-check rendered DOM.)

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/main.tsx src/store/
git commit -m "refactor: wire state+actions through AppContext, slim App.tsx"
```

---

### Task 6: Split `ExerciseCard.tsx`

**Files:**
- Create: `src/components/ExerciseCard/ExerciseHeader.tsx`
- Create: `src/components/ExerciseCard/ExerciseOptionsPanel.tsx`
- Create: `src/components/ExerciseCard/SetEntryForm.tsx`
- Create: `src/components/ExerciseCard/index.tsx` (moved + trimmed from `src/components/ExerciseCard.tsx`)
- Delete: `src/components/ExerciseCard.tsx`

**Interfaces:**
- `ExerciseHeader({ exercise, collapsed, isActiveExercise, showOptionsMenu, onToggleOptionsMenu, onSelectActive, onToggleCollapsed })`
- `ExerciseOptionsPanel({ exercise, onChangeUnit, onRename, onMove, canMoveUp, canMoveDown, onRemove })`
- `SetEntryForm({ exercise, sessions, previous, prefillToken, onAddSet })` — `previous` is `{ reps, weightKg, unit } | null`

- [ ] **Step 1: Create `src/components/ExerciseCard/ExerciseHeader.tsx`** (full code below — head row from original lines 235-271):

```tsx
import { Icon } from '../Icon'
import { useI18n } from '../../i18n'
import type { Exercise } from '../../lib/types'

export function ExerciseHeader({
  exercise,
  collapsed,
  isActiveExercise,
  showOptionsMenu,
  onToggleOptionsMenu,
  onSelectActive,
  onToggleCollapsed,
}: {
  exercise: Exercise
  collapsed: boolean
  isActiveExercise: boolean
  showOptionsMenu: boolean
  onToggleOptionsMenu: () => void
  onSelectActive?: () => void
  onToggleCollapsed: () => void
}) {
  const { tr, p } = useI18n()
  const setCount = exercise.sets.length
  const lastSetSummary =
    setCount > 0 ? tr('ex.lastSet', { count: setCount }) : tr('ex.noSets')

  return (
    <div className="exercise-head">
      {!collapsed && (
        <button
          type="button"
          className={`icon-btn${showOptionsMenu ? ' active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleOptionsMenu()
          }}
          aria-label={tr('ex.options')}
          title={tr('ex.options')}
        >
          <Icon name="more" size={18} />
        </button>
      )}
      <div
        className="exercise-title"
        onClick={!isActiveExercise && onSelectActive ? onSelectActive : undefined}
        style={{ cursor: !isActiveExercise ? 'pointer' : 'default' }}
      >
        <h3>{exercise.name}</h3>
        <p className="exercise-summary">
          {setCount} {p(setCount, 'count.sets')} · {lastSetSummary}
        </p>
      </div>
      <button
        type="button"
        className="collapse-toggle"
        onClick={(e) => {
          e.stopPropagation()
          onToggleCollapsed()
        }}
        aria-label={collapsed ? tr('ex.expand') : tr('ex.collapse')}
      >
        <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/ExerciseCard/ExerciseOptionsPanel.tsx`** (options panel from original lines 273-357):

```tsx
import { useState } from 'react'
import { Icon } from '../Icon'
import { useI18n } from '../../i18n'
import type { Exercise, ExerciseUnit } from '../../lib/types'

export function ExerciseOptionsPanel({
  exercise,
  onChangeUnit,
  onRename,
  onMove,
  canMoveUp,
  canMoveDown,
  onRemove,
}: {
  exercise: Exercise
  onChangeUnit: (unit: ExerciseUnit) => void
  onRename: () => void
  onMove?: (direction: -1 | 1) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onRemove: () => void
}) {
  const { tr } = useI18n()
  const [confirmRemove, setConfirmRemove] = useState(false)

  return (
    <div className="exercise-options-panel">
      <div className="options-row">
        <span className="options-label">{tr('ex.unitLabel')}</span>
        <select
          className="unit-select"
          value={exercise.unit}
          onChange={(e) => onChangeUnit(e.target.value as ExerciseUnit)}
          aria-label={tr('ex.unitLabel')}
        >
          <option value="kg">{tr('unit.kg')}</option>
          <option value="plate">{tr('unit.plates')}</option>
          <option value="bodyweight">bodyweight</option>
        </select>
      </div>
      <div className="options-actions">
        <button
          type="button"
          className="btn-sm secondary"
          onClick={onRename}
        >
          <Icon name="pencil" size={14} />
          <span>{tr('ex.rename')}</span>
        </button>
        {onMove && (
          <>
            <button
              type="button"
              className="btn-sm secondary"
              disabled={!canMoveUp}
              onClick={() => onMove(-1)}
              aria-label={tr('ex.moveUp')}
            >
              <Icon name="arrow-up" size={14} />
            </button>
            <button
              type="button"
              className="btn-sm secondary"
              disabled={!canMoveDown}
              onClick={() => onMove(1)}
              aria-label={tr('ex.moveDown')}
            >
              <Icon name="arrow-down" size={14} />
            </button>
          </>
        )}
        {confirmRemove ? (
          <span className="inline-confirm">
            <button
              type="button"
              className="btn-sm danger"
              onClick={onRemove}
            >
              {tr('ex.confirmRemove')}
            </button>
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => setConfirmRemove(false)}
            >
              {tr('cancel')}
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn-sm danger"
            onClick={() => {
              if (exercise.sets.length > 0) {
                setConfirmRemove(true)
              } else {
                onRemove()
              }
            }}
          >
            <Icon name="trash" size={14} />
            <span>{tr('ex.remove')}</span>
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/ExerciseCard/SetEntryForm.tsx`** (the current-set execution card, original lines 452-522). Form state (reps/weight/setType/dropParentId/error) and the scroll-into-view effect move here. The "fill from previous" effect and the collapsed repeat button are unified via `prefillToken`:

```tsx
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../Icon'
import { useI18n } from '../../i18n'
import {
  SET_TYPES,
  type Exercise,
  type ExerciseUnit,
  type SetType,
} from '../../lib/types'

export type PreviousSet = {
  reps: number
  weightKg: number
  unit: ExerciseUnit
}

export function SetEntryForm({
  exercise,
  previous,
  prefillToken,
  onAddSet,
}: {
  exercise: Exercise
  previous: PreviousSet | null
  prefillToken: number
  onAddSet: (reps: number, weightKg: number, type: SetType, parentId?: string) => void
}) {
  const { tr } = useI18n()
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [setType, setSetType] = useState<SetType>('working')
  const [dropParentId, setDropParentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const setFormRef = useRef<HTMLFormElement | null>(null)
  const previousSetCount = useRef(exercise.sets.length)

  useEffect(() => {
    if (!previous) return
    setReps(String(previous.reps))
    if (previous.unit === exercise.unit) {
      setWeight(String(previous.weightKg))
    }
  }, [previous, exercise.unit])

  useEffect(() => {
    if (exercise.unit === 'bodyweight') setWeight('')
  }, [exercise.unit])

  useEffect(() => {
    if (prefillToken === 0 || !previous) return
    setReps(String(previous.reps))
    setWeight(String(previous.weightKg))
    setError(null)
  }, [prefillToken, previous])

  useEffect(() => {
    const previousLength = previousSetCount.current
    previousSetCount.current = exercise.sets.length
    if (exercise.sets.length <= previousLength) return
    const node = setFormRef.current
    if (node) {
      const rect = node.getBoundingClientRect()
      if (rect.bottom > window.innerHeight) {
        node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [exercise.sets])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const repsValue = Number(reps)
    if (!Number.isInteger(repsValue) || repsValue < 1) {
      setError(tr('ex.repsError'))
      return
    }
    let weightValue = 0
    if (exercise.unit === 'bodyweight') {
      weightValue = 0
    } else if (exercise.unit === 'plate') {
      weightValue = Number(weight)
      if (!Number.isInteger(weightValue) || weightValue < 0) {
        setError(tr('ex.plateError'))
        return
      }
    } else {
      weightValue = Number(weight)
      if (!Number.isFinite(weightValue) || weightValue < 0) {
        setError(tr('ex.weightError'))
        return
      }
    }
    const wasDrop = dropParentId !== null
    onAddSet(repsValue, weightValue, setType, dropParentId ?? undefined)
    if (wasDrop && previous) {
      setReps(String(previous.reps))
      setWeight(String(previous.weightKg))
    } else {
      setReps(String(repsValue))
      setWeight(String(weightValue))
    }
    if (wasDrop) setSetType('working')
    setDropParentId(null)
    setError(null)
  }

  return (
    <div className="current-set-execution-card">
      <div className="current-set-header">
        <span className="current-set-title">
          {tr('ex.currentSet', { n: exercise.sets.length + 1 })}
        </span>
      </div>
      <form ref={setFormRef} onSubmit={handleSubmit} className="set-form">
        <div className="set-form-meta">
          <div
            className="set-type-row"
            role="group"
            aria-label={tr('ex.setTypeLabel')}
          >
            {SET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`set-type-btn${setType === type ? ' active' : ''}`}
                onClick={() => {
                  setSetType(type)
                  setDropParentId(null)
                }}
              >
                {tr(`setType.${type}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="set-fields-grid">
          <div className="field">
            <label htmlFor={`reps-${exercise.id}`}>{tr('ex.reps')}</label>
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
                {exercise.unit === 'plate' ? tr('ex.plates') : tr('ex.weightKg')}
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
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="positive complete-set-btn">
          <Icon name="check" size={18} />
          <span>{tr('ex.completeSet')}</span>
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/ExerciseCard/index.tsx`** — the composition root. Behavior identical to the original: computes `previous`, `prevSession`, `best`, `target`, `targetBeaten`, summary texts; keeps rename form, collapsed actions, previous block, SetList; delegates head/options/form to the new components. The collapsed repeat button increments `prefillToken`.

- [ ] **Step 5: Delete `src/components/ExerciseCard.tsx`**

```bash
rm src/components/ExerciseCard.tsx
```

- [ ] **Step 6: Update the import in `src/screens/WorkoutScreen.tsx`** to `from '../components/ExerciseCard'` (folder index — import path stays the same string, no change needed; verify build).

- [ ] **Step 7: Run build + lint + tests**

Run: `bun run build`, `bun run lint`, `bun test`. All must pass.

- [ ] **Step 8: Manual smoke test**

`bun run dev` — expand/collapse an exercise, open options (rename, move, delete), add a set with dropset flow, verify scroll behavior and repeat-last-set button.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: split ExerciseCard into header, options panel, and set-entry form"
```

---

### Task 7: Split `HomeScreen.tsx`

**Files:**
- Create: `src/screens/HomeScreen/SettingsModal.tsx`
- Create: `src/screens/HomeScreen/RoutinePicker.tsx`
- Create: `src/screens/HomeScreen/ActiveWorkoutBanner.tsx`
- Create: `src/screens/HomeScreen/index.tsx` (moved from `src/screens/HomeScreen.tsx`)
- Delete: `src/screens/HomeScreen.tsx`

**Interfaces:**
- `SettingsModal({ onClose, returnFocusRef, theme, onSetTheme, backupState, onImportBackup })`
- `RoutinePicker({ routines, onPick })` — `onPick(exerciseNames: string[])`
- `ActiveWorkoutBanner({ workout, onResume })`

- [ ] **Step 1: Create `src/screens/HomeScreen/ActiveWorkoutBanner.tsx`** — banner from original lines 122-137:

```tsx
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { formatTime } from '../../lib/format'
import type { Workout } from '../../lib/types'

export function ActiveWorkoutBanner({
  workout,
  onResume,
}: {
  workout: Workout
  onResume: () => void
}) {
  const { tr, lang } = useI18n()
  return (
    <div className="active-workout-banner">
      <div className="active-workout-info">
        <span className="pulse-dot" />
        <div>
          <strong>{tr('home.workoutInProgress')}</strong>
          <span className="muted">
            {' · '}
            {tr('home.startedAt', { time: formatTime(workout.startedAt, lang) })}
          </span>
        </div>
      </div>
      <button type="button" className="primary btn-sm" onClick={onResume}>
        {tr('home.resumeWorkout')}
      </button>
    </div>
  )
}
```

Note: original banner has no icon — remove the unused `Icon` import if lint complains.

- [ ] **Step 2: Create `src/screens/HomeScreen/RoutinePicker.tsx`** — picker section from original lines 245-288:

```tsx
import { useI18n } from '../../i18n'
import type { Routine } from '../../lib/types'

export function RoutinePicker({
  routines,
  onPick,
}: {
  routines: Routine[]
  onPick: (exerciseNames: string[]) => void
}) {
  const { tr, p } = useI18n()
  return (
    <section className="card">
      <h3>{tr('home.pickRoutine')}</h3>
      {routines.length === 0 ? (
        <p className="muted">{tr('home.noRoutines')}</p>
      ) : (
        <ul className="days">
          {routines.map((routine) => (
            <li key={routine.id} className="day">
              <div className="day-head">
                <strong>{routine.name}</strong>
                <span className="muted">
                  {routine.days.length} {p(routine.days.length, 'count.days')}
                </span>
              </div>
              {routine.days.length === 0 ? (
                <p className="muted">{tr('home.noDaysInRoutine')}</p>
              ) : (
                <div className="day-body">
                  {routine.days.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      className="day-toggle pick-day"
                      onClick={() => onPick(day.exerciseNames)}
                    >
                      <span>{day.name}</span>
                      <span className="muted">
                        {day.exerciseNames.length}{' '}
                        {p(day.exerciseNames.length, 'count.exercises')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Create `src/screens/HomeScreen/SettingsModal.tsx`** — settings dialog from original lines 341-400 (ConfirmDialog + BackupControls + theme options + about section):

```tsx
import type { RefObject } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { BackupControls } from '../../components/BackupControls'
import { FeedbackCard } from '../../components/FeedbackCard'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { GITHUB_URL, SAWERIA_URL } from '../../lib/config'
import { THEMES, type Theme } from '../../lib/theme'
import type { PersistedState } from '../../lib/types'

export function SettingsModal({
  onClose,
  returnFocusRef,
  theme,
  onSetTheme,
  backupState,
  onImportBackup,
}: {
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
  theme: Theme
  onSetTheme: (theme: Theme) => void
  backupState: PersistedState
  onImportBackup: (state: PersistedState) => void
}) {
  const { tr } = useI18n()
  return (
    <ConfirmDialog
      title={tr('home.settings')}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      ariaLabel={tr('home.settings')}
    >
      <div className="settings-content">
        <BackupControls state={backupState} onImport={onImportBackup} />

        <section className="about-sub">
          <h3>{tr('theme.title')}</h3>
          <div className="theme-options" role="group" aria-label={tr('theme.title')}>
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                className={`theme-option${theme === option ? ' active' : ''}`}
                onClick={() => onSetTheme(option)}
              >
                <Icon
                  name={option === 'light' ? 'sun' : option === 'dark' ? 'moon' : 'monitor'}
                  size={16}
                />
                <span>{tr(`theme.${option}`)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="about-sub">
          <h3>{tr('about.title')}</h3>
          <p className="muted">
            {tr('about.desc', { version: __APP_VERSION__ })}
          </p>
          <div className="backup-actions">
            <a
              className="file-button btn-sm secondary"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
            >
              {tr('about.github')}
            </a>
            <a
              className="file-button btn-sm secondary"
              href={SAWERIA_URL}
              target="_blank"
              rel="noreferrer"
            >
              {tr('about.support')}
            </a>
          </div>
          <FeedbackCard />
        </section>
      </div>
    </ConfirmDialog>
  )
}
```

- [ ] **Step 4: Create `src/screens/HomeScreen/index.tsx`** — move the current `HomeScreen.tsx` content, minus the extracted sections, importing the three new components. The picker's `onPick` handler closes the picker:

```tsx
{/* inside HomeScreen: */}
{pickingRoutine && (
  <RoutinePicker
    routines={routines}
    onPick={(names) => {
      onStartWithExercises(names)
      setPickingRoutine(false)
    }}
  />
)}
```

Settings render as `<SettingsModal onClose={() => setSettingsOpen(false)} returnFocusRef={settingsBtnRef} theme={theme} onSetTheme={onSetTheme} backupState={backupState} onImportBackup={onImportBackup} />`.

- [ ] **Step 5: Delete `src/screens/HomeScreen.tsx`**

```bash
rm src/screens/HomeScreen.tsx
```

- [ ] **Step 6: Run build + lint + tests**

Run: `bun run build`, `bun run lint`, `bun test`. All must pass.

- [ ] **Step 7: Manual smoke test**

`bun run dev` — open settings modal (theme switch, backup import), pick a routine, verify recent sessions and resume banner.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: split HomeScreen into settings modal, routine picker, and banner"
```

---

### Task 8: Error Boundary

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/i18n.tsx` (export `I18nContext`, add `error.*` keys)
- Modify: `src/App.tsx` (wrap `AppContent`)

- [ ] **Step 1: Export `I18nContext` from `src/i18n.tsx`** — change the internal `const I18nContext = createContext<...>(...)` to `export const I18nContext = ...`.

- [ ] **Step 2: Add i18n keys** — to `ID`:

```ts
'error.title': 'Terjadi kesalahan',
'error.reload': 'Muat ulang aplikasi',
'error.retry': 'Coba lagi',
```

To `EN`:

```ts
'error.title': 'Something went wrong',
'error.reload': 'Reload app',
'error.retry': 'Try again',
```

- [ ] **Step 3: Create `src/components/ErrorBoundary.tsx`**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { I18nContext, type I18n } from '../i18n'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  static contextType = I18nContext
  declare context: I18n

  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      const { tr } = this.context
      return (
        <main className="screen">
          <div className="card">
            <h1>{tr('error.title')}</h1>
            <div className="backup-actions">
              <button
                type="button"
                className="primary"
                onClick={() => window.location.reload()}
              >
                {tr('error.reload')}
              </button>
            </div>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 4: Wrap in `src/App.tsx`**

Inside `App`, wrap `<AppContent ... />` with `<ErrorBoundary>...</ErrorBoundary>` (inside `I18nProvider`, outside `AppContent`).

- [ ] **Step 5: Build + lint**

Run: `bun run build`, `bun run lint`. Fix type issues (`I18n` type export from i18n.tsx if needed — it is exported implicitly via `useI18n(): I18n`; add `export type I18n` if the type isn't exported).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ErrorBoundary with i18n fallback UI"
```

---

### Task 9: CI Workflow + Typecheck Script

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (typecheck already added in Task 1; verify)

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run typecheck

      - name: Test
        run: bun run test

      - name: Build
        run: bun run build
```

- [ ] **Step 2: Verify all scripts locally**

Run: `bun run lint && bun run typecheck && bun run test && bun run build` — all green.

- [ ] **Step 3: Commit**

```bash
git add .github/ package.json
git commit -m "ci: add GitHub Actions workflow (lint, typecheck, test, build)"
```

---

## Self-Review Notes

- Task 5 `finishWorkout` computes `viewedSession` locally instead of reading `lastFinishedRef` — behavior equivalent (the finished workout is known synchronously). This is the only structural deviation; the PR detection effect consumes `takeLastFinished()` with the same timing as the old ref.
- The existing `detectNewPRs(state.sessions, justFinished)` call passes sessions *including* the finished one — this is pre-existing behavior in `App.tsx` and is preserved verbatim (not a refactor target).
- If `oxlint` reports unused `state` param in `useRoutineActions`, rename to `_state`.
- Verify `main.tsx` does not need changes (provider placement is inside `App()`, keeping `I18nProvider` scope correct).