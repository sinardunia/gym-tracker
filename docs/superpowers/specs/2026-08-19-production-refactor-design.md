# Production Readiness Refactor — Design

**Date:** 2026-08-19
**Status:** Approved

## Goal

Make the gym-tracker codebase clean, well-split, and production-ready without changing user-facing behavior. Priorities: (1) code organization, (2) testing infrastructure, (3) build/deploy readiness.

## Current State (Problems)

- `App.tsx` is an 802-line god component: owns all state, ~22 mutation handlers, navigation, PR/milestone effects, and rendering.
- `src/lib/data.ts` (431 lines) mixes static data (exercise library, program templates) with runtime logic (storage, backup parsing, ID generation).
- `ExerciseCard.tsx` (527 lines) mixes header, options menu, rename form, set-entry form, previous-session block, and collapse logic.
- `HomeScreen.tsx` (403 lines) mixes layout, settings modal, and routine picker.
- No tests, no CI, no error boundary.

## Architecture (Approach A — Layered)

```
src/
  hooks/          ← usePersistedState, useWorkoutActions, useRoutineActions, useDevSeedData
  store/          ← AppContext (wires state + actions, consumed by AppContent)
  lib/
    storage.ts    ← STORAGE_KEY, loadState, saveState, loadAsyncState, EMPTY_STATE, newId, createWorkout
    backup.ts     ← parseBackup
    library.ts    ← EXERCISE_LIBRARY
    programs.ts   ← PROGRAM_GOALS, PROGRAM_TEMPLATES
    (data.ts deleted)
  components/
    ExerciseCard/ ← index.tsx, ExerciseHeader.tsx, ExerciseOptionsPanel.tsx, SetEntryForm.tsx
    HomeScreen/   ← SettingsModal.tsx, RoutinePicker.tsx, ActiveWorkoutBanner.tsx  (HomeScreen stays at src/screens/)
  ErrorBoundary.tsx
tests: co-located `*.test.ts` in src/lib/
```

## Key Rules

- **No behavior changes** — pure extraction/refactor. Do not fix bugs or alter logic.
- Screens keep their existing prop interfaces; only `App.tsx` internals change.
- `data.ts` is deleted; all four import sites updated (`App.tsx`, `ProgramPickerScreen.tsx`, `selectors.ts`, `BackupControls.tsx`).
- New file per responsibility, each answerable: what it does, how to use it, what it depends on.
- `npm run lint` and `npm run build` must pass; tests must pass.

## Testing

Vitest + Testing Library (jsdom). Tests for pure lib functions: `format`, `selectors`, `milestones`, `backup`, `storage`. Coverage focus: consistency, PR detection, set grouping, drop suggestion, backup parsing.

## Production Readiness

- Error boundary with i18n fallback UI (new `error.*` keys).
- CI workflow (GitHub Actions): lint → test → build on push/PR.
- `typecheck` script (`tsc -b`).

## Out of Scope

- Zustand or any new runtime dependency.
- Feature-folder restructure.
- Bug fixes discovered along the way (note, don't fix).