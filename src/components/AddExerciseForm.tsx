import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { findLibraryMatches } from '../lib/selectors'

export function AddExerciseForm({
  onAdd,
}: {
  onAdd: (name: string) => void
}) {
  const { tr } = useI18n()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError(tr('ex.nameRequired'))
      return
    }
    onAdd(trimmed)
    setName('')
    setError(null)
  }

  const query = name.trim().toLowerCase()
  const libraryMatches = findLibraryMatches(query)

  return (
    <form onSubmit={handleSubmit} className="card add-exercise">
      <h3>{tr('addEx.title')}</h3>
      <div className="field">
        <label htmlFor="exercise-name">{tr('addEx.nameLabel')}</label>
        <input
          id="exercise-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder={tr('addEx.namePlaceholder')}
          autoComplete="off"
        />
        {error && <p className="error">{error}</p>}
      </div>

      {query && libraryMatches.length > 0 && (
        <div className="recent-exercises">
          <span className="recent-label">{tr('addEx.library')}</span>
          <ul className="recent-list">
            {libraryMatches.slice(0, 10).map((exercise) => (
              <li key={exercise.name}>
                <button
                  type="button"
                  className="recent-item"
                  onClick={() => {
                    onAdd(exercise.name)
                    setName('')
                    setError(null)
                  }}
                >
                  {exercise.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" className="primary">
        {tr('addEx.add')}
      </button>
    </form>
  )
}
