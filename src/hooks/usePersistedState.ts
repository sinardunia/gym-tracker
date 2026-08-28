import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { loadAsyncState, loadState, saveState } from '../lib/storage'
import type { PersistedState } from '../lib/types'
import { useAuth } from '../lib/supabase/auth'
import { supabase } from '../lib/supabase/client'
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
  forceSync: () => Promise<{ pulled: number; pushed: number; error?: string }>
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

  // Pull on auth change and merge - ensures cross-device history sync (with retry for session race)
  useEffect(() => {
    if (!userId) {
      hasPulledRef.current = null
      return
    }
    let cancelled = false
    let attempts = 0
    async function doPull() {
      // Prevent duplicate pulls unless forced, but allow retry if previous pull was empty and local is empty (new device)
      if (hasPulledRef.current === userId && attempts === 0) {
        // Already pulled once, but allow one retry if we detected session not ready
        const { data: sess } = await supabase!.auth.getSession()
        if (sess.session) return
      }
      if (hasPulledRef.current === userId && attempts > 0) return
      hasPulledRef.current = userId
      attempts += 1
      setIsSyncing(true)
      // Small delay to let supabase client hydrate session from storage (PKCE)
      await new Promise((r) => setTimeout(r, 300))
      const remote = await pullStateFromSupabase(userId!)
      if (cancelled) return
      if (remote) {
        const local = stateRef.current
        const remoteHasData = remote.sessions.length > 0 || remote.routines.length > 0 || !!remote.activeWorkout
        const localHasData = local.sessions.length > 0 || local.routines.length > 0 || !!local.activeWorkout
        // If pull returned empty but we expected data (new device with same account), retry once after 1.5s
        if (!remoteHasData && !localHasData) {
          // Both empty - first login, nothing to do but ensure we don't block future pulls
          // Allow retry on next focus
          hasPulledRef.current = null
        }
        const merged = mergeStates(local, remote)
        const needsPush =
          merged.sessions.length !== remote.sessions.length ||
          merged.routines.length !== remote.routines.length ||
          JSON.stringify(merged.activeWorkout) !== JSON.stringify(remote.activeWorkout) ||
          local.sessions.length > remote.sessions.length ||
          local.routines.length > remote.routines.length

        setState((current) => {
          const freshMerged = mergeStates(current, remote)
          if (JSON.stringify(freshMerged) !== JSON.stringify(current)) {
            saveState(freshMerged)
            return freshMerged
          }
          return current
        })
        if (needsPush) {
          await pushStateToSupabase(merged, userId!)
        }
        try {
          const v = localStorage.getItem('gym-tracker.lastSyncAt')
          setLastSyncAt(v)
        } catch {
          // ignore
        }
      } else {
        // Pull returned null (error or no session) - retry once, else push local if not empty
        if (attempts < 2) {
          console.log('[sync] pull null, retrying in 1s...')
          setTimeout(() => void doPull(), 1000)
          return
        }
        const isLocalEmpty =
          stateRef.current.sessions.length === 0 &&
          stateRef.current.routines.length === 0 &&
          stateRef.current.activeWorkout === null
        if (!isLocalEmpty) {
          await pushStateToSupabase(stateRef.current, userId!)
          try {
            const v = localStorage.getItem('gym-tracker.lastSyncAt')
            setLastSyncAt(v)
          } catch {
            // ignore
          }
        } else {
          // New device with no local data and pull failed - allow retry on next focus
          hasPulledRef.current = null
        }
      }
      setIsSyncing(false)
      pusherRef.current?.flushPending().catch(() => {})
    }
    void doPull()
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

  // Re-pull when tab becomes visible or comes back online (cross-device sync)
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function refetch() {
      if (cancelled) return
      if (document.visibilityState !== 'visible' && !navigator.onLine) return
      setIsSyncing(true)
      const remote = await pullStateFromSupabase(userId!)
      if (cancelled || !remote) {
        setIsSyncing(false)
        return
      }
      setState((current) => {
        const merged = mergeStates(current, remote)
        if (JSON.stringify(merged) !== JSON.stringify(current)) {
          saveState(merged)
          return merged
        }
        return current
      })
      setIsSyncing(false)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refetch()
    }
    const onOnline = () => void refetch()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    // Also pull on focus (covers browser switch PC/mobile)
    window.addEventListener('focus', onOnline)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('focus', onOnline)
    }
  }, [userId])

  async function forceSync(): Promise<{ pulled: number; pushed: number; error?: string }> {
    if (!userId) return { pulled: 0, pushed: 0, error: 'Not signed in' }
    if (!navigator.onLine) return { pulled: 0, pushed: 0, error: 'Offline' }
    setIsSyncing(true)
    try {
      // First push local (ensures anonymous history created before login is uploaded)
      const localBefore = stateRef.current
      const pushedOk = await pushStateToSupabase(localBefore, userId)
      // Then pull remote and merge (union)
      const remote = await pullStateFromSupabase(userId)
      if (remote) {
        setState((current) => {
          const merged = mergeStates(current, remote)
          if (JSON.stringify(merged) !== JSON.stringify(current)) {
            saveState(merged)
            return merged
          }
          return current
        })
        // If pull got more than local had, push union back (covers edge)
        const merged = mergeStates(localBefore, remote)
        if (merged.sessions.length > remote.sessions.length || merged.routines.length > remote.routines.length) {
          await pushStateToSupabase(merged, userId)
        }
        try {
          const v = localStorage.getItem('gym-tracker.lastSyncAt')
          setLastSyncAt(v)
        } catch {
          // ignore
        }
        setIsSyncing(false)
        return { pulled: remote.sessions.length, pushed: localBefore.sessions.length, error: pushedOk ? undefined : 'Push failed, check console' }
      }
      setIsSyncing(false)
      return { pulled: 0, pushed: localBefore.sessions.length, error: pushedOk ? undefined : 'Pull returned null' }
    } catch (e) {
      setIsSyncing(false)
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[forceSync] error', e)
      return { pulled: 0, pushed: 0, error: msg }
    }
  }

  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => {})
  }, [])

  return { state, setState, isSyncing, lastSyncAt, forceSync }
}