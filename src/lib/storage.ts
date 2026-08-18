import { get, set } from 'idb-keyval'
import {
  isPersistedState,
  isRoutine,
  isWorkout,
  normalizeRoutine,
  normalizeWorkout,
  type PersistedState,
  type Workout,
} from './types'

export const STORAGE_KEY = 'gym-tracker.state.v2'
export const STORAGE_KEY_V1 = 'gym-tracker.state.v1'

export const EMPTY_STATE: PersistedState = {
  activeWorkout: null,
  sessions: [],
  routines: [],
}

export const newId = (): string => crypto.randomUUID()

export function createWorkout(): Workout {
  return {
    id: newId(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: [],
  }
}

export function loadState(): PersistedState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY_V1)
    if (!raw) return EMPTY_STATE
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_STATE
    const data = parsed as Record<string, unknown>
    const activeWorkout = isWorkout(data.activeWorkout)
      ? normalizeWorkout(data.activeWorkout)
      : null
    const sessions = Array.isArray(data.sessions)
      ? data.sessions.filter(isWorkout).map(normalizeWorkout)
      : []
    const routines = Array.isArray(data.routines)
      ? data.routines.filter(isRoutine).map(normalizeRoutine)
      : []
    return {
      activeWorkout,
      sessions,
      routines,
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : undefined,
    }
  } catch {
    return EMPTY_STATE
  }
}

export function saveState(state: PersistedState) {
  const stamped: PersistedState = {
    ...state,
    savedAt: new Date().toISOString(),
  }
  try {
    void set(STORAGE_KEY, stamped).catch(() => {})
  } catch {
    // Storage unavailable; keep working in memory.
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped))
  } catch {
    // Storage unavailable; keep working in memory.
  }
}

export async function loadAsyncState(): Promise<PersistedState | null> {
  try {
    const idbState = await get<PersistedState>(STORAGE_KEY)
    if (idbState && isPersistedState(idbState)) {
      return {
        activeWorkout: idbState.activeWorkout
          ? normalizeWorkout(idbState.activeWorkout)
          : null,
        sessions: idbState.sessions.map(normalizeWorkout),
        routines: (idbState.routines ?? []).map(normalizeRoutine),
        savedAt:
          typeof idbState.savedAt === 'string' ? idbState.savedAt : undefined,
      }
    }
  } catch {
    // IDB unavailable
  }
  return null
}