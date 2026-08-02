import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type WorkoutSet = {
  id: string
  reps: number
  weightKg: number
}

type Exercise = {
  id: string
  name: string
  sets: WorkoutSet[]
}

type Workout = {
  id: string
  startedAt: string
  finishedAt: string | null
  exercises: Exercise[]
}

type PersistedState = {
  activeWorkout: Workout | null
  sessions: Workout[]
}

const STORAGE_KEY = 'gym-tracker.state.v1'

const EMPTY_STATE: PersistedState = { activeWorkout: null, sessions: [] }

const newId = (): string => crypto.randomUUID()

function createWorkout(): Workout {
  return {
    id: newId(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: [],
  }
}

function isWorkout(value: unknown): value is Workout {
  if (typeof value !== 'object' || value === null) return false
  const workout = value as Record<string, unknown>
  if (typeof workout.id !== 'string' || typeof workout.startedAt !== 'string') {
    return false
  }
  if (
    workout.finishedAt !== null &&
    typeof workout.finishedAt !== 'string'
  ) {
    return false
  }
  if (!Array.isArray(workout.exercises)) return false
  return workout.exercises.every((exercise) => {
    if (typeof exercise !== 'object' || exercise === null) return false
    const entry = exercise as Record<string, unknown>
    if (typeof entry.id !== 'string' || typeof entry.name !== 'string') {
      return false
    }
    if (!Array.isArray(entry.sets)) return false
    return entry.sets.every((set) => {
      if (typeof set !== 'object' || set === null) return false
      const setEntry = set as Record<string, unknown>
      return (
        typeof setEntry.id === 'string' &&
        typeof setEntry.reps === 'number' &&
        typeof setEntry.weightKg === 'number'
      )
    })
  })
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_STATE
    const data = parsed as Record<string, unknown>
    const activeWorkout = isWorkout(data.activeWorkout)
      ? data.activeWorkout
      : null
    const sessions = Array.isArray(data.sessions)
      ? data.sessions.filter(isWorkout)
      : []
    return { activeWorkout, sessions }
  } catch {
    return EMPTY_STATE
  }
}

function App() {
  const [state, setState] = useState<PersistedState>(loadState)
  const [viewedSession, setViewedSession] = useState<Workout | null>(null)

  const activeWorkout = state.activeWorkout

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage unavailable; keep working in memory.
    }
  }, [state])

  function startWorkout() {
    setState((s) => ({ ...s, activeWorkout: createWorkout() }))
    setViewedSession(null)
  }

  function finishWorkout() {
    if (!activeWorkout) return
    const finished: Workout = {
      ...activeWorkout,
      finishedAt: new Date().toISOString(),
    }
    setState((s) => ({
      activeWorkout: null,
      sessions: [finished, ...s.sessions],
    }))
    setViewedSession(finished)
  }

  function addExercise(name: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: [
                ...s.activeWorkout.exercises,
                { id: newId(), name, sets: [] },
              ],
            },
          }
        : s,
    )
  }

  function addSet(exerciseId: string, reps: number, weightKg: number) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId
                  ? { ...e, sets: [...e.sets, { id: newId(), reps, weightKg }] }
                  : e,
              ),
            },
          }
        : s,
    )
  }

  function removeSet(exerciseId: string, setId: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId
                  ? { ...e, sets: e.sets.filter((set) => set.id !== setId) }
                  : e,
              ),
            },
          }
        : s,
    )
  }

  function removeExercise(exerciseId: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.filter(
                (e) => e.id !== exerciseId,
              ),
            },
          }
        : s,
    )
  }

  function renameExercise(exerciseId: string, name: string) {
    setState((s) =>
      s.activeWorkout
        ? {
            ...s,
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) =>
                e.id === exerciseId ? { ...e, name } : e,
              ),
            },
          }
        : s,
    )
  }

  function discardWorkout() {
    setState((s) => ({ ...s, activeWorkout: null }))
    setViewedSession(null)
  }

  if (activeWorkout) {
    return (
      <WorkoutScreen
        workout={activeWorkout}
        onAddExercise={addExercise}
        onAddSet={addSet}
        onRemoveSet={removeSet}
        onRemoveExercise={removeExercise}
        onRenameExercise={renameExercise}
        onDiscard={discardWorkout}
        onFinish={finishWorkout}
      />
    )
  }

  if (viewedSession) {
    return (
      <SummaryScreen
        workout={viewedSession}
        onStartAnother={startWorkout}
        onBack={() => setViewedSession(null)}
      />
    )
  }

  return (
    <HomeScreen
      sessions={state.sessions}
      onStart={startWorkout}
      onViewSession={setViewedSession}
    />
  )
}

function HomeScreen({
  sessions,
  onStart,
  onViewSession,
}: {
  sessions: Workout[]
  onStart: () => void
  onViewSession: (session: Workout) => void
}) {
  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Gym Tracker</h1>
        <p className="muted">Log your workout, one exercise and set at a time.</p>
      </header>

      <button type="button" className="primary start" onClick={onStart}>
        Start workout
      </button>

      <section className="recent">
        <h2>Recent sessions</h2>
        {sessions.length === 0 ? (
          <p className="muted">No completed sessions yet.</p>
        ) : (
          <ul className="session-list">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className="session-item"
                  onClick={() => onViewSession(session)}
                >
                  <span>{formatDate(session.startedAt)}</span>
                  <span className="muted">
                    {session.exercises.length} exercises ·{' '}
                    {countSets(session)} sets
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function WorkoutScreen({
  workout,
  onAddExercise,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onRenameExercise,
  onDiscard,
  onFinish,
}: {
  workout: Workout
  onAddExercise: (name: string) => void
  onAddSet: (exerciseId: string, reps: number, weightKg: number) => void
  onRemoveSet: (exerciseId: string, setId: string) => void
  onRemoveExercise: (exerciseId: string) => void
  onRenameExercise: (exerciseId: string, name: string) => void
  onDiscard: () => void
  onFinish: () => void
}) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const hasSet = workout.exercises.some((e) => e.sets.length > 0)
  const canFinish = workout.exercises.length > 0 && hasSet

  useEffect(() => {
    if (!confirmingDiscard) return
    const timer = setTimeout(() => setConfirmingDiscard(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmingDiscard])

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Workout</h1>
        <p className="muted">Started at {formatTime(workout.startedAt)}</p>
      </header>

      {workout.exercises.length === 0 ? (
        <p className="muted empty">No exercises yet. Add your first one below.</p>
      ) : (
        workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onAddSet={(reps, weightKg) => onAddSet(exercise.id, reps, weightKg)}
            onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
            onRemove={() => onRemoveExercise(exercise.id)}
            onRename={(name) => onRenameExercise(exercise.id, name)}
          />
        ))
      )}

      <AddExerciseForm onAdd={onAddExercise} />

      <button
        type="button"
        className="primary finish"
        onClick={onFinish}
        disabled={!canFinish}
      >
        Finish workout
      </button>
      {!canFinish && (
        <p className="error hint">
          Add at least one exercise with a set to finish the workout.
        </p>
      )}

      <div className="discard">
        {confirmingDiscard ? (
          <>
            <button type="button" className="danger" onClick={onDiscard}>
              Confirm discard
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirmingDiscard(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="danger"
            onClick={() => setConfirmingDiscard(true)}
          >
            Discard workout
          </button>
        )}
      </div>
    </main>
  )
}

function ExerciseCard({
  exercise,
  onAddSet,
  onRemoveSet,
  onRemove,
  onRename,
}: {
  exercise: Exercise
  onAddSet: (reps: number, weightKg: number) => void
  onRemoveSet: (setId: string) => void
  onRemove: () => void
  onRename: (name: string) => void
}) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const repsValue = Number(reps)
    const weightValue = Number(weight)
    if (!Number.isInteger(repsValue) || repsValue < 1) {
      setError('Reps must be a whole number of at least 1.')
      return
    }
    if (!Number.isFinite(weightValue) || weightValue < 0) {
      setError('Weight must be 0 or a positive number.')
      return
    }
    onAddSet(repsValue, weightValue)
    setReps('')
    setWeight('')
    setError(null)
  }

  function startRename() {
    setNameDraft(exercise.name)
    setNameError(null)
    setEditingName(true)
  }

  function handleRenameSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameError('Exercise name is required.')
      return
    }
    onRename(trimmed)
    setEditingName(false)
    setNameError(null)
  }

  return (
    <section className="card exercise">
      <div className="exercise-head">
        <h3>{exercise.name}</h3>
        <div className="exercise-actions">
          <button type="button" className="btn-sm secondary" onClick={startRename}>
            Rename
          </button>
          <button type="button" className="btn-sm danger" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      {editingName && (
        <form onSubmit={handleRenameSubmit} className="rename-form">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => {
              setNameDraft(e.target.value)
              setNameError(null)
            }}
            autoFocus
          />
          <div className="rename-actions">
            <button type="submit" className="btn-sm secondary">
              Save
            </button>
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => setEditingName(false)}
            >
              Cancel
            </button>
          </div>
          {nameError && <p className="error">{nameError}</p>}
        </form>
      )}

      {exercise.sets.length === 0 ? (
        <p className="muted">No sets yet.</p>
      ) : (
        <ul className="sets">
          {exercise.sets.map((set, index) => (
            <li key={set.id}>
              <span>Set {index + 1}</span>
              <span>
                {set.reps} reps · {set.weightKg} kg
              </span>
              <button
                type="button"
                className="btn-sm secondary"
                onClick={() => onRemoveSet(set.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="set-form">
        <div className="field">
          <label htmlFor={`reps-${exercise.id}`}>Reps</label>
          <input
            id={`reps-${exercise.id}`}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={reps}
            onChange={(e) => {
              setReps(e.target.value)
              setError(null)
            }}
            placeholder="10"
          />
        </div>
        <div className="field">
          <label htmlFor={`weight-${exercise.id}`}>Weight (kg)</label>
          <input
            id={`weight-${exercise.id}`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value)
              setError(null)
            }}
            placeholder="60"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary">
          Add set
        </button>
      </form>
    </section>
  )
}

function AddExerciseForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Exercise name is required.')
      return
    }
    onAdd(trimmed)
    setName('')
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="card add-exercise">
      <h3>Add exercise</h3>
      <div className="field">
        <label htmlFor="exercise-name">Exercise name</label>
        <input
          id="exercise-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder="e.g. Bench Press"
        />
        {error && <p className="error">{error}</p>}
      </div>
      <button type="submit" className="primary">
        Add exercise
      </button>
    </form>
  )
}

function SummaryScreen({
  workout,
  onStartAnother,
  onBack,
}: {
  workout: Workout
  onStartAnother: () => void
  onBack: () => void
}) {
  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Workout complete</h1>
        <p className="muted">{formatDate(workout.startedAt)}</p>
      </header>

      {workout.exercises.map((exercise) => (
        <section key={exercise.id} className="card">
          <h3>{exercise.name}</h3>
          <ul className="sets">
            {exercise.sets.map((set, index) => (
              <li key={set.id}>
                <span>Set {index + 1}</span>
                <span>
                  {set.reps} reps · {set.weightKg} kg
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="summary-count">
        {workout.exercises.length} exercises · {countSets(workout)} sets
      </p>

      <button type="button" className="primary" onClick={onStartAnother}>
        Start another workout
      </button>
      <button type="button" className="secondary" onClick={onBack}>
        Back
      </button>
    </main>
  )
}

function countSets(workout: Workout): number {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default App
