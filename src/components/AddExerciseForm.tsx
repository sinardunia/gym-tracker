import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { findLibraryMatches } from '../lib/selectors'
import { Button, CARD_CLASSES, Input } from './ui'

export function AddExerciseForm({
  onAdd,
  recent = [],
}: {
  onAdd: (name: string) => void
  recent?: string[]
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

  function pick(selected: string) {
    onAdd(selected)
    setName('')
    setError(null)
  }

  const query = name.trim().toLowerCase()
  const libraryMatches = findLibraryMatches(query)
  const userMatches = query
    ? recent.filter((n) => n.toLowerCase().includes(query))
    : []
  const libraryNames = new Set(libraryMatches.map((m) => m.name.toLowerCase()))
  const uniqueUserMatches = userMatches.filter((n) => !libraryNames.has(n.toLowerCase()))

  return (
    <form onSubmit={handleSubmit} className={`${CARD_CLASSES} [&_.field]:mb-1`}>
      <h3>{tr('addEx.title')}</h3>
      <div className="flex flex-col gap-1 [&_label]:text-[13px]">
        <label htmlFor="exercise-name">{tr('addEx.nameLabel')}</label>
        <Input
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
        {error && <p className="text-brand-danger text-sm m-0">{error}</p>}
      </div>

      {query && uniqueUserMatches.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px]">{tr('addEx.yourExercises')}</span>
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {uniqueUserMatches.slice(0, 5).map((exerciseName) => (
              <li key={exerciseName}>
                <button
                  type="button"
                  className="w-full text-left text-[15px] px-3 py-2.5 bg-brand-row border border-brand-border rounded-lg text-brand-heading cursor-pointer hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
                  onClick={() => pick(exerciseName)}
                >
                  {exerciseName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query && libraryMatches.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px]">{tr('addEx.library')}</span>
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {libraryMatches.slice(0, 10).map((exercise) => (
              <li key={exercise.name}>
                <button
                  type="button"
                  className="w-full text-left text-[15px] px-3 py-2.5 bg-brand-row border border-brand-border rounded-lg text-brand-heading cursor-pointer hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
                  onClick={() => pick(exercise.name)}
                >
                  {exercise.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!query && recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px]">{tr('addEx.recent')}</span>
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {recent.map((exerciseName) => (
              <li key={exerciseName}>
                <button
                  type="button"
                  className="w-full text-left text-[15px] px-3 py-2.5 bg-brand-row border border-brand-border rounded-lg text-brand-heading cursor-pointer hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
                  onClick={() => pick(exerciseName)}
                >
                  {exerciseName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit">{tr('addEx.add')}</Button>
    </form>
  )
}
