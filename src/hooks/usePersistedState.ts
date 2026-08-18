import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { loadAsyncState, loadState, saveState } from '../lib/storage'
import type { PersistedState } from '../lib/types'

export function usePersistedState(): {
  state: PersistedState
  setState: Dispatch<SetStateAction<PersistedState>>
} {
  const [state, setState] = useState<PersistedState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

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

  return { state, setState }
}