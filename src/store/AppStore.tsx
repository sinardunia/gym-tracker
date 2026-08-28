import { type ReactNode } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'
import { useWorkoutActions } from '../hooks/useWorkoutActions'
import { useRoutineActions } from '../hooks/useRoutineActions'
import { AppProvider } from './AppContext'

export function AppStore({ children }: { children: ReactNode }) {
  const { state, setState, isSyncing, lastSyncAt, syncError, forceSync } = usePersistedState()
  const workoutActions = useWorkoutActions(state, setState)
  const routineActions = useRoutineActions(state, setState)
  return (
    <AppProvider
      state={state}
      setState={setState}
      workoutActions={workoutActions}
      routineActions={routineActions}
      isSyncing={isSyncing}
      lastSyncAt={lastSyncAt}
      syncError={syncError}
      forceSync={forceSync}
    >
      {children}
    </AppProvider>
  )
}