import { useState, type ChangeEvent } from 'react'
import { useI18n } from '../i18n'
import { parseBackup } from '../lib/backup'
import type { BackupMessage, PersistedState } from '../lib/types'
import { Button, Card } from './ui'

export function BackupControls({
  state,
  onImport,
}: {
  state: PersistedState
  onImport: (state: PersistedState) => void
}) {
  const { tr } = useI18n()
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null)
  const [message, setMessage] = useState<BackupMessage | null>(null)

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'info', text: tr('backup.exported') })
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const backup = parseBackup(await file.text())
    if (!backup) {
      setPendingImport(null)
      setMessage({
        kind: 'error',
        text: tr('backup.invalid'),
      })
      return
    }

    setPendingImport(backup)
    setMessage(null)
  }

  function confirmImport() {
    if (!pendingImport) return
    onImport(pendingImport)
    setPendingImport(null)
    setMessage({ kind: 'info', text: tr('backup.imported') })
  }

  return (
    <Card>
      <h2>{tr('backup.title')}</h2>
      <p className="text-brand-text">{tr('backup.desc')}</p>
      <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
        <Button type="button" variant="secondary" onClick={handleExport}>
          {tr('backup.export')}
        </Button>
        <label className="inline-flex items-center justify-center px-4 py-3 border border-brand-border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent [&_input]:hidden">
          {tr('backup.import')}
          <input type="file" accept="application/json,.json" onChange={handleImportFile} />
        </label>
      </div>

      {pendingImport && (
        <div className="flex flex-col gap-2 p-3 rounded-[10px] bg-brand-row">
          <p>{tr('backup.importWarning')}</p>
          <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
            <Button type="button" variant="danger" onClick={confirmImport}>
              {tr('backup.confirmImport')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingImport(null)}
            >
              {tr('cancel')}
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p className={message.kind === 'error' ? 'text-brand-danger text-sm m-0' : 'text-brand-text'}>
          {message.text}
        </p>
      )}
    </Card>
  )
}