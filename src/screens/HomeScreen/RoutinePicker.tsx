import { useI18n } from '../../i18n'
import { Card } from '../../components/ui'
import type { Routine } from '../../lib/types'

export function RoutinePicker({
  routines,
  onPick,
}: {
  routines: Routine[]
  onPick: (exerciseNames: string[]) => void
}) {
  const { tr, p } = useI18n()
  return (
    <Card>
      <h3>{tr('home.pickRoutine')}</h3>
      {routines.length === 0 ? (
        <p className="text-brand-text">{tr('home.noRoutines')}</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {routines.map((routine) => (
            <li key={routine.id} className="flex flex-col gap-2 p-2.5 bg-brand-row rounded-lg">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <strong>{routine.name}</strong>
                <span className="text-brand-text">
                  {routine.days.length} {p(routine.days.length, 'count.days')}
                </span>
              </div>
              {routine.days.length === 0 ? (
                <p className="text-brand-text">{tr('home.noDaysInRoutine')}</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {routine.days.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      className="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left text-[15px] bg-transparent border-none text-brand-heading cursor-pointer font-[inherit] w-full px-2 py-2 rounded-md hover:bg-brand-bg"
                      onClick={() => onPick(day.exerciseNames)}
                    >
                      <span>{day.name}</span>
                      <span className="text-brand-text">
                        {day.exerciseNames.length}{' '}
                        {p(day.exerciseNames.length, 'count.exercises')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}