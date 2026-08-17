import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { formatSetWeight } from '../lib/format'
import type { ExerciseUnit } from '../lib/types'
import type { ExerciseHistoryEntry } from '../lib/selectors'

const VIEW_W = 300
const VIEW_H = 100
const PAD_LEFT = 28
const PAD_RIGHT = 8
const PAD_TOP = 10
const PAD_BOTTOM = 18
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT   // 264
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM   // 72

function getValue(entry: ExerciseHistoryEntry, unit: ExerciseUnit): number {
  return unit === 'bodyweight' ? entry.best.reps : entry.best.weightKg
}

export function ExerciseChart({
  entries,
  unit,
}: {
  entries: ExerciseHistoryEntry[]
  unit: ExerciseUnit
}) {
  const { tr } = useI18n()

  const { points, minVal, maxVal, prIndex } = useMemo(() => {
    const values = entries.map((e) => getValue(e, unit))
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)

    const n = entries.length
    const points = values.map((v, i) => {
      const x = PAD_LEFT + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W)
      const y =
        maxVal === minVal
          ? PAD_TOP + PLOT_H / 2
          : PAD_TOP + ((maxVal - v) / (maxVal - minVal)) * PLOT_H
      return { x, y, value: v }
    })

    // Find PR index (highest value; first occurrence on tie)
    let prIndex = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[prIndex]) prIndex = i
    }

    return { points, minVal, maxVal, prIndex }
  }, [entries, unit])

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const minLabel = unit === 'bodyweight'
    ? `${minVal}r`
    : (formatSetWeight(unit, minVal, tr) ?? `${minVal}`)
  const maxLabel = unit === 'bodyweight'
    ? `${maxVal}r`
    : (formatSetWeight(unit, maxVal, tr) ?? `${maxVal}`)

  return (
    <svg
      className="exercise-chart"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      aria-hidden="true"
    >
      {/* Y-axis labels */}
      <text
        x={0}
        y={PAD_TOP + 4}
        className="exercise-chart-axis-label"
        dominantBaseline="hanging"
      >
        {maxLabel}
      </text>
      <text
        x={0}
        y={VIEW_H - PAD_BOTTOM + 2}
        className="exercise-chart-axis-label"
        dominantBaseline="auto"
      >
        {minLabel}
      </text>

      {/* Line */}
      <polyline
        className="exercise-chart-line"
        points={polylinePoints}
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === prIndex ? 4.5 : 3}
          className={`exercise-chart-dot${i === prIndex ? ' pr-dot' : ''}`}
        />
      ))}
    </svg>
  )
}
