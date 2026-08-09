import { useState, useRef } from 'react'
import { useI18n } from '../i18n'
import { Icon } from '../components/Icon'
import { NoteField } from '../components/NoteField'
import { RestTimer } from '../components/RestTimer'
import { ExerciseCard } from '../components/ExerciseCard'
import { AddExerciseForm } from '../components/AddExerciseForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { recentExerciseNames } from '../lib/selectors'
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
  onMoveExercise,
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
  onMoveExercise: (exerciseId: string, direction: -1 | 1) => void
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
  const backButtonRef = useRef<HTMLButtonElement | null>(null)
  const addFormRef = useRef<HTMLDivElement | null>(null)
  const hasSet = workout.exercises.some((e) => e.sets.length > 0)
  const canFinish = workout.exercises.length > 0 && hasSet
  const noteOpen = noteExpanded || (workout.note ?? '').trim() !== ''
  const recent = recentExerciseNames(sessions)

  function scrollToAddExercise() {
    addFormRef.current?.scrollIntoView({ behavior: 'smooth' })
    const input = addFormRef.current?.querySelector('input')
    input?.focus()
  }

  return (
    <main className="screen">
      <header className="screen-header compact-workout-header">
        <div className="workout-header-title">
          <h1>{tr('workout.title')}</h1>
          <span className="muted">
            {tr('workout.startedAt', { time: formatTime(workout.startedAt, lang) })}
          </span>
        </div>
        <button
          type="button"
          className="icon-btn btn-sm"
          onClick={() => setNoteExpanded((open) => !open)}
          aria-label={tr('workout.notes')}
          title={tr('workout.notes')}
        >
          <Icon name="pencil" size={16} />
        </button>
      </header>

      {noteOpen && (
        <NoteField
          value={workout.note ?? ''}
          onChange={(note) => {
            onUpdateWorkoutNote(note)
          }}
          placeholder={tr('workout.notesPlaceholder')}
          label={tr('workout.notes')}
          compact={!noteExpanded}
          onFocus={() => setNoteExpanded(true)}
        />
      )}

      <div className="workout-actions">
        <div className="workout-actions-row">
          <button
            type="button"
            ref={backButtonRef}
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
        <ConfirmDialog
          title={tr('workout.exitTitle')}
          body={tr('workout.exitBody')}
          onClose={() => setConfirmingExit(false)}
          returnFocusRef={backButtonRef}
        >
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
        </ConfirmDialog>
      )}

      {workout.exercises.length === 0 ? (
        <p className="muted empty">{tr('workout.noExercises')}</p>
      ) : (
        workout.exercises.map((exercise, index) => (
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
            onMove={(direction) => onMoveExercise(exercise.id, direction)}
            canMoveUp={index > 0}
            canMoveDown={index < workout.exercises.length - 1}
            sessions={sessions}
            collapsed={collapsedExerciseIds.has(exercise.id)}
            onToggleCollapsed={() => onToggleCollapsed(exercise.id)}
          />
        ))
      )}

      <div ref={addFormRef}>
        <AddExerciseForm onAdd={onAddExercise} recent={recent} />
      </div>

      {workout.exercises.length > 0 && (
        <button
          type="button"
          className="floating-add-ex-btn"
          onClick={scrollToAddExercise}
          aria-label={tr('addEx.add')}
        >
          + Exercise
        </button>
      )}
    </main>
  )
}
