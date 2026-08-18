import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { parseBackup } from '../lib/backup'
import type { PersistedState } from '../lib/types'

export function useDevSeedData(
  state: PersistedState,
  setState: Dispatch<SetStateAction<PersistedState>>,
) {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (state.sessions.length > 0 || state.routines.length > 0) return
    let cancelled = false
    void fetch('gym-tracker-dummy-backup.json')
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return
        const backup = parseBackup(text)
        if (!backup) return
        setState(backup)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [state.sessions.length, state.routines.length, setState])
}