import { useEffect, useRef, useState } from 'react'
import { useI18n, type Lang } from '../../i18n'
import { Icon } from '../../components/Icon'
import { InstallPwaBanner } from '../../components/InstallPwaBanner'
import { ConsistencyWidget } from '../../components/ConsistencyWidget'
import { ActiveWorkoutBanner } from './ActiveWorkoutBanner'
import { RoutinePicker } from './RoutinePicker'
import { SettingsModal } from './SettingsModal'
import { getRecommendedWorkout } from '../../lib/selectors'
import {
  countSets,
  formatDateShort,
  formatTimeShort,
} from '../../lib/format'
import { type Theme } from '../../lib/theme'
import type {
  ConsistencyStats,
  PersistedState,
  Routine,
  Workout,
} from '../../lib/types'

function resolveDayName(workout: Workout, routines: Routine[]): string | null {
  if (!workout.routineId || !workout.dayId) return null
  const routine = routines.find((r) => r.id === workout.routineId)
  if (!routine) return null
  const day = routine.days.find((d) => d.id === workout.dayId)
  return day?.name ?? null
}

function sessionLabel(workout: Workout, routines: Routine[]): string {
  const dayName = resolveDayName(workout, routines)
  if (dayName) return dayName
  const names = workout.exercises.map((e) => e.name)
  if (names.length === 0) return '—'
  return names.slice(0, 2).join(' · ') + (names.length > 2 ? ` +${names.length - 2}` : '')
}

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
  theme,
  onSetTheme,
  consistencyStats,
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
  theme: Theme
  onSetTheme: (theme: Theme) => void
  consistencyStats: ConsistencyStats
}) {
  const { tr, p } = useI18n()
  const [pickingRoutine, setPickingRoutine] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsBtnRef = useRef<HTMLButtonElement | null>(null)
  const previewSessions = sessions.slice(0, 2)
  const recommendation = getRecommendedWorkout(routines, sessions)
  const [overrideSelection, setOverrideSelection] = useState<
    'recommended' | 'calendar' | null
  >(null)

  useEffect(() => {
    if (!settingsOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [settingsOpen])

  const activePlan =
    overrideSelection === 'calendar'
      ? recommendation.calendarScheduled
      : overrideSelection === 'recommended'
        ? recommendation.recommended
        : (recommendation.recommended ?? recommendation.calendarScheduled)

  const isShowingCalendar =
    activePlan && activePlan === recommendation.calendarScheduled
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
            aria-label={
              lang === 'id' ? tr('lang.switchToEn') : tr('lang.switchToId')
            }
          >
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
          <button
            type="button"
            ref={settingsBtnRef}
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
        <ActiveWorkoutBanner workout={activeWorkout} onResume={onResumeWorkout} />
      )}

      <ConsistencyWidget stats={consistencyStats} />

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
        <RoutinePicker
          routines={routines}
          onPick={(names) => {
            onStartWithExercises(names)
            setPickingRoutine(false)
          }}
        />
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
                const primary = sessionLabel(session, routines)
                const hasDayName = resolveDayName(session, routines) !== null
                const exNames = session.exercises.map((e) => e.name)
                const preview = hasDayName
                  ? exNames.slice(0, 3).join(' · ') +
                    (exNames.length > 3 ? ` +${exNames.length - 3}` : '')
                  : ''
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
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          returnFocusRef={settingsBtnRef}
          theme={theme}
          onSetTheme={onSetTheme}
          backupState={backupState}
          onImportBackup={onImportBackup}
        />
      )}
    </main>
  )
}