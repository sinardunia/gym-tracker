import { useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { ConfirmDialog } from './ConfirmDialog'
import { FEEDBACK_KEY, GITHUB_URL } from '../lib/config'
import { newId } from '../lib/data'

type FeedbackEntry = {
  id: string
  date: string
  message: string
}

export function FeedbackCard() {
  const { tr } = useI18n()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const openButtonRef = useRef<HTMLButtonElement | null>(null)

  function submit() {
    const trimmed = message.trim()
    if (!trimmed) return
    try {
      const raw = localStorage.getItem(FEEDBACK_KEY)
      const entries: FeedbackEntry[] = raw ? JSON.parse(raw) : []
      entries.push({ id: newId(), date: new Date().toISOString(), message: trimmed })
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(entries))
    } catch {
      // Storage unavailable; keep in memory.
    }
    setMessage('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <button
        type="button"
        ref={openButtonRef}
        className="secondary"
        onClick={() => setOpen(true)}
      >
        {tr('feedback.send')}
      </button>
      {open && (
        <ConfirmDialog
          title={tr('feedback.title')}
          body={tr('feedback.body')}
          onClose={() => setOpen(false)}
          returnFocusRef={openButtonRef}
          ariaLabel={tr('feedback.title')}
        >
          <textarea
            className="note-field"
            rows={4}
            value={message}
            placeholder={tr('feedback.placeholder')}
            aria-label={tr('feedback.messageLabel')}
            onChange={(e) => setMessage(e.target.value)}
          />
          {saved && <p className="feedback-saved">{tr('feedback.saved')}</p>}
          <div className="confirm-actions">
            <button
              type="button"
              className="positive"
              disabled={!message.trim()}
              onClick={submit}
            >
              {tr('feedback.save')}
            </button>
            <a
              className="file-button"
              href={`${GITHUB_URL}/issues/new`}
              target="_blank"
              rel="noreferrer"
            >
              {tr('feedback.openIssue')}
            </a>
            <button
              type="button"
              className="secondary"
              onClick={() => setOpen(false)}
            >
              {tr('feedback.close')}
            </button>
          </div>
        </ConfirmDialog>
      )}
    </>
  )
}
