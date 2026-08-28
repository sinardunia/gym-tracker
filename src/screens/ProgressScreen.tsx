import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { exerciseHistory, computeConsistency, computeHeatmapData, computeMonthlyVolume } from '../lib/selectors'
import { ExerciseChart } from '../components/ExerciseChart'
import { HeatmapChart } from '../components/HeatmapChart'
import { VolumeChart } from '../components/VolumeChart'
import { Button, Card, Screen } from '../components/ui'
import { formatDate, formatSetWeight } from '../lib/format'
import type { Workout } from '../lib/types'

export function ProgressScreen({
  sessions,
  selected,
  onSelect,
  onBack,
}: {
  sessions: Workout[]
  selected: string | null
  onSelect: (name: string | null) => void
  onBack: () => void
}) {
  const { tr, p, lang } = useI18n()
  const history = useMemo(() => exerciseHistory(sessions), [sessions])
  const stats = useMemo(() => computeConsistency(sessions), [sessions])
  const heatmap = useMemo(() => computeHeatmapData(sessions), [sessions])
  const volume = useMemo(() => computeMonthlyVolume(sessions, lang), [sessions, lang])

  if (sessions.length === 0) {
    return (
      <Screen>
        <header className="mb-1 [&_h1]:mb-1">
          <h1>{tr('progress.title')}</h1>
          <p className="text-brand-text">{tr('progress.desc')}</p>
        </header>
        <Button sm type="button" variant="secondary" onClick={onBack}>
          {tr('program.back')}
        </Button>
        <p className="text-brand-text py-2">{tr('progress.noSessions')}</p>
      </Screen>
    )
  }

  const item = selected ? history.find((h) => h.name === selected) : undefined

  return (
    <Screen>
      <header className="mb-1 [&_h1]:mb-1">
        <h1>{tr('progress.title')}</h1>
        <p className="text-brand-text">{tr('progress.desc')}</p>
      </header>
      <Button
        sm
        type="button"
        variant="secondary"
        onClick={selected ? () => onSelect(null) : onBack}
      >
        {selected ? tr('progress.backToList') : tr('program.back')}
      </Button>

      {!selected && sessions.length > 0 && (
        <>
          <Card>
            <h2>{tr('progress.last12Weeks')}</h2>
            <HeatmapChart weeks={heatmap.weeks} maxPerDay={heatmap.maxPerDay} />
          </Card>
          {volume.some((v) => v.count > 0) && (
            <Card>
              <h2>{tr('progress.monthlyVolume')}</h2>
              <VolumeChart data={volume} />
            </Card>
          )}
        </>
      )}

      {item ? (
        <>
          <Card>
            <h2>{item.name}</h2>
            {item.best && (
              <div className="flex items-center gap-2">
                <span className="bg-brand-positive text-white text-[11px] font-bold px-1.5 py-0.5 rounded-[5px] tracking-wide">
                  PR
                </span>
                <span className="text-lg font-bold text-brand-heading">
                  {formatSetWeight(item.best.unit, item.best.weightKg, tr) ?? `${item.best.reps}r`}
                </span>
                <span className="text-brand-text">
                  {item.best.unit !== 'bodyweight'
                    ? `× ${item.best.reps} reps`
                    : `${item.best.reps} reps`}
                </span>
              </div>
            )}
            <p className="text-brand-text" style={{ fontSize: '13px', marginTop: 0 }}>
               {item.entries.length} {p(item.entries.length, 'count.sessions')} {tr('progress.recorded')}
            </p>
          </Card>
          {item.entries.length >= 4 && item.best && (
            <ExerciseChart entries={item.entries} unit={item.best.unit} />
          )}
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
            {item.entries.map((entry) => {
              const weightText = formatSetWeight(entry.unit, entry.best.weightKg, tr)
              return (
                <li
                  key={`${entry.finishedAt}-${entry.name}`}
                  className="flex justify-between items-center gap-2 px-2.5 py-2 bg-brand-row rounded-lg"
                >
                  <span>{formatDate(entry.finishedAt, lang)}</span>
                  <span>
                    {tr('ex.repsCount', { reps: entry.best.reps })}
                    {weightText ? ` · ${weightText}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      ) : history.length === 0 ? (
        <p className="text-brand-text py-2">{tr('progress.noExercises')}</p>
      ) : (
        <>
          {/* Summary strip */}
          <div className="flex items-center justify-around bg-brand-card border border-brand-border rounded-xl p-4 gap-2">
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <span className="text-2xl font-bold text-brand-heading leading-none">{stats.totalSessions}</span>
              <span className="text-xs text-brand-text">
                {p(stats.totalSessions, 'count.sessions')}
              </span>
            </div>
            <div className="w-px h-9 bg-brand-border shrink-0" />
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <span className="text-2xl font-bold text-brand-heading leading-none">{stats.currentWeekStreak}w</span>
              <span className="text-xs text-brand-text">streak</span>
            </div>
            <div className="w-px h-9 bg-brand-border shrink-0" />
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <span className="text-2xl font-bold text-brand-heading leading-none">{history.length}</span>
              <span className="text-xs text-brand-text">
                {p(history.length, 'count.exercises')}
              </span>
            </div>
          </div>

          {/* Exercise list */}
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
            {history.map((h) => {
              const bestLabel = h.best
                ? h.best.unit === 'bodyweight'
                  ? `${h.best.reps}r`
                  : `${formatSetWeight(h.best.unit, h.best.weightKg, tr)} × ${h.best.reps}`
                : null
              const trend = (() => {
                if (h.entries.length < 2) return null
                const last = h.entries[h.entries.length - 1]
                const prev = h.entries[h.entries.length - 2]
                const lastVal = last.unit === 'bodyweight' ? last.best.reps : last.best.weightKg
                const prevVal = prev.unit === 'bodyweight' ? prev.best.reps : prev.best.weightKg
                if (lastVal > prevVal) return 'up'
                if (lastVal < prevVal) return 'down'
                return 'flat'
              })()

              return (
                <li key={h.name}>
                  <button
                    type="button"
                    className="w-full flex justify-between items-center gap-3 text-left bg-brand-card border border-brand-border rounded-[10px] px-3.5 py-3 font-[inherit] text-[15px] text-inherit cursor-pointer transition-[border-color] duration-[150ms] hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
                    onClick={() => onSelect(h.name)}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold text-brand-heading whitespace-nowrap overflow-hidden text-ellipsis">
                        {h.name}
                      </span>
                      <span className="text-xs text-brand-text">
                        {h.entries.length} {p(h.entries.length, 'count.sessions')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {bestLabel && (
                        <span className="text-[13px] font-semibold text-brand-accent whitespace-nowrap">
                          {bestLabel}
                        </span>
                      )}
                      {trend === 'up' && (
                        <span
                          className="text-base font-bold leading-none w-5 text-center text-brand-positive"
                          aria-label="trending up"
                        >
                          ↑
                        </span>
                      )}
                      {trend === 'down' && (
                        <span
                          className="text-base font-bold leading-none w-5 text-center text-brand-text opacity-50"
                          aria-label="trending down"
                        >
                          ↓
                        </span>
                      )}
                      {trend === 'flat' && (
                        <span
                          className="text-base font-bold leading-none w-5 text-center text-brand-text opacity-40"
                          aria-label="stable"
                        >
                          —
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Screen>
  )
}