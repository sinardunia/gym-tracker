import { type Dispatch, type SetStateAction } from 'react'
import { useI18n } from '../i18n'
import { newId } from '../lib/storage'
import type {
  PersistedState,
  ProgramTemplate,
  Routine,
  Weekday,
} from '../lib/types'

export function useRoutineActions(
  _state: PersistedState,
  setState: Dispatch<SetStateAction<PersistedState>>,
) {
  const { tr } = useI18n()

  function addRoutine() {
    setState((s) => ({
      ...s,
      routines: [
        ...s.routines,
        { id: newId(), name: tr('routine.newName'), days: [], schedule: {} },
      ],
    }))
  }

  function applyTemplate(template: ProgramTemplate) {
    const days = template.days.map((day) => ({
      id: day.id ?? newId(),
      name: tr(day.name),
      exerciseNames: [...day.exerciseNames],
    }))
    const schedule: Partial<Record<Weekday, string>> = {}
    for (const [weekday, dayId] of Object.entries(template.schedule ?? {})) {
      const day = days.find((d) => d.id === dayId)
      if (day) schedule[Number(weekday) as Weekday] = day.id
    }
    const routine: Routine = {
      id: newId(),
      name: tr(template.title),
      days,
      schedule,
    }
    setState((s) => ({
      ...s,
      routines: [routine, ...s.routines],
    }))
  }

  function renameRoutine(routineId: string, name: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId ? { ...r, name } : r,
      ),
    }))
  }

  function deleteRoutine(routineId: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.filter((r) => r.id !== routineId),
    }))
  }

  function addDay(routineId: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: [
                ...r.days,
                {
                  id: newId(),
                  name: tr('routine.newDayName'),
                  exerciseNames: [],
                },
              ],
            }
          : r,
      ),
    }))
  }

  function renameDay(routineId: string, dayId: string, name: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) => (d.id === dayId ? { ...d, name } : d)),
            }
          : r,
      ),
    }))
  }

  function removeDay(routineId: string, dayId: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => {
        if (r.id !== routineId) return r
        const schedule: Partial<Record<Weekday, string>> = {}
        for (const [weekday, id] of Object.entries(r.schedule)) {
          if (id !== dayId) schedule[Number(weekday) as Weekday] = id
        }
        return {
          ...r,
          days: r.days.filter((d) => d.id !== dayId),
          schedule,
        }
      }),
    }))
  }

  function setDaySchedule(
    routineId: string,
    dayId: string,
    weekday: Weekday | null,
  ) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => {
        if (r.id !== routineId) return r
        if (weekday === null) {
          const schedule: Partial<Record<Weekday, string>> = {}
          for (const [w, id] of Object.entries(r.schedule)) {
            if (id !== dayId) schedule[Number(w) as Weekday] = id
          }
          return { ...r, schedule }
        }
        return { ...r, schedule: { ...r.schedule, [weekday]: dayId } }
      }),
    }))
  }

  function moveDay(routineId: string, dayId: string, direction: -1 | 1) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) => {
        if (r.id !== routineId) return r
        const index = r.days.findIndex((d) => d.id === dayId)
        const target = index + direction
        if (index < 0 || target < 0 || target >= r.days.length) return r
        const days = [...r.days]
        const [moved] = days.splice(index, 1)
        days.splice(target, 0, moved)
        return { ...r, days }
      }),
    }))
  }

  function addExerciseToDay(routineId: string, dayId: string, name: string) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) =>
                d.id === dayId
                  ? { ...d, exerciseNames: [...d.exerciseNames, name] }
                  : d,
              ),
            }
          : r,
      ),
    }))
  }

  function removeExerciseFromDay(
    routineId: string,
    dayId: string,
    index: number,
  ) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      exerciseNames: d.exerciseNames.filter(
                        (_, i) => i !== index,
                      ),
                    }
                  : d,
              ),
            }
          : r,
      ),
    }))
  }

  function moveExerciseInDay(
    routineId: string,
    dayId: string,
    index: number,
    direction: -1 | 1,
  ) {
    setState((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              days: r.days.map((d) => {
                if (d.id !== dayId) return d
                const target = index + direction
                if (target < 0 || target >= d.exerciseNames.length) return d
                const names = [...d.exerciseNames]
                const [moved] = names.splice(index, 1)
                names.splice(target, 0, moved)
                return { ...d, exerciseNames: names }
              }),
            }
          : r,
      ),
    }))
  }

  return {
    addRoutine,
    applyTemplate,
    renameRoutine,
    deleteRoutine,
    addDay,
    renameDay,
    removeDay,
    setDaySchedule,
    moveDay,
    addExerciseToDay,
    removeExerciseFromDay,
    moveExerciseInDay,
  }
}