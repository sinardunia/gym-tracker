import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadSeenMilestones, saveSeenMilestones } from './milestones'

describe('milestones storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('round-trips a set of ids', () => {
    saveSeenMilestones(new Set(['first-workout', 'sessions-10']))
    expect(loadSeenMilestones()).toEqual(
      new Set(['first-workout', 'sessions-10']),
    )
  })

  it('returns empty set when nothing stored', () => {
    expect(loadSeenMilestones()).toEqual(new Set())
  })

  it('ignores corrupt stored data', () => {
    localStorage.setItem('gym-tracker.milestones-seen', '{not json')
    expect(loadSeenMilestones()).toEqual(new Set())
  })
})