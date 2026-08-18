import { useState } from 'react'
import { Icon } from '../Icon'
import { useI18n } from '../../i18n'
import type { Exercise, ExerciseUnit } from '../../lib/types'

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
        <button type="button" className="btn-sm secondary" onClick={onRename}>
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
            <button type="button" className="btn-sm danger" onClick={onRemove}>
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
  )
}