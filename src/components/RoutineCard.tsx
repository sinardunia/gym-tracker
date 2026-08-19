import { useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { InlineRename } from './InlineRename'
import { AddRoutineExerciseForm } from './AddRoutineExerciseForm'
import { DayScheduleSelect } from './DayScheduleSelect'
import type { Routine, ScheduleConflict, Weekday } from '../lib/types'

function DropdownMenu({
  items,
  ariaLabel,
}: {
  items: { label: string; onClick: () => void; variant?: 'danger' }[]
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <Icon name="more" size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-brand-card border border-brand-border rounded-lg shadow-lg py-1">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm font-[inherit] cursor-pointer hover:bg-brand-row ${
                  item.variant === 'danger'
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-brand-heading'
                }`}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function RoutineCard({
  routine,
  onRename,
  onDelete,
  onAddDay,
  onRenameDay,
  onRemoveDay,
  onMoveDay,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
  onSetSchedule,
  getConflict,
}: {
  routine: Routine
  onRename: (name: string) => void
  onDelete: () => void
  onAddDay: () => void
  onRenameDay: (dayId: string, name: string) => void
  onRemoveDay: (dayId: string) => void
  onMoveDay: (dayId: string, direction: -1 | 1) => void
  onAddExercise: (dayId: string, name: string) => void
  onRemoveExercise: (dayId: string, index: number) => void
  onMoveExercise: (dayId: string, index: number, direction: -1 | 1) => void
  onSetSchedule: (dayId: string, weekday: Weekday | null) => void
  getConflict: (weekday: Weekday, dayId: string) => ScheduleConflict | null
}) {
  const { tr, p } = useI18n()
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renamingDayId, setRenamingDayId] = useState<string | null>(null)
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null)

  function toggleDay(dayId: string) {
    setExpandedDayId((cur) => (cur === dayId ? null : dayId))
  }

  return (
    <section className="card routine transition-shadow duration-200 hover:shadow-md">
      <div className="routine-head">
        {renaming ? (
          <InlineRename
            value={routine.name}
            onSave={(name) => {
              onRename(name)
              setRenaming(false)
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <div className="routine-title min-w-0 flex-1">
              <h3 className="text-lg">{routine.name}</h3>
              <p className="muted exercise-summary">
                {routine.days.length} {p(routine.days.length, 'routine.day')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {confirmDelete ? (
                <span className="inline-confirm">
                  <button
                    type="button"
                    className="btn-sm danger"
                    onClick={onDelete}
                  >
                    {tr('routine.confirm')}
                  </button>
                  <button
                    type="button"
                    className="btn-sm secondary"
                    onClick={() => setConfirmDelete(false)}
                  >
                    {tr('cancel')}
                  </button>
                </span>
              ) : (
                <DropdownMenu
                  ariaLabel={tr('routine.options')}
                  items={[
                    { label: tr('routine.rename'), onClick: () => setRenaming(true) },
                    { label: tr('routine.delete'), onClick: () => setConfirmDelete(true), variant: 'danger' },
                  ]}
                />
              )}
            </div>
          </>
        )}
      </div>

      {routine.days.length === 0 && (
        <p className="muted collapsed-hint">{tr('routine.noDays')}</p>
      )}

      {routine.days.length > 0 && (
        <ul className="days">
          {routine.days.map((day) => {
            const assignedWeekday =
              Object.entries(routine.schedule).find(([, id]) => id === day.id)?.[0] ?? ''
            const takenWeekdays = Object.entries(routine.schedule)
              .filter(([, id]) => id !== day.id)
              .map(([w]) => Number(w))
            return (
              <li key={day.id} className="day">
                {renamingDayId === day.id ? (
                  <InlineRename
                    value={day.name}
                    onSave={(name) => {
                      onRenameDay(day.id, name)
                      setRenamingDayId(null)
                    }}
                    onCancel={() => setRenamingDayId(null)}
                  />
                ) : (
                  <div className="day-head">
                    <button
                      type="button"
                      className="day-toggle"
                      onClick={() => toggleDay(day.id)}
                    >
                      <span className="day-toggle-main">
                        <span>{day.name}</span>
                        <Icon
                          name={expandedDayId === day.id ? 'chevron-up' : 'chevron-down'}
                          size={24}
                        />
                      </span>
                      <span className="muted">
                        {day.exerciseNames.length}{' '}
                        {p(day.exerciseNames.length, 'routine.exercise')}
                      </span>
                    </button>
                    <DropdownMenu
                      ariaLabel={tr('routine.dayOptions')}
                      items={[
                        { label: tr('routine.moveDayUp'), onClick: () => onMoveDay(day.id, -1) },
                        { label: tr('routine.moveDayDown'), onClick: () => onMoveDay(day.id, 1) },
                        { label: tr('routine.renameDay'), onClick: () => setRenamingDayId(day.id) },
                        { label: tr('routine.removeDay'), onClick: () => onRemoveDay(day.id), variant: 'danger' },
                      ]}
                    />
                  </div>
                )}

                {expandedDayId === day.id && (
                  <div className="day-body">
                    {day.exerciseNames.length === 0 && (
                      <p className="muted">{tr('routine.noExercises')}</p>
                    )}
                    {day.exerciseNames.map((name, index) => (
                      <div key={`${name}-${index}`} className="exercise-row">
                        <span>
                          {index + 1}. {name}
                        </span>
                        <div className="exercise-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            disabled={index === 0}
                            onClick={() => onMoveExercise(day.id, index, -1)}
                            aria-label={tr('routine.moveExUp')}
                          >
                            <Icon name="arrow-up" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            disabled={index === day.exerciseNames.length - 1}
                            onClick={() => onMoveExercise(day.id, index, 1)}
                            aria-label={tr('routine.moveExDown')}
                          >
                            <Icon name="arrow-down" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => onRemoveExercise(day.id, index)}
                            aria-label={tr('routine.removeEx')}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <AddRoutineExerciseForm
                      onAdd={(name) => onAddExercise(day.id, name)}
                      existing={day.exerciseNames}
                    />
                    <DayScheduleSelect
                      id={day.id}
                      assignedWeekday={assignedWeekday}
                      takenWeekdays={takenWeekdays}
                      getConflict={(weekday) => getConflict(weekday, day.id)}
                      onSchedule={(weekday) => onSetSchedule(day.id, weekday)}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="btn-sm secondary" onClick={onAddDay}>
        {tr('routine.addDay')}
      </button>
    </section>
  )
}
