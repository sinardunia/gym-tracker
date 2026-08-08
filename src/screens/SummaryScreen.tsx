import { useI18n } from '../i18n'
import { SetList } from '../components/SetList'
import { countSets, formatDate } from '../lib/format'
import type { Workout } from '../lib/types'

export function SummaryScreen({
  workout,
  onStartAnother,
  onBack,
}: {
  workout: Workout
  onStartAnother: () => void
  onBack: () => void
}) {
  const { tr, p, lang } = useI18n()
  return (
    <main className="screen">
      <header className="screen-header">
        <h1>{tr('summary.title')}</h1>
        <p className="muted">{formatDate(workout.startedAt, lang)}</p>
      </header>

      {workout.note && (
        <p className="summary-note">{workout.note}</p>
      )}

      {workout.exercises.map((exercise) => (
        <section key={exercise.id} className="card">
          <h3>{exercise.name}</h3>
          {exercise.note && <p className="summary-note">{exercise.note}</p>}
          <SetList sets={exercise.sets} unit={exercise.unit} />
        </section>
      ))}

      <p className="summary-count">
        {p(workout.exercises.length, 'count.exercises')} ·{' '}
        {p(countSets(workout), 'count.sets')}
      </p>

      <button type="button" className="primary" onClick={onStartAnother}>
        {tr('summary.startAnother')}
      </button>
      <button type="button" className="secondary" onClick={onBack}>
        {tr('summary.back')}
      </button>
    </main>
  )
}
