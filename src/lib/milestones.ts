export const MILESTONES_KEY = 'gym-tracker.milestones-seen'

/**
 * Loads the set of milestone IDs that have been dismissed/seen by the user.
 * Returns an empty Set on first run or if storage is unavailable.
 */
export function loadSeenMilestones(): Set<string> {
  try {
    const raw = localStorage.getItem(MILESTONES_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

/**
 * Persists the set of seen milestone IDs to localStorage.
 */
export function saveSeenMilestones(seen: Set<string>): void {
  try {
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(Array.from(seen)))
  } catch {
    // Storage unavailable — silently ignore.
  }
}