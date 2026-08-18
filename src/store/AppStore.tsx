import { type ReactNode } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'
import { useWorkoutActions } from '../hooks/useWorkoutActions'
import { useRoutineActions } from '../hooks/useRoutineActions'
import { AppProvider } from './AppContext'

export function AppStore({ children }: { children: ReactNode }) {
  const { state, setState } = usePersistedState()
  const workoutActions = useWorkoutActions(state, setState)
  const routineActions = useRoutineActions(state, setState)
  return (
    <AppProvider
      state={state}
      setState={setState}
      workoutActions={workoutActions}
      routineActions={routineActions}
    >
      {children}
    </AppProvider>
  )
}