# Workout Execution Interface Redesign

## Goal
Transform the active workout screen from a "CRUD / Form Editor" feel into an "Execution Interface".
When users log a workout on mobile, the interface must immediately communicate:
"I am doing Squat. Here are my finished sets. Here is my current active set. I log it, finish it, and move forward."

---

## Key Design Principles & Structure

### 1. Hierarchy: Exercise → Completed Sets → Current Active Set → Secondary Management
- **Exercise Card Header**: Clean, focused header with Exercise Name, set count summary (e.g. `2 set selesai`), collapse toggle, and a secondary Options Menu icon (`···`).
- **Completed Sets Section**: Clean list of completed sets with checkmarks `✓` and muted styles so completed work is clear at a glance.
- **Current Set (Focus Execution Card)**:
  - Clear visual demarcation as the current active set (e.g., `SET 3 — Sedang Dikerjakan`).
  - Inputs for Reps and Weight (kg / plates / bodyweight).
  - Set type selector (Working / Pemanasan / Dropset).
  - **Primary CTA**: Prominent green action button **`✓ Selesaikan Set`** (Complete Set).
- **Secondary Exercise Controls**:
  - Re-order up/down, Rename, Note, Unit toggle, and Delete exercise are tucked into a secondary dropdown/popover menu (`···`) in the exercise header.
  - Keeps the main screen free of database editing clutter while keeping all existing functionality fully accessible.

---

## Detailed Components & UI Flow

### A. Icon Updates (`src/components/Icon.tsx`)
- Add `'check'` icon (for `✓ Selesaikan Set` and completed set checkmark).
- Add `'more-vertical'` or `'dots'` icon (for exercise secondary options menu).

### B. Completed Sets Display (`src/components/SetList.tsx`)
- Completed set rows will feature:
  - Set number badge or label (e.g. `Set 1`).
  - Set metrics display (`60 kg × 10`).
  - Visual completion status badge (`✓ Selesai` / `✓ Done`).
  - Editing individual set values remains possible via tap/click or inline edit button.

### C. Current Set Execution Card (`src/components/ExerciseCard.tsx`)
- Container with distinct active card styling (accent / subtle active background & border).
- Label: `SET {nextSetNumber} (Sedang dikerjakan)` / `SET {nextSetNumber} (In progress)`.
- Input fields: Reps and Weight styled with touch-friendly targets (375-430px mobile optimal).
- Set Type Selector (Working / Warmup / Dropset) placed clearly above or alongside inputs.
- Primary Action Button: `<button type="submit" className="primary complete-set-btn"><Icon name="check" /> {tr('ex.completeSet')}</button>`.

### D. Secondary Options Menu (`src/components/ExerciseCard.tsx`)
- Options button (`···` / `more-vertical`) in exercise header.
- Toggling reveals an inline/overlay action panel containing:
  - Note toggle / edit
  - Unit selector (kg / plates / bodyweight)
  - Rename exercise
  - Move Up / Move Down
  - Remove Exercise (with confirm)

---

## i18n Dictionary Updates (`src/i18n.tsx`)
- `ex.completeSet`: "Selesaikan Set" (ID) / "Complete Set" (EN)
- `ex.currentSet`: "SET {n} — Sedang dikerjakan" (ID) / "SET {n} — In progress" (EN)
- `ex.completed`: "Selesai" (ID) / "Done" (EN)
- `ex.options`: "Opsi exercise" (ID) / "Exercise options" (EN)

---

## Non-Goals (Out of Scope for No. 1)
- Automatic prefill of weight/reps from previous sets or previous sessions.
- Data model changes (Workout, Exercise, WorkoutSet schemas remain unchanged).
- Rest timer overhaul or previous performance progress tracking.
