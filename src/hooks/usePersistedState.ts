import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { loadAsyncState, loadState, saveState } from '../lib/storage'
import type { PersistedState } from '../lib/types'
import { useAuth } from '../lib/supabase/auth'
import {
  createDebouncedPusher,
  mergeStates,
  pullStateFromSupabase,
  pushStateToSupabase,
} from '../lib/supabase/sync'

export function usePersistedState(): {
  state: PersistedState
  setState: Dispatch<SetStateAction<PersistedState>>
  isSyncing: boolean
  lastSyncAt: string | null
} {
  const [state, setState] = useState<PersistedState>(loadState)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const { user } = useAuth()
  const stateRef = useRef(state)
  stateRef.current = state
  const userId = user?.id ?? null
  const hasPulledRef = useRef<string | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  // Debounced push when state changes and user is authenticated
  const pusherRef = useRef<ReturnType<typeof createDebouncedPusher> | null>(null)
  if (!pusherRef.current) {
    pusherRef.current = createDebouncedPusher(
      () => userId,
      () => stateRef.current,
    )
  }
  // keep userId/stateRef fresh by recreating pusher when user changes? Use effect to update closure
  useEffect(() => {
    pusherRef.current = createDebouncedPusher(
      () => userId,
      () => stateRef.current,
    )
    const cleanup = pusherRef.current.attachOnlineListener()
    return cleanup
  }, [userId])

  useEffect(() => {
    if (!userId) return
    pusherRef.current?.schedule()
    // update lastSyncAt display
    try {
      const v = localStorage.getItem('gym-tracker.lastSyncAt')
      setLastSyncAt(v)
    } catch {
      // ignore
    }
  }, [state, userId])

  // Pull on auth change and merge
  useEffect(() => {
    if (!userId) {
      hasPulledRef.current = null
      return
    }
    if (hasPulledRef.current === userId) return
    hasPulledRef.current = userId
    let cancelled = false
    void (async () => {
      setIsSyncing(true)
      const remote = await pullStateFromSupabase(userId)
      if (cancelled) return
      if (remote) {
        setState((current) => {
          const merged = mergeStates(current, remote)
          // if merged is remote, we need to save it locally immediately
          if (merged !== current) {
            saveState(merged)
          }
          return merged
        })
        try {
          const v = localStorage.getItem('gym-tracker.lastSyncAt')
          setLastSyncAt(v)
        } catch {
          // ignore
        }
      } else {
        // No remote data: push local if not empty (first login migration)
        const isLocalEmpty =
          stateRef.current.sessions.length === 0 &&
          stateRef.current.routines.length === 0 &&
          stateRef.current.activeWorkout === null
        if (!isLocalEmpty) {
          await pushStateToSupabase(stateRef.current, userId)
          try {
            const v = localStorage.getItem('gym-tracker.lastSyncAt')
            setLastSyncAt(v)
          } catch {
            // ignore
          }
        }
      }
      setIsSyncing(false)
      // flush any pending
      pusherRef.current?.flushPending().catch(() => {})
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const idb = await loadAsyncState()
      if (cancelled || !idb) return
      setState((current) => {
        const localSavedAt = current.savedAt ? Date.parse(current.savedAt) : NaN
        const idbSavedAt = idb.savedAt ? Date.parse(idb.savedAt) : NaN
        const idbEmpty =
          idb.sessions.length === 0 &&
          idb.routines.length === 0 &&
          idb.activeWorkout === null
        const localEmpty =
          current.sessions.length === 0 &&
          current.routines.length === 0 &&
          current.activeWorkout === null
        if (!Number.isFinite(idbSavedAt)) return current
        if (idbEmpty && !localEmpty) return current
        if (!Number.isFinite(localSavedAt)) return idb
        if (idbSavedAt > localSavedAt) return idb
        return current
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => {})
  }, [])

  return { state, setState, isSyncing, lastSyncAt }
}