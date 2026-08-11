import { useState } from 'react'
import { useI18n, type Lang } from '../i18n'
import { Icon } from '../components/Icon'
import { BackupControls } from '../components/BackupControls'
import { FeedbackCard } from '../components/FeedbackCard'
import { InstallPwaBanner } from '../components/InstallPwaBanner'
import { GITHUB_URL, SAWERIA_URL } from '../lib/config'
import { getRecommendedWorkout } from '../lib/selectors'
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
  onOpenHistory,
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
  onStartWithExercises: (exerciseNames: string[], routineId?: string, dayId?: string) => void
  onViewSession: (session: Workout) => void
  onOpenHistory: () => void
  backupState: PersistedState
  onImportBackup: (state: PersistedState) => void
  lang: Lang
  onToggleLang: () => void
}) {
  const { tr, p } = useI18n()
  const [pickingRoutine, setPickingRoutine] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const previewSessions = sessions.slice(0, 2)
  const recommendation = getRecommendedWorkout(routines, sessions)
  const [overrideSelection, setOverrideSelection] = useState<'recommended' | 'calendar' | null>(null)

  const activePlan =
    overrideSelection === 'calendar'
      ? recommendation.calendarScheduled
      : overrideSelection === 'recommended'
        ? recommendation.recommended
        : (recommendation.recommended ?? recommendation.calendarScheduled)

  const isShowingCalendar = activePlan && activePlan === recommendation.calendarScheduled
  const canStart = activeWorkout === null

  return (
    <main className="screen">
      <InstallPwaBanner />

      <header className="screen-header header-row">
        <div>
          <h1>Gym Tracker</h1>
          <p className="muted">{tr('home.tagline')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-sm secondary lang-toggle"
            onClick={onToggleLang}
            aria-label={lang === 'id' ? tr('lang.switchToEn') : tr('lang.switchToId')}
          >
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
          <button
            type="button"
            className={`icon-btn${settingsOpen ? ' active' : ''}`}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label={tr('home.settings')}
            title={tr('home.settings')}
          >
            <Icon name="settings" size={18} />
          </button>
        </div>
      </header>

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

      <section className="card today-card">
        <h2>
          {recommendation.isSequenceMismatch && !isShowingCalendar
            ? tr('home.recommendedNext')
            : tr('home.today')}
        </h2>
        {activePlan ? (
          <>
            <div className="plan-header-info">
              <h3>{activePlan.day.name}</h3>
              <p className="muted exercise-summary">{activePlan.routine.name}</p>
            </div>

            {recommendation.isSequenceMismatch && (
              <div className="sequence-mismatch-banner">
                {isShowingCalendar ? (
                  <>
                    <span className="mismatch-tag">
                      {tr('home.calendarContext', {
                        day: recommendation.calendarScheduled?.day.name ?? '',
                      })}
                    </span>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setOverrideSelection('recommended')}
                    >
                      {tr('home.switchToSequence', {
                        day: recommendation.recommended?.day.name ?? '',
                      })}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="mismatch-tag">
                      {tr('home.calendarContext', {
                        day: recommendation.calendarScheduled?.day.name ?? '',
                      })}
                    </span>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setOverrideSelection('calendar')}
                    >
                      {tr('home.switchToCalendar', {
                        day: recommendation.calendarScheduled?.day.name ?? '',
                      })}
                    </button>
                  </>
                )}
              </div>
            )}

            {activePlan.day.exerciseNames.length === 0 ? (
              <p className="muted">{tr('home.todayNoExercises')}</p>
            ) : (
              <ul className="today-exercises">
                {activePlan.day.exerciseNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
            {canStart && (
              <>
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    onStartWithExercises(
                      activePlan.day.exerciseNames,
                      activePlan.routine.id,
                      activePlan.day.id,
                    )
                  }
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

      <section className="recent">
        <h2>{tr('home.recentSessions')}</h2>
        {sessions.length === 0 ? (
          <p className="muted">{tr('home.noSessions')}</p>
        ) : (
          <>
            <ul className="session-list">
              {previewSessions.map((session) => {
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
            <button
              type="button"
              className="btn-sm secondary mt-2"
              onClick={onOpenHistory}
            >
              {tr('home.viewAllHistory')}
            </button>
          </>
        )}
      </section>

      {settingsOpen && (
        <section className="card settings-card">
          <div className="settings-toggle">
            <span>{tr('home.settings')}</span>
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => setSettingsOpen(false)}
            >
              ✕
            </button>
          </div>

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
        </section>
      )}
    </main>
  )
}
