import { supabase, isSupabaseConfigured } from './client'
import type { PersistedState, Workout, Routine } from '../types'
import { isPersistedState } from '../types'

const SYNC_DEBOUNCE_MS = 1200
const LAST_SYNC_KEY = 'gym-tracker.lastSyncAt'
const PENDING_KEY = 'gym-tracker.pendingSync'

type PendingSync = {
  state: PersistedState
  updatedAt: string
}

function getPending(): PendingSync | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingSync
    if (isPersistedState(parsed.state)) return parsed
    return null
  } catch {
    return null
  }
}

function setPending(state: PersistedState) {
  try {
    const pending: PendingSync = { state, updatedAt: new Date().toISOString() }
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    // ignore
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

export function getLastSyncAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY)
  } catch {
    return null
  }
}

function setLastSyncAt(iso: string) {
  try {
    localStorage.setItem(LAST_SYNC_KEY, iso)
  } catch {
    // ignore
  }
}

// Push local state to Supabase (upsert workouts, routines, user_state)
// Offline-first: always succeeds locally, sync is best-effort in background.
export async function pushStateToSupabase(state: PersistedState, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (!navigator.onLine) {
    setPending(state)
    return false
  }

  try {
    // Upsert routines
    if (state.routines.length > 0) {
      const rows = state.routines.map((r: Routine) => ({
        id: r.id,
        user_id: userId,
        name: r.name,
        data: r,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('routines').upsert(rows, { onConflict: 'id' })
      if (error) throw error
    } else {
      // No routines: ensure we don't leave stale? We handle deletions separately
    }

    // Handle routine deletions: fetch remote ids and delete missing
    const { data: remoteRoutines } = await supabase.from('routines').select('id').eq('user_id', userId)
    if (remoteRoutines) {
      const localIds = new Set(state.routines.map((r) => r.id))
      const toDelete = remoteRoutines.filter((r) => !localIds.has(r.id)).map((r) => r.id)
      if (toDelete.length > 0) {
        await supabase.from('routines').delete().in('id', toDelete)
      }
    }

    // Upsert workouts (sessions)
    if (state.sessions.length > 0) {
      const rows = state.sessions.map((w: Workout) => ({
        id: w.id,
        user_id: userId,
        routine_id: w.routineId ?? null,
        day_id: w.dayId ?? null,
        started_at: w.startedAt,
        finished_at: w.finishedAt,
        note: w.note ?? null,
        data: w,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('workouts').upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }

    const { data: remoteWorkouts } = await supabase.from('workouts').select('id').eq('user_id', userId)
    if (remoteWorkouts) {
      const localIds = new Set(state.sessions.map((w) => w.id))
      const toDelete = remoteWorkouts.filter((r) => !localIds.has(r.id)).map((r) => r.id)
      if (toDelete.length > 0) {
        await supabase.from('workouts').delete().in('id', toDelete)
      }
    }

    // Upsert user_state (activeWorkout)
    const { error: stateError } = await supabase.from('user_state').upsert(
      {
        user_id: userId,
        active_workout: state.activeWorkout ?? null,
        saved_at: state.savedAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (stateError) throw stateError

    const now = new Date().toISOString()
    setLastSyncAt(now)
    clearPending()
    return true
  } catch (err) {
    // Keep pending for retry
    setPending(state)
    console.warn('[supabase sync] push failed, queued for retry', err)
    return false
  }
}

// Pull remote state and merge with local (remote wins if newer)
export async function pullStateFromSupabase(userId: string): Promise<PersistedState | null> {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const [{ data: workouts, error: wErr }, { data: routines, error: rErr }, { data: userState, error: sErr }] =
      await Promise.all([
        supabase.from('workouts').select('data, updated_at').eq('user_id', userId).order('started_at', { ascending: false }),
        supabase.from('routines').select('data, updated_at').eq('user_id', userId),
        supabase.from('user_state').select('active_workout, saved_at, updated_at').eq('user_id', userId).maybeSingle(),
      ])
    if (wErr) throw wErr
    if (rErr) throw rErr
    if (sErr) throw sErr

    const sessions: Workout[] = (workouts ?? [])
      .map((row) => row.data as Workout)
      .filter((w) => !!w && typeof w.id === 'string')

    const remoteRoutines: Routine[] = (routines ?? [])
      .map((row) => row.data as Routine)
      .filter((r) => !!r && typeof r.id === 'string')

    const activeWorkout = (userState?.active_workout as Workout | null) ?? null
    const savedAt = (userState?.saved_at as string | undefined) ?? (userState?.updated_at as string | undefined)

    const remoteState: PersistedState = {
      activeWorkout,
      sessions,
      routines: remoteRoutines,
      savedAt,
    }

    if (!isPersistedState(remoteState)) return null

    // Determine most recent savedAt
    const remoteTime = remoteState.savedAt ? Date.parse(remoteState.savedAt) : 0
    void remoteTime // used by caller for merge decision

    const now = new Date().toISOString()
    setLastSyncAt(now)
    return remoteState
  } catch (err) {
    console.warn('[supabase sync] pull failed', err)
    return null
  }
}

// Debounced push hook helper
export function createDebouncedPusher(
  getUserId: () => string | null,
  getState: () => PersistedState,
) {
  let timer: number | null = null

  function schedule() {
    if (!isSupabaseConfigured || !supabase) return
    const userId = getUserId()
    if (!userId) return
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(async () => {
      const state = getState()
      await pushStateToSupabase(state, userId)
    }, SYNC_DEBOUNCE_MS)
  }

  // Flush pending on online event - push latest state, not just pending snapshot
  async function flushPending() {
    const userId = getUserId()
    if (!userId) return
    if (!navigator.onLine) return
    const latest = getState()
    const pending = getPending()
    // If pending is newer than latest, use pending; otherwise use latest
    if (pending) {
      const merged = mergeStates(latest, pending.state)
      await pushStateToSupabase(merged, userId)
    } else {
      await pushStateToSupabase(latest, userId)
    }
  }

  function attachOnlineListener() {
    window.addEventListener('online', flushPending)
    return () => window.removeEventListener('online', flushPending)
  }

  return { schedule, flushPending, attachOnlineListener }
}

export function mergeStates(local: PersistedState, remote: PersistedState): PersistedState {
  // Union merge: combine sessions/routines by id to avoid data loss across devices.
  // For duplicate ids, keep the newer by startedAt/updated cycle (fallback to local).
  const localTime = local.savedAt ? Date.parse(local.savedAt) : 0
  const remoteTime = remote.savedAt ? Date.parse(remote.savedAt) : 0

  const localEmpty = local.sessions.length === 0 && local.routines.length === 0 && !local.activeWorkout
  const remoteEmpty = remote.sessions.length === 0 && remote.routines.length === 0 && !remote.activeWorkout

  if (remoteEmpty && !localEmpty) return local
  if (localEmpty && !remoteEmpty) return remote

  // Union sessions by id
  const sessionMap = new Map<string, Workout>()
  for (const s of remote.sessions) sessionMap.set(s.id, s)
  for (const s of local.sessions) {
    const existing = sessionMap.get(s.id)
    if (!existing) {
      sessionMap.set(s.id, s)
    } else {
      // Prefer newer finishedAt/startedAt if available
      const eTime = existing.finishedAt ? Date.parse(existing.finishedAt) : Date.parse(existing.startedAt)
      const lTime = s.finishedAt ? Date.parse(s.finishedAt) : Date.parse(s.startedAt)
      if (lTime > eTime) sessionMap.set(s.id, s)
    }
  }
  const sessions = [...sessionMap.values()].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  )

  // Union routines by id
  const routineMap = new Map<string, Routine>()
  for (const r of remote.routines) routineMap.set(r.id, r)
  for (const r of local.routines) {
    if (!routineMap.has(r.id)) routineMap.set(r.id, r)
    // if duplicate, keep local (most recent action was local)
  }
  const routines = [...routineMap.values()]

  // activeWorkout: last-write-wins by savedAt, fallback to whichever exists
  let activeWorkout: PersistedState['activeWorkout'] = null
  if (local.activeWorkout && remote.activeWorkout) {
    activeWorkout = remoteTime > localTime ? remote.activeWorkout : local.activeWorkout
  } else {
    activeWorkout = local.activeWorkout ?? remote.activeWorkout ?? null
  }

  const savedAt =
    remoteTime > localTime ? remote.savedAt : local.savedAt ?? remote.savedAt

  return { activeWorkout, sessions, routines, savedAt }
}

export function isEqualState(a: PersistedState, b: PersistedState): boolean {
  // Quick deep equality via JSON (ok for small gym data)
  return JSON.stringify(a) === JSON.stringify(b)
}
