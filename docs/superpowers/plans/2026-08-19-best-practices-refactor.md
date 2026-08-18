# Best Practices Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the gym-tracker app to React Router v7 (library mode), direct lucide-react icon imports, and a 100% Tailwind styling stack — deleting `App.css` and the custom `Icon.tsx` wrapper — with zero user-facing behavior change.

**Architecture:** Phase 1 replaces state-based navigation in `App.tsx` with a route map (`/`, `/planning`, `/history`, `/progress`, `/workout`, `/summary/:sessionId`) driven by `BrowserRouter`, a new `WorkoutUiContext` (workout-paused / collapsed / PR UI state) and a `useWorkoutNavigation` hook (lifecycle handlers + router transitions). Screens keep their existing prop interfaces. Phase 2 replaces every App.css class with Tailwind utilities (token colors via existing `--color-brand-*` theme), swaps `<Icon name="x"/>` for direct lucide imports, then deletes `App.css`, `Icon.tsx`, and trims `index.css`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, React Router v7, lucide-react, Vitest, oxlint, Bun.

**Spec:** `docs/superpowers/specs/2026-08-19-best-practices-refactor-design.md`

## Global Constraints

- `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build` must all pass after EVERY task.
- **Zero behavior change** — pure migration. Never alter logic while moving styles or navigation. Bug fixes: note, don't fix.
- Absolute paths for all file edits.
- Run everything on branch `refactor/best-practices` (created in Task 1). Commit after every task.
- New runtime dependency: `react-router` only. No other new deps.
- Never edit `src/lib/*`, `src/hooks/useWorkoutActions.ts`, `src/hooks/useRoutineActions.ts`, `src/store/AppContext.tsx`, `src/store/AppStore.tsx`, `src/i18n.tsx`, `src/lib/theme.ts`, or `vite.config.ts` unless a task explicitly says so.
- Tailwind color tokens (defined in `src/index.css` via `@theme`, already working): `bg-brand-bg`, `bg-brand-card`, `bg-brand-row`, `border-brand-border`, `text-brand-text`, `text-brand-heading`, `text-brand-accent`, `bg-brand-accent-bg`, `text-brand-danger`, `bg-brand-danger-bg`, `text-brand-positive`, `bg-brand-positive-bg`, `border-brand-accent`, `border-brand-danger`, `border-brand-positive`, `bg-brand-positive`.
- Arbitrary CSS-variable utilities are fine: `bg-[var(--row-bg)]` etc. — but prefer token utilities where they exist.
- **No `dark:` variants needed** — tokens flip via `[data-theme='dark']` on `<html>`.

---

## Phase 1: Routing (React Router v7, library mode)

### Task 1: Baseline verification + feature branch

**Files:**
- (no source changes)

- [ ] **Step 1: Verify the baseline**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: all pass.

- [ ] **Step 2: Create the feature branch**

```bash
git checkout -b refactor/best-practices
```

---

### Task 2: Install React Router

**Files:**
- Modify: `package.json` (via bun)

- [ ] **Step 1: Install**

```bash
bun add react-router
```

Expected: `react-router` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Verify**

Run: `bun run typecheck && bun run build`
Expected: pass (nothing imports react-router yet).

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add react-router v7"
```

---

### Task 3: Create `src/store/WorkoutUiContext.tsx`

**Files:**
- Create: `src/store/WorkoutUiContext.tsx`

**Interfaces:**
- Produces: `WorkoutUiProvider({ children })`, `useWorkoutUi()` returning:
  `{ workoutPaused, setWorkoutPaused, collapsedExerciseIds, toggleExerciseCollapsed, resetCollapsed, newPRs, setNewPRs }`

This holds the workout-session UI state that used to live in `AppContent` (App.tsx): paused flag, collapsed exercise ids, and detected PRs. It is needed by `TabLayout` (home), the `/workout` guard, and the summary route — all rendered at different route levels, so it must live above `<Routes>`.

- [ ] **Step 1: Create the file with exactly this content**

```tsx
/* eslint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { PRDetection } from '../lib/types'

export type WorkoutUiValue = {
  workoutPaused: boolean
  setWorkoutPaused: Dispatch<SetStateAction<boolean>>
  collapsedExerciseIds: Set<string>
  toggleExerciseCollapsed: (exerciseId: string, allExerciseIds: string[]) => void
  resetCollapsed: () => void
  newPRs: PRDetection[]
  setNewPRs: Dispatch<SetStateAction<PRDetection[]>>
}

const WorkoutUiContext = createContext<WorkoutUiValue | null>(null)

export function WorkoutUiProvider({ children }: { children: ReactNode }) {
  const [workoutPaused, setWorkoutPaused] = useState(false)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [newPRs, setNewPRs] = useState<PRDetection[]>([])

  function toggleExerciseCollapsed(exerciseId: string, allExerciseIds: string[]) {
    setCollapsedExerciseIds((ids) => {
      if (ids.has(exerciseId)) {
        return new Set(allExerciseIds.filter((id) => id !== exerciseId))
      }
      const next = new Set(ids)
      next.add(exerciseId)
      return next
    })
  }

  function resetCollapsed() {
    setCollapsedExerciseIds(new Set())
  }

  return (
    <WorkoutUiContext.Provider
      value={{
        workoutPaused,
        setWorkoutPaused,
        collapsedExerciseIds,
        toggleExerciseCollapsed,
        resetCollapsed,
        newPRs,
        setNewPRs,
      }}
    >
      {children}
    </WorkoutUiContext.Provider>
  )
}

export function useWorkoutUi(): WorkoutUiValue {
  const ctx = useContext(WorkoutUiContext)
  if (!ctx) throw new Error('useWorkoutUi must be used within WorkoutUiProvider')
  return ctx
}
```

Note: the first line (`/* eslint-disable react/only-export-components */`) mirrors the existing comment in `src/store/AppContext.tsx`.

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: all pass (file is not imported yet, but must compile).

- [ ] **Step 3: Commit**

```bash
git add src/store/WorkoutUiContext.tsx
git commit -m "feat: add WorkoutUiContext for workout session UI state"
```

---

### Task 4: Create `src/hooks/useWorkoutNavigation.ts`

**Files:**
- Create: `src/hooks/useWorkoutNavigation.ts`

**Interfaces:**
- Consumes: `useApp()` from `../store/AppContext` (`{ state, setState, workoutActions, ... }`), `useWorkoutUi()` from Task 3, `useNavigate()` from `react-router`, `clearTimerSnapshots` from `../lib/timer`, types `PersistedState`/`Workout` from `../lib/types`.
- Produces: `useWorkoutNavigation()` returning:
  - `startWorkout(exerciseNames?: string[], routineId?: string, dayId?: string): void` — starts workout, clears UI state, navigates to `/workout`
  - `finishWorkout(): void` — finishes workout, navigates to `/summary/<finishedId>`
  - `editSession(session: Workout): void` — reopens session, navigates to `/workout`
  - `discardWorkout(): void` — discards, navigates to `/`
  - `deleteSession(sessionId: string): void` — deletes, navigates back (`-1`)
  - `importBackup(nextState: PersistedState): void` — replaces state, navigates to `/`
  - `viewSession(session: Workout): void` — navigates to `/summary/<id>`
  - `openHistory(): void` — navigates to `/history`

These handlers replicate AppContent's handlers from the old App.tsx (lines 116-160) but perform router transitions instead of setting `viewedSession`/`activeTab` state.

- [ ] **Step 1: Create the file with exactly this content**

```ts
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { clearTimerSnapshots } from '../lib/timer'
import { useApp } from '../store/AppContext'
import { useWorkoutUi } from '../store/WorkoutUiContext'
import type { PersistedState, Workout } from '../lib/types'

export function useWorkoutNavigation() {
  const { setState, workoutActions } = useApp()
  const { setWorkoutPaused, resetCollapsed } = useWorkoutUi()
  const navigate = useNavigate()

  const startWorkout = useCallback(
    (exerciseNames: string[] = [], routineId?: string, dayId?: string) => {
      workoutActions.startWorkout(exerciseNames, routineId, dayId)
      setWorkoutPaused(false)
      resetCollapsed()
      clearTimerSnapshots()
      navigate('/workout')
    },
    [workoutActions, setWorkoutPaused, resetCollapsed, navigate],
  )

  const finishWorkout = useCallback(() => {
    const finished = workoutActions.finishWorkout()
    if (!finished) return
    setWorkoutPaused(false)
    resetCollapsed()
    clearTimerSnapshots()
    navigate(`/summary/${finished.id}`)
  }, [workoutActions, setWorkoutPaused, resetCollapsed, navigate])

  const editSession = useCallback(
    (session: Workout) => {
      workoutActions.editSession(session)
      setWorkoutPaused(false)
      resetCollapsed()
      navigate('/workout')
    },
    [workoutActions, setWorkoutPaused, resetCollapsed, navigate],
  )

  const discardWorkout = useCallback(() => {
    workoutActions.discardWorkout()
    setWorkoutPaused(false)
    resetCollapsed()
    clearTimerSnapshots()
    navigate('/')
  }, [workoutActions, setWorkoutPaused, resetCollapsed, navigate])

  const deleteSession = useCallback(
    (sessionId: string) => {
      workoutActions.deleteSession(sessionId)
      navigate(-1)
    },
    [workoutActions, navigate],
  )

  const importBackup = useCallback(
    (nextState: PersistedState) => {
      setState(nextState)
      navigate('/')
    },
    [setState, navigate],
  )

  const viewSession = useCallback(
    (session: Workout) => {
      navigate(`/summary/${session.id}`)
    },
    [navigate],
  )

  const openHistory = useCallback(() => {
    navigate('/history')
  }, [navigate])

  return {
    startWorkout,
    finishWorkout,
    editSession,
    discardWorkout,
    deleteSession,
    importBackup,
    viewSession,
    openHistory,
  }
}
```

Note: `deleteSession` uses `navigate(-1)` so deleting from a history-opened summary returns to history (matching old behavior of clearing `viewedSession`).

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: all pass (file not imported yet).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useWorkoutNavigation.ts
git commit -m "feat: add useWorkoutNavigation hook for router transitions"
```

---

### Task 5: Rewrite `src/components/BottomNav.tsx` (NavLink + icons + Tailwind)

**Files:**
- Rewrite: `src/components/BottomNav.tsx`

**Interfaces:**
- Consumes: nothing (no props anymore), `useI18n()`, `react-router` `NavLink`, lucide icons.
- Produces: `<BottomNav />` — no props. The `TabKey` type export is REMOVED (its only consumer was App.tsx, rewritten in Task 6).

- [ ] **Step 1: Replace the entire file content**

```tsx
import { NavLink } from 'react-router'
import { BarChart2, Calendar, Clock, Home } from 'lucide-react'
import { useI18n } from '../i18n'

export function BottomNav() {
  const { tr } = useI18n()

  const tabs = [
    { to: '/', label: tr('nav.home'), icon: Home },
    { to: '/planning', label: tr('nav.planning'), icon: Calendar },
    { to: '/history', label: tr('nav.history'), icon: Clock },
    { to: '/progress', label: tr('nav.progress'), icon: BarChart2 },
  ]

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-brand-card border-t border-brand-border flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]"
      aria-label="Main Navigation"
    >
      {tabs.map(({ to, label, icon: IconComponent }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-[3px] h-full bg-transparent border-none text-brand-text text-[11px] font-medium py-1 cursor-pointer transition-colors duration-150 hover:text-brand-accent ${
              isActive ? 'text-brand-accent font-bold' : ''
            }`
          }
        >
          <IconComponent size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
```

This does the full modern job for this file: NavLink routing (active state via `isActive`), direct lucide imports (replaces `Icon`), and Tailwind (replaces `.bottom-nav` / `.bottom-nav-item` / `.bottom-nav-label` from App.css — note there is no `.bottom-nav-label` rule in App.css, it was unstyled).

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: FAIL — App.tsx still imports `TabKey` from BottomNav. That is expected; the error is fixed in Task 6.

- [ ] **Step 3: Proceed to Task 6 before committing** (do not commit a broken state — Task 6 restores the build).

---

### Task 6: Rewrite `src/App.tsx` (routes, guards, layout)

**Files:**
- Rewrite: `src/App.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `WorkoutUiProvider`/`useWorkoutUi` (Task 3), `useWorkoutNavigation` (Task 4), new prop-less `BottomNav` (Task 5).
- Produces: `App` (default export, unchanged name) that renders `I18nProvider > AppStore > WorkoutUiProvider > ErrorBoundary > AppRoutes`. `AppRoutes` (local component) renders the `<Routes>` tree with `TabLayout`, `WorkoutGuard`, and `SummaryRoute` local components.
- Screen prop interfaces do NOT change in this task — every screen keeps the props it already receives. Only the wiring moves.

- [ ] **Step 1: Replace the entire content of `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Agentation } from 'agentation'
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router'
import { I18nProvider, LANG_KEY, type Lang } from './i18n'
import { HomeScreen } from './screens/HomeScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { PlanningScreen } from './screens/PlanningScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { BottomNav } from './components/BottomNav'
import { UpdateBanner } from './components/UpdateBanner'
import { ErrorBoundary } from './components/ErrorBoundary'
import type { ConsistencyStats } from './lib/types'
import { useTheme, type Theme } from './lib/theme'
import { computeConsistency, detectNewPRs, checkMilestones } from './lib/selectors'
import { loadSeenMilestones, saveSeenMilestones } from './lib/milestones'
import { useDevSeedData } from './hooks/useDevSeedData'
import { useWorkoutNavigation } from './hooks/useWorkoutNavigation'
import { AppStore } from './store/AppStore'
import { useApp } from './store/AppContext'
import { WorkoutUiProvider, useWorkoutUi } from './store/WorkoutUiContext'
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
      <AppStore>
        <WorkoutUiProvider>
          <ErrorBoundary>
            <AppRoutes
              lang={lang}
              onToggleLang={() => setLang((cur) => (cur === 'id' ? 'en' : 'id'))}
              theme={theme}
              onSetTheme={setTheme}
            />
          </ErrorBoundary>
        </WorkoutUiProvider>
      </AppStore>
      <UpdateBanner />
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </I18nProvider>
  )
}

function AppRoutes({
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
  const { setWorkoutPaused, newPRs, setNewPRs } = useWorkoutUi()
  const navigate = useNavigate()
  const [progressExercise, setProgressExercise] = useState<string | null>(null)
  const [consistencyStats, setConsistencyStats] = useState<ConsistencyStats>({
    currentWeekStreak: 0,
    longestWeekStreak: 0,
    totalSessions: 0,
    lastTrainedAt: null,
    gapDays: null,
  })
  const nav = useWorkoutNavigation()

  useDevSeedData(state, setState)

  useEffect(() => {
    const stats = computeConsistency(state.sessions)
    setConsistencyStats(stats)
    const justFinished = workoutActions.takeLastFinished()
    if (justFinished) {
      const priorSessions = state.sessions.filter(
        (session) => session.id !== justFinished.id,
      )
      setNewPRs(detectNewPRs(priorSessions, justFinished))
    }
  }, [state.sessions, workoutActions, setNewPRs])

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

  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route
          path="/"
          element={
            <HomeScreen
              sessions={state.sessions}
              routines={state.routines}
              activeWorkout={state.activeWorkout}
              onResumeWorkout={() => setWorkoutPaused(false)}
              onStart={nav.startWorkout}
              onStartWithExercises={nav.startWorkout}
              onViewSession={nav.viewSession}
              onOpenHistory={nav.openHistory}
              backupState={state}
              onImportBackup={nav.importBackup}
              lang={lang}
              onToggleLang={onToggleLang}
              theme={theme}
              onSetTheme={onSetTheme}
              consistencyStats={consistencyStats}
            />
          }
        />
        <Route
          path="/planning"
          element={
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
          }
        />
        <Route
          path="/history"
          element={
            <main className="screen">
              <HistoryScreen
                sessions={state.sessions}
                routines={state.routines}
                onViewSession={nav.viewSession}
                lang={lang}
              />
            </main>
          }
        />
        <Route
          path="/progress"
          element={
            <ProgressScreen
              sessions={state.sessions}
              selected={progressExercise}
              onSelect={setProgressExercise}
              onBack={() => navigate('/')}
            />
          }
        />
      </Route>
      <Route path="/workout" element={<WorkoutGuard />} />
      <Route path="/summary/:sessionId" element={<SummaryRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function TabLayout() {
  return (
    <div className="app-layout flex flex-col min-h-dvh pb-[72px]">
      <Outlet />
      <BottomNav />
    </div>
  )
}

function WorkoutGuard() {
  const { state, workoutActions } = useApp()
  const {
    workoutPaused,
    setWorkoutPaused,
    collapsedExerciseIds,
    toggleExerciseCollapsed,
  } = useWorkoutUi()
  const nav = useWorkoutNavigation()

  const activeWorkout = state.activeWorkout
  if (!activeWorkout || workoutPaused) return <Navigate to="/" replace />

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
      onDiscard={nav.discardWorkout}
      onFinish={nav.finishWorkout}
      sessions={state.sessions}
      collapsedExerciseIds={collapsedExerciseIds}
      onToggleCollapsed={(exerciseId) =>
        toggleExerciseCollapsed(exerciseId, activeWorkout.exercises.map((e) => e.id))
      }
    />
  )
}

function SummaryRoute() {
  const { sessionId } = useParams()
  const { state } = useApp()
  const { newPRs } = useWorkoutUi()
  const nav = useWorkoutNavigation()
  const navigate = useNavigate()

  const workout = sessionId
    ? state.sessions.find((session) => session.id === sessionId)
    : null
  if (!workout) return <Navigate to="/" replace />

  return (
    <SummaryScreen
      workout={workout}
      onStartAnother={nav.startWorkout}
      onBack={() => navigate(-1)}
      onEdit={nav.editSession}
      onDelete={nav.deleteSession}
      newPRs={newPRs}
      sessions={state.sessions}
    />
  )
}

export default App
```

- [ ] **Step 2: Update `src/main.tsx`** — wrap `<App />` in `BrowserRouter`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3: Verify**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: all pass. (`App.test.tsx` still passes — `render(<App />)` works because App does not use router hooks itself; only `AppRoutes` does, and it is rendered inside `BrowserRouter` in `main.tsx` only. Task 7 updates the test to be explicit about the router.)

- [ ] **Step 4: Manual smoke test**

Run: `bun run dev`. Verify: home loads; bottom nav navigates between all four tabs (URL changes); starting a workout opens `/workout`; finishing opens `/summary/<id>`; back button returns; `/workout` with no active workout redirects to `/`; direct URL `/summary/unknown-id` redirects to `/`.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/components/BottomNav.tsx
git commit -m "feat: replace state-based navigation with React Router v7 routes"
```

---

### Task 7: Update `src/App.test.tsx` (router-aware tests)

**Files:**
- Rewrite: `src/App.test.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import App from './App'

describe('App', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('mounts and settles without render loops', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Gym Tracker')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.getByText('Gym Tracker')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('redirects /workout to home when no active workout', async () => {
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Gym Tracker')).toBeInTheDocument()
  })

  it('redirects an unknown summary id to home', async () => {
    render(
      <MemoryRouter initialEntries={['/summary/does-not-exist']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Gym Tracker')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Verify**

Run: `bun run test`
Expected: 3 passing tests.

- [ ] **Step 3: Commit**

```bash
git add src/App.test.tsx
git commit -m "test: add router-aware app tests (MemoryRouter, guard redirects)"
```

---

## Phase 2: Migration to Tailwind + direct lucide icons

> **Global recipe (applies to EVERY Task 8–40 migration task):**
>
> 1. Replace every App.css class on an element with the exact Tailwind string from **Appendix A**. Where a class is conditional (template literal), splice the conditional parts as shown in Appendix A (`[&.x]:...` variants) — keep the template logic unchanged.
> 2. Replace every `<Icon name="x" size={n} />` with a direct lucide import per **Appendix B**: `import { Trash2 } from 'lucide-react'` and `<Trash2 size={n} aria-hidden="true" />`. Default `size` when absent is `18`. Always keep `aria-hidden="true"`.
> 3. Replace bare `<button>` with `<Button>` / `<IconButton>` from `../components/ui` (see Task 8); bare `<input>` → `<Input>`, `<select>` → `<Select>`, `<textarea>` → `<Textarea>`. This is REQUIRED: `App.css` defines global `input`/`button` styles that disappear when it is deleted. Keep all existing `type`, `onClick`, `aria-*`, `disabled` props on the swapped element.
> 4. `<h1>`–`<h4>`/`<p>` margins are already reset globally by `src/index.css` `@layer base` — do NOT add margin utilities for them unless a specific Appendix A entry says so.
> 5. Verify with the full command, then commit. One commit per file.

---

### Task 8: Create `src/components/ui.tsx` (shared primitives)

**Files:**
- Create: `src/components/ui.tsx`

This single file replaces the design doc's `src/components/ui/` directory (simpler for linear execution). It centralizes the shared patterns from App.css so migration tasks reference `Button`/`Input`/etc. instead of repeating long class strings. No existing file imports it yet — the app must keep working.

- [ ] **Step 1: Create the file with exactly this content**

```tsx
/* eslint-disable react/only-export-components */
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react'

export const CARD_CLASSES =
  'bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col gap-3'

export function Card({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <section className={`${CARD_CLASSES} ${className}`.trim()}>{children}</section>
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-col gap-4 px-4 pt-6 pb-[calc(48px+env(safe-area-inset-bottom))] flex-1">
      {children}
    </main>
  )
}

const BUTTON_BASE =
  'px-4 py-3 rounded-[10px] border border-transparent cursor-pointer font-[inherit] text-base disabled:opacity-50 disabled:cursor-not-allowed'

const BUTTON_VARIANTS = {
  primary: 'bg-brand-accent text-white',
  positive: 'bg-brand-positive text-white',
  secondary: 'bg-transparent border-brand-border text-brand-heading hover:border-brand-accent',
  danger: 'bg-transparent border-brand-danger text-brand-danger hover:bg-brand-danger-bg',
} as const

export function Button({
  variant = 'primary',
  sm = false,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS
  sm?: boolean
}) {
  return (
    <button
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${sm ? 'text-[13px] px-2.5 py-1.5 rounded-md' : ''} ${className}`.trim()}
      {...rest}
    />
  )
}

const ICON_BUTTON_BASE =
  'inline-flex items-center justify-center shrink-0 w-11 h-11 p-0 rounded-lg border border-brand-border bg-transparent text-brand-heading cursor-pointer hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1 disabled:opacity-35 disabled:cursor-not-allowed'

const ICON_BUTTON_VARIANTS = {
  default: '',
  danger: 'text-brand-danger border-brand-danger hover:bg-brand-danger-bg',
  positive: 'text-brand-positive border-brand-positive hover:bg-brand-positive-bg',
} as const

export function IconButton({
  variant = 'default',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof ICON_BUTTON_VARIANTS
}) {
  return (
    <button
      className={`${ICON_BUTTON_BASE} ${ICON_BUTTON_VARIANTS[variant]} ${className}`.trim()}
      {...rest}
    />
  )
}

const FIELD_BASE =
  'w-full px-3 py-2.5 border border-brand-border rounded-lg bg-brand-bg text-brand-heading text-base font-[inherit] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_BASE} ${className}`.trim()} {...rest} />
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD_BASE} cursor-pointer ${className}`.trim()} {...rest} />
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_BASE} resize-y min-h-10 text-sm ${className}`.trim()} {...rest} />
}
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: all pass (file is not imported yet, but must compile).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui.tsx
git commit -m "feat: add shared Tailwind UI primitives (Card, Button, Input, Select, Textarea, Screen)"
```

---

### Task 9: Migrate `src/components/ConfirmDialog.tsx`

**Files:**
- Modify: `src/components/ConfirmDialog.tsx`

**Classes to replace:** `confirm-dialog` → `fixed inset-0 z-10 flex items-center justify-center px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))] bg-black/45`; `confirm-card` → `w-full max-w-[400px] flex flex-col gap-3 p-4 bg-brand-card border border-brand-border rounded-xl shadow-[0_16px_32px_rgba(0,0,0,0.2)]`; `muted` (the `{body && <p className="muted">}` line) → `text-brand-text`.

The close button (line 78) is already Tailwind — leave it as-is. Keep `ref={dialogRef}` on the overlay div and the click-outside handler.

- [ ] **Step 1: Apply the class replacements**
- [ ] **Step 2: Verify**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/ConfirmDialog.tsx
git commit -m "style: migrate ConfirmDialog to Tailwind"
```

---

### Task 10: Migrate `src/components/NoteField.tsx`

**Files:**
- Modify: `src/components/NoteField.tsx`

**Classes to replace:** `note-field` → `<Textarea>` with `className` → `w-full px-3 py-2.5 border border-brand-border rounded-lg bg-brand-bg text-brand-heading font-[inherit] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1` + `resize-y min-h-10 text-sm`; the `compact` modifier class (`note-field compact`) → add `min-h-[36px] resize-none` when compact (keep the existing conditional logic).

Simplest: replace the `<textarea ... className={`note-field${compact ? ' compact' : ''}`}>` element with `<Textarea className={compact ? 'min-h-[36px] resize-none' : undefined} ...>`. Keep all other props (`value`, `onChange`, `placeholder`, etc.).

- [ ] **Step 1: Swap the textarea for `<Textarea>`**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/NoteField.tsx
git commit -m "style: migrate NoteField to Tailwind"
```

---

### Task 11: Migrate `src/components/InlineRename.tsx`

**Files:**
- Modify: `src/components/InlineRename.tsx`

**Classes to replace:** `rename-form` → `flex flex-col gap-2`; `inline-rename-row` → `flex gap-2 items-center flex-wrap [&_input]:flex-1 [&_input]:min-w-0`; `error` → `text-brand-danger text-sm m-0`; `btn-sm` (both buttons) → `<Button sm>` with the matching variant (`secondary` stays `variant="secondary"`; if a `primary`/`danger` appears, map accordingly).

The `<input>` inside the row → `<Input>` (its `flex-1 min-w-0` comes from the parent's `[&_input]` variant — do not add classes to the Input itself).

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/InlineRename.tsx
git commit -m "style: migrate InlineRename to Tailwind"
```

---

### Task 12: Migrate `src/components/DayScheduleSelect.tsx`

**Files:**
- Modify: `src/components/DayScheduleSelect.tsx`

**Classes to replace:** `secondary` → `<Button variant="secondary">`; `schedule-row` → `flex flex-col gap-1 mt-1`; `muted` → `text-brand-text`; `import-confirm` → `flex flex-col gap-2 p-3 rounded-[10px] bg-brand-row`; `danger` → `<Button variant="danger">`; `backup-actions` → `flex gap-2 flex-wrap [&_button]:flex-1`.

The `<select>` inside `schedule-row` → `<Select>`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/DayScheduleSelect.tsx
git commit -m "style: migrate DayScheduleSelect to Tailwind"
```

---

### Task 13: Migrate `src/components/ConsistencyWidget.tsx`

**Files:**
- Modify: `src/components/ConsistencyWidget.tsx`

**Classes to replace:**
- `consistency-widget` (base) → `px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-[10px] flex items-center justify-between gap-3`
- `comeback` conditional (wrapper template `consistency-widget${comeback ? ' comeback' : ''}`) → ` bg-brand-positive-bg border-brand-positive flex-col items-start gap-1` (note leading space, spliced into the template)
- `consistency-streak` → `flex items-baseline gap-1.5`
- `consistency-streak-number` (+ `animating` conditional) → `text-[22px] font-extrabold text-brand-accent tabular-nums leading-none` + ` animating ? 'animate-[streak-count-in_400ms_ease-out_forwards]' : ''`
- `consistency-streak-label` → `text-[13px] font-semibold text-brand-heading`
- `consistency-meta` → `text-[13px] text-brand-text text-right`
- `consistency-comeback-main` → `text-[15px] font-semibold text-brand-positive`
- `consistency-comeback-sub` → `text-[13px] text-brand-text`

- [ ] **Step 1: Apply replacements (keep the wrapper template logic)**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/ConsistencyWidget.tsx
git commit -m "style: migrate ConsistencyWidget to Tailwind"
```

---

### Task 14: Migrate `src/components/FeedbackCard.tsx`

**Files:**
- Modify: `src/components/FeedbackCard.tsx`

**Classes to replace:** `backup-actions` → `flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1`; `file-button` → `inline-flex items-center justify-center px-4 py-3 border border-brand-border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent [&_input]:hidden`. If `feedback-saved` appears → `text-brand-positive text-sm font-semibold`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/FeedbackCard.tsx
git commit -m "style: migrate FeedbackCard to Tailwind"
```

---

### Task 15: Migrate `src/components/BackupControls.tsx`

**Files:**
- Modify: `src/components/BackupControls.tsx`

**Classes to replace:** `card` → `<Card>`; `muted` → `text-brand-text`; `backup-actions` → `flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1`; `file-button` → `inline-flex items-center justify-center px-4 py-3 border border-brand-border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent [&_input]:hidden`; `import-confirm` → `flex flex-col gap-2 p-3 rounded-[10px] bg-brand-row`; `danger` → `<Button variant="danger">`; `secondary` → `<Button variant="secondary">`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/BackupControls.tsx
git commit -m "style: migrate BackupControls to Tailwind"
```

---

### Task 16: Migrate `src/components/ExerciseChart.tsx`

**Files:**
- Modify: `src/components/ExerciseChart.tsx`

**Classes to replace (SVG attributes via Tailwind fill/stroke utilities):**
- `exercise-chart` → `w-full block mb-1`
- `exercise-chart-axis-label` → `text-[11px] fill-[var(--text)]`
- `exercise-chart-line` → `fill-none stroke-brand-accent stroke-2 stroke-linecap-round stroke-linejoin-round`
- `exercise-chart-dot` → `fill-brand-card stroke-brand-accent stroke-2` + conditional variants: `pr-dot` → `fill-brand-positive stroke-brand-positive`, `weight-dot` → `fill-brand-card stroke-brand-accent`, `hovered` → `stroke-[3]` (use `[&.pr-dot]:fill-brand-positive [&.pr-dot]:stroke-brand-positive [&.weight-dot]:fill-brand-card [&.weight-dot]:stroke-brand-accent [&.hovered]:stroke-[3]` appended to the base so conditional templates keep working)
- `exercise-chart-tick-label` → `text-[10px] fill-[var(--text-muted)]`

**Note:** `stroke-2` → `stroke-width: 2`; `stroke-[3]` → `stroke-width: 3`. There is no `--color-brand-text-muted` token — use `fill-[var(--text-muted)]`.

- [ ] **Step 1: Apply replacements (keep the dot classname template conditionals)**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseChart.tsx
git commit -m "style: migrate ExerciseChart to Tailwind"
```

---

### Task 17: Migrate `src/components/ExerciseCard/ExerciseHeader.tsx`

**Files:**
- Modify: `src/components/ExerciseCard/ExerciseHeader.tsx`

**Icons to swap:** `more` (size 18) → `MoreVertical`; `collapsed ? 'chevron-down' : 'chevron-up'` (size 18) → `{collapsed ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronUp size={18} aria-hidden="true" />}`.

**Classes to replace:** `exercise-head` → `flex items-start gap-2`; `exercise-title` → `flex-1 min-w-0`; `exercise-summary` → `mt-1 text-brand-text text-sm`; `collapse-toggle` → `inline-flex items-center justify-center shrink-0 w-11 h-11 p-0 mt-0.5 border-none rounded-lg bg-transparent text-brand-text cursor-pointer hover:bg-brand-row hover:text-brand-heading focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`.

The two bare `<button>` elements (options toggle + collapse toggle) become `<IconButton>` (options button uses `IconButton`; collapse toggle keeps its custom class string — it is NOT an `icon-btn`, it is `collapse-toggle` with no border, so use a plain `<button>` with the class string above).

- [ ] **Step 1: Swap icons and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseCard/ExerciseHeader.tsx
git commit -m "style: migrate ExerciseHeader to Tailwind and direct lucide icons"
```

---

### Task 18: Migrate `src/components/ExerciseCard/ExerciseOptionsPanel.tsx`

**Files:**
- Modify: `src/components/ExerciseCard/ExerciseOptionsPanel.tsx`

**Icons to swap:** `pencil` (14) → `Pencil`; `arrow-up` (14) → `ArrowUp`; `arrow-down` (14) → `ArrowDown`; `trash` (14) → `Trash2`.

**Classes to replace:** `exercise-options-panel` → `flex flex-col gap-2.5 px-3 py-2.5 bg-brand-row rounded-lg border border-brand-border`; `options-row` → `flex items-center justify-between gap-2`; `options-label` → `text-[13px] font-medium text-brand-heading`; `options-actions` → `flex gap-1.5 flex-wrap items-center`; `inline-confirm` → `flex gap-2 flex-wrap justify-end`; `unit-select` → `<Select>`; `btn-sm` (all) → `<Button sm>` with the existing variant (`secondary` → `variant="secondary"`, `danger` → `variant="danger"`, `positive` → `variant="positive"`); `icon-btn` (if any appear here) → `<IconButton>`.

- [ ] **Step 1: Swap icons and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseCard/ExerciseOptionsPanel.tsx
git commit -m "style: migrate ExerciseOptionsPanel to Tailwind and direct lucide icons"
```

---

### Task 19: Migrate `src/components/ExerciseCard/SetEntryForm.tsx`

**Files:**
- Modify: `src/components/ExerciseCard/SetEntryForm.tsx`

**Icons to swap:** `check` (18) → `Check`.

**Classes to replace:** `field` → `flex flex-col gap-1 [&_label]:text-[13px]`; `set-form` → `grid grid-cols-2 gap-3 items-end [&_button]:col-span-2 [&_.error]:col-span-2`; `set-form-meta` → `col-span-2 flex gap-2 flex-wrap items-center`; `set-type-row` → `flex gap-1.5 flex-1 min-w-0`; `set-type-btn` (template with `active`) → `flex-1 text-[13px] px-2.5 py-2 rounded-lg bg-transparent border border-brand-border text-brand-heading cursor-pointer hover:border-brand-accent [&.active]:border-brand-accent [&.active]:bg-brand-accent-bg`; `set-fields-grid` → `col-span-2 grid grid-cols-2 gap-2.5`; `current-set-execution-card` → `flex flex-col gap-2.5 p-3 bg-brand-row border-[1.5px] border-brand-accent rounded-[10px]`; `current-set-header` → `flex items-center justify-between`; `current-set-title` → `text-[13px] font-bold tracking-wider uppercase text-brand-accent`; `positive` → `<Button variant="positive">`; `error` → `text-brand-danger text-sm m-0`; `complete-set-btn` → `flex items-center justify-center gap-2 min-h-12 text-base font-semibold w-full` (append to the `<Button variant="positive">` className).

The two bare `<input>` fields → `<Input>` (with `aria-label` kept).

- [ ] **Step 1: Swap icons and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseCard/SetEntryForm.tsx
git commit -m "style: migrate SetEntryForm to Tailwind and direct lucide icons"
```

---

### Task 20: Migrate `src/components/SetList.tsx` (adds `rowClassName` prop)

**Files:**
- Modify: `src/components/SetList.tsx`

**Icons to swap:** `check` (14) → `Check`.

**New prop:** add `rowClassName?: string` to the props type. It is applied to the base row `<li>` class string: `className={`${rowClassName ?? ''}${isDrop ? ' drop-row' : ''}${highlightId === set.id ? ' set-highlight' : ''}`}` — i.e. insert `${rowClassName ?? ''}` first, keep the existing template logic. Default row styling moves into the base (see below) instead of the `<ul>` parent's `li` rule.

**Classes to replace:**
- `sets` (the `<ul>`) → `list-none m-0 p-0 flex flex-col gap-1.5`
- Base row `<li>` gets: `flex justify-between items-center gap-2 px-2.5 py-2 bg-brand-row rounded-lg scroll-mt-[calc(100px+env(safe-area-inset-top))]`
- `drop-row` → `ml-5 bg-brand-bg`
- `set-highlight` → `animate-[set-flash_1.2s_ease-out]`
- `set-badge` → **remove entirely** (dead class, no CSS rule for `set-badge` or any `set.type` variant — drop the `className={`set-badge ${set.type}`}` attribute from the span, keep the span and its `tr(`setType.${set.type}`)` text)
- `set-edit-toggle` → `flex-1 min-w-0 flex items-center gap-2 text-left font-[inherit] text-[inherit] bg-transparent border-none p-0 cursor-pointer disabled:opacity-100 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1 focus-visible:rounded`
- `set-edit-toggle-info` → `flex-1 min-w-0 flex justify-between items-center gap-2`
- `set-edit-row` → `flex flex-col gap-2`
- `set-edit-form` → `flex gap-2 items-center flex-wrap [&_select]:flex-1 [&_input]:flex-1 [&_select]:min-w-0 [&_input]:min-w-0`
- `rename-actions` → `flex gap-2`
- `error` → `text-brand-danger text-sm m-0`
- `drop-marker` → `text-brand-text text-[13px] shrink-0`
- `completed-check-icon` → `inline-flex items-center justify-center text-brand-positive ml-1`
- `btn-sm` → `<Button sm>` (`primary` → default variant, `danger` → `variant="danger"`, `secondary` → `variant="secondary"`)
- `<select>` → `<Select>`, the two `<input>` → `<Input>`

**Note:** the `ref` on the last row `<li>` must stay on the row `<li>`.

- [ ] **Step 1: Apply replacements and add the prop**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/SetList.tsx
git commit -m "style: migrate SetList to Tailwind and direct lucide icons; add rowClassName prop"
```

---

### Task 21: Migrate `src/components/ExerciseCard/index.tsx`

**Files:**
- Modify: `src/components/ExerciseCard/index.tsx`

**Icons to swap:** `pencil` (14) → `Pencil`.

**Classes to replace:**
- The `<section>` template `className={`card exercise${isActiveExercise ? ' active-exercise' : ' inactive-exercise'}`}` → `className={`${CARD_CLASSES}${isActiveExercise ? ' border-brand-accent shadow-[0_2px_8px_rgba(124,58,237,0.08)]' : ' opacity-85 transition-opacity duration-150 ease-in hover:opacity-100 hover:border-brand-border'}`}` with `import { CARD_CLASSES } from '../ui'`
- `collapsed-actions` → `flex flex-col gap-2 items-start [&_button]:w-full`
- `muted` → `text-brand-text`
- `previous-summary` → `whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2.5 py-1.5 bg-brand-row rounded-lg`
- `target-line` → `text-brand-accent font-semibold text-sm m-0`
- `previous-block` → `p-2.5 bg-brand-row border-l-[3px] border-l-brand-accent rounded-r-lg [&_h4]:text-[13px] [&_h4]:text-brand-text [&_h4]:mb-1.5`
- `best-line` → `ml-2 text-brand-accent`
- The read-only `<SetList sets={prevSession.sets} unit={exercise.unit} />` (inside `previous-block`) → add `rowClassName="bg-brand-bg"` (replaces the old `.previous-block .sets li { background: var(--bg) }` override)
- The editable `<SetList ... />` stays without `rowClassName`
- `rename-form` → `flex flex-col gap-2`; `rename-actions` → `flex gap-2`; `btn-sm` (buttons) → `<Button sm>`; `error` → `text-brand-danger text-sm m-0`
- The bare `<input>` in the rename form → `<Input>`
- The "fill previous" button `btn-sm secondary repeat-btn` → `<Button variant="secondary" sm className="inline-flex items-center justify-center gap-2">` (`repeat-btn` → `inline-flex items-center justify-center gap-2` merged into the className)

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseCard/index.tsx
git commit -m "style: migrate ExerciseCard to Tailwind and direct lucide icons"
```

---

### Task 22: Migrate `src/components/RestTimer.tsx`

**Files:**
- Modify: `src/components/RestTimer.tsx`

**Icons to swap:** `clock` (14) → `Clock`.

**Classes to replace:**
- Wrapper template (`rest-timer` + conditional `compact` / `done`) → base `flex items-center gap-2.5 flex-wrap w-full`; `compact` → `pt-0 border-t-0`; `done` → nothing on the wrapper (the done-state color moves to the display span, below)
- `timer-display-btn` → `inline-flex items-center justify-center px-1.5 py-1 -ml-1.5 border-none rounded-[10px] bg-transparent text-inherit cursor-pointer hover:bg-brand-row focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`
- `timer-display` → `text-[38px] font-extrabold tabular-nums text-brand-heading min-w-[90px] leading-none`. **In the `status === 'done'` branch only**, add `text-brand-positive` to that display span (replaces the old `.rest-timer.done .timer-display` rule — the running-state display stays `text-brand-heading`)
- `timer-progress` → `flex-1 min-w-12 h-1 rounded-full bg-brand-row overflow-hidden [&_div]:h-full [&_div]:bg-brand-positive [&_div]:transition-[width] [&_div]:duration-[250ms] [&_div]:ease-linear`
- `timer-done-msg` → `text-brand-positive text-[13px] font-semibold`
- `timer-chip` (base, incl. the `active` conditional template) → `text-[15px] px-3.5 py-2.5 rounded-[10px] border border-brand-border bg-transparent text-brand-heading cursor-pointer font-medium hover:border-brand-positive hover:text-brand-positive [&.active]:border-brand-positive [&.active]:text-brand-positive [&.active]:bg-brand-positive-bg`
- `timer-quick` (on the same button as `timer-chip`) → `flex-1 inline-flex justify-center items-center gap-2 text-[17px] font-bold px-4 py-3.5 rounded-xl bg-brand-row`
- `timer-settings` (on the `timer-chip` button with the clock icon) → `inline-flex items-center justify-center px-3.5 py-3 rounded-xl`
- `timer-chip-duration` → `tabular-nums font-bold`
- `timer-custom` (the bare `<input>`) → `<Input className="w-16! px-2.5 py-2 text-[15px]">` — the `!` important flag overrides the Input's `w-full`
- `btn-sm` → `<Button sm>` (`secondary` → `variant="secondary"`, `positive` → `variant="positive"`, `primary` → default)

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/RestTimer.tsx
git commit -m "style: migrate RestTimer to Tailwind and direct lucide icons"
```

---

### Task 23: Migrate `src/components/PlateCalculator.tsx`

**Files:**
- Modify: `src/components/PlateCalculator.tsx`

**Icons to swap:** `calculator` (24) → `Calculator`.

**Classes:** this file has NO App.css classes (it already uses Tailwind utilities). Only swap the icon and remove `import { Icon } from './Icon'`. The `ConfirmDialog` usage needs no change (migrated in Task 9).

- [ ] **Step 1: Swap the icon import and usage**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/PlateCalculator.tsx
git commit -m "style: swap PlateCalculator to direct lucide icon"
```

---

### Task 24: Migrate `src/components/AddExerciseForm.tsx`

**Files:**
- Modify: `src/components/AddExerciseForm.tsx`

**Classes to replace:** `card` (on the `<form>` element — use `CARD_CLASSES` from `../components/ui` on the form, NOT the `<Card>` component, since the element must stay a `<form>`): `className="card add-exercise"` → `className={`${CARD_CLASSES} [&_.field]:mb-1`}`; `field` → `flex flex-col gap-1 [&_label]:text-[13px]`; `error` → `text-brand-danger text-sm m-0`; `primary` → `<Button>`; `recent-exercises` → `flex flex-col gap-2`; `recent-label` → `text-[13px]`; `recent-list` → `list-none m-0 p-0 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto`; `recent-item` → `w-full text-left text-[15px] px-3 py-2.5 bg-brand-row border border-brand-border rounded-lg text-brand-heading cursor-pointer hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`.

Bare `<input>` → `<Input>`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/AddExerciseForm.tsx
git commit -m "style: migrate AddExerciseForm to Tailwind"
```

---

### Task 25: Migrate `src/components/AddRoutineExerciseForm.tsx`

**Files:**
- Modify: `src/components/AddRoutineExerciseForm.tsx`

**Icons to swap:** `plus` (14) → `Plus`.

**Classes:** all App.css classes used here are DEAD (no rules exist): `add-routine-exercise-wrapper`, `add-exercise-day-inline`, `input-with-suggestions`, `routine-suggestions-dropdown`, `suggestion-item`, `inline-add-btn` — **remove them from the className strings entirely** (keep the structure: the `<div>`, `<form>`, suggestion `<ul>`, `<li>` elements stay, just without dead class names; the suggestion list keeps its conditional rendering).

`error` → `text-brand-danger text-sm m-0`; `btn-sm` (the submit button) → `<Button variant="positive" sm>` (the original is `btn-sm positive flex-shrink-0 inline-add-btn`).

The bare `<input>` → `<Input>`.

- [ ] **Step 1: Remove dead classes, swap icon, migrate error/btn-sm/input**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/AddRoutineExerciseForm.tsx
git commit -m "style: migrate AddRoutineExerciseForm to Tailwind, remove dead classes"
```

---

### Task 26: Migrate `src/components/RoutineCard.tsx`

**Files:**
- Modify: `src/components/RoutineCard.tsx`

**Icons to swap:** `pencil` (16) → `Pencil`; `trash` (16) → `Trash2`; `arrow-up` (16) → `ArrowUp`; `arrow-down` (16) → `ArrowDown`; `chevron-up`/`chevron-down` (16, ternary) → conditional `<ChevronUp>`/`<ChevronDown>`.

**Classes to replace:** `card` → `<Card>`; `routine-head` → `flex justify-between items-start gap-2`; `routine-title` → `min-w-0`; `days` → `list-none m-0 p-0 flex flex-col gap-2`; `day` → `flex flex-col gap-2 p-2.5 bg-brand-row rounded-lg`; `day-head` → `flex justify-between items-center gap-2 flex-wrap`; `day-body` → `flex flex-col gap-1.5`; `day-toggle` → `flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left text-[15px] bg-transparent border-none text-brand-heading px-0 py-1 cursor-pointer`; `day-toggle-main` → `flex items-center justify-between gap-2 w-full`; `exercise-row` → `flex justify-between items-center gap-2 px-2 py-1.5 bg-brand-bg rounded-md text-sm`; `inline-confirm` → `flex gap-2 flex-wrap justify-end`; `icon-btn` (all) → `<IconButton>` (danger variants → `variant="danger"`); `btn-sm` → `<Button sm>`; `muted` → `text-brand-text`; `exercise-actions` → `flex gap-2 flex-wrap justify-end items-center`.

If any template string contains a bare `routine` token with no CSS rule, drop it.

- [ ] **Step 1: Swap icons and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/RoutineCard.tsx
git commit -m "style: migrate RoutineCard to Tailwind and direct lucide icons"
```

---

### Task 27: Migrate `src/components/InstallPwaBanner.tsx`

**Files:**
- Modify: `src/components/InstallPwaBanner.tsx`

**Icons to swap:** `x` (16) → `X`.

**Classes to replace:** `pwa-banner` → `mb-4 px-4 py-3.5 rounded-xl bg-brand-card border border-brand-accent shadow-[0_4px_16px_rgba(124,58,237,0.12)]`; `pwa-banner-content` → `flex items-center justify-between gap-3`; `pwa-banner-info` → `flex flex-col gap-0.5 [&_strong]:text-[15px] [&_strong]:text-brand-heading [&_p]:text-[13px]`; `ios-guide-text` → `font-semibold text-brand-accent mt-1`; `pwa-banner-actions` → `flex items-center gap-2`; `icon-btn-sm` → `inline-flex items-center justify-center p-1.5 border-none rounded-lg bg-transparent text-brand-text cursor-pointer hover:bg-brand-row`; `btn-sm` → `<Button sm>` (match the existing variant — if it has no variant class, use `variant="secondary"`); `muted` → `text-brand-text`.

- [ ] **Step 1: Swap icon and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/InstallPwaBanner.tsx
git commit -m "style: migrate InstallPwaBanner to Tailwind and direct lucide icons"
```

---

### Task 28: Migrate `src/components/UpdateBanner.tsx`

**Files:**
- Modify: `src/components/UpdateBanner.tsx`

**Classes to replace:** wrapper template `update-banner${needRefresh ? ' update-banner-refresh' : ' update-banner-toast'}` → base `fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[608px] flex items-center justify-between gap-3 px-3 py-2.5 bg-brand-card border border-brand-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-[45] animate-[sheet-in_180ms_ease-out]`; `update-banner-refresh` → **remove** (dead, no rule); `update-banner-toast` → `justify-center border-brand-accent`; `update-banner-text` → `text-sm text-brand-heading`; `update-banner-actions` → `flex items-center gap-1.5 shrink-0`; `icon-btn` → `<IconButton>`; `btn-sm` → `<Button sm>` (match existing variant).

- [ ] **Step 1: Apply replacements (keep the template ternary)**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/UpdateBanner.tsx
git commit -m "style: migrate UpdateBanner to Tailwind"
```

---

### Task 29: Migrate `src/components/ErrorBoundary.tsx`

**Files:**
- Modify: `src/components/ErrorBoundary.tsx`

**Classes to replace:** `screen` (the `<main>`) → `<Screen>` from `../components/ui`; `card` → `<Card>`; `primary` → `<Button>`; `backup-actions` → `flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "style: migrate ErrorBoundary to Tailwind"
```

---

### Task 30: Migrate `src/screens/HomeScreen/RoutinePicker.tsx`

**Files:**
- Modify: `src/screens/HomeScreen/RoutinePicker.tsx`

**Classes to replace:** `card` → `<Card>`; `days` → `list-none m-0 p-0 flex flex-col gap-2`; `day` → `flex flex-col gap-2 p-2.5 bg-brand-row rounded-lg`; `day-head` → `flex justify-between items-center gap-2 flex-wrap`; `day-body` → `flex flex-col gap-1.5`; `day-toggle` → `flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left text-[15px] bg-transparent border-none text-brand-heading px-0 py-1 cursor-pointer`; `pick-day` → `border-none bg-transparent cursor-pointer font-[inherit] w-full px-2 py-2 rounded-md flex flex-col items-start gap-0.5 text-brand-heading text-[15px] hover:bg-brand-bg` (used combined as `day-toggle pick-day` — splice the two strings); `muted` → `text-brand-text`.

Bare `<button>` elements → `<Button>`/explicit class strings with the base button styles where the original was a bare button.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen/RoutinePicker.tsx
git commit -m "style: migrate RoutinePicker to Tailwind"
```

---

### Task 31: Migrate `src/screens/HomeScreen/ActiveWorkoutBanner.tsx`

**Files:**
- Modify: `src/screens/HomeScreen/ActiveWorkoutBanner.tsx`

**Classes to replace:** `active-workout-banner` → `flex justify-between items-center gap-3 px-3.5 py-2.5 bg-brand-accent-bg border border-brand-accent rounded-[10px] text-brand-heading`; `active-workout-info` → `flex items-center gap-2.5 [&_strong]:text-brand-heading`; `pulse-dot` → `w-2.5 h-2.5 rounded-full bg-brand-accent shadow-[0_0_0_0_rgba(124,58,237,0.7)] animate-[pulse-ring_1.8s_infinite]`; `primary` → `<Button>`; `muted` → `text-brand-text`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen/ActiveWorkoutBanner.tsx
git commit -m "style: migrate ActiveWorkoutBanner to Tailwind"
```

---

### Task 32: Migrate `src/screens/HomeScreen/SettingsModal.tsx`

**Files:**
- Modify: `src/screens/HomeScreen/SettingsModal.tsx`

**Icons to swap:** the theme option ternary (`'sun' | 'moon' | 'monitor'`, size 16) → `{option === 'light' ? <Sun size={16} aria-hidden="true" /> : option === 'dark' ? <Moon size={16} aria-hidden="true" /> : <Monitor size={16} aria-hidden="true" />}` with the three imports from `lucide-react`.

**Classes to replace:** `settings-content` → `flex flex-col gap-4 mt-3 pt-3 border-t border-brand-border`; `about-sub` → `flex flex-col gap-2.5`; `theme-options` → `grid grid-cols-3 gap-2`; `theme-option` (template with `active`) → `flex flex-col items-center gap-1 px-2 py-2 border border-brand-border rounded-lg bg-brand-card text-brand-text text-[13px] font-[inherit] cursor-pointer transition-[background,color,border-color] duration-[120ms] [&.active]:bg-brand-accent-bg [&.active]:border-brand-accent [&.active]:text-brand-heading [&.active]:font-semibold`; `muted` → `text-brand-text`; `backup-actions` → `flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1`; `file-button` (the two `<a>` links) → `inline-flex items-center justify-center px-4 py-3 border border-brand-border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent [&_input]:hidden`; `btn-sm` + `secondary` on those links → also add `text-[13px] px-2.5 py-1.5 rounded-md` and `bg-transparent border-brand-border text-brand-heading hover:border-brand-accent`.

**Note:** `ConfirmDialog` here needs NO `settings-modal` class — the `.settings-modal .confirm-dialog` CSS in App.css is dead (no element carries `settings-modal`) and is deleted with App.css in Task 42. The dialog renders centered, exactly as it does today.

- [ ] **Step 1: Swap icons and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen/SettingsModal.tsx
git commit -m "style: migrate SettingsModal to Tailwind and direct lucide icons"
```

---

### Task 33: Migrate `src/screens/HomeScreen/index.tsx`

**Files:**
- Modify: `src/screens/HomeScreen/index.tsx`

**Icons to swap:** `settings` (18) → `Settings`.

**Classes to replace:**
- `screen` (the `<main>`) → `<Screen>`
- `screen-header` → `mb-1 [&_h1]:mb-1` (combined with existing `header-row` → `flex justify-between items-start gap-3`; splice both strings into the one className)
- `muted` → `text-brand-text`
- `btn-sm` → `<Button sm>`; `secondary` → `variant="secondary"`; `primary` → `<Button>`
- `lang-toggle` (on the `btn-sm secondary` lang button) → `shrink-0 min-w-[44px]`
- `icon-btn` settings button (template `icon-btn${settingsOpen ? ' active' : ''}`) → `<IconButton aria-expanded={settingsOpen} aria-label={...}>` — **drop the `active` modifier** (dead, no rule for `icon-btn.active`)
- `card` (the `<section className="card today-card">`) → `<Card>` — **drop `today-card`** (dead class)
- `plan-header-info` → **remove** (dead class)
- `exercise-summary` → `mt-1 text-brand-text text-sm`
- `sequence-mismatch-banner` → `flex flex-col items-start gap-1.5 my-2.5 mb-3.5 px-3 py-2.5 rounded-[10px] bg-brand-row border border-dashed border-brand-border`
- `mismatch-tag` → `text-[13px] font-medium text-brand-text`
- `btn-link` → `bg-none border-none p-0 text-[13px] font-semibold text-brand-accent cursor-pointer underline hover:opacity-85`
- `today-exercises` → `list-none m-0 p-0 flex flex-col gap-1 max-h-[220px] overflow-y-auto text-sm`
- `backup-actions` → `flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1`
- `recent` → `flex flex-col gap-2`
- `session-list` → `list-none m-0 p-0 flex flex-col gap-2`
- `session-item` → `w-full flex justify-between items-center gap-2 text-left text-[15px] bg-brand-card border border-brand-border rounded-[10px] p-3 hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`
- `session-item-main` → `flex flex-col gap-0.5`
- `session-name` → `font-semibold text-brand-heading text-[15px] leading-[1.3]`
- `session-preview` → `text-[13px]`
- `session-date-secondary` → `text-xs mt-px`
- `session-meta` → `text-[13px] whitespace-nowrap shrink-0`

- [ ] **Step 1: Swap icon and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen/index.tsx
git commit -m "style: migrate HomeScreen to Tailwind and direct lucide icons"
```

---

### Task 34: Migrate `src/screens/HistoryScreen.tsx`

**Files:**
- Modify: `src/screens/HistoryScreen.tsx`

**Classes to replace:** `screen-header` → `mb-1 [&_h1]:mb-1`; `muted` → `text-brand-text`; `session-list` → `list-none m-0 p-0 flex flex-col gap-2`; `session-item` → `w-full flex justify-between items-center gap-2 text-left text-[15px] bg-brand-card border border-brand-border rounded-[10px] p-3 hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`; `session-item-main` → `flex flex-col gap-0.5`; `session-name` → `font-semibold text-brand-heading text-[15px] leading-[1.3]`; `session-date-secondary` → `text-xs mt-px`; `btn-sm` → `<Button sm>` (with existing variant).

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/HistoryScreen.tsx
git commit -m "style: migrate HistoryScreen to Tailwind"
```

---

### Task 35: Migrate `src/screens/PlanningScreen.tsx`

**Files:**
- Modify: `src/screens/PlanningScreen.tsx`

**Classes to replace:** `screen-header` → `mb-1 [&_h1]:mb-1`; `muted` → `text-brand-text`; `planning-tab-bar` → **remove** (dead class — keep the container element, just drop the class).

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/PlanningScreen.tsx
git commit -m "style: migrate PlanningScreen to Tailwind"
```

---

### Task 36: Migrate `src/screens/ProgramPickerScreen.tsx`

**Files:**
- Modify: `src/screens/ProgramPickerScreen.tsx`

**Classes to replace:** `screen-header` → `mb-1 [&_h1]:mb-1`; `muted` → `text-brand-text`; `card` → `<Card>`; `program-card` → `flex flex-col items-start gap-1.5 text-left px-4 py-3.5 rounded-xl border border-brand-border bg-brand-card text-brand-heading hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`; `program-goal` → `flex flex-col items-start gap-1 text-left px-4 py-3.5 rounded-xl border border-brand-border bg-brand-card text-brand-heading hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`; `program-goal-list` → `flex flex-col gap-2.5`; `program-meta` → `text-[13px] text-brand-text`; `days` → `list-none m-0 p-0 flex flex-col gap-2`; `day` → `flex flex-col gap-2 p-2.5 bg-brand-row rounded-lg`; `day-head` → `flex justify-between items-center gap-2 flex-wrap`; `exercise-row` → `flex justify-between items-center gap-2 px-2 py-1.5 bg-brand-bg rounded-md text-sm`; `program-preview-days` → `max-h-[360px] overflow-y-auto`; `backup-actions` → `flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1`; `primary` → `<Button>`; `secondary` → `<Button variant="secondary">`; `btn-sm` → `<Button sm>`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/ProgramPickerScreen.tsx
git commit -m "style: migrate ProgramPickerScreen to Tailwind"
```

---

### Task 37: Migrate `src/screens/SummaryScreen.tsx`

**Files:**
- Modify: `src/screens/SummaryScreen.tsx`

**Classes to replace:** `screen` → `<Screen>`; `screen-header` → `mb-1 [&_h1]:mb-1`; `muted` → `text-brand-text`; `active-workout-banner` → `flex justify-between items-center gap-3 px-3.5 py-2.5 bg-brand-accent-bg border border-brand-accent rounded-[10px] text-brand-heading` (the inline `style={{ background: 'var(--positive-bg)', borderColor: 'var(--positive)' }}` stays as-is and overrides the utilities — keep it); `active-workout-info` → `flex items-center gap-2.5 [&_strong]:text-brand-heading`; `pulse-dot` → `w-2.5 h-2.5 rounded-full bg-brand-accent shadow-[0_0_0_0_rgba(124,58,237,0.7)] animate-[pulse-ring_1.8s_infinite]` (keep the inline `style={{ background: 'var(--positive)', boxShadow: 'none' }}`); `pr-callout-card` → `bg-brand-positive-bg border border-brand-positive rounded-[10px] px-3.5 py-3 flex flex-col gap-2`; `pr-callout-title` → `text-[13px] font-bold uppercase tracking-wider text-brand-positive`; `pr-callout-item` → `flex flex-col gap-px`; `pr-callout-main` → `text-[15px] font-semibold text-brand-heading`; `pr-callout-prev` → `text-[13px] text-brand-text`; `summary-note` → `m-0 px-2.5 py-2 border-l-[3px] border-l-brand-accent bg-brand-row rounded-r-md text-sm text-brand-text whitespace-pre-wrap break-words`; `card` → `<Card>`; `summary-identity-line` → `text-center text-sm italic text-brand-text py-1`; `summary-count` → `text-center my-1`; `primary` → `<Button>`; `secondary` → `<Button variant="secondary">`; `btn-sm` → `<Button sm>` (with existing variant + `flex-1` kept in className); `danger` → `<Button variant="danger">`; `confirm-actions` → `flex gap-2 flex-wrap [&_button]:flex-1`; `sets` `<ul>` (the exercise's sets list) → `list-none m-0 p-0 flex flex-col gap-1.5` — keep using the read-only `<SetList>` (no `rowClassName`).

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/SummaryScreen.tsx
git commit -m "style: migrate SummaryScreen to Tailwind"
```

---

### Task 38: Migrate `src/screens/WorkoutScreen.tsx`

**Files:**
- Modify: `src/screens/WorkoutScreen.tsx`

**Icons to swap:** `arrow-left` (no size → default 18) → `ArrowLeft`.

**Classes to replace:** `screen` → `<Screen>`; `screen-header` → `mb-1 [&_h1]:mb-1` (spliced with `compact-workout-header` → `flex justify-between items-center [&_h1]:text-[22px]`); `workout-header-title` → `flex items-baseline gap-2.5`; `muted` → `text-brand-text`; `workout-timer-container` → `sticky top-[env(safe-area-inset-top)] z-10 px-4 py-3.5 -m-1 mb-3 bg-brand-card border border-brand-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]`; `confirm-actions` → `flex gap-2 flex-wrap [&_button]:flex-1`; `primary` → `<Button>`; `danger` → `<Button variant="danger">`; `finish-modal-body` → **remove** (dead class — keep the `<div>`); `secondary` → `<Button variant="secondary">`; `positive` → `<Button variant="positive">`; `empty` → `py-2`; `workout-bottom-actions` → `sticky bottom-0 z-[15] flex flex-col gap-2 px-4 py-3.5 mt-5 -mx-4 -mb-4 bg-brand-card border-t border-brand-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)]`; `workout-actions-row` → `flex items-center gap-2`; `icon-btn` (the arrow-left button) → `<IconButton aria-label={...}>`; `finish` → `mt-2`; `error` → `text-brand-danger text-sm m-0`; `hint` → `text-center`.

**Note:** the `<main className="screen">` has `compact-workout-header` on the `<header>`, not the main. The two `<ConfirmDialog>` usages need no changes. Keep `style={{ marginTop: '1rem' }}` on the second `confirm-actions`.

- [ ] **Step 1: Swap icon and classes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/WorkoutScreen.tsx
git commit -m "style: migrate WorkoutScreen to Tailwind and direct lucide icons"
```

---

### Task 39: Migrate `src/screens/ProgressScreen.tsx`

**Files:**
- Modify: `src/screens/ProgressScreen.tsx`

**Props are UNCHANGED** (`sessions`, `selected`, `onSelect`, `onBack`) — App.tsx keeps passing them (already wired in Task 6).

**Classes to replace:** `screen` → `<Screen>` (both `<main>`s); `screen-header` → `mb-1 [&_h1]:mb-1`; `muted` → `text-brand-text`; `empty` → `py-2`; `btn-sm` → `<Button sm>` with existing variant (`secondary`); `card` → `<Card>`; `progress-best-block` → `flex items-center gap-2`; `progress-pr-badge` → `bg-brand-positive text-white text-[11px] font-bold px-1.5 py-0.5 rounded-[5px] tracking-wide`; `progress-best-value` → `text-lg font-bold text-brand-heading`; `sets` `<ul>` → `list-none m-0 p-0 flex flex-col gap-1.5`; **its `<li>` rows** (which previously got `.sets li` styles) → each `<li>` gets `flex justify-between items-center gap-2 px-2.5 py-2 bg-brand-row rounded-lg`; `progress-summary-strip` → `flex items-center justify-around bg-brand-card border border-brand-border rounded-xl p-4 gap-2`; `progress-summary-stat` → `flex flex-col items-center gap-0.5 flex-1`; `progress-summary-value` → `text-2xl font-bold text-brand-heading leading-none`; `progress-summary-label` → `text-xs text-brand-text`; `progress-summary-divider` → `w-px h-9 bg-brand-border shrink-0`; `progress-exercise-list` → `list-none m-0 p-0 flex flex-col gap-1.5`; `progress-exercise-row` → `w-full flex justify-between items-center gap-3 text-left bg-brand-card border border-brand-border rounded-[10px] px-3.5 py-3 font-[inherit] text-[15px] text-inherit cursor-pointer transition-[border-color] duration-[150ms] hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1`; `progress-exercise-info` → `flex flex-col gap-0.5 min-w-0`; `progress-exercise-name` → `font-semibold text-brand-heading whitespace-nowrap overflow-hidden text-ellipsis`; `progress-exercise-count` → `text-xs`; `progress-exercise-right` → `flex items-center gap-2 shrink-0`; `progress-exercise-best` → `text-[13px] font-semibold text-brand-accent whitespace-nowrap`; `progress-trend` (template with `up`/`down`/`flat`) → `text-base font-bold leading-none w-5 text-center [&.up]:text-brand-positive [&.down]:text-brand-text [&.down]:opacity-50 [&.flat]:text-brand-text [&.flat]:opacity-40`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/ProgressScreen.tsx
git commit -m "style: migrate ProgressScreen to Tailwind"
```

---

### Task 40: Migrate `src/screens/RoutineEditorScreen.tsx`

**Files:**
- Modify: `src/screens/RoutineEditorScreen.tsx`

**Classes to replace:** `screen-header` → `mb-1 [&_h1]:mb-1` (spliced with the existing `flex items-start justify-between gap-3`); `muted` → `text-brand-text`; `btn-sm` → `<Button sm>` (with existing variant `secondary`); `primary` → `<Button>`; `empty` → `py-2`.

- [ ] **Step 1: Apply replacements**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/screens/RoutineEditorScreen.tsx
git commit -m "style: migrate RoutineEditorScreen to Tailwind"
```

---

### Task 41: Clean up `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Changes:**
1. `TabLayout`: `className="app-layout flex flex-col min-h-dvh pb-[72px]"` → remove the dead `app-layout` class: `className="flex flex-col min-h-dvh pb-[72px]"`.
2. The two `<main className="screen">` wrappers (planning + history routes) → `<Screen>` from `./components/ui` (keep the `<PlanningScreen ... />` / `<HistoryScreen ... />` children and all their props exactly as-is).
3. Add `import { Screen } from './components/ui'`.

- [ ] **Step 1: Apply the three changes**
- [ ] **Step 2: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "style: clean up App.tsx layout classes"
```

---

### Task 42: Delete `src/components/Icon.tsx` and `src/App.css`; move keyframes to `src/index.css`

**Files:**
- Delete: `src/components/Icon.tsx`
- Delete: `src/App.css`
- Modify: `src/App.tsx` (remove `import './App.css'`)
- Modify: `src/index.css` (append keyframes)

**Prerequisite check:** after Tasks 8–41, `Icon.tsx` has zero importers (verify: `grep -rn "components/Icon'" src --include='*.tsx'` must return nothing) and `App.css` has zero class consumers.

- [ ] **Step 1: Append these keyframes to the END of `src/index.css`** (after the existing rules; the `@layer base` and `:root` blocks stay untouched):

```css
/* Keyframes formerly in App.css (deleted) */

@keyframes set-flash {
  0% {
    background: var(--accent-bg);
  }
  100% {
    background: var(--row-bg);
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(124, 58, 237, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
  }
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

@keyframes sheet-in {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Note:** `modal-in` and the `.settings-modal` media-query rules are dead (no element uses `settings-modal`) — they are NOT carried over.

- [ ] **Step 2: Delete the two files and remove the import**

```bash
rm src/components/Icon.tsx src/App.css
```

Remove `import './App.css'` from `src/App.tsx`.

- [ ] **Step 3: Verify** — `bun run lint && bun run typecheck && bun run test && bun run build` — then confirm no remaining references:

```bash
grep -rn "App.css\|components/Icon\|Icon name=" src --include='*.tsx' --include='*.css'
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add -A src
git commit -m "refactor: delete Icon wrapper and App.css, move keyframes to index.css"
```

---

### Task 43: Final verification + smoke test

**Files:**
- (no source changes)

- [ ] **Step 1: Full verification**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: all pass.

- [ ] **Step 2: Manual smoke test**

Run: `bun run dev`. Verify, comparing against the pre-migration behavior:
- Home screen renders with the same layout/spacing as before (cards, banner, recent sessions)
- Bottom nav still navigates all four tabs (unchanged from Phase 1)
- Start a workout → set entry UI (fields, set-type buttons, complete button) renders correctly; exercise collapse/options toggle works; rest timer styles look right (quick chip, presets, custom input width)
- Finish workout → summary (PR callout, note styling, delete confirmation dialog)
- Settings modal renders as a centered dialog with theme options and backup buttons
- Progress screen list/detail views and chart render with correct stroke/fill colors
- Light and dark theme both look correct (tokens flip via `data-theme`)
- PWA install banner and update banner (if shown) look right

- [ ] **Step 3: Commit any leftover**

If the smoke test found nothing, there is nothing to commit — the branch is ready to merge.

---

## Appendix A: App.css → Tailwind class dictionary

The dictionary below maps every App.css class used by components to its exact Tailwind replacement. Tasks list the classes each file uses; look them up here. Entries marked **DEAD** have no App.css rule — remove the class entirely. Entries marked **PRIMITIVE** map to the `src/components/ui.tsx` component.

```text
screen                      → PRIMITIVE <Screen>
screen-header               → mb-1 [&_h1]:mb-1
header-row                  → flex justify-between items-start gap-3
lang-toggle                 → shrink-0 min-w-[44px]
muted                       → text-brand-text
empty                       → py-2
hint                        → text-center
error                       → text-brand-danger text-sm m-0
card                        → PRIMITIVE <Card> (or CARD_CLASSES)
sets                        → list-none m-0 p-0 flex flex-col gap-1.5  (li rows: flex justify-between items-center gap-2 px-2.5 py-2 bg-brand-row rounded-lg; see Task 20/37/39)
drop-row                    → ml-5 bg-brand-bg
drop-marker                 → text-brand-text text-[13px] shrink-0
set-edit-toggle             → flex-1 min-w-0 flex items-center gap-2 text-left font-[inherit] text-[inherit] bg-transparent border-none p-0 cursor-pointer disabled:opacity-100 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1 focus-visible:rounded
set-edit-toggle-info        → flex-1 min-w-0 flex justify-between items-center gap-2
set-edit-row                → flex flex-col gap-2
set-edit-form               → flex gap-2 items-center flex-wrap [&_select]:flex-1 [&_input]:flex-1 [&_select]:min-w-0 [&_input]:min-w-0
set-highlight               → animate-[set-flash_1.2s_ease-out]
set-badge                   → DEAD (remove)
field                       → flex flex-col gap-1 [&_label]:text-[13px]
input (bare)                → PRIMITIVE <Input>
select (bare)               → PRIMITIVE <Select>
textarea (bare)             → PRIMITIVE <Textarea>
note-field                  → PRIMITIVE <Textarea> (see Task 10)
summary-note                → m-0 px-2.5 py-2 border-l-[3px] border-l-brand-accent bg-brand-row rounded-r-md text-sm text-brand-text whitespace-pre-wrap break-words
set-form                    → grid grid-cols-2 gap-3 items-end [&_button]:col-span-2 [&_.error]:col-span-2
set-form-meta               → col-span-2 flex gap-2 flex-wrap items-center
set-type-row                → flex gap-1.5 flex-1 min-w-0
set-type-btn                → flex-1 text-[13px] px-2.5 py-2 rounded-lg bg-transparent border border-brand-border text-brand-heading cursor-pointer hover:border-brand-accent [&.active]:border-brand-accent [&.active]:bg-brand-accent-bg
unit-select                 → PRIMITIVE <Select>
active-exercise             → border-brand-accent shadow-[0_2px_8px_rgba(124,58,237,0.08)]
inactive-exercise           → opacity-85 transition-opacity duration-150 ease-in hover:opacity-100 hover:border-brand-border
completed-check-icon        → inline-flex items-center justify-center text-brand-positive ml-1
exercise-options-panel      → flex flex-col gap-2.5 px-3 py-2.5 bg-brand-row rounded-lg border border-brand-border
options-row                 → flex items-center justify-between gap-2
options-label               → text-[13px] font-medium text-brand-heading
options-actions             → flex gap-1.5 flex-wrap items-center
current-set-execution-card  → flex flex-col gap-2.5 p-3 bg-brand-row border-[1.5px] border-brand-accent rounded-[10px]
current-set-header          → flex items-center justify-between
current-set-title           → text-[13px] font-bold tracking-wider uppercase text-brand-accent
set-fields-grid             → col-span-2 grid grid-cols-2 gap-2.5
complete-set-btn            → flex items-center justify-center gap-2 min-h-12 text-base font-semibold w-full
previous-block              → p-2.5 bg-brand-row border-l-[3px] border-l-brand-accent rounded-r-lg [&_h4]:text-[13px] [&_h4]:text-brand-text [&_h4]:mb-1.5
best-line                   → ml-2 text-brand-accent
previous-summary            → whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2.5 py-1.5 bg-brand-row rounded-lg
target-line                 → text-brand-accent font-semibold text-sm m-0
button (bare)               → PRIMITIVE <Button>
primary                     → PRIMITIVE <Button variant="primary">
positive                    → PRIMITIVE <Button variant="positive">
secondary                   → PRIMITIVE <Button variant="secondary">
danger                      → PRIMITIVE <Button variant="danger">
btn-sm                      → PRIMITIVE <Button sm> (variant mapped as above)
icon-btn                    → PRIMITIVE <IconButton> (danger/positive variants → <IconButton variant="danger|positive">)
collapse-toggle             → inline-flex items-center justify-center shrink-0 w-11 h-11 p-0 mt-0.5 border-none rounded-lg bg-transparent text-brand-text cursor-pointer hover:bg-brand-row hover:text-brand-heading focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1
exercise-head               → flex items-start gap-2
exercise-title              → flex-1 min-w-0
exercise-actions            → flex gap-2 flex-wrap justify-end items-center
collapsed-actions           → flex flex-col gap-2 items-start [&_button]:w-full
repeat-btn                  → inline-flex items-center justify-center gap-2
set-remove                  → w-11 h-11
drop-btn                    → DEAD (no usage)
exercise-summary            → mt-1 text-brand-text text-sm
collapsed-hint              → mt-1 text-brand-text text-sm
collapsed-note              → mt-1 text-brand-text text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2.5 py-1.5 bg-brand-row rounded-lg italic
workout-timer-container     → sticky top-[env(safe-area-inset-top)] z-10 px-4 py-3.5 -m-1 mb-3 bg-brand-card border border-brand-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]
workout-bottom-actions      → sticky bottom-0 z-[15] flex flex-col gap-2 px-4 py-3.5 mt-5 -mx-4 -mb-4 bg-brand-card border-t border-brand-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)]
workout-actions-row         → flex items-center gap-2
rest-timer                  → flex items-center gap-2.5 flex-wrap w-full (compact → pt-0 border-t-0; done → see Task 22)
timer-chip-duration         → tabular-nums font-bold
timer-settings              → inline-flex items-center justify-center px-3.5 py-3 rounded-xl
timer-display               → text-[38px] font-extrabold tabular-nums text-brand-heading min-w-[90px] leading-none
timer-display-btn           → inline-flex items-center justify-center px-1.5 py-1 -ml-1.5 border-none rounded-[10px] bg-transparent text-inherit cursor-pointer hover:bg-brand-row focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1
timer-progress              → flex-1 min-w-12 h-1 rounded-full bg-brand-row overflow-hidden [&_div]:h-full [&_div]:bg-brand-positive [&_div]:transition-[width] [&_div]:duration-[250ms] [&_div]:ease-linear
timer-chip                  → text-[15px] px-3.5 py-2.5 rounded-[10px] border border-brand-border bg-transparent text-brand-heading cursor-pointer font-medium hover:border-brand-positive hover:text-brand-positive [&.active]:border-brand-positive [&.active]:text-brand-positive [&.active]:bg-brand-positive-bg
timer-quick                 → flex-1 inline-flex justify-center items-center gap-2 text-[17px] font-bold px-4 py-3.5 rounded-xl bg-brand-row
timer-custom                → PRIMITIVE <Input className="w-16! px-2.5 py-2 text-[15px]">
timer-done-msg              → text-brand-positive text-[13px] font-semibold
confirm-dialog              → fixed inset-0 z-10 flex items-center justify-center px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))] bg-black/45
confirm-card                → w-full max-w-[400px] flex flex-col gap-3 p-4 bg-brand-card border border-brand-border rounded-xl shadow-[0_16px_32px_rgba(0,0,0,0.2)]
confirm-actions             → flex gap-2 flex-wrap [&_button]:flex-1
resume-card                 → DEAD (no usage; base rules already covered by index.css)
day-toggle-main             → flex items-center justify-between gap-2 w-full
rename-form                 → flex flex-col gap-2
rename-actions              → flex gap-2
start                       → DEAD (no usage)
finish                      → mt-2
recent                      → flex flex-col gap-2
session-list                → list-none m-0 p-0 flex flex-col gap-2
session-item                → w-full flex justify-between items-center gap-2 text-left text-[15px] bg-brand-card border border-brand-border rounded-[10px] p-3 hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1
about / backup              → DEAD (no usage; base rules already covered by index.css)
feedback-saved              → text-brand-positive text-sm font-semibold
backup-actions              → flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1
file-button                 → inline-flex items-center justify-center px-4 py-3 border border-brand-border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent [&_input]:hidden
add-exercise                → [&_.field]:mb-1
recent-exercises            → flex flex-col gap-2
recent-label                → text-[13px]
recent-list                 → list-none m-0 p-0 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto
recent-item                 → w-full text-left text-[15px] px-3 py-2.5 bg-brand-row border border-brand-border rounded-lg text-brand-heading cursor-pointer hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1
import-confirm              → flex flex-col gap-2 p-3 rounded-[10px] bg-brand-row
summary-count               → text-center my-1
routine-head                → flex justify-between items-start gap-2
routine-title               → min-w-0
days                        → list-none m-0 p-0 flex flex-col gap-2
day                         → flex flex-col gap-2 p-2.5 bg-brand-row rounded-lg
day-head                    → flex justify-between items-center gap-2 flex-wrap
day-toggle                  → flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left text-[15px] bg-transparent border-none text-brand-heading px-0 py-1 cursor-pointer
inline-confirm              → flex gap-2 flex-wrap justify-end
inline-rename-row           → flex gap-2 items-center flex-wrap [&_input]:flex-1 [&_input]:min-w-0
day-body                    → flex flex-col gap-1.5
exercise-row                → flex justify-between items-center gap-2 px-2 py-1.5 bg-brand-bg rounded-md text-sm
add-exercise-day            → DEAD (no usage)
schedule-row                → flex flex-col gap-1 mt-1
today-exercises             → list-none m-0 p-0 flex flex-col gap-1 max-h-[220px] overflow-y-auto text-sm
pick-day                    → border-none bg-transparent cursor-pointer font-[inherit] w-full px-2 py-2 rounded-md flex flex-col items-start gap-0.5 text-brand-heading text-[15px] hover:bg-brand-bg
program-goal-list           → flex flex-col gap-2.5
program-goal                → flex flex-col items-start gap-1 text-left px-4 py-3.5 rounded-xl border border-brand-border bg-brand-card text-brand-heading hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1
program-card                → flex flex-col items-start gap-1.5 text-left px-4 py-3.5 rounded-xl border border-brand-border bg-brand-card text-brand-heading hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1
program-meta                → text-[13px] text-brand-text
program-preview-days        → max-h-[360px] overflow-y-auto
active-workout-banner       → flex justify-between items-center gap-3 px-3.5 py-2.5 bg-brand-accent-bg border border-brand-accent rounded-[10px] text-brand-heading
active-workout-info         → flex items-center gap-2.5 [&_strong]:text-brand-heading
pulse-dot                   → w-2.5 h-2.5 rounded-full bg-brand-accent shadow-[0_0_0_0_rgba(124,58,237,0.7)] animate-[pulse-ring_1.8s_infinite]
compact-workout-header      → flex justify-between items-center [&_h1]:text-[22px]
workout-header-title        → flex items-baseline gap-2.5
session-item-main           → flex flex-col gap-0.5
session-date                → DEAD (no usage)
session-name                → font-semibold text-brand-heading text-[15px] leading-[1.3]
session-date-secondary      → text-xs mt-px
session-preview             → text-[13px]
session-meta                → text-[13px] whitespace-nowrap shrink-0
pwa-banner                  → mb-4 px-4 py-3.5 rounded-xl bg-brand-card border border-brand-accent shadow-[0_4px_16px_rgba(124,58,237,0.12)]
pwa-banner-content          → flex items-center justify-between gap-3
pwa-banner-info             → flex flex-col gap-0.5 [&_strong]:text-[15px] [&_strong]:text-brand-heading [&_p]:text-[13px]
ios-guide-text              → font-semibold text-brand-accent mt-1
pwa-banner-actions          → flex items-center gap-2
icon-btn-sm                 → inline-flex items-center justify-center p-1.5 border-none rounded-lg bg-transparent text-brand-text cursor-pointer hover:bg-brand-row
sequence-mismatch-banner    → flex flex-col items-start gap-1.5 my-2.5 mb-3.5 px-3 py-2.5 rounded-[10px] bg-brand-row border border-dashed border-brand-border
mismatch-tag                → text-[13px] font-medium text-brand-text
btn-link                    → bg-none border-none p-0 text-[13px] font-semibold text-brand-accent cursor-pointer underline hover:opacity-85
update-banner               → fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[608px] flex items-center justify-between gap-3 px-3 py-2.5 bg-brand-card border border-brand-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-[45] animate-[sheet-in_180ms_ease-out]
update-banner-refresh       → DEAD (remove)
update-banner-toast         → justify-center border-brand-accent
update-banner-text          → text-sm text-brand-heading
update-banner-actions       → flex items-center gap-1.5 shrink-0
consistency-widget          → px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-[10px] flex items-center justify-between gap-3
comeback                    → bg-brand-positive-bg border-brand-positive flex-col items-start gap-1
consistency-streak          → flex items-baseline gap-1.5
consistency-streak-number   → text-[22px] font-extrabold text-brand-accent tabular-nums leading-none
animating                   → animate-[streak-count-in_400ms_ease-out_forwards]
consistency-streak-label    → text-[13px] font-semibold text-brand-heading
consistency-meta            → text-[13px] text-brand-text text-right
consistency-comeback-main   → text-[15px] font-semibold text-brand-positive
consistency-comeback-sub    → text-[13px] text-brand-text
pr-callout-card             → bg-brand-positive-bg border border-brand-positive rounded-[10px] px-3.5 py-3 flex flex-col gap-2
pr-callout-title            → text-[13px] font-bold uppercase tracking-wider text-brand-positive
pr-callout-item             → flex flex-col gap-px
pr-callout-main             → text-[15px] font-semibold text-brand-heading
pr-callout-prev             → text-[13px] text-brand-text
milestone-card*             → DEAD (no usage — rules dropped with App.css)
summary-identity-line       → text-center text-sm italic text-brand-text py-1
progress-summary-strip      → flex items-center justify-around bg-brand-card border border-brand-border rounded-xl p-4 gap-2
progress-summary-stat       → flex flex-col items-center gap-0.5 flex-1
progress-summary-value      → text-2xl font-bold text-brand-heading leading-none
progress-summary-label      → text-xs text-brand-text
progress-summary-divider    → w-px h-9 bg-brand-border shrink-0
progress-exercise-list      → list-none m-0 p-0 flex flex-col gap-1.5
progress-exercise-row       → w-full flex justify-between items-center gap-3 text-left bg-brand-card border border-brand-border rounded-[10px] px-3.5 py-3 font-[inherit] text-[15px] text-inherit cursor-pointer transition-[border-color] duration-[150ms] hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1
progress-exercise-info      → flex flex-col gap-0.5 min-w-0
progress-exercise-name      → font-semibold text-brand-heading whitespace-nowrap overflow-hidden text-ellipsis
progress-exercise-count     → text-xs
progress-exercise-right     → flex items-center gap-2 shrink-0
progress-exercise-best      → text-[13px] font-semibold text-brand-accent whitespace-nowrap
progress-trend              → text-base font-bold leading-none w-5 text-center [&.up]:text-brand-positive [&.down]:text-brand-text [&.down]:opacity-50 [&.flat]:text-brand-text [&.flat]:opacity-40
progress-best-block         → flex items-center gap-2
progress-pr-badge           → bg-brand-positive text-white text-[11px] font-bold px-1.5 py-0.5 rounded-[5px] tracking-wide
progress-best-value         → text-lg font-bold text-brand-heading
exercise-chart              → w-full block mb-1
exercise-chart-axis-label   → text-[11px] fill-[var(--text)]
exercise-chart-line         → fill-none stroke-brand-accent stroke-2 stroke-linecap-round stroke-linejoin-round
exercise-chart-dot          → fill-brand-card stroke-brand-accent stroke-2 [&.pr-dot]:fill-brand-positive [&.pr-dot]:stroke-brand-positive [&.weight-dot]:fill-brand-card [&.weight-dot]:stroke-brand-accent [&.hovered]:stroke-[3]
exercise-chart-tick-label   → text-[10px] fill-[var(--text-muted)]
app-layout                  → DEAD (remove)
settings-modal              → DEAD CSS (no element uses it — rules dropped with App.css)
finish-modal-body           → DEAD (remove)
today-card                  → DEAD (remove)
plan-header-info            → DEAD (remove)
planning-tab-bar            → DEAD (remove)
add-exercise-day-inline     → DEAD (remove)
input-with-suggestions      → DEAD (remove)
routine-suggestions-dropdown→ DEAD (remove)
suggestion-item             → DEAD (remove)
inline-add-btn              → DEAD (remove)
add-routine-exercise-wrapper→ DEAD (remove)
bottom-nav-label            → DEAD (already removed in Task 5)
```

## Appendix B: Icon mapping (`<Icon name="x" size={n} />` → lucide direct import)

```text
'arrow-left'    → ArrowLeft
'arrow-up'      → ArrowUp
'arrow-down'    → ArrowDown
'calculator'    → Calculator
'check'         → Check
'clock'         → Clock
'chevron-down'  → ChevronDown
'chevron-up'    → ChevronUp
'more'          → MoreVertical
'pencil'        → Pencil
'plus'          → Plus
'settings'      → Settings
'trash'         → Trash2
'x'             → X
'sun'           → Sun
'moon'          → Moon
'monitor'       → Monitor
```

Usage sites by file (all covered by Tasks 17–38; `BottomNav` already migrated in Task 5):

```text
WorkoutScreen.tsx                       arrow-left (18)
HomeScreen/index.tsx                    settings (18)
InstallPwaBanner.tsx                    x (16)
PlateCalculator.tsx                     calculator (24)
ExerciseCard/index.tsx                  pencil (14)
RestTimer.tsx                           clock (14)
ExerciseCard/SetEntryForm.tsx           check (18)
RoutineCard.tsx                         pencil/trash/arrow-up/arrow-down/chevron-up/chevron-down (16)
SetList.tsx                             check (14)
ExerciseCard/ExerciseOptionsPanel.tsx   pencil/arrow-up/arrow-down/trash (14)
AddRoutineExerciseForm.tsx              plus (14)
ExerciseCard/ExerciseHeader.tsx         more (18), chevron-down/chevron-up (18)
HomeScreen/SettingsModal.tsx            sun/moon/monitor (16)
```

Per the recipe, each swap keeps the original `size` and adds `aria-hidden="true"` (the old `Icon` already rendered `aria-hidden="true"`). The unused `IconName` entries (`note`, `repeat`, `home`, `calendar`, `chart`) have no usages and need no replacement.