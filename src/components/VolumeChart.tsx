const VIEW_W = 300
const VIEW_H = 120
const PAD_LEFT = 8
const PAD_RIGHT = 8
const PAD_TOP = 20
const PAD_BOTTOM = 24
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM

export function VolumeChart({
  data,
}: {
  data: { month: string; count: number; ISO: string }[]
}) {
  if (data.length === 0) return null

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const barW = Math.floor(PLOT_W / data.length) - 4
  const gap = Math.floor((PLOT_W - barW * data.length) / (data.length + 1))

  return (
    <svg
      className="w-full block"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      aria-label="Volume latihan bulanan"
      role="img"
    >
      {data.map((d, i) => {
        const x = PAD_LEFT + gap + i * (barW + gap)
        const barH = maxCount > 0 ? (d.count / maxCount) * PLOT_H : 0
        const y = PAD_TOP + PLOT_H - barH

        return (
          <g key={d.ISO}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill="var(--accent)"
            />
            {d.count > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                className="text-[11px] font-semibold fill-brand-heading"
              >
                {d.count}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={VIEW_H - PAD_BOTTOM + 14}
              textAnchor="middle"
              className="text-[10px] fill-brand-text"
            >
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
