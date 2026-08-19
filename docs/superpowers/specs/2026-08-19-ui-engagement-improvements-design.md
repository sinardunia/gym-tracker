# UI Engagement Improvements

Status: Draft · Owner: waltahh · Updated: 2026-08-19

## Overview

Three targeted improvements to increase engagement and visual clarity:
1. Exercise names as primary labels in session history cards
2. Weekly calendar heatmap + monthly volume bar chart on Progress screen
3. Accent-colored date text in session cards for visual hierarchy

## Feature 1: Exercise Names as Primary Session Labels

### Problem
Session cards in History and Home currently show the routine day name (e.g., "Push Day") as the primary label, with exercise names only as a small preview line. The user wants exercise names to be immediately visible.

### Design

**Layout change for session cards** (both `HistoryScreen.tsx` and `HomeScreen/index.tsx`):

- **Primary (`.session-name`):** Exercise names — always the first thing visible
- **Secondary (`.session-preview`):** Day name from routine (if exists)
- **Tertiary (`.session-date-secondary`):** Date + time (colored per Feature 3)

When no day name exists (non-routine workouts), the preview line is omitted.

### Files to change
- `src/screens/HistoryScreen.tsx` — swap rendering order
- `src/screens/HomeScreen/index.tsx` — same swap

## Feature 2: Progress Screen — Heatmap + Volume Chart

### 2a: Weekly Calendar Heatmap
- 12-week grid (84 days), 7 rows × 12 columns
- Color intensity maps to session count
- SVG, consistent with existing `ExerciseChart` approach

### 2b: Monthly Volume Bar Chart
- 6 bars (recent months), height proportional to session count
- Month labels below, count labels above
- SVG, accent-colored bars

**New helpers:** `computeHeatmapData()`, `computeMonthlyVolume()` in `selectors.ts`
**New components:** `HeatmapChart.tsx`, `VolumeChart.tsx`

## Feature 3: Accent-Colored Date

Change `.session-date-secondary` color from `var(--text)` to `var(--accent)`.

## Testing
- Visual: manual check in light + dark mode
- Run `npm run lint`, `npm run typecheck`, `npm run test`

## Out of scope
- Daily streak on home screen (deferred)
- New charting libraries (all SVG, no deps)
- Changes to data model or persistence
