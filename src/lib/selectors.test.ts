import { describe, expect, it } from 'vitest'
import {
  detectNewPRs,
  findPersonalBest,
  groupSetRows,
  suggestDrop,
} from './selectors'
import type { Workout, WorkoutSet } from './types'

function session(id: string, exercises: Workout['exercises']): Workout {
  return {
    id,
    startedAt: '2026-01-01T00:00:00Z',
    finishedAt: '2026-01-01T01:00:00Z',
    exercises,
  }
}

describe('groupSetRows', () => {
  it('groups dropsets under their parent working set', () => {
    const sets: WorkoutSet[] = [
      { id: 'w1', reps: 8, weightKg: 80, type: 'working' },
      { id: 'd1', reps: 6, weightKg: 60, type: 'dropset', parentId: 'w1' },
      { id: 'w2', reps: 8, weightKg: 80, type: 'working' },
    ]
    expect(groupSetRows(sets)).toEqual([
      { set: sets[0], drops: [sets[1]] },
      { set: sets[2], drops: [] },
    ])
  })

  it('orphan dropsets become standalone rows', () => {
    const sets: WorkoutSet[] = [
      { id: 'd1', reps: 6, weightKg: 60, type: 'dropset', parentId: 'missing' },
    ]
    expect(groupSetRows(sets)).toEqual([{ set: sets[0], drops: [] }])
  })
})

describe('suggestDrop', () => {
  it('suggests 85% of the parent weight rounded to 2.5', () => {
    const parent: WorkoutSet = { id: 'w', reps: 8, weightKg: 100, type: 'working' }
    expect(suggestDrop(parent, 'kg')).toBe(85)
  })

  it('suggests one plate lighter for plate unit', () => {
    const parent: WorkoutSet = { id: 'w', reps: 8, weightKg: 4, type: 'working' }
    expect(suggestDrop(parent, 'plate')).toBe(3)
  })

  it('returns null for bodyweight', () => {
    const parent: WorkoutSet = { id: 'w', reps: 8, weightKg: 0, type: 'working' }
    expect(suggestDrop(parent, 'bodyweight')).toBeNull()
  })
})

describe('findPersonalBest', () => {
  it('finds highest weight, tie-break by reps', () => {
    const sessions = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [
            { id: 'a', reps: 5, weightKg: 100, type: 'working' },
            { id: 'b', reps: 3, weightKg: 110, type: 'working' },
          ],
        },
      ]),
    ]
    expect(findPersonalBest(sessions, 'Squat', 'kg')).toEqual({
      weightKg: 110,
      reps: 3,
    })
  })

  it('ignores warmup and dropset sets', () => {
    const sessions = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [
            { id: 'a', reps: 10, weightKg: 60, type: 'warmup' },
            { id: 'b', reps: 8, weightKg: 120, type: 'dropset', parentId: 'x' },
            { id: 'c', reps: 5, weightKg: 100, type: 'working' },
          ],
        },
      ]),
    ]
    expect(findPersonalBest(sessions, 'Squat', 'kg')).toEqual({
      weightKg: 100,
      reps: 5,
    })
  })

  it('is case-insensitive on exercise name', () => {
    const sessions = [
      session('s1', [
        {
          id: 'e1',
          name: 'squat',
          unit: 'kg',
          sets: [{ id: 'a', reps: 5, weightKg: 100, type: 'working' }],
        },
      ]),
    ]
    expect(findPersonalBest(sessions, 'Squat', 'kg')).toEqual({
      weightKg: 100,
      reps: 5,
    })
  })
})

describe('detectNewPRs', () => {
  it('flags a heavier best as a new PR', () => {
    const prior = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [{ id: 'a', reps: 5, weightKg: 100, type: 'working' }],
        },
      ]),
    ]
    const finished = session('s2', [
      {
        id: 'e1',
        name: 'Squat',
        unit: 'kg',
        sets: [{ id: 'b', reps: 5, weightKg: 105, type: 'working' }],
      },
    ])
    const prs = detectNewPRs(prior, finished)
    expect(prs).toHaveLength(1)
    expect(prs[0]).toMatchObject({
      exerciseName: 'Squat',
      newBest: { weightKg: 105, reps: 5 },
    })
  })

  it('does not flag an equal or lighter weight', () => {
    const prior = [
      session('s1', [
        {
          id: 'e1',
          name: 'Squat',
          unit: 'kg',
          sets: [{ id: 'a', reps: 5, weightKg: 100, type: 'working' }],
        },
      ]),
    ]
    const finished = session('s2', [
      {
        id: 'e1',
        name: 'Squat',
        unit: 'kg',
        sets: [{ id: 'b', reps: 5, weightKg: 100, type: 'working' }],
      },
    ])
    expect(detectNewPRs(prior, finished)).toHaveLength(0)
  })
})