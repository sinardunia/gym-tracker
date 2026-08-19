import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { Button, Card } from '../components/ui'
import { PROGRAM_GOALS, PROGRAM_TEMPLATES } from '../lib/programs'
import type { ProgramGoal, ProgramTemplate } from '../lib/types'

export function ProgramPickerScreen({
  onBack,
  hideHeader = false,
  onApply,
}: {
  onBack: () => void
  hideHeader?: boolean
  onApply: (template: ProgramTemplate) => void
}) {
  const { tr, p } = useI18n()
  const [goal, setGoal] = useState<ProgramGoal | null>(null)
  const [selected, setSelected] = useState<ProgramTemplate | null>(null)
  const recommended = goal
    ? PROGRAM_TEMPLATES.filter((template) => template.goal === goal)
    : []

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [goal, selected])

  function programExerciseCount(template: ProgramTemplate): number {
    return template.days.reduce(
      (sum, day) => sum + day.exerciseNames.length,
      0,
    )
  }

  function renderProgramCard(template: ProgramTemplate) {
    return (
      <button
        key={template.id}
        type="button"
        className="flex flex-col items-start gap-1.5 text-left px-4 py-3.5 rounded-xl border border-brand-border bg-brand-card text-brand-heading hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
        onClick={() => setSelected(template)}
      >
        <h3>{tr(template.title)}</h3>
        <p className="text-brand-text">{tr(template.description)}</p>
        <p className="text-[13px] text-brand-text">
          {template.days.length} {p(template.days.length, 'count.days')} ·{' '}
          {programExerciseCount(template)}{' '}
          {p(programExerciseCount(template), 'count.exercises')}
        </p>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!hideHeader && (
        <>
          <header className="mb-1 [&_h1]:mb-1">
            <h1>{tr('program.title')}</h1>
            <p className="text-brand-text">{tr('program.desc')}</p>
          </header>

          <Button sm variant="secondary" type="button" onClick={onBack}>
            {tr('program.back')}
          </Button>
        </>
      )}

      {selected ? (
        <Card>
          <h2>{tr(selected.title)}</h2>
          <p className="text-brand-text">{tr(selected.description)}</p>
          <p className="text-[13px] text-brand-text">
            {selected.days.length} {p(selected.days.length, 'count.days')} ·{' '}
            {programExerciseCount(selected)}{' '}
            {p(programExerciseCount(selected), 'count.exercises')}
          </p>
          <h3>{tr('program.days')}</h3>
          <ul className="list-none m-0 p-0 flex flex-col gap-2 max-h-[360px] overflow-y-auto">
            {selected.days.map((day) => (
              <li key={day.name} className="flex flex-col gap-2 p-2.5 bg-brand-row rounded-lg">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <strong>{tr(day.name)}</strong>
                </div>
                {day.exerciseNames.map((name, index) => (
                  <div
                    key={`${day.name}-${index}`}
                    className="flex justify-between items-center gap-2 px-2 py-1.5 bg-brand-bg rounded-md text-sm"
                  >
                    <span>
                      {index + 1}. {name}
                    </span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
          <p className="text-brand-text">{tr('program.applyHint')}</p>
          <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
            <Button type="button" onClick={() => onApply(selected)}>
              {tr('program.apply')}
            </Button>
            <Button variant="secondary" type="button" onClick={() => setSelected(null)}>
              {tr('program.backToList')}
            </Button>
          </div>
        </Card>
      ) : goal === null ? (
        <>
          <h2>{tr('program.chooseGoal')}</h2>
          <p className="text-brand-text">{tr('program.goalHint')}</p>
          <div className="flex flex-col gap-2.5">
            {PROGRAM_GOALS.map((direction) => (
              <button
                key={direction}
                type="button"
                className="flex flex-col items-start gap-1 text-left px-4 py-3.5 rounded-xl border border-brand-border bg-brand-card text-brand-heading hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
                onClick={() => setGoal(direction)}
              >
                <h3>{tr(`program.direction.${direction}`)}</h3>
                <p className="text-brand-text">
                  {tr(`program.direction.${direction}.desc`)}
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
            <Button sm variant="secondary" type="button" onClick={() => setGoal(null)}>
              {tr('program.changeGoal')}
            </Button>
          </div>
          <h2>{tr('program.recommended')}</h2>
          {recommended.map(renderProgramCard)}
          <h2>{tr('program.allPrograms')}</h2>
          {PROGRAM_TEMPLATES.filter(
            (template) => !recommended.includes(template),
          ).map(renderProgramCard)}
        </>
      )}
    </div>
  )
}
