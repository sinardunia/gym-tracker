# Best Practices Refactor — Design

**Date:** 2026-08-19
**Status:** Approved

## Goal

Bring the gym-tracker codebase in line with modern React best practices without changing user-facing behavior:
1. **Routing** — replace state-based navigation with React Router v7 (library mode).
2. **Icons** — delete the custom `Icon.tsx` wrapper; import lucide-react components directly.
3. **Styling** — delete `App.css` (~1958 lines); migrate all component styles to Tailwind utility classes.
4. **Executability** — produce a plan of tiny, file-level tasks that a cheap AI model can execute reliably (full code in each task, verify command after each task).

## Current State (Problems)

- `src/App.tsx` (293 lines) still owns navigation state: `activeTab`, `viewedSession`, `progressExercise`, `workoutPaused` (App.tsx:73-76) — no URLs, no deep links, no browser back/forward.
- `src/components/Icon.tsx` wraps lucide-react behind a hand-rolled `ICON_MAP`/`IconName` indirection (21 icons) — an anti-pattern; lucide-react is already installed and tree-shakeable.
- `src/App.css` (~1958 lines) holds all component styles in plain CSS classes; Tailwind is only partially used (some inline utilities in a few components). `index.css` already maps theme tokens via `@theme` (`--color-brand-*`).
- Screen prop-drilling: App.tsx passes ~17 props to `WorkoutScreen`, 16 to `HomeScreen` — most become route-level reads after routing lands.

## Architecture Decisions

### 1. Routing — React Router v7 (library mode)

Plain `<BrowserRouter>` SPA mode. New runtime dependency: `react-router` (v7). No framework mode, no loaders/actions (state stays in React context).

**Route map:**

| Route | Element | Guards |
|---|---|---|
| `/` | HomeScreen (inside TabLayout) | — |
| `/planning` | PlanningScreen (inside TabLayout) | — |
| `/history` | HistoryScreen (inside TabLayout) | — |
| `/progress` | ProgressScreen (inside TabLayout) | — |
| `/workout` | WorkoutScreen | `<Navigate to="/">` when `!activeWorkout \|\| workoutPaused` |
| `/summary/:sessionId` | SummaryScreen | `<Navigate to="/">` when session not found |
| `*` | `<Navigate to="/">` | — |

**Structure:**

- `TabLayout` — route component rendering `<Outlet />` plus `BottomNav` (switches from `activeTab` prop to `NavLink`; active tab via `NavLink`'s `isActive` callback). Owns `collapsedExerciseIds`, `consistencyStats`, `newPRs`, `progressExercise` UI state.
- `WorkoutUiContext` — tiny context provided above `<Routes>` holding `workoutPaused` + `setWorkoutPaused`. Both `TabLayout` (home resume banner) and the `/workout` guard read it. (The guard lives outside TabLayout, so the value cannot be TabLayout state.)
- `useWorkoutNavigation` hook — owns the workout/session lifecycle handlers from App.tsx (`startWorkout`, `finishWorkout`, `editSession`, `deleteSession`, `importBackup`) and performs the router transitions (`navigate('/workout')`, `navigate('/summary/' + id)`, `navigate('/')`) plus the existing side effects (clear timer snapshots, reset collapsed set).
- `SummaryScreen` reads `:sessionId` via `useParams`; missing/unknown id → redirect home. Back button → `useNavigate(-1)`.
- PWA, i18n, theme, `useDevSeedData`, `ErrorBoundary`, `UpdateBanner`, Agentation unchanged. `main.tsx` gains `BrowserRouter` (inside `I18nProvider`, outside `AppStore`).
- Screen prop interfaces shrink: workout/session actions come from `useApp()` context inside each screen; screens keep props only for data they cannot read from context (e.g. `sessions`, `lang`, `theme` stay props where screens already receive them — minimal churn).

### 2. Icons — direct lucide imports

- Delete `src/components/Icon.tsx` and the `IconName` type.
- Every usage becomes a direct import: `import { Trash2 } from 'lucide-react'` and `<Trash2 size={18} aria-hidden="true" />`.
- Mechanical, one-component-per-task; `lucide-react` version stays as-is.

### 3. Styling — full Tailwind migration

**Token strategy (keeps CSS-variable theming):**

- `index.css` keeps `:root` / `:root[data-theme='dark']` semantic tokens (`--bg`, `--card-bg`, `--accent`, …) and the `@theme` block mapping them to `--color-brand-*`. The `data-theme` FOUC-prevention script in `index.html` works unchanged; no `dark:` variants needed because tokens flip by attribute.
- Components use only token utilities: `bg-brand-bg`, `bg-brand-card`, `bg-brand-row`, `border-brand-border`, `text-brand-text`, `text-brand-heading`, `text-brand-accent`, `bg-brand-accent-bg`, `bg-brand-danger-bg`, `text-brand-danger`, `text-brand-positive`, `bg-brand-positive-bg`.
- `App.css` deleted at the end of the migration.

**Shared UI primitives (avoid repeating long class strings):**

Create `src/components/ui/` with small styled components extracted from the App.css patterns (names from current classes):
- `Card`, `Row` (`.card`, `.row`)
- `Button` / `IconButton` (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`, `.icon-btn`)
- `Input`, `Select`, `Textarea` (`.input`, `.unit-select`, `.note-input`)
- `ScreenShell` (`.screen`, `.app-layout` min-h-dvh + pb for bottom nav)

Each primitive is a styled `<div>`/`<button>`/`<input>` with typed props, using Tailwind utilities only.

**Migration order (dependency-driven):**

1. Create `src/components/ui/` primitives (compiled from App.css patterns; no component switched yet → app keeps working).
2. Migrate leaf components: `SetList`, `NoteField`, `ConfirmDialog`, `InlineRename`, `DayScheduleSelect`, `Icon`-adjacent components, `UpdateBanner`, `InstallPwaBanner`, `ErrorBoundary`, `FeedbackCard`, `BackupControls`, `ConsistencyWidget`.
3. Migrate composite components: `ExerciseCard/*` (Header, OptionsPanel, SetEntryForm, index), `AddExerciseForm`, `AddRoutineExerciseForm`, `RestTimer`, `PlateCalculator`, `BottomNav`.
4. Migrate screens: `HomeScreen/*` (index, ActiveWorkoutBanner, RoutinePicker, SettingsModal), `WorkoutScreen`, `SummaryScreen`, `PlanningScreen`, `HistoryScreen`, `ProgressScreen`, `ProgramPickerScreen`, `RoutineEditorScreen`.
5. Delete `App.css`, remove `import './App.css'` from App.tsx.
6. `index.css` trimmed to: theme tokens, `@theme` mapping, minimal base (box-sizing, body, #root max-width 640px — can become `@layer base` utilities).

### 4. Plan structure (for cheap AI execution)

- One task = one file (or one concern within one file). No cross-file reasoning required.
- Every task: absolute file path, current-code excerpt, full expected code, verify command (`bun run lint` / `bun run typecheck` / `bun run test` / `bun run build`), and a commit line.
- Strict linear order; each task commits separately (clean rollback).
- Run on a feature branch (`refactor/best-practices`).

## Key Rules

- **No behavior changes.** Pure migration. Never alter logic while moving styles or navigation. Bug fixes noticed along the way: note, don't fix.
- `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build` must pass after every task.
- Tests updated only where required (App.test.tsx gains `MemoryRouter`; any screen tests render inside `MemoryRouter`).
- New runtime dependency: `react-router` only. No other new deps.
- Data layer untouched: `src/lib/*`, `src/hooks/useWorkoutActions.ts`, `src/hooks/useRoutineActions.ts`, `src/store/*` stay as-is (except where App.tsx routing changes how they're consumed).

## Out of Scope

- Behavior changes, new features, bug fixes.
- Zustand/Redux or any state library.
- Framework-mode React Router, route loaders, SSR.
- Component library (shadcn etc.) — hand-rolled components keep their design, restyled with Tailwind.
- Feature-folder restructure beyond what routing requires.