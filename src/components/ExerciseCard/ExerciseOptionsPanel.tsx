import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { Exercise, ExerciseUnit } from '../../lib/types'
import { Button, Select } from '../ui'

export function ExerciseOptionsPanel({
  exercise,
  onChangeUnit,
  onRename,
  onMove,
  canMoveUp,
  canMoveDown,
  onRemove,
}: {
  exercise: Exercise
  onChangeUnit: (unit: ExerciseUnit) => void
  onRename: () => void
  onMove?: (direction: -1 | 1) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onRemove: () => void
}) {
  const { tr } = useI18n()
  const [confirmRemove, setConfirmRemove] = useState(false)

  return (
    <div className="flex flex-col gap-2.5 px-3 py-2.5 bg-brand-row rounded-lg border border-brand-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-brand-heading">{tr('ex.unitLabel')}</span>
        <Select
          value={exercise.unit}
          onChange={(e) => onChangeUnit(e.target.value as ExerciseUnit)}
          aria-label={tr('ex.unitLabel')}
        >
          <option value="kg">{tr('unit.kg')}</option>
          <option value="plate">{tr('unit.plates')}</option>
          <option value="bodyweight">bodyweight</option>
        </Select>
      </div>
      <div className="flex gap-1.5 flex-wrap items-center">
        <Button type="button" sm variant="secondary" onClick={onRename}>
          <Pencil size={14} aria-hidden="true" />
          <span>{tr('ex.rename')}</span>
        </Button>
        {onMove && (
          <>
            <Button
              type="button"
              sm
              variant="secondary"
              disabled={!canMoveUp}
              onClick={() => onMove(-1)}
              aria-label={tr('ex.moveUp')}
            >
              <ArrowUp size={14} aria-hidden="true" />
            </Button>
            <Button
              type="button"
              sm
              variant="secondary"
              disabled={!canMoveDown}
              onClick={() => onMove(1)}
              aria-label={tr('ex.moveDown')}
            >
              <ArrowDown size={14} aria-hidden="true" />
            </Button>
          </>
        )}
        {confirmRemove ? (
          <span className="flex gap-2 flex-wrap justify-end">
            <Button type="button" sm variant="danger" onClick={onRemove}>
              {tr('ex.confirmRemove')}
            </Button>
            <Button
              type="button"
              sm
              variant="secondary"
              onClick={() => setConfirmRemove(false)}
            >
              {tr('cancel')}
            </Button>
          </span>
        ) : (
          <Button
            type="button"
            sm
            variant="danger"
            onClick={() => {
              if (exercise.sets.length > 0) {
                setConfirmRemove(true)
              } else {
                onRemove()
              }
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>{tr('ex.remove')}</span>
          </Button>
        )}
      </div>
    </div>
  )
}