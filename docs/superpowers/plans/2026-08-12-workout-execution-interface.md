# Workout Execution Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the active workout screen from a CRUD form into a mobile-first execution interface where Exercise is the primary unit, Completed Sets are displayed clearly, and Current Set is the primary interactive focus with "✓ Selesaikan Set" as the main CTA.

**Architecture:** Redesign `ExerciseCard` and `SetList` components in React and CSS to establish visual hierarchy (Exercise Header with Options Menu → Completed Sets → Current Set Focus Card). Keep data models unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS / custom CSS variables, oxlint, Vite.

## Global Constraints
- `npm run lint` must pass without errors.
- `npm run build` (`tsc -b && vite build`) must pass cleanly.
- Absolute paths only for file edits.
- Keep data structures (`Workout`, `Exercise`, `WorkoutSet`) unchanged.

---

### Task 1: Add Icons & i18n Translations

**Files:**
- Modify: `src/components/Icon.tsx`
- Modify: `src/i18n.tsx`

**Interfaces:**
- Consumes: Icon props `IconName`
- Produces: `check` and `more` icon options; i18n keys `ex.completeSet`, `ex.currentSet`, `ex.completed`, `ex.options`

- [ ] **Step 1: Add `check` and `more` to `Icon.tsx`**

Add `'check'` and `'more'` to `IconName` union and `ICON_PATHS` map in `src/components/Icon.tsx`:
```tsx
  check: ['M20 6L9 17l-5-5'],
  more: [
    'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  ],
```

- [ ] **Step 2: Add translation keys to `src/i18n.tsx`**

In `ID` object:
```ts
  'ex.completeSet': 'Selesaikan set',
  'ex.currentSet': 'SET {n} — Sedang dikerjakan',
  'ex.completed': 'Selesai',
  'ex.options': 'Opsi exercise',
```

In `EN` object:
```ts
  'ex.completeSet': 'Complete set',
  'ex.currentSet': 'SET {n} — In progress',
  'ex.completed': 'Done',
  'ex.options': 'Exercise options',
```

- [ ] **Step 3: Run build to verify types**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Icon.tsx src/i18n.tsx
git commit -m "feat: add check/more icons and execution i18n keys"
```

---

### Task 2: Refactor SetList UI for Completed Sets

**Files:**
- Modify: `src/components/SetList.tsx`

**Interfaces:**
- Consumes: `WorkoutSet`, `ExerciseUnit`, `onRemoveSet`, `onUpdateSet`
- Produces: Completed set row rendering with check icon badge and completion status

- [ ] **Step 1: Update completed set row in `src/components/SetList.tsx`**

In `renderSetRow`, display completed checkmark badge on set rows when rendered in active workout:
```tsx
<span className="set-completed-badge" title={tr('ex.completed')}>
  <Icon name="check" size={14} />
</span>
```

- [ ] **Step 2: Run build & lint**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/SetList.tsx
git commit -m "feat: display checkmark badge for completed sets in SetList"
```

---

### Task 3: Redesign ExerciseCard Header & Secondary Options Menu

**Files:**
- Modify: `src/components/ExerciseCard.tsx`

**Interfaces:**
- Consumes: `Exercise`, callbacks (`onRename`, `onChangeUnit`, `onMove`, `onRemove`, `onUpdateNote`)
- Produces: Clean exercise card header with a collapsible secondary Options Menu (`···`)

- [ ] **Step 1: Implement Options Menu toggle in `ExerciseCard.tsx`**

Replace row of primary edit/move/remove buttons in the main header with:
- Title & set count badge.
- Options Menu button (`more` icon).
- When Options Menu is open, show an options bar/card with Rename, Unit Selector, Note toggle, Move Up/Down, and Delete Exercise.

- [ ] **Step 2: Run build & lint**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseCard.tsx
git commit -m "refactor: clean exercise header and move editing to options menu"
```

---

### Task 4: Transform Current Set Input into Focus Execution Card & CSS Polish

**Files:**
- Modify: `src/components/ExerciseCard.tsx`
- Modify: `src/App.css` or `src/index.css`

**Interfaces:**
- Consumes: Set form state, `onAddSet`, `tr`
- Produces: High-contrast Current Set Execution Card with "✓ Selesaikan Set" primary button

- [ ] **Step 1: Update current set form structure in `ExerciseCard.tsx`**

Wrap the set form in a `.current-set-card` section with:
- Header: `SET {nextSetNumber} — {tr('ex.currentSet')}` label.
- Inputs for Reps and Weight (large numeric inputs optimized for mobile touch).
- Set Type Selector buttons (`Working`, `Warmup`, `Dropset`).
- Primary Submit CTA: `<button type="submit" className="primary complete-set-btn"><Icon name="check" size={18} /> {tr('ex.completeSet')}</button>`.

- [ ] **Step 2: Add CSS rules for execution card in `src/App.css`**

Add styles for:
- `.current-set-card`: accent border, subtle card background, padding, rounded corners.
- `.current-set-header`: bold text, subtle active indicator.
- `.complete-set-btn`: full width or large positive green button, large tap target (minimum 48px height for mobile).
- `.exercise-options-panel`: secondary menu layout for editing controls.

- [ ] **Step 3: Run build & lint verification**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ExerciseCard.tsx src/App.css
git commit -m "feat: implement mobile-first execution interface for current set"
```
