import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { exerciseHistory } from '../lib/selectors'
import { ExerciseChart } from '../components/ExerciseChart'
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

      {item ? (
        <>
          <section className="card">
            <h2>{item.name}</h2>
            {item.best && (
              <p className="muted">
                {tr('ex.best', {
                  weight:
                    formatSetWeight(item.best.unit, item.best.weightKg, tr) ?? '',
                  reps: item.best.reps,
                })}
              </p>
            )}
          </section>
          {item.entries.length >= 4 && item.best && (
            <ExerciseChart entries={item.entries} unit={item.best.unit} />
          )}
          <ul className="sets">
            {item.entries.map((entry) => {
              const weightText = formatSetWeight(
                entry.unit,
                entry.best.weightKg,
                tr,
              )
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
        <ul className="days">
          {history.map((h) => (
            <li key={h.name} className="day">
              <button
                type="button"
                className="day-toggle"
                onClick={() => onSelect(h.name)}
              >
                <span className="day-toggle-main">
                  <span>{h.name}</span>
                  <span className="muted">
                    {h.entries.length} {p(h.entries.length, 'count.sessions')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
