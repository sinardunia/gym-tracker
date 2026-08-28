import { useState, type Ref } from 'react'
import { Check } from 'lucide-react'
import { useI18n } from '../i18n'
import { Button, Input, Select } from './ui'
import { groupSetRows } from '../lib/selectors'
import { formatSetWeight } from '../lib/format'
import { SET_TYPES, type ExerciseUnit, type SetType, type WorkoutSet } from '../lib/types'

const ROW_BASE_CLASSES =
  'px-2.5 py-2 bg-brand-row rounded-lg scroll-mt-[calc(100px+env(safe-area-inset-top))]'

export function SetList({
  sets,
  unit,
  onRemoveSet,
  onUpdateSet,
  highlightId,
  lastRowRef,
  rowClassName,
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
  rowClassName?: string
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
      <li key={set.id} className={`${ROW_BASE_CLASSES} flex flex-col gap-2`}>
        <div className="flex gap-2 items-center flex-wrap [&_select]:flex-1 [&_input]:flex-1 [&_select]:min-w-0 [&_input]:min-w-0">
          <Select
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
          </Select>
          <Input
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
            <Input
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
        {editError && <p className="text-brand-danger text-sm m-0">{editError}</p>}
        <div className="flex gap-2">
          <Button sm onClick={() => saveEdit(set)}>
            {tr('save')}
          </Button>
          {onRemoveSet && (
            <Button
              sm
              variant="danger"
              onClick={() => {
                onRemoveSet(set.id)
                cancelEdit()
              }}
            >
              {tr('ex.remove')}
            </Button>
          )}
          <Button sm variant="secondary" onClick={cancelEdit}>
            {tr('cancel')}
          </Button>
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
        className={`${ROW_BASE_CLASSES} flex justify-between items-center gap-2${rowClassName ?? ''}${
          isDrop ? ' drop-row' : ''
        }${highlightId === set.id ? ' set-highlight' : ''}`}
      >
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 text-left font-[inherit] text-[inherit] bg-transparent border-none p-0 cursor-pointer disabled:opacity-100 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1 focus-visible:rounded"
          onClick={onUpdateSet ? () => startEdit(set) : undefined}
          disabled={!onUpdateSet}
          aria-label={tr('ex.editSet')}
        >
          {isDrop && (
            <span className="text-brand-text text-[13px] shrink-0" aria-hidden="true">↳</span>
          )}
          <span className="flex-1 min-w-0 flex justify-between items-center gap-2">
            <span>
              {!isDrop && tr('ex.setLabel', { n: setNumber })}
              {set.type !== 'working' && `${isDrop ? ' ' : ''}${tr(`setType.${set.type}`)}`}
            </span>
            <span>
              {tr('ex.repsCount', { reps: set.reps })}
              {weightText ? ` · ${weightText}` : ''}
            </span>
          </span>
          {onUpdateSet && (
            <span className="inline-flex items-center justify-center text-brand-positive ml-1" title={tr('ex.completed')}>
              <Check size={14} aria-hidden="true" />
            </span>
          )}
        </button>
      </li>
    )
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
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