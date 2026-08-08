import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'

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

  return (
    <form onSubmit={handleSubmit} className="add-exercise-day">
      <input
        type="text"
        value={name}
        placeholder={tr('routine.exercisePlaceholder')}
        autoComplete="off"
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
      />
      <button type="submit" className="btn-sm primary">
        {tr('addEx.add')}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
