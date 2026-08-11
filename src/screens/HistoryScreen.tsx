import { useState } from 'react'
import { useI18n, type Lang } from '../i18n'
import { countSets, formatDate } from '../lib/format'
import type { Workout } from '../lib/types'

export function HistoryScreen({
  sessions,
  onViewSession,
  lang,
}: {
  sessions: Workout[]
  onViewSession: (session: Workout) => void
  lang: Lang
}) {
  const { tr, p } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const visibleSessions = showAll ? sessions : sessions.slice(0, 15)

  return (
    <div className="flex flex-col gap-4">
      <header className="screen-header">
        <h1>{tr('nav.history')}</h1>
        <p className="muted">{tr('home.recentSessions')}</p>
      </header>

      {sessions.length === 0 ? (
        <p className="muted empty">{tr('home.noSessions')}</p>
      ) : (
        <>
          <ul className="session-list">
            {visibleSessions.map((session) => {
              const totalSets = countSets(session)
              const exNames = session.exercises.map((e) => e.name)
              const previewText =
                exNames.length > 0
                  ? exNames.slice(0, 2).join(', ') +
                    (exNames.length > 2 ? ` +${exNames.length - 2}` : '')
                  : ''

              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="session-item"
                    onClick={() => onViewSession(session)}
                  >
                    <div className="session-item-main">
                      <span className="session-date">
                        {formatDate(session.startedAt, lang)}
                      </span>
                      {previewText && (
                        <span className="muted session-preview">
                          {previewText}
                        </span>
                      )}
                    </div>
                    <span className="muted session-meta">
                      {p(session.exercises.length, 'count.exercises')} (
                      {totalSets} set)
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {sessions.length > 15 && !showAll && (
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => setShowAll(true)}
            >
              {tr('home.showMore')}
            </button>
          )}
        </>
      )}
    </div>
  )
}
