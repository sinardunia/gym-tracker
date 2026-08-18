import { Icon } from '../Icon'
import { useI18n } from '../../i18n'
import type { Exercise } from '../../lib/types'

export function ExerciseHeader({
  exercise,
  collapsed,
  isActiveExercise,
  showOptionsMenu,
  onToggleOptionsMenu,
  onSelectActive,
  onToggleCollapsed,
}: {
  exercise: Exercise
  collapsed: boolean
  isActiveExercise: boolean
  showOptionsMenu: boolean
  onToggleOptionsMenu: () => void
  onSelectActive?: () => void
  onToggleCollapsed: () => void
}) {
  const { tr, p } = useI18n()
  const setCount = exercise.sets.length
  const lastSetSummary =
    setCount > 0 ? tr('ex.lastSet', { count: setCount }) : tr('ex.noSets')

  return (
    <div className="exercise-head">
      {!collapsed && (
        <button
          type="button"
          className={`icon-btn${showOptionsMenu ? ' active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleOptionsMenu()
          }}
          aria-label={tr('ex.options')}
          title={tr('ex.options')}
        >
          <Icon name="more" size={18} />
        </button>
      )}
      <div
        className="exercise-title"
        onClick={!isActiveExercise && onSelectActive ? onSelectActive : undefined}
        style={{ cursor: !isActiveExercise ? 'pointer' : 'default' }}
      >
        <h3>{exercise.name}</h3>
        <p className="exercise-summary">
          {setCount} {p(setCount, 'count.sets')} · {lastSetSummary}
        </p>
      </div>
      <button
        type="button"
        className="collapse-toggle"
        onClick={(e) => {
          e.stopPropagation()
          onToggleCollapsed()
        }}
        aria-label={collapsed ? tr('ex.expand') : tr('ex.collapse')}
      >
        <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} />
      </button>
    </div>
  )
}