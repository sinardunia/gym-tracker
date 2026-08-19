# UI Engagement Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve session card UX (exercise names as primary labels, accent-colored dates) and add engagement visualizations to Progress screen (heatmap + volume chart).

**Architecture:** Pure presentational changes + new SVG chart components + new selector helpers. No data model changes. All charts use inline SVG consistent with existing `ExerciseChart`.

**Tech Stack:** React, TypeScript, Tailwind CSS, SVG (no new dependencies)

## Global Constraints
- Mobile-first, max-width 640px
- Light + dark theme support via CSS variables
- No new npm dependencies
- All new SVG charts use viewBox approach (no fixed pixel sizes)
- Follow existing code conventions (functional components, hooks, i18n via `useI18n()`)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/selectors.ts` | Modify | Add `computeHeatmapData()`, `computeMonthlyVolume()` |
| `src/components/HeatmapChart.tsx` | Create | SVG weekly calendar heatmap component |
| `src/components/VolumeChart.tsx` | Create | SVG monthly volume bar chart component |
| `src/screens/ProgressScreen.tsx` | Modify | Render heatmap + volume chart |
| `src/screens/HistoryScreen.tsx` | Modify | Swap exercise names to primary label |
| `src/screens/HomeScreen/index.tsx` | Modify | Same swap in recent sessions |
| `src/App.css` | Modify | Date color + heatmap/volume styles |

---

### Task 1: Accent-colored date in session cards

**Files:**
- Modify: `src/App.css:1409-1412`

**Interfaces:** None — pure CSS change.

- [ ] **Step 1: Add accent color to `.session-date-secondary`**

In `src/App.css`, change `.session-date-secondary` to add `color: var(--accent);`

- [ ] **Step 2: Verify visually** — dates should be purple in both themes.

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "style: accent color for session card dates"
```

---

### Task 2: Exercise names as primary labels in session cards

**Files:**
- Modify: `src/screens/HistoryScreen.tsx`
- Modify: `src/screens/HomeScreen/index.tsx`

- [ ] **Step 1: Update HistoryScreen session card rendering**

Change the JSX so exercise names are primary and day name is secondary.

- [ ] **Step 2: Update HomeScreen session card rendering**

Same change in HomeScreen recent sessions.

- [ ] **Step 3: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/screens/HistoryScreen.tsx src/screens/HomeScreen/index.tsx
git commit -m "feat: show exercise names as primary session card labels"
```

---

### Task 3: Add heatmap and volume data helpers

**Files:**
- Modify: `src/lib/selectors.ts`

- [ ] **Step 1: Add `computeHeatmapData` function**

```typescript
export function computeHeatmapData(
  sessions: Workout[],
): { weeks: number[][]; maxPerDay: number } {
  const finished = sessions.filter((s) => s.finishedAt !== null)
  if (finished.length === 0) {
    return { weeks: Array.from({ length: 12 }, () => Array(7).fill(0)), maxPerDay: 0 }
  }
  const now = new Date()
  const todayDay = (now.getDay() + 6) % 7
  const currentMonday = new Date(now)
  currentMonday.setDate(now.getDate() - todayDay)
  currentMonday.setHours(0, 0, 0, 0)
  const startMonday = new Date(currentMonday)
  startMonday.setDate(startMonday.getDate() - 11 * 7)
  const weeks: number[][] = Array.from({ length: 12 }, () => Array(7).fill(0))
  let maxPerDay = 0
  for (const session of finished) {
    const d = new Date(session.finishedAt as string)
    const dayOfWeek = (d.getDay() + 6) % 7
    const diffMs = d.getTime() - startMonday.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const weekIndex = Math.floor(diffDays / 7)
    if (weekIndex < 0 || weekIndex >= 12) continue
    weeks[weekIndex][dayOfWeek] += 1
    if (weeks[weekIndex][dayOfWeek] > maxPerDay) {
      maxPerDay = weeks[weekIndex][dayOfWeek]
    }
  }
  return { weeks, maxPerDay }
}
```

- [ ] **Step 2: Add `computeMonthlyVolume` function**

```typescript
export function computeMonthlyVolume(
  sessions: Workout[],
  lang: Lang,
): { month: string; count: number; ISO: string }[] {
  const finished = sessions.filter((s) => s.finishedAt !== null)
  const now = new Date()
  const results: { month: string; count: number; ISO: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const ISO = `${year}-${String(month + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString(localeOf(lang), { month: 'short' })
    const count = finished.filter((s) => {
      const sd = new Date(s.finishedAt as string)
      return sd.getFullYear() === year && sd.getMonth() === month
    }).length
    results.push({ month: label, count, ISO })
  }
  return results
}
```

- [ ] **Step 3: Add `Lang` and `localeOf` imports**

```typescript
import { localeOf, type Lang } from '../i18n'
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`

- [ ] **Step 5: Commit**

```bash
git add src/lib/selectors.ts
git commit -m "feat: add computeHeatmapData and computeMonthlyVolume selectors"
```

---

### Task 4: HeatmapChart component

**Files:**
- Create: `src/components/HeatmapChart.tsx`

- [ ] **Step 1: Create HeatmapChart.tsx**

Full SVG component with 12×7 grid, day labels, cell coloring by intensity.

- [ ] **Step 2: Add CSS for heatmap in App.css**

```css
.heatmap-chart { width: 100%; display: block; }
.heatmap-day-label { font-size: 10px; fill: var(--text); }
```

- [ ] **Step 3: Run typecheck**

- [ ] **Step 4: Commit**

```bash
git add src/components/HeatmapChart.tsx src/App.css
git commit -m "feat: add HeatmapChart SVG component"
```

---

### Task 5: VolumeChart component

**Files:**
- Create: `src/components/VolumeChart.tsx`

- [ ] **Step 1: Create VolumeChart.tsx**

Full SVG bar chart with 6 monthly bars, count labels, month labels.

- [ ] **Step 2: Add CSS for volume chart in App.css**

```css
.volume-chart { width: 100%; display: block; }
.volume-chart-count { font-size: 11px; font-weight: 600; fill: var(--text-h); }
.volume-chart-label { font-size: 10px; fill: var(--text); }
```

- [ ] **Step 3: Run typecheck**

- [ ] **Step 4: Commit**

```bash
git add src/components/VolumeChart.tsx src/App.css
git commit -m "feat: add VolumeChart SVG bar chart component"
```

---

### Task 6: Wire charts into ProgressScreen

**Files:**
- Modify: `src/screens/ProgressScreen.tsx`

- [ ] **Step 1: Add imports for HeatmapChart, VolumeChart, and new selectors**

- [ ] **Step 2: Compute heatmap and volume data with useMemo**

- [ ] **Step 3: Render heatmap card before existing content**

- [ ] **Step 4: Render volume card after heatmap**

- [ ] **Step 5: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`

- [ ] **Step 6: Run tests**

Run: `npm run test`

- [ ] **Step 7: Commit**

```bash
git add src/screens/ProgressScreen.tsx
git commit -m "feat: add heatmap and volume chart to Progress screen"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full lint + typecheck + test**

Run: `npm run lint && npm run typecheck && npm run test`

- [ ] **Step 2: Visual check** — all features work in light/dark mode

- [ ] **Step 3: Merge branch into main**

```bash
git checkout main
git merge --no-ff feat/ui-engagement-improvements
git branch -d feat/ui-engagement-improvements
```
