import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'

describe('parseBackup', () => {
  it('returns null for invalid JSON', () => {
    expect(parseBackup('not json')).toBeNull()
  })

  it('returns null for wrong shape', () => {
    expect(parseBackup(JSON.stringify({ foo: 1 }))).toBeNull()
  })

  it('parses a valid backup and normalizes it', () => {
    const backup = JSON.stringify({
      activeWorkout: null,
      sessions: [],
      routines: [
        {
          id: 'r1',
          name: 'Push',
          days: [{ id: 'd1', name: 'Day A', exerciseNames: ['Bench Press'] }],
        },
      ],
      savedAt: '2026-01-01T00:00:00Z',
    })
    const result = parseBackup(backup)
    expect(result).not.toBeNull()
    expect(result?.routines[0]?.name).toBe('Push')
    expect(result?.routines[0]?.schedule).toEqual({})
  })

  it('rejects sessions with invalid sets', () => {
    const backup = JSON.stringify({
      activeWorkout: null,
      sessions: [
        {
          id: 's1',
          startedAt: '2026-01-01T00:00:00Z',
          finishedAt: null,
          exercises: [
            {
              id: 'e1',
              name: 'Squat',
              sets: [{ id: 'x', reps: 'five', weightKg: 100, type: 'working' }],
            },
          ],
        },
      ],
      routines: [],
    })
    expect(parseBackup(backup)).toBeNull()
  })
})