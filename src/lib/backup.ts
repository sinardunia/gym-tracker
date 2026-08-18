import {
  isPersistedState,
  normalizeRoutine,
  normalizeWorkout,
  type PersistedState,
} from './types'

export function parseBackup(text: string): PersistedState | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (!isPersistedState(parsed)) return null
    return {
      ...parsed,
      activeWorkout: parsed.activeWorkout
        ? normalizeWorkout(parsed.activeWorkout)
        : null,
      sessions: parsed.sessions.map(normalizeWorkout),
      routines: (parsed.routines ?? []).map(normalizeRoutine),
    }
  } catch {
    return null
  }
}