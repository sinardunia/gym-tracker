import { useI18n } from '../../i18n'
import { formatTime } from '../../lib/format'
import { Button } from '../../components/ui'
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
    <div className="flex justify-between items-center gap-3 px-3.5 py-2.5 bg-brand-accent-bg border border-brand-accent rounded-[10px] text-brand-heading">
      <div className="flex items-center gap-2.5 [&_strong]:text-brand-heading">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-accent shadow-[0_0_0_0_rgba(124,58,237,0.7)] animate-[pulse-ring_1.8s_infinite]" />
        <div>
          <strong>{tr('home.workoutInProgress')}</strong>
          <span className="text-brand-text">
            {' · '}
            {tr('home.startedAt', { time: formatTime(workout.startedAt, lang) })}
          </span>
        </div>
      </div>
      <Button sm onClick={onResume}>
        {tr('home.resumeWorkout')}
      </Button>
    </div>
  )
}