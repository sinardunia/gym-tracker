import { useI18n } from '../i18n'
import { FEEDBACK_EMAIL, GITHUB_URL } from '../lib/config'

export function FeedbackCard() {
  const { tr } = useI18n()
  return (
    <div className="backup-actions">
      <a className="file-button btn-sm secondary" href={`mailto:${FEEDBACK_EMAIL}`}>
        {tr('feedback.email')}
      </a>
      <a
        className="file-button btn-sm secondary"
        href={`${GITHUB_URL}/issues/new`}
        target="_blank"
        rel="noreferrer"
      >
        {tr('feedback.openIssue')}
      </a>
    </div>
  )
}