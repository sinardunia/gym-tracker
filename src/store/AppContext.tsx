/* eslint-disable react/only-export-components */
import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { PersistedState } from '../lib/types'
import type { useWorkoutActions } from '../hooks/useWorkoutActions'
import type { useRoutineActions } from '../hooks/useRoutineActions'

export type WorkoutActions = ReturnType<typeof useWorkoutActions>
export type RoutineActions = ReturnType<typeof useRoutineActions>

export type AppContextValue = {
  state: PersistedState
  setState: Dispatch<SetStateAction<PersistedState>>
  workoutActions: WorkoutActions
  routineActions: RoutineActions
  isSyncing: boolean
  lastSyncAt: string | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  state,
  setState,
  workoutActions,
  routineActions,
  isSyncing,
  lastSyncAt,
  children,
}: AppContextValue & { children: ReactNode }) {
  return (
    <AppContext.Provider
      value={{ state, setState, workoutActions, routineActions, isSyncing, lastSyncAt }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}