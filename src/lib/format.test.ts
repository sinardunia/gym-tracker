import { describe, expect, it } from 'vitest'
import { countSets, formatTimer } from './format'
import type { Workout } from './types'

describe('countSets', () => {
  it('sums sets across exercises', () => {
    const workout = {
      id: '1',
      startedAt: '2026-01-01T00:00:00Z',
      finishedAt: null,
      exercises: [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [{ id: 's1', reps: 5, weightKg: 100, type: 'working' }],
        },
        {
          id: 'e2',
          name: 'Bench',
          unit: 'kg',
          sets: [
            { id: 's2', reps: 5, weightKg: 60, type: 'working' },
            { id: 's3', reps: 5, weightKg: 60, type: 'working' },
          ],
        },
      ],
    } as Workout
    expect(countSets(workout)).toBe(3)
  })
})

describe('formatTimer', () => {
  it('formats minutes and seconds', () => {
    expect(formatTimer(0)).toBe('0:00')
    expect(formatTimer(65)).toBe('1:05')
    expect(formatTimer(600)).toBe('10:00')
  })
})