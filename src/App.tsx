import { useState, type FormEvent } from 'react'
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

const newId = (): string => crypto.randomUUID()

function App() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [summary, setSummary] = useState<Workout | null>(null)

  function startWorkout() {
    setWorkout({
      id: newId(),
      startedAt: new Date().toISOString(),
      finishedAt: null,
      exercises: [],
    })
    setSummary(null)
  }

  function finishWorkout() {
    if (!workout) return
    setSummary({ ...workout, finishedAt: new Date().toISOString() })
    setWorkout(null)
  }

  function addExercise(name: string) {
    setWorkout(
      (w) =>
        w && { ...w, exercises: [...w.exercises, { id: newId(), name, sets: [] }] },
    )
  }

  function addSet(exerciseId: string, reps: number, weightKg: number) {
    setWorkout(
      (w) =>
        w && {
          ...w,
          exercises: w.exercises.map((e) =>
            e.id === exerciseId
              ? { ...e, sets: [...e.sets, { id: newId(), reps, weightKg }] }
              : e,
          ),
        },
    )
  }

  if (summary) {
    return (
      <SummaryScreen
        workout={summary}
        onStartAnother={startWorkout}
      />
    )
  }

  if (workout) {
    return (
      <WorkoutScreen
        workout={workout}
        onAddExercise={addExercise}
        onAddSet={addSet}
        onFinish={finishWorkout}
      />
    )
  }

  return <StartScreen onStart={startWorkout} />
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="screen center">
      <h1>Gym Tracker</h1>
      <p className="muted">Log your workout, one exercise and set at a time.</p>
      <button type="button" className="primary start" onClick={onStart}>
        Start workout
      </button>
    </main>
  )
}

function WorkoutScreen({
  workout,
  onAddExercise,
  onAddSet,
  onFinish,
}: {
  workout: Workout
  onAddExercise: (name: string) => void
  onAddSet: (exerciseId: string, reps: number, weightKg: number) => void
  onFinish: () => void
}) {
  const hasSet = workout.exercises.some((e) => e.sets.length > 0)
  const canFinish = workout.exercises.length > 0 && hasSet

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
    </main>
  )
}

function ExerciseCard({
  exercise,
  onAddSet,
}: {
  exercise: Exercise
  onAddSet: (reps: number, weightKg: number) => void
}) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  return (
    <section className="card exercise">
      <h3>{exercise.name}</h3>
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
}: {
  workout: Workout
  onStartAnother: () => void
}) {
  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  )

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
        {workout.exercises.length} exercises · {totalSets} sets
      </p>

      <button type="button" className="primary" onClick={onStartAnother}>
        Start another workout
      </button>
    </main>
  )
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
