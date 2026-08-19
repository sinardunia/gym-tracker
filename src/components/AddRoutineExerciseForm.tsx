import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '../i18n'
import { findLibraryMatches } from '../lib/selectors'
import { Button, Input } from './ui'

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
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <Input
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
            <ul>
              {matches.map((item) => (
                <li key={item.name}>
                  <button type="button" onMouseDown={() => pick(item.name)}>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" variant="positive" sm className="flex-shrink-0">
          <Plus size={14} aria-hidden="true" />
          <span>{tr('addEx.add')}</span>
        </Button>
      </form>
      {error && <p className="text-brand-danger text-sm m-0">{error}</p>}
    </div>
  )
}
