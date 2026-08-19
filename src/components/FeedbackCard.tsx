import { useI18n } from '../i18n'
import { FEEDBACK_EMAIL, GITHUB_URL } from '../lib/config'

export function FeedbackCard() {
  const { tr } = useI18n()
  return (
    <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
      <a
        className="inline-flex items-center justify-center px-4 py-3 border border-brand-border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent [&_input]:hidden"
        href={`mailto:${FEEDBACK_EMAIL}`}
      >
        {tr('feedback.email')}
      </a>
      <a
        className="inline-flex items-center justify-center px-4 py-3 border border-brand-border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent [&_input]:hidden"
        href={`${GITHUB_URL}/issues/new`}
        target="_blank"
        rel="noreferrer"
      >
        {tr('feedback.openIssue')}
      </a>
    </div>
  )
}