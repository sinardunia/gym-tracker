import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { RoutineCard } from '../components/RoutineCard'
import type { Routine, ScheduleConflict, Weekday } from '../lib/types'

export function RoutineEditorScreen({
  routines,
  onBack,
  onAddRoutine,
  onRenameRoutine,
  onDeleteRoutine,
  onAddDay,
  onRenameDay,
  onRemoveDay,
  onMoveDay,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
  onSetSchedule,
}: {
  routines: Routine[]
  onBack: () => void
  onAddRoutine: () => void
  onRenameRoutine: (routineId: string, name: string) => void
  onDeleteRoutine: (routineId: string) => void
  onAddDay: (routineId: string) => void
  onRenameDay: (routineId: string, dayId: string, name: string) => void
  onRemoveDay: (routineId: string, dayId: string) => void
  onMoveDay: (routineId: string, dayId: string, direction: -1 | 1) => void
  onAddExercise: (routineId: string, dayId: string, name: string) => void
  onRemoveExercise: (routineId: string, dayId: string, index: number) => void
  onMoveExercise: (
    routineId: string,
    dayId: string,
    index: number,
    direction: -1 | 1,
  ) => void
  onSetSchedule: (
    routineId: string,
    dayId: string,
    weekday: Weekday | null,
  ) => void
}) {
  const { tr } = useI18n()
  const owners = useMemo(() => {
    const map = new Map<number, ScheduleConflict>()
    for (const routine of routines) {
      for (const [weekday, dayId] of Object.entries(routine.schedule)) {
        const day = routine.days.find((d) => d.id === dayId)
        if (day) {
          map.set(Number(weekday), {
            routineName: routine.name,
            dayName: day.name,
          })
        }
      }
    }
    return map
  }, [routines])

  function getScheduleConflict(
    weekday: Weekday,
    dayId: string,
  ): ScheduleConflict | null {
    for (const routine of routines) {
      if (routine.schedule[weekday] === dayId) return null
    }
    return owners.get(weekday) ?? null
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>{tr('routine.title')}</h1>
        <p className="muted">{tr('routine.desc')}</p>
      </header>

      <button type="button" className="btn-sm secondary" onClick={onBack}>
        {tr('routine.back')}
      </button>

      <button type="button" className="primary" onClick={onAddRoutine}>
        {tr('routine.addRoutine')}
      </button>

      {routines.length === 0 && (
        <p className="muted empty">{tr('routine.noRoutines')}</p>
      )}

      {routines.map((routine) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          onRename={(name) => onRenameRoutine(routine.id, name)}
          onDelete={() => onDeleteRoutine(routine.id)}
          onAddDay={() => onAddDay(routine.id)}
          onRenameDay={(dayId, name) => onRenameDay(routine.id, dayId, name)}
          onRemoveDay={(dayId) => onRemoveDay(routine.id, dayId)}
          onMoveDay={(dayId, direction) => onMoveDay(routine.id, dayId, direction)}
          onAddExercise={(dayId, name) =>
            onAddExercise(routine.id, dayId, name)
          }
          onRemoveExercise={(dayId, index) =>
            onRemoveExercise(routine.id, dayId, index)
          }
          onMoveExercise={(dayId, index, direction) =>
            onMoveExercise(routine.id, dayId, index, direction)
          }
          onSetSchedule={(dayId, weekday) =>
            onSetSchedule(routine.id, dayId, weekday)
          }
          getConflict={getScheduleConflict}
        />
      ))}
    </main>
  )
}
