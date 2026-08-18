import { useI18n } from '../../i18n'
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
    <section className="card">
      <h3>{tr('home.pickRoutine')}</h3>
      {routines.length === 0 ? (
        <p className="muted">{tr('home.noRoutines')}</p>
      ) : (
        <ul className="days">
          {routines.map((routine) => (
            <li key={routine.id} className="day">
              <div className="day-head">
                <strong>{routine.name}</strong>
                <span className="muted">
                  {routine.days.length} {p(routine.days.length, 'count.days')}
                </span>
              </div>
              {routine.days.length === 0 ? (
                <p className="muted">{tr('home.noDaysInRoutine')}</p>
              ) : (
                <div className="day-body">
                  {routine.days.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      className="day-toggle pick-day"
                      onClick={() => onPick(day.exerciseNames)}
                    >
                      <span>{day.name}</span>
                      <span className="muted">
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
    </section>
  )
}