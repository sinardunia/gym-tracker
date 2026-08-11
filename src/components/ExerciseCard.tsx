import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { NoteField } from './NoteField'
import { SetList } from './SetList'
import {
  dropContext,
  findLastSessionSet,
  findPersonalBest,
  findPreviousExercise,
  nearestWorkingParent,
  overloadTarget,
  suggestDrop,
} from '../lib/selectors'
import { formatDate, formatSetWeight } from '../lib/format'
import {
  SET_TYPES,
  type Exercise,
  type ExerciseUnit,
  type SetType,
  type Workout,
  type WorkoutSet,
} from '../lib/types'

export function ExerciseCard({
  exercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemove,
  onRename,
  onChangeUnit,
  onUpdateNote,
  onMove,
  canMoveUp,
  canMoveDown,
  sessions,
  collapsed,
  onToggleCollapsed,
}: {
  exercise: Exercise
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
  const { tr, p, lang } = useI18n()
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [setType, setSetType] = useState<SetType>('working')
  const [dropParentId, setDropParentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [highlightedSetId, setHighlightedSetId] = useState<string | null>(null)
  const [showNoteField, setShowNoteField] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const lastSetRef = useRef<HTMLLIElement | null>(null)
  const setFormRef = useRef<HTMLFormElement | null>(null)
  const previousSetCount = useRef(exercise.sets.length)
  const rawLastSet = exercise.sets[exercise.sets.length - 1]
  const lastSet =
    rawLastSet && rawLastSet.type === 'dropset' && rawLastSet.parentId
      ? (nearestWorkingParent(exercise.sets) ?? rawLastSet)
      : rawLastSet
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
  const drop = dropContext(exercise.sets)
  const dropWeight = drop ? suggestDrop(drop.base, exercise.unit) : null
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

  useEffect(() => {
    if (!previous) return
    setReps(String(previous.reps))
    if (previous.unit === exercise.unit) {
      setWeight(String(previous.weightKg))
    }
  }, [previous, exercise.unit])

  useEffect(() => {
    if (exercise.unit === 'bodyweight') setWeight('')
  }, [exercise.unit])

  useEffect(() => {
    const previousLength = previousSetCount.current
    previousSetCount.current = exercise.sets.length
    if (exercise.sets.length <= previousLength) return
    const added = exercise.sets[exercise.sets.length - 1]
    setHighlightedSetId(added.id)
    const node = setFormRef.current
    if (node) {
      const rect = node.getBoundingClientRect()
      if (rect.bottom > window.innerHeight) {
        node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
    const timer = setTimeout(() => setHighlightedSetId(null), 1200)
    return () => clearTimeout(timer)
  }, [exercise.sets])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const repsValue = Number(reps)
    if (!Number.isInteger(repsValue) || repsValue < 1) {
      setError(tr('ex.repsError'))
      return
    }
    let weightValue = 0
    if (exercise.unit === 'bodyweight') {
      weightValue = 0
    } else if (exercise.unit === 'plate') {
      weightValue = Number(weight)
      if (!Number.isInteger(weightValue) || weightValue < 0) {
        setError(tr('ex.plateError'))
        return
      }
    } else {
      weightValue = Number(weight)
      if (!Number.isFinite(weightValue) || weightValue < 0) {
        setError(tr('ex.weightError'))
        return
      }
    }
    const wasDrop = dropParentId !== null
    onAddSet(repsValue, weightValue, setType, dropParentId ?? undefined)
    if (wasDrop && previous) {
      // Kembalikan ke nilai working set supaya set working berikutnya
      // tidak memakai berat drop yang lebih ringan.
      setReps(String(previous.reps))
      setWeight(String(previous.weightKg))
    } else {
      setReps(String(repsValue))
      setWeight(String(weightValue))
    }
    if (wasDrop) setSetType('working')
    setDropParentId(null)
    setError(null)
  }

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

  const setCount = exercise.sets.length
  const lastSetWeight = lastSet
    ? formatSetWeight(exercise.unit, lastSet.weightKg, tr)
    : null
  const lastSetSummary = lastSet
    ? tr('ex.lastSet', { reps: lastSet.reps, weight: lastSetWeight ? ` · ${lastSetWeight}` : '' })
    : tr('ex.noSets')
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
    <section className="card exercise">
      <div className="exercise-head">
        <button
          type="button"
          className="collapse-toggle"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? tr('ex.expand') : tr('ex.collapse')}
        >
          <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} />
        </button>
        <div className="exercise-title">
          <h3>{exercise.name}</h3>
          <p className="exercise-summary">
            {setCount} {p(setCount, 'count.sets')} · {lastSetSummary}
          </p>
        </div>
        {!collapsed && (
          <div className="exercise-actions">
            <button
              type="button"
              className={`icon-btn${showOptionsMenu ? ' active' : ''}`}
              onClick={() => setShowOptionsMenu((open) => !open)}
              aria-label={tr('ex.options')}
              title={tr('ex.options')}
            >
              <Icon name="more" size={18} />
            </button>
          </div>
        )}
      </div>

      {!collapsed && showOptionsMenu && (
        <div className="exercise-options-panel">
          <div className="options-row">
            <span className="options-label">{tr('ex.unitLabel')}</span>
            <select
              className="unit-select"
              value={exercise.unit}
              onChange={(e) => onChangeUnit(e.target.value as ExerciseUnit)}
              aria-label={tr('ex.unitLabel')}
            >
              <option value="kg">{tr('unit.kg')}</option>
              <option value="plate">{tr('unit.plates')}</option>
              <option value="bodyweight">bodyweight</option>
            </select>
          </div>
          <div className="options-actions">
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => {
                setShowNoteField((open) => !open)
                setShowOptionsMenu(false)
              }}
            >
              <Icon name="note" size={14} />
              <span>{tr('ex.note')}</span>
            </button>
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => {
                startRename()
                setShowOptionsMenu(false)
              }}
            >
              <Icon name="pencil" size={14} />
              <span>{tr('ex.rename')}</span>
            </button>
            {onMove && (
              <>
                <button
                  type="button"
                  className="btn-sm secondary"
                  disabled={!canMoveUp}
                  onClick={() => onMove(-1)}
                  aria-label={tr('ex.moveUp')}
                >
                  <Icon name="arrow-up" size={14} />
                </button>
                <button
                  type="button"
                  className="btn-sm secondary"
                  disabled={!canMoveDown}
                  onClick={() => onMove(1)}
                  aria-label={tr('ex.moveDown')}
                >
                  <Icon name="arrow-down" size={14} />
                </button>
              </>
            )}
            {confirmRemove ? (
              <span className="inline-confirm">
                <button
                  type="button"
                  className="btn-sm danger"
                  onClick={onRemove}
                >
                  {tr('ex.confirmRemove')}
                </button>
                <button
                  type="button"
                  className="btn-sm secondary"
                  onClick={() => setConfirmRemove(false)}
                >
                  {tr('cancel')}
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="btn-sm danger"
                onClick={() => {
                  if (exercise.sets.length > 0) {
                    setConfirmRemove(true)
                  } else {
                    onRemove()
                  }
                }}
              >
                <Icon name="trash" size={14} />
                <span>{tr('ex.remove')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {collapsed && (
        <div className="collapsed-actions">
          {exercise.note && (
            <p className="muted collapsed-note">{exercise.note}</p>
          )}
          {prevSessionSummary && (
            <p className="muted previous-summary">{prevSessionSummary}</p>
          )}
          {targetText && (
            <p className="target-line">{targetText}</p>
          )}
          {previous && previous.unit === exercise.unit && (
            <button
              type="button"
              className="btn-sm secondary repeat-btn"
              onClick={() => onAddSet(previous.reps, previous.weightKg, 'working')}
            >
              <Icon name="repeat" size={14} />
              {tr('ex.repeatLastSet')}
            </button>
          )}
        </div>
      )}

      {!collapsed && (
        <>
      {(showNoteField || exercise.note) && (
        <NoteField
          value={exercise.note ?? ''}
          onChange={onUpdateNote}
          placeholder={tr('ex.notePlaceholder')}
          compact
          label={tr('ex.note')}
        />
      )}

      {prevSession && prevSession.sets.length > 0 && (
        <section className="previous-block">
          <h4>
            {tr('ex.previous', { date: formatDate(prevSession.finishedAt, lang) })}
            {bestText && <span className="best-line">{bestText}</span>}
          </h4>
          <SetList sets={prevSession.sets} unit={exercise.unit} />
        </section>
      )}
      {targetText && (
        <p className="target-line">{targetText}</p>
      )}

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

      <div className="current-set-execution-card">
        <div className="current-set-header">
          <span className="current-set-title">
            {tr('ex.currentSet', { n: exercise.sets.length + 1 })}
          </span>
        </div>
        <form ref={setFormRef} onSubmit={handleSubmit} className="set-form">
          <div className="set-form-meta">
            <div className="set-type-row" role="group" aria-label={tr('ex.setTypeLabel')}>
              {SET_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`set-type-btn${setType === type ? ' active' : ''}`}
                  onClick={() => {
                    setSetType(type)
                    setDropParentId(null)
                  }}
                >
                  {tr(`setType.${type}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="set-fields-grid">
            <div className="field">
              <label htmlFor={`reps-${exercise.id}`}>{tr('ex.reps')}</label>
              <input
                id={`reps-${exercise.id}`}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={reps}
                onChange={(e) => {
                  setReps(e.target.value)
                  setError(null)
                }}
                placeholder="10"
              />
            </div>
            {exercise.unit !== 'bodyweight' && (
              <div className="field">
                <label htmlFor={`weight-${exercise.id}`}>
                  {exercise.unit === 'plate' ? tr('ex.plates') : tr('ex.weightKg')}
                </label>
                <input
                  id={`weight-${exercise.id}`}
                  type="number"
                  min={0}
                  step={exercise.unit === 'plate' ? 1 : 'any'}
                  inputMode={exercise.unit === 'plate' ? 'numeric' : 'decimal'}
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value)
                    setError(null)
                  }}
                  placeholder={exercise.unit === 'plate' ? '2' : '60'}
                />
              </div>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {drop && dropWeight !== null && (
            <button
              type="button"
              className="btn-sm secondary drop-btn"
              onClick={() => {
                setSetType('dropset')
                setReps(String(drop.base.reps))
                setWeight(String(dropWeight))
                setDropParentId(drop.parentId)
              }}
            >
              {tr('ex.drop')}
            </button>
          )}
          <button type="submit" className="positive complete-set-btn">
            <Icon name="check" size={18} />
            <span>{tr('ex.completeSet')}</span>
          </button>
        </form>
      </div>
        </>
      )}
    </section>
  )
}
