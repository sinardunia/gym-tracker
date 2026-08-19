import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import { useI18n } from '../../i18n'
import { SetList } from '../SetList'
import { Button, CARD_CLASSES, Input } from '../ui'
import { ExerciseHeader } from './ExerciseHeader'
import { ExerciseOptionsPanel } from './ExerciseOptionsPanel'
import { SetEntryForm } from './SetEntryForm'
import {
  findLastSessionSet,
  findPersonalBest,
  findPreviousExercise,
  overloadTarget,
} from '../../lib/selectors'
import { formatDate, formatSetWeight } from '../../lib/format'
import type {
  Exercise,
  ExerciseUnit,
  SetType,
  Workout,
  WorkoutSet,
} from '../../lib/types'

export function ExerciseCard({
  exercise,
  isActiveExercise = true,
  onSelectActive,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemove,
  onRename,
  onChangeUnit,
  onUpdateNote: _onUpdateNote,
  onMove,
  canMoveUp,
  canMoveDown,
  sessions,
  collapsed,
  onToggleCollapsed,
}: {
  exercise: Exercise
  isActiveExercise?: boolean
  onSelectActive?: () => void
  onAddSet: (reps: number, weightKg: number, type: SetType, parentId?: string) => void
  onRemoveSet: (setId: string) => void
  onUpdateSet: (setId: string, reps: number, weightKg: number, type: SetType) => void
  onRemove: () => void
  onRename: (name: string) => void
  onChangeUnit: (unit: ExerciseUnit) => void
  onUpdateNote: (note: string) => void
  onMove?: (direction: -1 | 1) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  sessions: Workout[]
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const { tr, lang } = useI18n()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [highlightedSetId, setHighlightedSetId] = useState<string | null>(null)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [prefillToken, setPrefillToken] = useState(0)
  const lastSetRef = useRef<HTMLLIElement | null>(null)
  const previousSetCount = useRef(exercise.sets.length)

  useEffect(() => {
    if (!isActiveExercise || collapsed) {
      setShowOptionsMenu(false)
    }
  }, [isActiveExercise, collapsed])

  useEffect(() => {
    const previousLength = previousSetCount.current
    previousSetCount.current = exercise.sets.length
    if (exercise.sets.length <= previousLength) return
    const added = exercise.sets[exercise.sets.length - 1]
    setHighlightedSetId(added.id)
    const timer = setTimeout(() => setHighlightedSetId(null), 1200)
    return () => clearTimeout(timer)
  }, [exercise.sets])

  let lastWorkingSet: WorkoutSet | undefined
  for (const set of exercise.sets) {
    if (set.type === 'working') lastWorkingSet = set
  }
  const previous = useMemo(() => {
    if (lastWorkingSet) {
      return {
        reps: lastWorkingSet.reps,
        weightKg: lastWorkingSet.weightKg,
        unit: exercise.unit,
      }
    }
    return findLastSessionSet(sessions, exercise.name)
  }, [lastWorkingSet, sessions, exercise.name, exercise.unit])
  const prevSession = useMemo(
    () => findPreviousExercise(sessions, exercise.name),
    [sessions, exercise.name],
  )
  const best = useMemo(
    () => findPersonalBest(sessions, exercise.name, exercise.unit),
    [sessions, exercise.name, exercise.unit],
  )
  const target = useMemo(
    () => overloadTarget(exercise.name, sessions),
    [exercise.name, sessions],
  )
  const targetBeaten = target
    ? exercise.sets.some(
        (set) =>
          set.type === 'working' &&
          (set.weightKg > target.weightKg ||
            (set.weightKg === target.weightKg && set.reps >= target.targetReps)),
      )
    : true

  function startRename() {
    setNameDraft(exercise.name)
    setNameError(null)
    setEditingName(true)
  }

  function handleRenameSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameError(tr('ex.nameRequired'))
      return
    }
    onRename(trimmed)
    setEditingName(false)
    setNameError(null)
  }

  const bestText = best
    ? (() => {
        const weightText = formatSetWeight(exercise.unit, best.weightKg, tr)
        return weightText
          ? tr('ex.best', { weight: weightText, reps: best.reps })
          : tr('ex.bestBodyweight', { reps: best.reps })
      })()
    : null
  const targetText =
    target && !targetBeaten && target.unit === exercise.unit
      ? (() => {
          const weightText = formatSetWeight(exercise.unit, target.weightKg, tr)
          return weightText
            ? tr('ex.target', { weight: weightText, reps: target.targetReps })
            : tr('ex.targetBodyweight', { reps: target.targetReps })
        })()
      : null
  const prevSessionSummary =
    prevSession && prevSession.sets.length > 0
      ? tr('ex.previousShort', {
          sets: prevSession.sets
            .map((set) => {
              const weightText = formatSetWeight(exercise.unit, set.weightKg, tr)
              return weightText ? `${weightText} × ${set.reps}` : String(set.reps)
            })
            .join(' · '),
        }) + (bestText ? ` · ${bestText}` : '')
      : null

  return (
    <section
      className={`${CARD_CLASSES}${isActiveExercise ? ' border-brand-accent shadow-[0_2px_8px_rgba(124,58,237,0.08)]' : ' opacity-85 transition-opacity duration-150 ease-in hover:opacity-100 hover:border-brand-border'}`}
      onClick={!isActiveExercise && onSelectActive ? onSelectActive : undefined}
    >
      <ExerciseHeader
        exercise={exercise}
        collapsed={collapsed}
        isActiveExercise={isActiveExercise}
        showOptionsMenu={showOptionsMenu}
        onToggleOptionsMenu={() => setShowOptionsMenu((open) => !open)}
        onSelectActive={onSelectActive}
        onToggleCollapsed={onToggleCollapsed}
      />

      {!collapsed && showOptionsMenu && (
        <ExerciseOptionsPanel
          exercise={exercise}
          onChangeUnit={onChangeUnit}
          onRename={() => {
            startRename()
            setShowOptionsMenu(false)
          }}
          onMove={onMove}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onRemove={onRemove}
        />
      )}

      {collapsed && (
        <div className="flex flex-col gap-2 items-start [&_button]:w-full">
          {prevSessionSummary && (
            <p className="text-brand-text whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2.5 py-1.5 bg-brand-row rounded-lg">
              {prevSessionSummary}
            </p>
          )}
          {targetText && (
            <p className="text-brand-accent font-semibold text-sm m-0">{targetText}</p>
          )}
          {previous && previous.unit === exercise.unit && (
            <Button
              type="button"
              variant="secondary"
              sm
              className="inline-flex items-center justify-center gap-2"
              onClick={() => setPrefillToken((token) => token + 1)}
            >
              <Pencil size={14} aria-hidden="true" />
              <span>
                {exercise.unit === 'bodyweight'
                  ? tr('ex.fillInputBodyweight', { reps: previous.reps })
                  : tr('ex.fillInput', {
                      weight: formatSetWeight(exercise.unit, previous.weightKg, tr) ?? '',
                      reps: previous.reps,
                    })}
              </span>
            </Button>
          )}
        </div>
      )}

      {!collapsed && (
        <>
          {prevSession && prevSession.sets.length > 0 && (
            <section className="p-2.5 bg-brand-row border-l-[3px] border-l-brand-accent rounded-r-lg [&_h4]:text-[13px] [&_h4]:text-brand-text [&_h4]:mb-1.5">
              <h4>
                {tr('ex.previous', { date: formatDate(prevSession.finishedAt, lang) })}
                {bestText && <span className="ml-2 text-brand-accent">{bestText}</span>}
              </h4>
              <SetList
                sets={prevSession.sets}
                unit={exercise.unit}
                rowClassName="bg-brand-bg"
              />
            </section>
          )}
          {targetText && (
            <p className="text-brand-accent font-semibold text-sm m-0">{targetText}</p>
          )}

          {editingName && (
            <form onSubmit={handleRenameSubmit} className="flex flex-col gap-2">
              <Input
                type="text"
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value)
                  setNameError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setEditingName(false)
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" sm variant="secondary">
                  {tr('save')}
                </Button>
                <Button
                  type="button"
                  sm
                  variant="secondary"
                  onClick={() => setEditingName(false)}
                >
                  {tr('cancel')}
                </Button>
              </div>
              {nameError && <p className="text-brand-danger text-sm m-0">{nameError}</p>}
            </form>
          )}

          {exercise.sets.length === 0 ? (
            <p className="text-brand-text">{tr('ex.noSets')}</p>
          ) : (
            <SetList
              sets={exercise.sets}
              unit={exercise.unit}
              onRemoveSet={onRemoveSet}
              onUpdateSet={onUpdateSet}
              highlightId={highlightedSetId}
              lastRowRef={lastSetRef}
            />
          )}

          {isActiveExercise && (
            <SetEntryForm
              exercise={exercise}
              previous={previous}
              prefillToken={prefillToken}
              onAddSet={onAddSet}
            />
          )}
        </>
      )}
    </section>
  )
}