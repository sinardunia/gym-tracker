export type TimerStatus = 'idle' | 'running' | 'done'

export type TimerSnapshot = {
  duration: number
  endAt: number
}

const REST_TIMER_PREFIX = 'gym-tracker.rest.'

export function timerStorageKey(workoutId: string): string {
  return `${REST_TIMER_PREFIX}${workoutId}`
}

export function loadTimerSnapshot(workoutId: string): TimerSnapshot | null {
  try {
    const raw = sessionStorage.getItem(timerStorageKey(workoutId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const snapshot = parsed as Record<string, unknown>
    if (
      typeof snapshot.duration !== 'number' ||
      !Number.isFinite(snapshot.duration) ||
      typeof snapshot.endAt !== 'number' ||
      !Number.isFinite(snapshot.endAt)
    ) {
      return null
    }
    return { duration: snapshot.duration, endAt: snapshot.endAt }
  } catch {
    return null
  }
}

export function saveTimerSnapshot(workoutId: string, snapshot: TimerSnapshot | null) {
  try {
    if (snapshot) {
      sessionStorage.setItem(timerStorageKey(workoutId), JSON.stringify(snapshot))
    } else {
      sessionStorage.removeItem(timerStorageKey(workoutId))
    }
  } catch {
    // sessionStorage unavailable; timer keeps running in memory.
  }
}

export function clearTimerSnapshots() {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(REST_TIMER_PREFIX)) sessionStorage.removeItem(key)
    }
  } catch {
    // sessionStorage unavailable.
  }
}
