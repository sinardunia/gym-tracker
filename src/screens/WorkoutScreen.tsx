import { useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from '../components/Icon'
import { NoteField } from '../components/NoteField'
import { RestTimer } from '../components/RestTimer'
import { ExerciseCard } from '../components/ExerciseCard'
import { AddExerciseForm } from '../components/AddExerciseForm'
import { formatTime } from '../lib/format'
import type { ExerciseUnit, SetType, Workout } from '../lib/types'

export function WorkoutScreen({
  workout,
  onAddExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemoveExercise,
  onRenameExercise,
  onChangeUnit,
  onUpdateWorkoutNote,
  onUpdateExerciseNote,
  onExit,
  onDiscard,
  onFinish,
  sessions,
  collapsedExerciseIds,
  onToggleCollapsed,
}: {
  workout: Workout
  onAddExercise: (name: string) => void
  onAddSet: (
    exerciseId: string,
    reps: number,
    weightKg: number,
    type: SetType,
    parentId?: string,
  ) => void
  onRemoveSet: (exerciseId: string, setId: string) => void
  onUpdateSet: (
    exerciseId: string,
    setId: string,
    reps: number,
    weightKg: number,
    type: SetType,
  ) => void
  onRemoveExercise: (exerciseId: string) => void
  onRenameExercise: (exerciseId: string, name: string) => void
  onChangeUnit: (exerciseId: string, unit: ExerciseUnit) => void
  onUpdateWorkoutNote: (note: string) => void
  onUpdateExerciseNote: (exerciseId: string, note: string) => void
  onExit: () => void
  onDiscard: () => void
  onFinish: () => void
  sessions: Workout[]
  collapsedExerciseIds: Set<string>
  onToggleCollapsed: (exerciseId: string) => void
}) {
  const { tr, lang } = useI18n()
  const [confirmingExit, setConfirmingExit] = useState(false)
  const [noteExpanded, setNoteExpanded] = useState(false)
  const hasSet = workout.exercises.some((e) => e.sets.length > 0)
  const canFinish = workout.exercises.length > 0 && hasSet
  const noteOpen = noteExpanded || (workout.note ?? '').trim() !== ''

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>{tr('workout.title')}</h1>
        <p className="muted">
          {tr('workout.startedAt', { time: formatTime(workout.startedAt, lang) })}
        </p>
      </header>

      <NoteField
        value={workout.note ?? ''}
        onChange={(note) => {
          onUpdateWorkoutNote(note)
          setNoteExpanded(true)
        }}
        placeholder={tr('workout.notesPlaceholder')}
        label={tr('workout.notes')}
        compact={!noteOpen}
        onFocus={() => setNoteExpanded(true)}
        onBlur={() => setNoteExpanded(false)}
      />

      <div className="workout-actions">
        <div className="workout-actions-row">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setConfirmingExit(true)}
            aria-label={tr('workout.backHome')}
          >
            <Icon name="arrow-left" />
          </button>
          <button
            type="button"
            className="positive finish"
            onClick={onFinish}
            disabled={!canFinish}
          >
            {tr('workout.finish')}
          </button>
        </div>
        <RestTimer workoutId={workout.id} />
      </div>
      {!canFinish && (
        <p className="error hint">{tr('workout.finishHint')}</p>
      )}

      {confirmingExit && (
        <div className="confirm-dialog" role="dialog" aria-modal="true">
          <div className="confirm-card">
            <h3>{tr('workout.exitTitle')}</h3>
            <p className="muted">{tr('workout.exitBody')}</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setConfirmingExit(false)
                  onExit()
                }}
              >
                {tr('workout.goHome')}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setConfirmingExit(false)
                  onDiscard()
                }}
              >
                {tr('workout.discard')}
              </button>
            </div>
          </div>
        </div>
      )}

      {workout.exercises.length === 0 ? (
        <p className="muted empty">{tr('workout.noExercises')}</p>
      ) : (
        workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onAddSet={(reps, weightKg, type, parentId) =>
              onAddSet(exercise.id, reps, weightKg, type, parentId)
            }
            onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
            onUpdateSet={(setId, reps, weightKg, type) =>
              onUpdateSet(exercise.id, setId, reps, weightKg, type)
            }
            onRemove={() => onRemoveExercise(exercise.id)}
            onRename={(name) => onRenameExercise(exercise.id, name)}
            onChangeUnit={(unit) => onChangeUnit(exercise.id, unit)}
            onUpdateNote={(note) => onUpdateExerciseNote(exercise.id, note)}
            sessions={sessions}
            collapsed={collapsedExerciseIds.has(exercise.id)}
            onToggleCollapsed={() => onToggleCollapsed(exercise.id)}
          />
        ))
      )}

      <AddExerciseForm onAdd={onAddExercise} />
    </main>
  )
}
