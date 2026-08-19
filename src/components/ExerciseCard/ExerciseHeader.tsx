import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react'
import { useI18n } from '../../i18n'
import { IconButton } from '../ui'
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
    <div className="flex items-start gap-2">
      {!collapsed && (
        <IconButton
          type="button"
          className={`${showOptionsMenu ? ' active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleOptionsMenu()
          }}
          aria-label={tr('ex.options')}
          title={tr('ex.options')}
        >
          <MoreVertical size={18} aria-hidden="true" />
        </IconButton>
      )}
      <div
        className="flex-1 min-w-0"
        onClick={!isActiveExercise && onSelectActive ? onSelectActive : undefined}
        style={{ cursor: !isActiveExercise ? 'pointer' : 'default' }}
      >
        <h3>{exercise.name}</h3>
        <p className="mt-1 text-brand-text text-sm">
          {setCount} {p(setCount, 'count.sets')} · {lastSetSummary}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center shrink-0 w-11 h-11 p-0 mt-0.5 border-none rounded-lg bg-transparent text-brand-text cursor-pointer hover:bg-brand-row hover:text-brand-heading focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
        onClick={(e) => {
          e.stopPropagation()
          onToggleCollapsed()
        }}
        aria-label={collapsed ? tr('ex.expand') : tr('ex.collapse')}
      >
        {collapsed ? (
          <ChevronDown size={18} aria-hidden="true" />
        ) : (
          <ChevronUp size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}