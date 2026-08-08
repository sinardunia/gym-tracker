import { useState, type ChangeEvent } from 'react'
import { useI18n } from '../i18n'
import { parseBackup } from '../lib/data'
import type { BackupMessage, PersistedState } from '../lib/types'

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
    <section className="card backup">
      <h2>{tr('backup.title')}</h2>
      <p className="muted">{tr('backup.desc')}</p>
      <div className="backup-actions">
        <button type="button" className="secondary" onClick={handleExport}>
          {tr('backup.export')}
        </button>
        <label className="file-button">
          {tr('backup.import')}
          <input type="file" accept="application/json,.json" onChange={handleImportFile} />
        </label>
      </div>

      {pendingImport && (
        <div className="import-confirm">
          <p>{tr('backup.importWarning')}</p>
          <div className="backup-actions">
            <button type="button" className="danger" onClick={confirmImport}>
              {tr('backup.confirmImport')}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setPendingImport(null)}
            >
              {tr('cancel')}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={message.kind === 'error' ? 'error' : 'muted'}>
          {message.text}
        </p>
      )}
    </section>
  )
}
