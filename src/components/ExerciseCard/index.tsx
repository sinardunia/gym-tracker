import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useI18n } from '../../i18n'
import { Icon } from '../Icon'
import { SetList } from '../SetList'
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
      className={`card exercise${isActiveExercise ? ' active-exercise' : ' inactive-exercise'}`}
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
        <div className="collapsed-actions">
          {prevSessionSummary && (
            <p className="muted previous-summary">{prevSessionSummary}</p>
          )}
          {targetText && <p className="target-line">{targetText}</p>}
          {previous && previous.unit === exercise.unit && (
            <button
              type="button"
              className="btn-sm secondary repeat-btn"
              onClick={() => setPrefillToken((token) => token + 1)}
            >
              <Icon name="pencil" size={14} />
              <span>
                {exercise.unit === 'bodyweight'
                  ? tr('ex.fillInputBodyweight', { reps: previous.reps })
                  : tr('ex.fillInput', {
                      weight: formatSetWeight(exercise.unit, previous.weightKg, tr) ?? '',
                      reps: previous.reps,
                    })}
              </span>
            </button>
          )}
        </div>
      )}

      {!collapsed && (
        <>
          {prevSession && prevSession.sets.length > 0 && (
            <section className="previous-block">
              <h4>
                {tr('ex.previous', { date: formatDate(prevSession.finishedAt, lang) })}
                {bestText && <span className="best-line">{bestText}</span>}
              </h4>
              <SetList sets={prevSession.sets} unit={exercise.unit} />
            </section>
          )}
          {targetText && <p className="target-line">{targetText}</p>}

          {editingName && (
            <form onSubmit={handleRenameSubmit} className="rename-form">
              <input
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
              <div className="rename-actions">
                <button type="submit" className="btn-sm secondary">
                  {tr('save')}
                </button>
                <button
                  type="button"
                  className="btn-sm secondary"
                  onClick={() => setEditingName(false)}
                >
                  {tr('cancel')}
                </button>
              </div>
              {nameError && <p className="error">{nameError}</p>}
            </form>
          )}

          {exercise.sets.length === 0 ? (
            <p className="muted">{tr('ex.noSets')}</p>
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