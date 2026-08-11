import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { findLibraryMatches } from '../lib/selectors'
import { Icon } from './Icon'

export function AddRoutineExerciseForm({
  onAdd,
  existing,
}: {
  onAdd: (name: string) => void
  existing: string[]
}) {
  const { tr } = useI18n()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError(tr('ex.nameRequired'))
      return
    }
    if (
      existing.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())
    ) {
      setError(tr('routine.duplicate'))
      return
    }
    onAdd(trimmed)
    setName('')
    setError(null)
  }

  function pick(selected: string) {
    if (existing.some((n) => n.trim().toLowerCase() === selected.toLowerCase())) {
      setError(tr('routine.duplicate'))
      return
    }
    onAdd(selected)
    setName('')
    setError(null)
  }

  const query = name.trim().toLowerCase()
  const matches = query ? findLibraryMatches(query).slice(0, 5) : []

  return (
    <div className="add-routine-exercise-wrapper">
      <form onSubmit={handleSubmit} className="add-exercise-day-inline">
        <div className="input-with-suggestions">
          <input
            type="text"
            value={name}
            placeholder={tr('routine.exercisePlaceholder')}
            autoComplete="off"
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
          {focused && matches.length > 0 && (
            <ul className="routine-suggestions-dropdown">
              {matches.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className="suggestion-item"
                    onMouseDown={() => pick(item.name)}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="btn-sm positive flex-shrink-0 inline-add-btn">
          <Icon name="plus" size={14} />
          <span>{tr('addEx.add')}</span>
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
