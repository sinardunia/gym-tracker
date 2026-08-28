import { useState } from 'react'
import { useI18n } from '../i18n'
import { SetList } from '../components/SetList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Button, Card, Screen } from '../components/ui'
import { countSets, formatDate, formatSetWeight } from '../lib/format'
import { analyzeWorkout, computeConsistency } from '../lib/selectors'
import type { PRDetection, Workout } from '../lib/types'

export function SummaryScreen({
  workout,
  onStartAnother,
  onBack,
  onEdit,
  onDelete,
  newPRs,
  sessions,
}: {
  workout: Workout
  onStartAnother: () => void
  onBack: () => void
  onEdit: (session: Workout) => void
  onDelete: (sessionId: string) => void
  newPRs: PRDetection[]
  sessions: Workout[]
}) {
  const { tr, p, lang } = useI18n()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const consistencyStats = computeConsistency(sessions)
  const analysis = analyzeWorkout(workout, lang)
  return (
    <Screen>
      <header className="mb-1 [&_h1]:mb-1">
        <h1>{tr('summary.title')}</h1>
        <p className="text-brand-text">{formatDate(workout.startedAt, lang)}</p>
      </header>

      <div
        className="flex justify-between items-center gap-3 px-3.5 py-2.5 bg-brand-accent-bg border border-brand-accent rounded-[10px] text-brand-heading"
        style={{ background: 'var(--positive-bg)', borderColor: 'var(--positive)' }}
      >
        <div className="flex items-center gap-2.5 [&_strong]:text-brand-heading">
          <span
            className="w-2.5 h-2.5 rounded-full bg-brand-accent shadow-[0_0_0_0_rgba(124,58,237,0.7)] animate-[pulse-ring_1.8s_infinite]"
            style={{ background: 'var(--positive)', boxShadow: 'none' }}
          />
          <strong style={{ color: 'var(--positive)' }}>{tr('summary.savedNotice')}</strong>
        </div>
      </div>

      {analysis.suggestions.length > 0 && (
        <div className="bg-brand-row border border-brand-border rounded-[10px] px-3.5 py-3 flex flex-col gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-wider text-brand-accent">
            {tr('summary.analysisTitle')}
          </span>
          <span className="text-[13px] text-brand-text">{tr('summary.analysisDuration', { n: analysis.durationMinutes })}</span>
          {analysis.suggestions.map((s, i) => (
            <span key={i} className="text-[13px] text-brand-text">• {s}</span>
          ))}
        </div>
      )}

      {newPRs.length > 0 && (
        <div className="bg-brand-positive-bg border border-brand-positive rounded-[10px] px-3.5 py-3 flex flex-col gap-2">
          <span className="text-[13px] font-bold uppercase tracking-wider text-brand-positive">
            {tr('summary.prTitle')}
          </span>
          {newPRs.slice(0, 3).map((pr) => {
            const isBodyweight = pr.unit === 'bodyweight'
            const newWeightText = isBodyweight ? null : formatSetWeight(pr.unit, pr.newBest.weightKg, tr)
            const prevWeightText =
              pr.previousBest && !isBodyweight
                ? formatSetWeight(pr.unit, pr.previousBest.weightKg, tr)
                : null

            const mainLine = isBodyweight
              ? tr('summary.prBodyweight', { exercise: pr.exerciseName, reps: pr.newBest.reps })
              : tr('summary.prLine', {
                  exercise: pr.exerciseName,
                  weight: newWeightText ?? '',
                  reps: pr.newBest.reps,
                })

            const prevLine = pr.previousBest === null
              ? tr('summary.prLineFirst')
              : isBodyweight
                ? tr('summary.prBodyweightPrev', { reps: pr.previousBest.reps })
                : tr('summary.prLinePrev', {
                    weight: prevWeightText ?? '',
                    reps: pr.previousBest.reps,
                  })

            return (
              <div key={pr.exerciseName} className="flex flex-col gap-px">
                <span className="text-[15px] font-semibold text-brand-heading">{mainLine}</span>
                <span className="text-[13px] text-brand-text">{prevLine}</span>
              </div>
            )
          })}
        </div>
      )}

      {workout.note && (
        <p className="m-0 px-2.5 py-2 border-l-[3px] border-l-brand-accent bg-brand-row rounded-r-md text-sm text-brand-text whitespace-pre-wrap break-words">
          {workout.note}
        </p>
      )}

      {workout.exercises.map((exercise) => (
        <Card key={exercise.id}>
          <h3>{exercise.name}</h3>
          {exercise.note && (
            <p className="m-0 px-2.5 py-2 border-l-[3px] border-l-brand-accent bg-brand-row rounded-r-md text-sm text-brand-text whitespace-pre-wrap break-words">
              {exercise.note}
            </p>
          )}
          <SetList sets={exercise.sets} unit={exercise.unit} />
        </Card>
      ))}

      {(() => {
        const { currentWeekStreak, totalSessions } = consistencyStats
        if (totalSessions === 1) {
          return <p className="text-center text-sm italic text-brand-text py-1">{tr('summary.identityLine1')}</p>
        }
        if (currentWeekStreak >= 2) {
          return (
            <p className="text-center text-sm italic text-brand-text py-1">
              {tr('summary.identityLine', { n: currentWeekStreak })}
            </p>
          )
        }
        if (totalSessions >= 2) {
          return (
            <p className="text-center text-sm italic text-brand-text py-1">
              {tr('summary.identityLineSessions', { n: totalSessions })}
            </p>
          )
        }
        return null
      })()}

      <p className="text-center my-1 font-semibold">
        {p(workout.exercises.length, 'count.exercises')} ·{' '}
        {p(countSets(workout), 'count.sets')}
      </p>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={onStartAnother}>
          {tr('summary.startAnother')}
        </Button>
        <Button type="button" variant="secondary" onClick={onBack}>
          {tr('summary.back')}
        </Button>

        <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
          <Button sm type="button" variant="secondary" className="flex-1" onClick={() => onEdit(workout)}>
            {tr('summary.edit')}
          </Button>
          <Button
            sm
            type="button"
            variant="danger"
            className="flex-1"
            onClick={() => setConfirmingDelete(true)}
          >
            {tr('summary.delete')}
          </Button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={tr('summary.deleteTitle')}
          body={tr('summary.deleteBody')}
          onClose={() => setConfirmingDelete(false)}
        >
          <div className="flex gap-2 flex-wrap [&_button]:flex-1">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setConfirmingDelete(false)
                onDelete(workout.id)
              }}
            >
              {tr('summary.confirmDelete')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              {tr('cancel')}
            </Button>
          </div>
        </ConfirmDialog>
      )}
    </Screen>
  )
}
