# Routine Editor Redesign & Indonesian i18n ("Jadwal") Design Spec

## Goal
1. Replace all Indonesian translations of "Routine / Routines" with **"Jadwal"**.
2. Redesign the Routine card UI, focusing on making exercise addition inline (input on left, add button on right), integrated autocomplete library dropdown, clear day schedule selector styling, and clean action buttons.

---

## 1. i18n Dictionary Updates (`src/i18n.tsx`)
In the `ID` (Indonesian) dictionary:
- `home.routines`: "Jadwal"
- `home.pickRoutine`: "Pilih jadwal"
- `home.noRoutines`: "Belum ada jadwal. Buat dulu di menu Jadwal."
- `routine.title`: "Jadwal"
- `routine.desc`: "Siapkan hari dan exercise workout lebih awal."
- `routine.addRoutine`: "Tambah jadwal"
- `routine.noRoutines`: "Belum ada jadwal. Buat satu untuk merencanakan minggumu."
- `routine.newName`: "Jadwal baru"
- `routine.rename`: "Ubah nama jadwal"
- `routine.delete`: "Hapus jadwal"
- `program.applyHint`: "Menambah Jadwal baru yang bisa kamu ubah dan jadwalkan."

---

## 2. UI / UX Redesign Details

### A. Add Exercise to Day (`AddRoutineExerciseForm.tsx`)
- **Inline Layout**: Flex container with `input` taking full remaining space (`flex: 1`) and button pinned on the right (`flex-shrink: 0`).
- **Autocomplete Dropdown Suggestions**:
  - As user types, filter library exercises from `findLibraryMatches`.
  - Display matching suggestions in a clean floating dropdown below the input field.
  - Tapping a suggestion instantly adds it to the day and clears input.

### B. Day Schedule Selector (`DayScheduleSelect.tsx`)
- Style the day assignment selector as a compact inline row:
  - Label: `Jadwal Hari` / `Schedule Day`
  - Clean dropdown selector inline or full width with subtle background.
  - Conflict confirmation banner cleanly styled.

### C. Routine Card & Day Card Hierarchy (`RoutineCard.tsx` & `App.css`)
- **Header**: Clear Routine/Jadwal title, day count badge, and clean action icons.
- **Day Card**:
  - Better visual padding and border radius.
  - Clear list numbering for exercises (`1. Bench Press`, `2. Incline Press`).
  - Action buttons (move up, move down, remove) aligned neatly without overflow.

---

## 3. Scope Boundaries
- No backend/persisted schema changes.
- Existing schedule conflict detection logic remains unchanged.
