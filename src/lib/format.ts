import { localeOf, type Lang } from '../i18n'
import type { ExerciseUnit, Workout } from './types'

export function countSets(workout: Workout): number {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
}

export function formatSetWeight(
  unit: ExerciseUnit,
  weightKg: number,
  tr: (key: string, vars?: Record<string, string | number>) => string,
): string | null {
  if (unit === 'bodyweight') return null
  if (unit === 'plate') return `${weightKg} ${tr('unit.plates')}`
  return `${weightKg} ${tr('unit.kg')}`
}

export function formatTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(localeOf(lang), {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleString(localeOf(lang), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
