# Routine Editor Redesign & Indonesian i18n ("Jadwal") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Indonesian "Routine" terminology with "Jadwal", and redesign Routine/Jadwal card UI with an inline exercise input (input on left, add button on right with autocomplete suggestions dropdown).

**Architecture:** Modify `src/i18n.tsx`, `AddRoutineExerciseForm.tsx`, `RoutineCard.tsx`, `DayScheduleSelect.tsx`, and `src/App.css`.

**Tech Stack:** React 19, TypeScript, CSS, Vite, oxlint.

## Global Constraints
- `npm run lint` must pass without errors.
- `npm run build` (`tsc -b && vite build`) must pass cleanly.
- Absolute paths only for file edits.

---

### Task 1: Update Indonesian i18n Translations to "Jadwal"

**Files:**
- Modify: `src/i18n.tsx`

**Interfaces:**
- Consumes: `ID` dictionary
- Produces: Updated translations for routine keys in Indonesian

- [ ] **Step 1: Replace Routine terms in `src/i18n.tsx`**

In `ID` object, update:
```ts
  'home.pickRoutine': 'Pilih jadwal',
  'home.noRoutines': 'Belum ada jadwal. Buat dulu di menu Jadwal.',
  'home.routines': 'Jadwal',
  'home.noDaysInRoutine': 'Belum ada hari di jadwal ini.',
  'routine.title': 'Jadwal Latihan',
  'routine.desc': 'Siapkan hari dan exercise workout lebih awal.',
  'routine.addRoutine': 'Tambah jadwal',
  'routine.noRoutines': 'Belum ada jadwal. Buat satu untuk merencanakan minggumu.',
  'routine.newName': 'Jadwal baru',
  'routine.rename': 'Ubah nama jadwal',
  'routine.delete': 'Hapus jadwal',
  'program.applyHint': 'Menambah Jadwal baru yang bisa kamu ubah dan jadwalkan.',
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/i18n.tsx
git commit -m "i18n: update Indonesian translation for routine to Jadwal"
```

---

### Task 2: Redesign AddRoutineExerciseForm with Inline Layout & Library Suggestions Dropdown

**Files:**
- Modify: `src/components/AddRoutineExerciseForm.tsx`

**Interfaces:**
- Consumes: `onAdd`, `existing` array of strings
- Produces: `AddRoutineExerciseForm` component with inline input+button and floating library suggestions dropdown

- [ ] **Step 1: Update `AddRoutineExerciseForm.tsx`**

Implement input with flex grow, button pinned on right (`flex-shrink: 0`), and library exercise suggestions overlay when user types query:
```tsx
import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { findLibraryMatches } from '../lib/selectors'
import { Icon } from './Icon'

export function AddRoutineExerciseForm({
  onAdd,
  existing,
}: {
  onAdd: (name: string) => void
  existing: string[]
}) {
  const { tr } = useI18n()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError(tr('ex.nameRequired'))
      return
    }
    if (
      existing.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())
    ) {
      setError(tr('routine.duplicate'))
      return
    }
    onAdd(trimmed)
    setName('')
    setError(null)
  }

  function pick(selected: string) {
    if (existing.some((n) => n.trim().toLowerCase() === selected.toLowerCase())) {
      setError(tr('routine.duplicate'))
      return
    }
    onAdd(selected)
    setName('')
    setError(null)
  }

  const query = name.trim().toLowerCase()
  const matches = query ? findLibraryMatches(query).slice(0, 5) : []

  return (
    <div className="add-routine-exercise-wrapper">
      <form onSubmit={handleSubmit} className="add-exercise-day-inline">
        <div className="input-with-suggestions">
          <input
            type="text"
            value={name}
            placeholder={tr('routine.exercisePlaceholder')}
            autoComplete="off"
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
          {focused && matches.length > 0 && (
            <ul className="routine-suggestions-dropdown">
              {matches.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className="suggestion-item"
                    onMouseDown={() => pick(item.name)}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="btn-sm positive flex-shrink-0 inline-add-btn">
          <Icon name="plus" size={14} />
          <span>{tr('addEx.add')}</span>
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Run lint & build**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/AddRoutineExerciseForm.tsx
git commit -m "feat: redesign AddRoutineExerciseForm with inline layout and exercise library suggestions"
```

---

### Task 3: Refactor RoutineCard & DayScheduleSelect Styling

**Files:**
- Modify: `src/components/DayScheduleSelect.tsx`
- Modify: `src/components/RoutineCard.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: Routine component props
- Produces: Clean card layout with right-aligned button inline inputs, dropdown suggestions overlay styling, and day schedule selector

- [ ] **Step 1: Update `DayScheduleSelect.tsx` for cleaner inline appearance**

Enhance schedule row container styling class to `.schedule-row-compact`.

- [ ] **Step 2: Add CSS rules for inline form & autocomplete dropdown in `src/App.css`**

Add CSS for:
- `.add-exercise-day-inline`: `display: flex; gap: 8px; align-items: center;`
- `.input-with-suggestions`: `position: relative; flex: 1; min-width: 0;`
- `.routine-suggestions-dropdown`: floating absolute list below input with card background & shadow.
- `.inline-add-btn`: positive green action button, right aligned beside input.
- `.schedule-row-compact`: clean schedule day block styling.

- [ ] **Step 3: Run lint & build verification**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/DayScheduleSelect.tsx src/components/RoutineCard.tsx src/App.css
git commit -m "feat: polish routine card layout and day schedule styling"
```
