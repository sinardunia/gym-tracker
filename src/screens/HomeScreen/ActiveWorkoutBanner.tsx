import { useI18n } from '../../i18n'
import { formatTime } from '../../lib/format'
import type { Workout } from '../../lib/types'

export function ActiveWorkoutBanner({
  workout,
  onResume,
}: {
  workout: Workout
  onResume: () => void
}) {
  const { tr, lang } = useI18n()
  return (
    <div className="active-workout-banner">
      <div className="active-workout-info">
        <span className="pulse-dot" />
        <div>
          <strong>{tr('home.workoutInProgress')}</strong>
          <span className="muted">
            {' · '}
            {tr('home.startedAt', { time: formatTime(workout.startedAt, lang) })}
          </span>
        </div>
      </div>
      <button type="button" className="primary btn-sm" onClick={onResume}>
        {tr('home.resumeWorkout')}
      </button>
    </div>
  )
}