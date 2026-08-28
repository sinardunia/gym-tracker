import { useEffect, useRef, useState } from 'react'
import { Settings } from 'lucide-react'
import { useI18n, type Lang } from '../../i18n'
import { Button, Card, IconButton, Screen } from '../../components/ui'
import { InstallPwaBanner } from '../../components/InstallPwaBanner'
import { ConsistencyWidget } from '../../components/ConsistencyWidget'
import { WeeklySchedule } from '../../components/WeeklySchedule'
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

function resolveRoutineName(workout: Workout, routines: Routine[]): string | null {
  if (!workout.routineId) return null
  const routine = routines.find((r) => r.id === workout.routineId)
  return routine?.name ?? null
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
    <Screen>
      <InstallPwaBanner />

      <header className="mb-1 [&_h1]:mb-1 flex justify-between items-start gap-3">
        <div>
          <h1>Gym Tracker</h1>
          <p className="text-brand-text">{tr('home.tagline')}</p>
        </div>
        <div>
          <IconButton
            type="button"
            ref={settingsBtnRef}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label={tr('home.settings')}
            title={tr('home.settings')}
          >
            <Settings size={18} aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      {activeWorkout && (
        <ActiveWorkoutBanner workout={activeWorkout} onResume={onResumeWorkout} />
      )}

      <ConsistencyWidget stats={consistencyStats} />

      <WeeklySchedule routines={routines} />

      <Card>
        <h2>
          {recommendation.isSequenceMismatch && !isShowingCalendar
            ? tr('home.recommendedNext')
            : tr('home.today')}
        </h2>
        {activePlan ? (
          <>
            <div>
              <h3>{activePlan.day.name}</h3>
              <p className="mt-1 text-brand-text text-sm">{activePlan.routine.name}</p>
            </div>

            {recommendation.isSequenceMismatch && (
              <div className="flex flex-col items-start gap-1.5 my-2.5 mb-3.5 px-3 py-2.5 rounded-[10px] bg-brand-row border border-dashed border-brand-border">
                {isShowingCalendar ? (
                  <>
                    <span className="text-[13px] font-medium text-brand-text">
                      {tr('home.calendarContext', {
                        day: recommendation.calendarScheduled?.day.name ?? '',
                      })}
                    </span>
                    <button
                      type="button"
                      className="bg-none border-none p-0 text-[13px] font-semibold text-brand-accent cursor-pointer underline hover:opacity-85"
                      onClick={() => setOverrideSelection('recommended')}
                    >
                      {tr('home.switchToSequence', {
                        day: recommendation.recommended?.day.name ?? '',
                      })}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] font-medium text-brand-text">
                      {tr('home.calendarContext', {
                        day: recommendation.calendarScheduled?.day.name ?? '',
                      })}
                    </span>
                    <button
                      type="button"
                      className="bg-none border-none p-0 text-[13px] font-semibold text-brand-accent cursor-pointer underline hover:opacity-85"
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
              <p className="text-brand-text">{tr('home.todayNoExercises')}</p>
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col gap-1 max-h-[220px] overflow-y-auto text-sm">
                {activePlan.day.exerciseNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
            {canStart && (
              <>
                <Button
                  type="button"
                  onClick={() =>
                    onStartWithExercises(
                      activePlan.day.exerciseNames,
                      activePlan.routine.id,
                      activePlan.day.id,
                    )
                  }
                >
                  {tr('home.startWorkout')}
                </Button>
                <Button type="button" variant="secondary" onClick={onStart}>
                  {tr('home.startEmpty')}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-brand-text">{tr('home.todayScheduled')}</p>
            {canStart && (
              <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
                <Button
                  type="button"
                  onClick={() => setPickingRoutine(true)}
                >
                  {tr('home.pickRoutine')}
                </Button>
                <Button type="button" variant="secondary" onClick={onStart}>
                  {tr('home.startEmpty')}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {pickingRoutine && (
        <RoutinePicker
          routines={routines}
          onPick={(names) => {
            onStartWithExercises(names)
            setPickingRoutine(false)
          }}
        />
      )}

      <section className="flex flex-col gap-2">
        <h2>{tr('home.recentSessions')}</h2>
        {sessions.length === 0 ? (
          <p className="text-brand-text">{tr('home.noSessions')}</p>
        ) : (
          <>
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {previewSessions.map((session) => {
                const totalSets = countSets(session)
                const primary = sessionLabel(session, routines)
                const routineName = resolveRoutineName(session, routines)
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
                      className="w-full flex justify-between items-center gap-2 text-left text-[15px] bg-brand-card border border-brand-border rounded-[10px] p-3 hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
                      onClick={() => onViewSession(session)}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-brand-heading text-[15px] leading-[1.3]">
                          {primary}
                        </span>
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
            <Button
              sm
              variant="secondary"
              className="mt-2"
              onClick={onOpenHistory}
            >
              {tr('home.viewAllHistory')}
            </Button>
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
          lang={lang}
          onToggleLang={onToggleLang}
        />
      )}
    </Screen>
  )
}