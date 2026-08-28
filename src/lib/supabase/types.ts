export type DbWorkout = {
  id: string
  user_id: string
  routine_id: string | null
  day_id: string | null
  started_at: string
  finished_at: string | null
  note: string | null
  data: unknown // full Workout JSON for flexible offline-first sync
  created_at: string
  updated_at: string
}

export type DbRoutine = {
  id: string
  user_id: string
  name: string
  data: unknown // full Routine JSON
  created_at: string
  updated_at: string
}

export type SupabasePersistedState = {
  activeWorkout: unknown | null
  sessions: unknown[]
  routines: unknown[]
  savedAt?: string
}
