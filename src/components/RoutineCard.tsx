import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, MoreVertical, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { Button, IconButton } from './ui'
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
      <IconButton
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <MoreVertical size={18} aria-hidden="true" />
      </IconButton>
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
    <section className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-md">
      <div className="flex justify-between items-start gap-2">
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
            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              <h3>{routine.name}</h3>
              <p className="text-brand-text text-sm">
                {routine.days.length} {p(routine.days.length, 'routine.day')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {confirmDelete ? (
                <span className="flex gap-2 flex-wrap justify-end">
                  <Button
                    sm
                    type="button"
                    variant="danger"
                    onClick={onDelete}
                  >
                    {tr('routine.confirm')}
                  </Button>
                  <Button
                    sm
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmDelete(false)}
                  >
                    {tr('cancel')}
                  </Button>
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
        <p className="m-0 mt-1 text-brand-text text-sm">{tr('routine.noDays')}</p>
      )}

      {routine.days.length > 0 && (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {routine.days.map((day) => {
            const assignedWeekday =
              Object.entries(routine.schedule).find(([, id]) => id === day.id)?.[0] ?? ''
            const takenWeekdays = Object.entries(routine.schedule)
              .filter(([, id]) => id !== day.id)
              .map(([w]) => Number(w))
            return (
              <li key={day.id} className="flex flex-col gap-2 p-2.5 bg-brand-row rounded-lg">
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
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left text-[15px] bg-transparent border-none text-brand-heading p-1 cursor-pointer"
                      onClick={() => toggleDay(day.id)}
                    >
                      <span className="flex items-center justify-between gap-2 w-full">
                        <span>{day.name}</span>
                        {expandedDayId === day.id ? (
                          <ChevronUp size={24} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={24} aria-hidden="true" />
                        )}
                      </span>
                      <span className="text-brand-text">
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
                  <div className="flex flex-col gap-1.5">
                    {day.exerciseNames.length === 0 && (
                      <p className="text-brand-text">{tr('routine.noExercises')}</p>
                    )}
                    {day.exerciseNames.map((name, index) => (
                      <div key={`${name}-${index}`} className="flex justify-between items-center gap-2 px-2 py-1.5 bg-brand-bg rounded-md text-sm">
                        <span>
                          {index + 1}. {name}
                        </span>
                        <div className="flex gap-2 flex-wrap justify-end items-center">
                          <IconButton
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveExercise(day.id, index, -1)}
                            aria-label={tr('routine.moveExUp')}
                          >
                            <ArrowUp size={16} aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            type="button"
                            disabled={index === day.exerciseNames.length - 1}
                            onClick={() => onMoveExercise(day.id, index, 1)}
                            aria-label={tr('routine.moveExDown')}
                          >
                            <ArrowDown size={16} aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            type="button"
                            variant="danger"
                            onClick={() => onRemoveExercise(day.id, index)}
                            aria-label={tr('routine.removeEx')}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </IconButton>
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

      <Button sm type="button" variant="secondary" onClick={onAddDay}>
        {tr('routine.addDay')}
      </Button>
    </section>
  )
}
