import { useState, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../i18n'
import { NoteField } from '../components/NoteField'
import { RestTimer } from '../components/RestTimer'
import { ExerciseCard } from '../components/ExerciseCard'
import { AddExerciseForm } from '../components/AddExerciseForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Button, IconButton, Screen } from '../components/ui'
import { FloatingPlateCalculatorButton } from '../components/PlateCalculator'
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
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finishNote, setFinishNote] = useState(() => workout.note ?? '')
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(
    () => workout.exercises[0]?.id ?? null,
  )
  const backButtonRef = useRef<HTMLButtonElement | null>(null)
  const hasSet = workout.exercises.some((e) => e.sets.length > 0)
  const canFinish = workout.exercises.length > 0 && hasSet
  const recent = recentExerciseNames(sessions)

  const effectiveActiveId =
    workout.exercises.find((e) => e.id === activeExerciseId)?.id ??
    workout.exercises[0]?.id ??
    null

  return (
    <Screen>
      <header className="mb-1 [&_h1]:mb-1 flex justify-between items-center [&_h1]:text-[22px]">
        <div className="flex items-baseline gap-2.5">
          <h1>{tr('workout.title')}</h1>
          <span className="text-brand-text">
            {tr('workout.startedAt', { time: formatTime(workout.startedAt, lang) })}
          </span>
        </div>
      </header>

      <div className="sticky top-[env(safe-area-inset-top)] z-10 px-4 py-3.5 -m-1 mb-3 bg-brand-card border border-brand-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <RestTimer workoutId={workout.id} />
      </div>

      {confirmingExit && (
        <ConfirmDialog
          title={tr('workout.exitTitle')}
          body={tr('workout.exitBody')}
          onClose={() => setConfirmingExit(false)}
          returnFocusRef={backButtonRef}
        >
          <div className="flex gap-2 flex-wrap [&_button]:flex-1">
            <Button
              type="button"
              onClick={() => {
                setConfirmingExit(false)
                onExit()
              }}
            >
              {tr('workout.goHome')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setConfirmingExit(false)
                onDiscard()
              }}
            >
              {tr('workout.discard')}
            </Button>
          </div>
        </ConfirmDialog>
      )}

      {showFinishModal && (
        <ConfirmDialog
          title={tr('workout.finishNotesTitle')}
          onClose={() => setShowFinishModal(false)}
        >
          <div>
            <NoteField
              value={finishNote}
              onChange={setFinishNote}
              placeholder={tr('workout.notesPlaceholder')}
              label={tr('workout.notes')}
            />
            <div className="flex gap-2 flex-wrap [&_button]:flex-1" style={{ marginTop: '1rem' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFinishModal(false)}
              >
                {tr('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="positive"
                onClick={() => {
                  onUpdateWorkoutNote(finishNote)
                  setShowFinishModal(false)
                  onFinish()
                }}
              >
                {tr('workout.finish')}
              </Button>
            </div>
          </div>
        </ConfirmDialog>
      )}

      {workout.exercises.length === 0 ? (
        <p className="text-brand-text py-2">{tr('workout.noExercises')}</p>
      ) : (
        workout.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isActiveExercise={exercise.id === effectiveActiveId}
            onSelectActive={() => {
              setActiveExerciseId(exercise.id)
              if (collapsedExerciseIds.has(exercise.id)) {
                onToggleCollapsed(exercise.id)
              }
            }}
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
            onToggleCollapsed={() => {
              const isCurrentlyCollapsed = collapsedExerciseIds.has(exercise.id)
              if (isCurrentlyCollapsed) {
                setActiveExerciseId(exercise.id)
              }
              onToggleCollapsed(exercise.id)
            }}
          />
        ))
      )}

      <AddExerciseForm onAdd={onAddExercise} recent={recent} />

      <div className="sticky bottom-0 z-[15] flex flex-col gap-2 px-4 py-3.5 mt-5 -mx-4 -mb-4 bg-brand-card border-t border-brand-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2">
          <IconButton
            type="button"
            ref={backButtonRef}
            onClick={() => setConfirmingExit(true)}
            aria-label={tr('workout.backHome')}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </IconButton>
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={() => setShowFinishModal(true)}
            disabled={!canFinish}
          >
            {tr('workout.finish')}
          </Button>
        </div>
        {!canFinish && (
          <p className="text-brand-danger text-sm m-0 text-center">{tr('workout.finishHint')}</p>
        )}
      </div>

      <FloatingPlateCalculatorButton />
    </Screen>
  )
}
