import { useState } from 'react'
import { useI18n, type Lang } from '../i18n'
import { countSets, formatDateShort, formatTimeShort } from '../lib/format'
import type { Routine, Workout } from '../lib/types'

/** Resolve the day name from a workout's routineId/dayId, or null if not found. */
function resolveDayName(workout: Workout, routines: Routine[]): string | null {
  if (!workout.routineId || !workout.dayId) return null
  const routine = routines.find((r) => r.id === workout.routineId)
  if (!routine) return null
  const day = routine.days.find((d) => d.id === workout.dayId)
  return day?.name ?? null
}

/** Primary display label for a session: day name > exercise names > fallback */
function sessionLabel(workout: Workout, routines: Routine[]): string {
  const dayName = resolveDayName(workout, routines)
  if (dayName) return dayName
  const names = workout.exercises.map((e) => e.name)
  if (names.length === 0) return '—'
  return names.slice(0, 2).join(' · ') + (names.length > 2 ? ` +${names.length - 2}` : '')
}

/** Compact exercise preview line (shown under the primary label when primary is day name) */
function exercisePreview(workout: Workout): string {
  const names = workout.exercises.map((e) => e.name)
  if (names.length === 0) return ''
  return names.slice(0, 3).join(' · ') + (names.length > 3 ? ` +${names.length - 3}` : '')
}

export function HistoryScreen({
  sessions,
  routines,
  onViewSession,
  lang,
}: {
  sessions: Workout[]
  routines: Routine[]
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
              const primary = sessionLabel(session, routines)
              const hasDayName = resolveDayName(session, routines) !== null
              const preview = hasDayName ? exercisePreview(session) : ''
              const dateStr = formatDateShort(session.startedAt, lang)
              const timeStr = formatTimeShort(session.startedAt, lang)

              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="session-item"
                    onClick={() => onViewSession(session)}
                  >
                    <div className="session-item-main">
                      <span className="session-name">{primary}</span>
                      {preview && (
                        <span className="muted session-preview">{preview}</span>
                      )}
                      <span className="session-date-secondary muted">
                        {dateStr} · {timeStr}
                      </span>
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
