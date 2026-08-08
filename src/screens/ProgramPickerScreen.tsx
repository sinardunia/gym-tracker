import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { PROGRAM_GOALS, PROGRAM_TEMPLATES } from '../lib/data'
import type { ProgramGoal, ProgramTemplate } from '../lib/types'

export function ProgramPickerScreen({
  onBack,
  onApply,
}: {
  onBack: () => void
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
        className="program-card"
        onClick={() => setSelected(template)}
      >
        <h3>{tr(template.title)}</h3>
        <p className="muted">{tr(template.description)}</p>
        <p className="program-meta">
          {template.days.length} {p(template.days.length, 'count.days')} ·{' '}
          {programExerciseCount(template)}{' '}
          {p(programExerciseCount(template), 'count.exercises')}
        </p>
      </button>
    )
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>{tr('program.title')}</h1>
        <p className="muted">{tr('program.desc')}</p>
      </header>

      <button type="button" className="btn-sm secondary" onClick={onBack}>
        {tr('program.back')}
      </button>

      {selected ? (
        <section className="card">
          <h2>{tr(selected.title)}</h2>
          <p className="muted">{tr(selected.description)}</p>
          <p className="program-meta">
            {selected.days.length} {p(selected.days.length, 'count.days')} ·{' '}
            {programExerciseCount(selected)}{' '}
            {p(programExerciseCount(selected), 'count.exercises')}
          </p>
          <h3>{tr('program.days')}</h3>
          <ul className="days program-preview-days">
            {selected.days.map((day) => (
              <li key={day.name} className="day">
                <div className="day-head">
                  <strong>{tr(day.name)}</strong>
                </div>
                {day.exerciseNames.map((name, index) => (
                  <div
                    key={`${day.name}-${index}`}
                    className="exercise-row"
                  >
                    <span>
                      {index + 1}. {name}
                    </span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
          <p className="muted">{tr('program.applyHint')}</p>
          <div className="backup-actions">
            <button
              type="button"
              className="primary"
              onClick={() => onApply(selected)}
            >
              {tr('program.apply')}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setSelected(null)}
            >
              {tr('program.backToList')}
            </button>
          </div>
        </section>
      ) : goal === null ? (
        <>
          <h2>{tr('program.chooseGoal')}</h2>
          <p className="muted">{tr('program.goalHint')}</p>
          <div className="program-goal-list">
            {PROGRAM_GOALS.map((direction) => (
              <button
                key={direction}
                type="button"
                className="program-goal"
                onClick={() => setGoal(direction)}
              >
                <h3>{tr(`program.direction.${direction}`)}</h3>
                <p className="muted">
                  {tr(`program.direction.${direction}.desc`)}
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="backup-actions">
            <button
              type="button"
              className="btn-sm secondary"
              onClick={() => setGoal(null)}
            >
              {tr('program.changeGoal')}
            </button>
          </div>
          <h2>{tr('program.recommended')}</h2>
          {recommended.map(renderProgramCard)}
          <h2>{tr('program.allPrograms')}</h2>
          {PROGRAM_TEMPLATES.filter(
            (template) => !recommended.includes(template),
          ).map(renderProgramCard)}
        </>
      )}
    </main>
  )
}
