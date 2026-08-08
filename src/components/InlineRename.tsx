import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'

export function InlineRename({
  value,
  onSave,
  onCancel,
}: {
  value: string
  onSave: (name: string) => void
  onCancel: () => void
}) {
  const { tr } = useI18n()
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) {
      setError(tr('nameRequired'))
      return
    }
    onSave(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="rename-form inline-rename">
      <div className="inline-rename-row">
        <input
          type="text"
          value={draft}
          autoFocus
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onCancel()
            }
          }}
        />
        <button type="submit" className="btn-sm primary">
          {tr('save')}
        </button>
        <button type="button" className="btn-sm secondary" onClick={onCancel}>
          {tr('cancel')}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
