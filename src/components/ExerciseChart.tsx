import { useMemo, useState } from 'react'
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

    let prIndex = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[prIndex]) prIndex = i
    }

    return { points, minVal, maxVal, prIndex }
  }, [entries, unit])

  const [hoveredDot, setHoveredDot] = useState<number | null>(null)

  const nearestDotIdx = useMemo(() => {
    return (clientX: number, clientY: number, svgRect: DOMRect) => {
      const svgX = ((clientX - svgRect.left) / svgRect.width) * VIEW_W
      const svgY = ((clientY - svgRect.top) / svgRect.height) * VIEW_H
      let best = -1
      let bestDist = Infinity
      points.forEach((p, i) => {
        const dx = p.x - svgX
        const dy = p.y - svgY
        const dist = dx * dx + dy * dy
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      })
      return best >= 0 && bestDist < 400 ? best : null
    }
  }, [points])

  if (entries.length < 4) return null

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const minLabel = unit === 'bodyweight'
    ? `${minVal}r`
    : (formatSetWeight(unit, minVal, tr) ?? `${minVal}`)
  const maxLabel = unit === 'bodyweight'
    ? `${maxVal}r`
    : (formatSetWeight(unit, maxVal, tr) ?? `${maxVal}`)

  return (
    <svg
      className="w-full block mb-1"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      aria-hidden="true"
      onPointerEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const idx = nearestDotIdx(e.clientX, e.clientY, rect)
        setHoveredDot(idx)
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const idx = nearestDotIdx(e.clientX, e.clientY, rect)
        setHoveredDot(idx)
      }}
      onPointerLeave={() => setHoveredDot(null)}
    >
      {/* Y-axis labels */}
      <text
        x={PAD_LEFT - 4}
        y={PAD_TOP - 2}
        textAnchor="end"
        dominantBaseline="hanging"
        className="text-[10px] fill-[var(--text-muted)]"
      >
        {tr('progress.chart.yAxisUnit', { unit: unit === 'kg' ? 'kg' : 'r' })}
      </text>
      <text
        x={0}
        y={PAD_TOP + 4}
        className="text-[11px] fill-[var(--text)]"
        dominantBaseline="hanging"
      >
        {maxLabel}
      </text>
      <text
        x={0}
        y={VIEW_H - PAD_BOTTOM + 2}
        className="text-[11px] fill-[var(--text)]"
        dominantBaseline="auto"
      >
        {minLabel}
      </text>

      {/* Line */}
      <polyline
        className="fill-none stroke-brand-accent stroke-2 stroke-linecap-round stroke-linejoin-round"
        points={polylinePoints}
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === prIndex ? 4.5 : 3}
          className={`fill-brand-card stroke-brand-accent stroke-2 [&.pr-dot]:fill-brand-positive [&.pr-dot]:stroke-brand-positive [&.weight-dot]:fill-brand-card [&.weight-dot]:stroke-brand-accent [&.hovered]:stroke-[3]${i === prIndex ? ' pr-dot' : ' weight-dot'}${hoveredDot === i ? ' hovered' : ''}`}
        />
      ))}

      {/* Hover tooltip */}
      {hoveredDot !== null && (() => {
        const p = points[hoveredDot]
        const e = entries[hoveredDot]
        const label = unit === 'kg'
          ? `${e.best.weightKg} kg × ${e.best.reps}`
          : `${e.best.reps}r`
        return (
          <text
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            className="text-[10px] fill-[var(--text-muted)]"
            style={{ fontWeight: 600 }}
          >
            {label}
          </text>
        )
      })()}
    </svg>
  )
}
