import { useState } from 'react'
import { useI18n } from '../i18n'
import { SetList } from '../components/SetList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { countSets, formatDate } from '../lib/format'
import type { Workout } from '../lib/types'

export function SummaryScreen({
  workout,
  onStartAnother,
  onBack,
  onEdit,
  onDelete,
}: {
  workout: Workout
  onStartAnother: () => void
  onBack: () => void
  onEdit: (session: Workout) => void
  onDelete: (sessionId: string) => void
}) {
  const { tr, p, lang } = useI18n()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  return (
    <main className="screen">
      <header className="screen-header">
        <h1>{tr('summary.title')}</h1>
        <p className="muted">{formatDate(workout.startedAt, lang)}</p>
      </header>

      <div className="active-workout-banner" style={{ background: 'var(--positive-bg)', borderColor: 'var(--positive)' }}>
        <div className="active-workout-info">
          <span className="pulse-dot" style={{ background: 'var(--positive)', boxShadow: 'none' }} />
          <strong style={{ color: 'var(--positive)' }}>{tr('summary.savedNotice')}</strong>
        </div>
      </div>

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

      <p className="summary-count font-semibold">
        {p(workout.exercises.length, 'count.exercises')} ·{' '}
        {p(countSets(workout), 'count.sets')}
      </p>

      <div className="flex flex-col gap-2">
        <button type="button" className="primary" onClick={onStartAnother}>
          {tr('summary.startAnother')}
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          {tr('summary.back')}
        </button>

        <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
          <button type="button" className="btn-sm secondary flex-1" onClick={() => onEdit(workout)}>
            {tr('summary.edit')}
          </button>
          <button
            type="button"
            className="btn-sm danger flex-1"
            onClick={() => setConfirmingDelete(true)}
          >
            {tr('summary.delete')}
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={tr('summary.deleteTitle')}
          body={tr('summary.deleteBody')}
          onClose={() => setConfirmingDelete(false)}
        >
          <div className="confirm-actions">
            <button
              type="button"
              className="danger"
              onClick={() => {
                setConfirmingDelete(false)
                onDelete(workout.id)
              }}
            >
              {tr('summary.confirmDelete')}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              {tr('cancel')}
            </button>
          </div>
        </ConfirmDialog>
      )}
    </main>
  )
}
