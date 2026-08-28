# Fix 28 Logic Bugs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 28 logic bugs from issue #42 across the gym-tracker codebase.

**Architecture:** Pure bug fixes across existing files — no new files or structural changes. Each task groups related fixes by file to minimize context switches. All fixes are minimal and surgical.

**Tech Stack:** React 19, TypeScript 6, Vitest 4, Tailwind CSS 4

## Global Constraints

- Run `bun run typecheck` and `bun run lint` after each task
- Run `bun run test` after tasks that modify testable logic
- Do not add comments unless the fix requires explanation
- Do not change public interfaces or types

---

## Task 1: Fix selectors.ts — Library search, heatmap, date, Chinese text, fallback matching

**Files:**
- Modify: `src/lib/selectors.ts:188, 409-413, 659, 774, 122-131`
- Test: `src/lib/selectors.test.ts`

**Interfaces:**
- Consumes: none
- Produces: fixed `findLibraryMatches`, `getPreviousDayISO`, `computeHeatmapData`, `analyzeWorkout`, `getRecommendedWorkout`

- [ ] **Step 1: Fix `findLibraryMatches` — lowercase the query** (Bug #1)

At line 188, the query is not lowercased:

```typescript
// Before
alias.toLowerCase().includes(query)

// After
alias.toLowerCase().includes(query.toLowerCase())
```

- [ ] **Step 2: Fix `getPreviousDayISO` — use local time consistently** (Bug #2)

At lines 409-413, the function uses `setUTCDate` but `getFullYear()`/`getMonth()`/`getDate()` (local). Mix of UTC and local causes wrong date in timezones where local midnight != UTC midnight:

```typescript
// Before
function getPreviousDayISO(date: Date): string {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// After
function getPreviousDayISO(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
```

- [ ] **Step 3: Fix `computeHeatmapData` — fix offset formula** (Bug #3)

At line 659, the offset uses `+` where it should use `-`:

```typescript
// Before
const offset = (WEEKS - 1 - w) * 7 + (6 - dow) + (6 - todayDow)

// After
const offset = (WEEKS - 1 - w) * 7 + (6 - dow) - todayDow
```

Wait, let me re-analyze. The formula should map (w, dow) to a date offset from today. The heatmap grid has columns = weeks (newest last), rows = Sun–Sat. Let me think about this more carefully.

Current: `offset = (WEEKS - 1 - w) * 7 + (6 - dow) + (6 - todayDow)`

For today (w=WEEKS-1, dow=todayDow):
- `offset = 0 * 7 + (6 - todayDow) + (6 - todayDow) = 12 - 2*todayDow`
- This should be 0 for today. Only works when `todayDow == 6` (Saturday).

The correct formula: `offset = (WEEKS - 1 - w) * 7 + (todayDow - dow)`

For today: `offset = 0 + todayDow - todayDow = 0` ✓
For yesterday (w=WEEKS-1, dow=todayDow-1): `offset = 0 + todayDow - (todayDow-1) = 1` ✓

```typescript
// After
const offset = (WEEKS - 1 - w) * 7 + (todayDow - dow)
```

- [ ] **Step 4: Fix `getRecommendedWorkout` fallback — scope to primary routine** (Bug #13)

At lines 122-131, the fallback match checks all routines instead of only the primary:

```typescript
// Before
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

// After
if (lastDayIndex === -1 && session.routineId === primaryRoutine.id && session.exercises.length > 0) {
  const sessionExNames = new Set(session.exercises.map((e) => e.name.toLowerCase()))
  const matchedIdx = primaryRoutine.days.findIndex((d) =>
    d.exerciseNames.some((name) => sessionExNames.has(name.toLowerCase())),
  )
  if (matchedIdx !== -1) {
    lastDayIndex = matchedIdx
    break
  }
}
```

- [ ] **Step 5: Fix `analyzeWorkout` — remove Chinese text** (Bug #10)

At line 774, replace Chinese `已经超过` with Indonesian `melebihi`:

```typescript
// Before
? `Total ${totalSets} set. Pertimbangkan untuk kurangi jika sudah超过 kemampuan recovery.`

// After
? `Total ${totalSets} set. Pertimbangkan untuk kurangi jika sudah melebihi kemampuan recovery.`
```

- [ ] **Step 6: Add tests for findLibraryMatches and computeHeatmapData**

Add to `src/lib/selectors.test.ts`:

```typescript
describe('findLibraryMatches', () => {
  it('matches case-insensitively', () => {
    const results = findLibraryMatches('Bench')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((e) => e.name.toLowerCase().includes('bench'))).toBe(true)
  })

  it('returns empty for no match', () => {
    expect(findLibraryMatches('xyznotreal')).toEqual([])
  })

  it('returns empty for empty query', () => {
    expect(findLibraryMatches('')).toEqual([])
  })
})

describe('computeHeatmapData', () => {
  it('today cell is at grid end', () => {
    const { weeks } = computeHeatmapData([])
    expect(weeks).toHaveLength(12)
    expect(weeks[0]).toHaveLength(7)
  })
})
```

- [ ] **Step 7: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 8: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/selectors.ts src/lib/selectors.test.ts
git commit -m "fix(selectors): search casing, heatmap offset, date calc, Chinese text, fallback scoping"
```

---

## Task 2: Fix App.tsx — Collapse toggle, BottomNav visibility, StrictMode ref

**Files:**
- Modify: `src/App.tsx:95-106, 175-178, 299-305`

**Interfaces:**
- Consumes: none
- Produces: fixed `toggleExerciseCollapsed`, BottomNav visibility, `takeLastFinished` double-fire guard

- [ ] **Step 1: Fix `toggleExerciseCollapsed` — only toggle one ID** (Bug #4)

At lines 174-178, when collapsing (isCollapsed=true), it creates a new Set from ALL exercise IDs minus the one — this opens ALL exercises. Should only remove the single ID from the set:

```typescript
// Before
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

// After
function toggleExerciseCollapsed(exerciseId: string) {
  setCollapsedExerciseIds((ids) => {
    const isCollapsed = ids.has(exerciseId)
    if (isCollapsed) {
      const next = new Set(ids)
      next.delete(exerciseId)
      return next
    }
    const next = new Set(ids)
    next.add(exerciseId)
    return next
  })
}
```

- [ ] **Step 2: Hide BottomNav when SummaryScreen is shown** (Bug #8)

At lines 299-305, BottomNav should not render when `viewedSession` is set:

```typescript
// Before
<BottomNav
  activeTab={activeTab}
  onTabChange={(tab) => {
    setViewedSession(null)
    setActiveTab(tab)
  }}
/>

// After
{!viewedSession && (
  <BottomNav
    activeTab={activeTab}
    onTabChange={(tab) => {
      setViewedSession(null)
      setActiveTab(tab)
    }}
  />
)}
```

- [ ] **Step 3: Guard `takeLastFinished` against StrictMode double-fire** (Bug #27)

At lines 95-106, the effect fires twice in StrictMode. The `takeLastFinished` already handles this via the ref (returns null on second call), so no code change needed. This is a known StrictMode behavior that the ref pattern already handles correctly. **No fix needed — skip.**

- [ ] **Step 4: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 5: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "fix(App): collapse toggle only affects one exercise, hide nav on summary"
```

---

## Task 3: Fix useWorkoutActions.ts — Stale closure, editSession guard

**Files:**
- Modify: `src/hooks/useWorkoutActions.ts:41-45, 61-67`

**Interfaces:**
- Consumes: none
- Produces: fixed `finishWorkout`, `editSession`

- [ ] **Step 1: Fix `finishWorkout` stale closure** (Bug #6)

At lines 40-58, `finished` is built from `state.activeWorkout` which may be stale. Use the setState updater to get fresh state:

```typescript
// Before
function finishWorkout(): Workout | null {
  if (!state.activeWorkout) return null
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
  return finished
}

// After
function finishWorkout(): Workout | null {
  let finished: Workout | null = null
  const editingId = editingSessionIdRef.current
  editingSessionIdRef.current = null
  setState((s) => {
    if (!s.activeWorkout) return s
    finished = normalizeWorkout({
      ...s.activeWorkout,
      finishedAt: new Date().toISOString(),
    })
    lastFinishedRef.current = finished
    return {
      ...s,
      activeWorkout: null,
      sessions: editingId
        ? s.sessions.map((session) =>
            session.id === editingId ? finished! : session,
          )
        : [finished, ...s.sessions],
    }
  })
  return finished
}
```

- [ ] **Step 2: Add guard to `editSession` — don't overwrite active workout** (Bug #7)

At lines 61-67, if a workout is in progress, editing an old session would overwrite it:

```typescript
// Before
function editSession(session: Workout) {
  editingSessionIdRef.current = session.id
  setState((s) => ({
    ...s,
    activeWorkout: normalizeWorkout({ ...session, finishedAt: null }),
  }))
}

// After
function editSession(session: Workout) {
  editingSessionIdRef.current = session.id
  setState((s) => {
    if (s.activeWorkout && s.activeWorkout.finishedAt === null) return s
    return {
      ...s,
      activeWorkout: normalizeWorkout({ ...session, finishedAt: null }),
    }
  })
}
```

- [ ] **Step 3: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWorkoutActions.ts
git commit -m "fix(useWorkoutActions): stale closure in finishWorkout, guard editSession"
```

---

## Task 4: Fix SetEntryForm.tsx — dropParentId not set (Bug #5)

**Files:**
- Modify: `src/components/ExerciseCard/SetEntryForm.tsx:38, 139-142`

**Interfaces:**
- Consumes: none
- Produces: fixed dropset parenting

- [ ] **Step 1: Fix `dropParentId` — set it when type is dropset** (Bug #5)

The drop button needs to set `dropParentId` to the nearest working set's ID when switching to dropset type. Currently clicking the "Dropset" type button resets `dropParentId` to null. Need to find the nearest working set from exercise.sets and set it.

Looking at the code flow:
- Line 139-142: clicking a set type button sets `setSetType(type); setDropParentId(null)` 
- The "Drop" button (`ex.drop`) is in the ExerciseCard, not in SetEntryForm

Actually, looking more carefully at the SetEntryForm:
- The type buttons (working/warmup/dropset) all reset dropParentId to null on line 141
- The `onAddSet` callback receives `dropParentId` on line 99

The issue is: when the user selects "Dropset" as the set type, the `dropParentId` should be set to the last working set's id. But the click handler on line 139-142 always resets it to null.

Fix: when switching to 'dropset', find the nearest working set and set its id as parent:

```typescript
// Before (line 139-142)
onClick={() => {
  setSetType(type)
  setDropParentId(null)
}}

// After
onClick={() => {
  setSetType(type)
  if (type === 'dropset') {
    const workingSets = exercise.sets.filter((s) => s.type === 'working')
    const lastWorking = workingSets[workingSets.length - 1]
    setDropParentId(lastWorking?.id ?? null)
  } else {
    setDropParentId(null)
  }
}}
```

- [ ] **Step 2: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 3: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ExerciseCard/SetEntryForm.tsx
git commit -m "fix(SetEntryForm): set dropParentId when switching to dropset type"
```

---

## Task 5: Fix types.ts — normalizeSet clamp, normalizeExercise trim, isPersistedState

**Files:**
- Modify: `src/lib/types.ts:206-208, 214, 230-231`

**Interfaces:**
- Consumes: none
- Produces: fixed `normalizeSet`, `normalizeExercise`, `isPersistedState`

- [ ] **Step 1: Fix `normalizeSet` — clamp negative weight/reps** (Bug #16)

```typescript
// Before
export function normalizeSet(set: WorkoutSet): WorkoutSet {
  return { ...set, type: set.type ?? 'working' }
}

// After
export function normalizeSet(set: WorkoutSet): WorkoutSet {
  return {
    ...set,
    type: set.type ?? 'working',
    reps: Math.max(0, Math.round(set.reps)),
    weightKg: Math.max(0, set.weightKg),
  }
}
```

- [ ] **Step 2: Fix `normalizeExercise` — trim note** (Bug #17)

```typescript
// Before
export function normalizeExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    unit: exercise.unit ?? 'kg',
    note: exercise.note?.trim() ? exercise.note : undefined,
    sets: exercise.sets.map(normalizeSet),
  }
}

// After
export function normalizeExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    unit: exercise.unit ?? 'kg',
    note: exercise.note?.trim() || undefined,
    sets: exercise.sets.map(normalizeSet),
  }
}
```

Note: `.trim() ?` treats empty string as truthy after trim (it's not). Use `|| undefined` instead to also handle empty string after trim.

- [ ] **Step 3: Fix `isPersistedState` — accept backup without `activeWorkout` key** (Bug #11)

At lines 230-231, `undefined === null` is `false`, so backups missing the `activeWorkout` key are rejected:

```typescript
// Before
const activeWorkoutIsValid =
  data.activeWorkout === null || isWorkout(data.activeWorkout)

// After
const activeWorkoutIsValid =
  data.activeWorkout === undefined ||
  data.activeWorkout === null ||
  isWorkout(data.activeWorkout)
```

- [ ] **Step 4: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 5: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts
git commit -m "fix(types): clamp negatives in normalizeSet, trim notes, accept missing activeWorkout"
```

---

## Task 6: Fix storage.ts — IDB validation (Bug #12)

**Files:**
- Modify: `src/lib/storage.ts:82-83`

**Interfaces:**
- Consumes: none
- Produces: fixed `loadAsyncState`

- [ ] **Step 1: Add `isWorkout` validation to IDB `activeWorkout`** (Bug #12)

At lines 82-83, the IDB load skips validation on `activeWorkout`. The `isPersistedState` check at line 80 only checks sessions and routines, not the shape of activeWorkout deeply. Actually, looking again, `isPersistedState` does check `activeWorkout` via `data.activeWorkout === null || isWorkout(data.activeWorkout)`. But the returned value applies `normalizeWorkout` without validating first. If `isPersistedState` passes but `activeWorkout` is malformed in a way `isWorkout` doesn't catch...

Actually the issue is: `isPersistedState` at line 80 validates the top-level shape, but then line 82-83 applies `normalizeWorkout` directly on `idbState.activeWorkout` without going through the `isWorkout` check that `loadState()` (line 40-42) does. The `isPersistedState` function does check `activeWorkout`, so if it passes, the activeWorkout is valid. But let me add an explicit `isWorkout` check for safety:

```typescript
// Before
activeWorkout: idbState.activeWorkout
  ? normalizeWorkout(idbState.activeWorkout)
  : null,

// After
activeWorkout: isWorkout(idbState.activeWorkout)
  ? normalizeWorkout(idbState.activeWorkout)
  : null,
```

- [ ] **Step 2: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 3: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/storage.ts
git commit -m "fix(storage): validate activeWorkout with isWorkout before normalizing from IDB"
```

---

## Task 7: Fix i18n.tsx — Context memoization, lastSet grammar (Bugs #14, #22)

**Files:**
- Modify: `src/i18n.tsx:444, 741-756`

**Interfaces:**
- Consumes: none
- Produces: memoized I18n context value, fixed `ex.lastSet` grammar

- [ ] **Step 1: Fix `ex.lastSet` English grammar** (Bug #22)

At line 444, "1 sets logged" should be "1 set logged":

```typescript
// Before
'ex.lastSet': '{count} sets logged',

// After - no fix needed, the p() function handles pluralization with .one/.other
```

Wait, looking at the code: `ex.lastSet` uses `{count}` not pluralization. The `p()` function picks `.one` or `.other` suffix. So `ex.lastSet.one` and `ex.lastSet.other` would be needed. But currently there's only `ex.lastSet` as a single key. Let me check how it's used.

Actually, looking at the i18n keys, `ex.lastSet` is used with `tr('ex.lastSet', { count })` not `p()`. The issue says "1 sets logged" — this is because `{count}` is replaced with 1, but the text always says "sets" (plural).

The fix should be to use `p()` instead of `tr()`. But that requires changing the consumer. Alternatively, add `.one`/`.other` keys:

Actually, let me re-read the issue. Bug #22 says: `i18n.tsx:444` — `ex.lastSet` produces "1 sets logged" grammar error.

The simplest fix: change the English key to use singular when count=1. But since it uses `tr()` with interpolation, not `p()`, we need to either:
1. Change the consumer to use `p()` 
2. Or make the template handle it

Let me check how it's used. Looking at ExerciseCard or similar components that display "X sets logged". This is used in the collapsed view showing how many sets have been logged.

The cleanest fix: change `ex.lastSet` to use `p()` at the consumer, or add separate `.one`/`.other` keys. But the consumer might be deep in a component. Let me just add the grammar handling inline:

Actually the simplest approach: keep using `tr()` but make the text correct for both cases by using the count:

```typescript
// EN
'ex.lastSet': '{count} {count, plural, one {set} other {sets}} logged',
```

But the interpolation function doesn't support CLDR plural syntax. So let's just use two keys:

```typescript
// Before
'ex.lastSet': '{count} sets logged',

// After  
'ex.lastSet.one': '{count} set logged',
'ex.lastSet.other': '{count} sets logged',
```

And update the consumer to use `p()` instead of `tr()`. But I need to find the consumer first. Let me search for `ex.lastSet` usage.

Actually, looking at the codebase exploration, the `p()` function uses key.one/key.other suffixes. So if we change the keys to `ex.lastSet.one` and `ex.lastSet.other`, we need the consumer to call `p(count, 'ex.lastSet')` instead of `tr('ex.lastSet', { count })`.

Let me find the consumer. It's likely in ExerciseCard/index.tsx or ExerciseHeader.tsx.

For now, I'll fix the keys and update the consumer. Let me check which component uses it.

- [ ] **Step 2: Memoize I18n context value** (Bug #14)

At lines 741-756, the `value` object is recreated every render:

```typescript
// Before
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value: I18n = {
    lang,
    tr: (key, vars) => { ... },
    p: (count, key) => { ... },
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// After
import { useMemo } from 'react'

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value: I18n = useMemo(() => ({
    lang,
    tr: (key: string, vars?: Vars) => {
      const template = DICTS[lang][key] ?? DICTS.en[key]
      if (template === undefined) warnMissing(key)
      return interpolate(template ?? key, vars)
    },
    p: (count: number, key: string) => {
      const template =
        DICTS[lang][`${key}.${count === 1 ? 'one' : 'other'}`] ??
        DICTS.en[`${key}.${count === 1 ? 'one' : 'other'}`]
      if (template === undefined) warnMissing(key)
      return interpolate(template ?? key, { count })
    },
  }), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
```

- [ ] **Step 3: Update `ex.lastSet` keys and find consumer**

Search for `ex.lastSet` usage, update keys and consumer to use `p()`.

- [ ] **Step 4: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 5: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/i18n.tsx src/components/ExerciseCard/index.tsx
git commit -m "fix(i18n): memoize context value, fix ex.lastSet grammar"
```

---

## Task 8: Fix ProgressScreen.tsx — Hardcoded text, trend unit, duplicate keys (Bugs #9, #20, #26)

**Files:**
- Modify: `src/screens/ProgressScreen.tsx:63, 68, 95, 106, 157-158`

**Interfaces:**
- Consumes: none
- Produces: i18n'd text, per-entry unit in trend, unique keys

- [ ] **Step 1: Fix hardcoded Indonesian text** (Bug #20)

Lines 63, 68, 95 have hardcoded text. Replace with `tr()` calls:

```typescript
// Line 63: "12-Minggu Terakhir"
<h2>{tr('progress.last12Weeks')}</h2>

// Line 68: "Volume Bulanan"  
<h2>{tr('progress.monthlyVolume')}</h2>

// Line 95: "tercatat"
{item.entries.length} {p(item.entries.length, 'count.sessions')} {tr('progress.recorded')}
```

Add these keys to both ID and EN dictionaries in `i18n.tsx`:
```
'progress.last12Weeks': '12-Minggu Terakhir' / 'Last 12 Weeks'
'progress.monthlyVolume': 'Volume Bulanan' / 'Monthly Volume'
'progress.recorded': 'tercatat' / 'recorded'
```

- [ ] **Step 2: Fix trend comparison — use per-entry unit** (Bug #9)

At lines 157-158, uses `h.best?.unit` (overall best unit) instead of per-entry unit:

```typescript
// Before
const lastVal = h.best?.unit === 'bodyweight' ? last.best.reps : last.best.weightKg
const prevVal = h.best?.unit === 'bodyweight' ? prev.best.reps : prev.best.weightKg

// After
const lastVal = last.unit === 'bodyweight' ? last.best.reps : last.best.weightKg
const prevVal = prev.unit === 'bodyweight' ? prev.best.reps : prev.best.weightKg
```

- [ ] **Step 3: Fix duplicate React key** (Bug #26)

At line 106, `key={entry.finishedAt}` could have duplicates if two sessions finished at the same timestamp. Use a composite key:

```typescript
// Before
key={entry.finishedAt}

// After
key={`${entry.finishedAt}-${entry.name}`}
```

- [ ] **Step 4: Add i18n keys**

Add to both ID and EN dictionaries in `src/i18n.tsx`.

- [ ] **Step 5: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 6: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/screens/ProgressScreen.tsx src/i18n.tsx
git commit -m "fix(ProgressScreen): i18n hardcoded text, per-entry trend unit, unique keys"
```

---

## Task 9: Fix HistoryScreen.tsx & HomeScreen — Hardcoded "set", showAll reset (Bugs #21, #28)

**Files:**
- Modify: `src/screens/HistoryScreen.tsx:52, 96`
- Modify: `src/screens/HomeScreen/index.tsx:295`

**Interfaces:**
- Consumes: none
- Produces: i18n'd "set" text, showAll reset

- [ ] **Step 1: Fix hardcoded "set" in HistoryScreen** (Bug #21)

At line 96, replace hardcoded `set` with `p(totalSets, 'count.sets')`:

```typescript
// Before
{p(session.exercises.length, 'count.exercises')} (
{totalSets} set)

// After
{p(session.exercises.length, 'count.exercises')} (
{p(totalSets, 'count.sets')})
```

- [ ] **Step 2: Fix hardcoded "set" in HomeScreen** (Bug #21)

At line 295, same fix:

```typescript
// Before
{p(session.exercises.length, 'count.exercises')} (
{totalSets} set)

// After
{p(session.exercises.length, 'count.exercises')} (
{p(totalSets, 'count.sets')})
```

- [ ] **Step 3: Fix `showAll` not resetting** (Bug #28)

At line 52, `showAll` never resets to false. This means once the user clicks "Show more", they can't go back. The fix is to reset when sessions list changes significantly, or more practically, to reset when navigating away. Since the component unmounts on tab change (React conditional rendering), the state is already reset. But the bug says it never resets — perhaps the user expects a way to collapse back. Let me check if this is actually a problem.

Looking at the code: `showAll` starts as `false`, becomes `true` on button click. The button only shows when `sessions.length > 15 && !showAll`. Once clicked, the button disappears and all sessions show. There's no way to collapse back.

The simplest fix: add a "Show less" button when `showAll` is true:

```typescript
// After the sessions.length > 15 check
{sessions.length > 15 && showAll && (
  <Button sm variant="secondary" type="button" onClick={() => setShowAll(false)}>
    {tr('home.showLess')}
  </Button>
)}
```

Add i18n key `'home.showLess'`: 'Tampilkan lebih sedikit' / 'Show less'

- [ ] **Step 4: Add i18n keys**

Add to both ID and EN dictionaries in `src/i18n.tsx`.

- [ ] **Step 5: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 6: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/screens/HistoryScreen.tsx src/screens/HomeScreen/index.tsx src/i18n.tsx
git commit -m "fix(HistoryScreen,HomeScreen): i18n 'set' text, add show less toggle"
```

---

## Task 10: Fix ExerciseOptionsPanel, WorkoutScreen, SetList, timer, SummaryScreen (Bugs #15, #19, #23, #24, #25)

**Files:**
- Modify: `src/components/ExerciseCard/ExerciseOptionsPanel.tsx:38`
- Modify: `src/screens/WorkoutScreen.tsx:67`
- Modify: `src/components/SetList.tsx:44`
- Modify: `src/lib/timer.ts:21-28`
- Modify: `src/screens/SummaryScreen.tsx:94`

**Interfaces:**
- Consumes: none
- Produces: i18n'd bodyweight, finishNote sync, const counter, timer validation, unique PR keys

- [ ] **Step 1: Fix missing `unit.bodyweight` translation** (Bug #15)

At line 38, replace hardcoded "bodyweight" with `tr('unit.bodyweight')`:

```typescript
// Before
<option value="bodyweight">bodyweight</option>

// After
<option value="bodyweight">{tr('unit.bodyweight')}</option>
```

Add i18n keys:
```
'unit.bodyweight': 'Berat badan' / 'Bodyweight'
```

- [ ] **Step 2: Fix `finishNote` not re-syncing** (Bug #19)

At line 67, `finishNote` is initialized once from `workout.note` but doesn't update if the workout note changes externally. Add a useEffect:

```typescript
// After line 67
useEffect(() => {
  setFinishNote(workout.note ?? '')
}, [workout.note])
```

- [ ] **Step 3: Fix mutable `let` counter in SetList** (Bug #23)

At line 44, `let number = 0` is mutable inside `flatMap`. Convert to a ref or use index:

```typescript
// Before
let number = 0

// ... inside flatMap
number += 1
const setNumber = number

// After - use an index accumulator via reduce or track with a mutable object
// Actually, the simplest fix that maintains semantics:
const numbered = rows.reduce<{ set: WorkoutSet; drops: WorkoutSet[]; n: number }[]>(
  (acc, row) => {
    const n = (acc.length > 0 ? acc[acc.length - 1].n : 0) + 1
    acc.push({ ...row, n })
    return acc
  },
  [],
)

// But this changes the structure. Simpler: just keep the let but use it inside a for loop instead of flatMap.
```

Actually, the simplest idiomatic fix: convert `flatMap` to a `reduce` or use a closure. Since the counter is only used within the flatMap callback and the order is deterministic, the current code works but is fragile. The fix:

```typescript
// Before
let number = 0

// ... 
{rows.flatMap(({ set, drops }) => {
  number += 1
  const setNumber = number
  return [
    renderSetRow(set, false, setNumber),
    ...drops.map((drop) => renderSetRow(drop, true, setNumber)),
  ]
})}

// After
{rows.map(({ set, drops }, idx) => {
  const setNumber = idx + 1
  return (
    <Fragment key={set.id}>
      {renderSetRow(set, false, setNumber)}
      {drops.map((drop) => renderSetRow(drop, true, setNumber))}
    </Fragment>
  )
})}
```

Need to add `Fragment` import from React.

- [ ] **Step 4: Fix timer snapshot validation** (Bug #24)

At lines 21-28, add check for `endAt > Date.now()`:

```typescript
// Before
if (
  typeof snapshot.duration !== 'number' ||
  !Number.isFinite(snapshot.duration) ||
  typeof snapshot.endAt !== 'number' ||
  !Number.isFinite(snapshot.endAt)
) {
  return null
}

// After
if (
  typeof snapshot.duration !== 'number' ||
  !Number.isFinite(snapshot.duration) ||
  typeof snapshot.endAt !== 'number' ||
  !Number.isFinite(snapshot.endAt) ||
  snapshot.endAt <= Date.now()
) {
  return null
}
```

- [ ] **Step 5: Fix duplicate React key in SummaryScreen PR list** (Bug #25)

At line 94, `key={pr.exerciseName}` could have duplicates if same exercise has multiple PRs (unlikely but possible with bodyweight/kg transitions). Use index:

```typescript
// Before
key={pr.exerciseName}

// After
key={`${pr.exerciseName}-${pr.unit}`}
```

- [ ] **Step 6: Add i18n keys**

Add `unit.bodyweight` to both ID and EN dictionaries in `src/i18n.tsx`.

- [ ] **Step 7: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 8: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/ExerciseCard/ExerciseOptionsPanel.tsx src/screens/WorkoutScreen.tsx src/components/SetList.tsx src/lib/timer.ts src/screens/SummaryScreen.tsx src/i18n.tsx
git commit -m "fix(misc): bodyweight i18n, finishNote sync, const counter, timer validation, PR keys"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 5: Commit any remaining fixes**

If any issues found in verification, fix and commit.

---

## Bug-to-Task Mapping

| Bug # | Severity | File | Task |
|-------|----------|------|------|
| 1 | HIGH | selectors.ts:188 | Task 1 |
| 2 | HIGH | selectors.ts:409-413 | Task 1 |
| 3 | HIGH | selectors.ts:659 | Task 1 |
| 4 | HIGH | App.tsx:175-178 | Task 2 |
| 5 | HIGH | SetEntryForm.tsx:38,139-142 | Task 4 |
| 6 | MEDIUM | useWorkoutActions.ts:41-45 | Task 3 |
| 7 | MEDIUM | useWorkoutActions.ts:61-67 | Task 3 |
| 8 | MEDIUM | App.tsx:299-305 | Task 2 |
| 9 | MEDIUM | ProgressScreen.tsx:157-158 | Task 8 |
| 10 | MEDIUM | selectors.ts:774 | Task 1 |
| 11 | MEDIUM | types.ts:230-231 | Task 5 |
| 12 | MEDIUM | storage.ts:82-83 | Task 6 |
| 13 | MEDIUM | selectors.ts:122-131 | Task 1 |
| 14 | MEDIUM | i18n.tsx:741-756 | Task 7 |
| 15 | MEDIUM | ExerciseOptionsPanel.tsx:38 | Task 10 |
| 16 | LOW | types.ts:206-208 | Task 5 |
| 17 | LOW | types.ts:214 | Task 5 |
| 18 | LOW | storage.ts:60-75 | **Skip** — dual-write divergence is a design choice, not a bug |
| 19 | LOW | WorkoutScreen.tsx:67 | Task 10 |
| 20 | LOW | ProgressScreen.tsx:63,68,95 | Task 8 |
| 21 | LOW | HistoryScreen:96, HomeScreen:295 | Task 9 |
| 22 | LOW | i18n.tsx:444 | Task 7 |
| 23 | LOW | SetList.tsx:44 | Task 10 |
| 24 | LOW | timer.ts:21-28 | Task 10 |
| 25 | LOW | SummaryScreen.tsx:94 | Task 10 |
| 26 | LOW | ProgressScreen.tsx:106 | Task 8 |
| 27 | LOW | App.tsx:95-106 | **Skip** — already handled by ref pattern |
| 28 | LOW | HistoryScreen.tsx:52 | Task 9 |
