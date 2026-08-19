const COLS = 12
const ROWS = 7
const CELL = 14
const GAP = 2
const PAD_LEFT = 28
const PAD_TOP = 16
const VIEW_W = PAD_LEFT + COLS * (CELL + GAP)
const VIEW_H = PAD_TOP + ROWS * (CELL + GAP)

const DAY_LABELS = ['S', 'R', 'K', 'J', 'S', 'M', 'M']

export function HeatmapChart({
  weeks,
  maxPerDay,
}: {
  weeks: number[][]
  maxPerDay: number
}) {
  function cellColor(count: number): string {
    if (count === 0) return 'var(--row-bg)'
    if (maxPerDay <= 1) return 'var(--accent)'
    const ratio = count / maxPerDay
    if (ratio <= 0.5) return 'color-mix(in srgb, var(--accent) 40%, transparent)'
    return 'var(--accent)'
  }

  return (
    <svg
      className="w-full block"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      aria-label="Heatmap latihan 12 minggu terakhir"
      role="img"
    >
      {DAY_LABELS.map((label, day) => (
        <text
          key={day}
          x={PAD_LEFT - 4}
          y={PAD_TOP + day * (CELL + GAP) + CELL / 2}
          textAnchor="end"
          dominantBaseline="central"
          className="text-[10px] fill-brand-text"
        >
          {label}
        </text>
      ))}

      {weeks.map((week, wi) =>
        week.map((count, di) => (
          <rect
            key={`${wi}-${di}`}
            x={PAD_LEFT + wi * (CELL + GAP)}
            y={PAD_TOP + di * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={2}
            fill={cellColor(count)}
          >
            <title>
              {count} {count === 1 ? 'sesi' : 'sesi'}
            </title>
          </rect>
        )),
      )}
    </svg>
  )
}
