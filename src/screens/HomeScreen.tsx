import { useState } from 'react'
import { useI18n, type Lang } from '../i18n'
import { BackupControls } from '../components/BackupControls'
import { FeedbackCard } from '../components/FeedbackCard'
import { GITHUB_URL, SAWERIA_URL } from '../lib/config'
import { findNextScheduledWorkout, findTodayWorkout } from '../lib/selectors'
import { countSets, formatDate, formatTime } from '../lib/format'
import type { PersistedState, Routine, Workout } from '../lib/types'

export function HomeScreen({
  sessions,
  routines,
  activeWorkout,
  onResumeWorkout,
  onStart,
  onStartWithExercises,
  onViewSession,
  onOpenRoutines,
  onOpenPrograms,
  onOpenProgress,
  backupState,
  onImportBackup,
  lang,
  onToggleLang,
}: {
  sessions: Workout[]
  routines: Routine[]
  activeWorkout: Workout | null
  onResumeWorkout: () => void
  onStart: () => void
  onStartWithExercises: (exerciseNames: string[]) => void
  onViewSession: (session: Workout) => void
  onOpenRoutines: () => void
  onOpenPrograms: () => void
  onOpenProgress: () => void
  backupState: PersistedState
  onImportBackup: (state: PersistedState) => void
  lang: Lang
  onToggleLang: () => void
}) {
  const { tr, p } = useI18n()
  const [pickingRoutine, setPickingRoutine] = useState(false)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const visibleSessions = showAllSessions ? sessions : sessions.slice(0, 10)
  const today = findTodayWorkout(routines)
  const nextScheduled = today ? null : findNextScheduledWorkout(routines)
  const plan = today ?? nextScheduled
  const canStart = activeWorkout === null

  return (
    <main className="screen">
      {activeWorkout && (
        <div className="active-workout-banner">
          <div className="active-workout-info">
            <span className="pulse-dot" />
            <div>
              <strong>{tr('home.workoutInProgress')}</strong>
              <span className="muted">
                {' · '}{tr('home.startedAt', { time: formatTime(activeWorkout.startedAt, lang) })}
              </span>
            </div>
          </div>
          <button type="button" className="primary btn-sm" onClick={onResumeWorkout}>
            {tr('home.resumeWorkout')}
          </button>
        </div>
      )}

      <header className="screen-header header-row">
        <div>
          <h1>Gym Tracker</h1>
          <p className="muted">{tr('home.tagline')}</p>
        </div>
        <button
          type="button"
          className="btn-sm secondary lang-toggle"
          onClick={onToggleLang}
          aria-label={lang === 'id' ? tr('lang.switchToEn') : tr('lang.switchToId')}
        >
          {lang === 'id' ? 'EN' : 'ID'}
        </button>
      </header>

      <section className="card today-card">
        <h2>
          {today
            ? tr('home.today')
            : nextScheduled
              ? tr('home.nextWorkout', {
                  day: tr(`weekday.${nextScheduled.weekday}`),
                })
              : tr('home.today')}
        </h2>
        {plan ? (
          <>
            <h3>{plan.day.name}</h3>
            <p className="muted exercise-summary">{plan.routine.name}</p>
            {plan.day.exerciseNames.length === 0 ? (
              <p className="muted">{tr('home.todayNoExercises')}</p>
            ) : (
              <ul className="today-exercises">
                {plan.day.exerciseNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
            {canStart && (
              <>
                <button
                  type="button"
                  className="primary"
                  onClick={() => onStartWithExercises(plan.day.exerciseNames)}
                >
                  {tr('home.startWorkout')}
                </button>
                <button type="button" className="secondary" onClick={onStart}>
                  {tr('home.startEmpty')}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="muted">{tr('home.todayScheduled')}</p>
            {canStart && (
              <div className="backup-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() => setPickingRoutine(true)}
                >
                  {tr('home.pickRoutine')}
                </button>
                <button type="button" className="secondary" onClick={onStart}>
                  {tr('home.startEmpty')}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {pickingRoutine && (
        <section className="card">
          <h3>{tr('home.pickRoutine')}</h3>
          {routines.length === 0 ? (
            <p className="muted">{tr('home.noRoutines')}</p>
          ) : (
            <ul className="days">
              {routines.map((routine) => (
                <li key={routine.id} className="day">
                  <div className="day-head">
                    <strong>{routine.name}</strong>
                    <span className="muted">
                      {routine.days.length} {p(routine.days.length, 'count.days')}
                    </span>
                  </div>
                  {routine.days.length === 0 ? (
                    <p className="muted">{tr('home.noDaysInRoutine')}</p>
                  ) : (
                    <div className="day-body">
                      {routine.days.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          className="day-toggle pick-day"
                          onClick={() => {
                            onStartWithExercises(day.exerciseNames)
                            setPickingRoutine(false)
                          }}
                        >
                          <span>{day.name}</span>
                          <span className="muted">
                            {day.exerciseNames.length}{' '}
                            {p(day.exerciseNames.length, 'count.exercises')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="backup-actions">
        <button
          type="button"
          className="secondary"
          onClick={onOpenPrograms}
        >
          {tr('home.chooseProgram')}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onOpenRoutines}
        >
          {tr('home.routines')}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onOpenProgress}
        >
          {tr('home.progress')}
        </button>
      </div>

      <section className="recent">
        <h2>{tr('home.recentSessions')}</h2>
        {sessions.length === 0 ? (
          <p className="muted">{tr('home.noSessions')}</p>
        ) : (
          <>
            <ul className="session-list">
              {visibleSessions.map((session) => {
                const totalSets = countSets(session)
                const exNames = session.exercises.map((e) => e.name)
                const previewText = exNames.length > 0
                  ? exNames.slice(0, 2).join(', ') + (exNames.length > 2 ? ` +${exNames.length - 2}` : '')
                  : ''

                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      className="session-item"
                      onClick={() => onViewSession(session)}
                    >
                      <div className="session-item-main">
                        <span className="session-date">{formatDate(session.startedAt, lang)}</span>
                        {previewText && <span className="muted session-preview">{previewText}</span>}
                      </div>
                      <span className="muted session-meta">
                        {p(session.exercises.length, 'count.exercises')} ({totalSets} set)
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {sessions.length > 10 && !showAllSessions && (
              <button
                type="button"
                className="btn-sm secondary"
                onClick={() => setShowAllSessions(true)}
              >
                {tr('home.showMore')}
              </button>
            )}
          </>
        )}
      </section>

      <section className="card settings-card">
        <button
          type="button"
          className="settings-toggle"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <span>Pengaturan & Cadangan Data</span>
          <span className="muted">{settingsOpen ? '▲' : '▼'}</span>
        </button>

        {settingsOpen && (
          <div className="settings-content">
            <BackupControls state={backupState} onImport={onImportBackup} />

            <section className="about-sub">
              <h3>{tr('about.title')}</h3>
              <p className="muted">
                {tr('about.desc', { version: __APP_VERSION__ })}
              </p>
              <div className="backup-actions">
                <a
                  className="file-button btn-sm secondary"
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tr('about.github')}
                </a>
                <a
                  className="file-button btn-sm secondary"
                  href={SAWERIA_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tr('about.support')}
                </a>
              </div>
              <FeedbackCard />
            </section>
          </div>
        )}
      </section>
    </main>
  )
}
