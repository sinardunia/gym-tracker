import { useState, type Ref } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { groupSetRows } from '../lib/selectors'
import { formatSetWeight } from '../lib/format'
import { SET_TYPES, type ExerciseUnit, type SetType, type WorkoutSet } from '../lib/types'

export function SetList({
  sets,
  unit,
  onRemoveSet,
  onUpdateSet,
  highlightId,
  lastRowRef,
}: {
  sets: WorkoutSet[]
  unit: ExerciseUnit
  onRemoveSet?: (setId: string) => void
  onUpdateSet?: (
    setId: string,
    reps: number,
    weightKg: number,
    type: SetType,
  ) => void
  highlightId?: string | null
  lastRowRef?: Ref<HTMLLIElement>
}) {
  const { tr } = useI18n()
  const rows = groupSetRows(sets)
  const lastSetId = sets.length > 0 ? sets[sets.length - 1].id : undefined
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{
    reps: string
    weight: string
    type: SetType
  } | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  let number = 0

  function startEdit(set: WorkoutSet) {
    setEditingId(set.id)
    setDraft({
      reps: String(set.reps),
      weight: String(set.weightKg),
      type: set.type,
    })
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(null)
    setEditError(null)
  }

  function saveEdit(set: WorkoutSet) {
    if (!draft || !onUpdateSet) return
    const repsValue = Number(draft.reps)
    if (!Number.isInteger(repsValue) || repsValue < 1) {
      setEditError(tr('ex.repsError'))
      return
    }
    let weightValue = 0
    if (unit === 'bodyweight') {
      weightValue = 0
    } else if (unit === 'plate') {
      weightValue = Number(draft.weight)
      if (!Number.isInteger(weightValue) || weightValue < 0) {
        setEditError(tr('ex.plateError'))
        return
      }
    } else {
      weightValue = Number(draft.weight)
      if (!Number.isFinite(weightValue) || weightValue < 0) {
        setEditError(tr('ex.weightError'))
        return
      }
    }
    onUpdateSet(set.id, repsValue, weightValue, draft.type)
    cancelEdit()
  }

  function renderEditRow(set: WorkoutSet) {
    return (
      <li key={set.id} className="set-edit-row">
        <div className="set-edit-form">
          <select
            value={draft?.type ?? set.type}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, type: e.target.value as SetType } : d))
            }
            aria-label={tr('ex.setTypeLabel')}
          >
            {SET_TYPES.map((t) => (
              <option key={t} value={t}>
                {tr(`setType.${t}`)}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={draft?.reps ?? ''}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, reps: e.target.value } : d))
            }
            aria-label={tr('ex.reps')}
          />
          {unit !== 'bodyweight' && (
            <input
              type="number"
              min={0}
              step={unit === 'plate' ? 1 : 'any'}
              inputMode={unit === 'plate' ? 'numeric' : 'decimal'}
              value={draft?.weight ?? ''}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, weight: e.target.value } : d))
              }
              aria-label={unit === 'plate' ? tr('ex.plates') : tr('ex.weightKg')}
            />
          )}
        </div>
        {editError && <p className="error">{editError}</p>}
        <div className="rename-actions">
          <button type="button" className="btn-sm primary" onClick={() => saveEdit(set)}>
            {tr('save')}
          </button>
          <button type="button" className="btn-sm secondary" onClick={cancelEdit}>
            {tr('cancel')}
          </button>
        </div>
      </li>
    )
  }

  function renderSetRow(set: WorkoutSet, isDrop: boolean, setNumber: number) {
    if (editingId === set.id) return renderEditRow(set)
    const weightText = formatSetWeight(unit, set.weightKg, tr)
    return (
      <li
        key={set.id}
        ref={set.id === lastSetId ? lastRowRef : undefined}
        className={`${isDrop ? 'drop-row' : ''}${
          highlightId === set.id ? ' set-highlight' : ''
        }`}
      >
        <button
          type="button"
          className="set-edit-toggle"
          onClick={onUpdateSet ? () => startEdit(set) : undefined}
          disabled={!onUpdateSet}
          aria-label={tr('ex.editSet')}
        >
          {isDrop && (
            <span className="drop-marker" aria-hidden="true">↳</span>
          )}
          <span className="set-edit-toggle-info">
            <span>
              {!isDrop && tr('ex.setLabel', { n: setNumber })}
              {set.type !== 'working' && (
                <span className={`set-badge ${set.type}`}>
                  {tr(`setType.${set.type}`)}
                </span>
              )}
            </span>
            <span>
              {tr('ex.repsCount', { reps: set.reps })}
              {weightText ? ` · ${weightText}` : ''}
            </span>
          </span>
          {onUpdateSet && (
            <span className="completed-check-icon" title={tr('ex.completed')}>
              <Icon name="check" size={14} />
            </span>
          )}
        </button>
        {onRemoveSet && (
          <button
            type="button"
            className="icon-btn danger set-remove"
            onClick={() => onRemoveSet(set.id)}
            aria-label={
              isDrop ? tr('ex.removeDrop') : tr('ex.removeSet', { n: setNumber })
            }
          >
            <Icon name="trash" size={16} />
          </button>
        )}
      </li>
    )
  }

  return (
    <ul className="sets">
      {rows.flatMap(({ set, drops }) => {
        number += 1
        const setNumber = number
        return [
          renderSetRow(set, false, setNumber),
          ...drops.map((drop) => renderSetRow(drop, true, setNumber)),
        ]
      })}
    </ul>
  )
}
