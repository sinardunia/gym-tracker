import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { Button, Input } from './ui'

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2 items-center flex-wrap [&_input]:flex-1 [&_input]:min-w-0">
        <Input
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
        <Button sm type="submit">
          {tr('save')}
        </Button>
        <Button sm type="button" variant="secondary" onClick={onCancel}>
          {tr('cancel')}
        </Button>
      </div>
      {error && <p className="text-brand-danger text-sm m-0">{error}</p>}
    </form>
  )
}