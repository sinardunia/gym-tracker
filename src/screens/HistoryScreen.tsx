import { useState } from 'react'
import { useI18n, type Lang } from '../i18n'
import { countSets, formatDateShort, formatTimeShort } from '../lib/format'
import { Button } from '../components/ui'
import type { Routine, Workout } from '../lib/types'

/** Resolve the day name from a workout's routineId/dayId, or null if not found. */
function resolveDayName(workout: Workout, routines: Routine[]): string | null {
  if (!workout.routineId || !workout.dayId) return null
  const routine = routines.find((r) => r.id === workout.routineId)
  if (!routine) return null
  const day = routine.days.find((d) => d.id === workout.dayId)
  return day?.name ?? null
}

/** Resolve the routine/program name from a workout's routineId, or null if not found. */
function resolveRoutineName(workout: Workout, routines: Routine[]): string | null {
  if (!workout.routineId) return null
  const routine = routines.find((r) => r.id === workout.routineId)
  return routine?.name ?? null
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
      <header className="mb-1 [&_h1]:mb-1">
        <h1>{tr('nav.history')}</h1>
        <p className="text-brand-text">{tr('home.recentSessions')}</p>
      </header>

      {sessions.length === 0 ? (
        <p className="text-brand-text py-2">{tr('home.noSessions')}</p>
      ) : (
        <>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {visibleSessions.map((session) => {
              const totalSets = countSets(session)
              const primary = sessionLabel(session, routines)
              const routineName = resolveRoutineName(session, routines)
              const hasDayName = resolveDayName(session, routines) !== null
              const preview = hasDayName ? exercisePreview(session) : ''
              const dateStr = formatDateShort(session.startedAt, lang)
              const timeStr = formatTimeShort(session.startedAt, lang)

              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="w-full flex justify-between items-center gap-2 text-left text-[15px] bg-brand-card border border-brand-border rounded-[10px] p-3 hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
                    onClick={() => onViewSession(session)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-brand-heading text-[15px] leading-[1.3]">{primary}</span>
                      {routineName && (
                        <span className="text-brand-accent text-[13px] font-medium">{routineName}</span>
                      )}
                      {preview && (
                        <span className="text-brand-text text-[13px]">{preview}</span>
                      )}
                      <span className="text-xs mt-px text-brand-text">
                        {dateStr} · {timeStr}
                      </span>
                    </div>
                    <span className="text-brand-text text-[13px] whitespace-nowrap shrink-0">
                      {p(session.exercises.length, 'count.exercises')} (
                      {totalSets} set)
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {sessions.length > 15 && !showAll && (
            <Button sm variant="secondary" type="button" onClick={() => setShowAll(true)}>
              {tr('home.showMore')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
