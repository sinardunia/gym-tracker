import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { exerciseHistory, computeConsistency, computeHeatmapData, computeMonthlyVolume } from '../lib/selectors'
import { ExerciseChart } from '../components/ExerciseChart'
import { HeatmapChart } from '../components/HeatmapChart'
import { VolumeChart } from '../components/VolumeChart'
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
      <main className="screen">
        <header className="screen-header">
          <h1>{tr('progress.title')}</h1>
          <p className="muted">{tr('progress.desc')}</p>
        </header>
        <button type="button" className="btn-sm secondary" onClick={onBack}>
          {tr('program.back')}
        </button>
        <p className="muted empty">{tr('progress.noSessions')}</p>
      </main>
    )
  }

  const item = selected ? history.find((h) => h.name === selected) : undefined

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>{tr('progress.title')}</h1>
        <p className="muted">{tr('progress.desc')}</p>
      </header>
      <button
        type="button"
        className="btn-sm secondary"
        onClick={selected ? () => onSelect(null) : onBack}
      >
        {selected ? tr('progress.backToList') : tr('program.back')}
      </button>

      {!selected && sessions.length > 0 && (
        <>
          <section className="card">
            <h2>12-Minggu Terakhir</h2>
            <HeatmapChart weeks={heatmap.weeks} maxPerDay={heatmap.maxPerDay} />
          </section>
          {volume.some((v) => v.count > 0) && (
            <section className="card">
              <h2>Volume Bulanan</h2>
              <VolumeChart data={volume} />
            </section>
          )}
        </>
      )}

      {item ? (
        <>
          <section className="card">
            <h2>{item.name}</h2>
            {item.best && (
              <div className="progress-best-block">
                <span className="progress-pr-badge">PR</span>
                <span className="progress-best-value">
                  {formatSetWeight(item.best.unit, item.best.weightKg, tr) ?? `${item.best.reps}r`}
                </span>
                <span className="muted">
                  {item.best.unit !== 'bodyweight'
                    ? `× ${item.best.reps} reps`
                    : `${item.best.reps} reps`}
                </span>
              </div>
            )}
            <p className="muted" style={{ fontSize: '13px', marginTop: 0 }}>
              {item.entries.length} {p(item.entries.length, 'count.sessions')} tercatat
            </p>
          </section>
          {item.entries.length >= 4 && item.best && (
            <ExerciseChart entries={item.entries} unit={item.best.unit} />
          )}
          <ul className="sets">
            {item.entries.map((entry) => {
              const weightText = formatSetWeight(entry.unit, entry.best.weightKg, tr)
              return (
                <li key={entry.finishedAt}>
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
        <p className="muted empty">{tr('progress.noExercises')}</p>
      ) : (
        <>
          {/* Summary strip */}
          <div className="progress-summary-strip">
            <div className="progress-summary-stat">
              <span className="progress-summary-value">{stats.totalSessions}</span>
              <span className="progress-summary-label">
                {p(stats.totalSessions, 'count.sessions')}
              </span>
            </div>
            <div className="progress-summary-divider" />
            <div className="progress-summary-stat">
              <span className="progress-summary-value">{stats.currentWeekStreak}w</span>
              <span className="progress-summary-label">streak</span>
            </div>
            <div className="progress-summary-divider" />
            <div className="progress-summary-stat">
              <span className="progress-summary-value">{history.length}</span>
              <span className="progress-summary-label">
                {p(history.length, 'count.exercises')}
              </span>
            </div>
          </div>

          {/* Exercise list */}
          <ul className="progress-exercise-list">
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
                const lastVal = h.best?.unit === 'bodyweight' ? last.best.reps : last.best.weightKg
                const prevVal = h.best?.unit === 'bodyweight' ? prev.best.reps : prev.best.weightKg
                if (lastVal > prevVal) return 'up'
                if (lastVal < prevVal) return 'down'
                return 'flat'
              })()

              return (
                <li key={h.name}>
                  <button
                    type="button"
                    className="progress-exercise-row"
                    onClick={() => onSelect(h.name)}
                  >
                    <div className="progress-exercise-info">
                      <span className="progress-exercise-name">{h.name}</span>
                      <span className="progress-exercise-count muted">
                        {h.entries.length} {p(h.entries.length, 'count.sessions')}
                      </span>
                    </div>
                    <div className="progress-exercise-right">
                      {bestLabel && (
                        <span className="progress-exercise-best">{bestLabel}</span>
                      )}
                      {trend === 'up' && (
                        <span className="progress-trend up" aria-label="trending up">↑</span>
                      )}
                      {trend === 'down' && (
                        <span className="progress-trend down" aria-label="trending down">↓</span>
                      )}
                      {trend === 'flat' && (
                        <span className="progress-trend flat" aria-label="stable">—</span>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
