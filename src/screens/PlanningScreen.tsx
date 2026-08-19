import { useState } from 'react'
import { useI18n } from '../i18n'
import { RoutineEditorScreen } from './RoutineEditorScreen'
import { ProgramPickerScreen } from './ProgramPickerScreen'
import type { ProgramTemplate, Routine, Weekday } from '../lib/types'

export function PlanningScreen({
  routines,
  onAddRoutine,
  onRenameRoutine,
  onDeleteRoutine,
  onAddDay,
  onRenameDay,
  onRemoveDay,
  onMoveDay,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
  onSetSchedule,
  onApplyTemplate,
}: {
  routines: Routine[]
  onAddRoutine: () => void
  onRenameRoutine: (routineId: string, name: string) => void
  onDeleteRoutine: (routineId: string) => void
  onAddDay: (routineId: string) => void
  onRenameDay: (routineId: string, dayId: string, name: string) => void
  onRemoveDay: (routineId: string, dayId: string) => void
  onMoveDay: (routineId: string, dayId: string, direction: -1 | 1) => void
  onAddExercise: (routineId: string, dayId: string, name: string) => void
  onRemoveExercise: (routineId: string, dayId: string, index: number) => void
  onMoveExercise: (
    routineId: string,
    dayId: string,
    index: number,
    direction: -1 | 1,
  ) => void
  onSetSchedule: (
    routineId: string,
    dayId: string,
    weekday: Weekday | null,
  ) => void
  onApplyTemplate: (template: ProgramTemplate) => void
}) {
  const { tr } = useI18n()
  const [subTab, setSubTab] = useState<'routines' | 'programs'>('routines')

  return (
    <div className="flex flex-col gap-4">
      <header className="mb-1 [&_h1]:mb-1">
        <h1>{tr('nav.planning')}</h1>
        <p className="text-brand-text">{tr('routine.desc')}</p>
      </header>

      <div className="flex p-1 bg-[var(--row-bg)] rounded-xl border border-[var(--border)]">
        <button
          type="button"
          className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            subTab === 'routines'
              ? 'bg-[var(--card-bg)] text-[var(--text-h)] shadow-sm'
              : 'text-[var(--text)] hover:text-[var(--text-h)]'
          }`}
          onClick={() => setSubTab('routines')}
        >
          {tr('nav.myRoutines')}
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            subTab === 'programs'
              ? 'bg-[var(--card-bg)] text-[var(--text-h)] shadow-sm'
              : 'text-[var(--text)] hover:text-[var(--text-h)]'
          }`}
          onClick={() => setSubTab('programs')}
        >
          {tr('nav.programs')}
        </button>
      </div>

      {subTab === 'routines' ? (
        <RoutineEditorScreen
          routines={routines}
          onBack={() => {}}
          hideHeader
          onAddRoutine={onAddRoutine}
          onRenameRoutine={onRenameRoutine}
          onDeleteRoutine={onDeleteRoutine}
          onAddDay={onAddDay}
          onRenameDay={onRenameDay}
          onRemoveDay={onRemoveDay}
          onMoveDay={onMoveDay}
          onAddExercise={onAddExercise}
          onRemoveExercise={onRemoveExercise}
          onMoveExercise={onMoveExercise}
          onSetSchedule={onSetSchedule}
        />
      ) : (
        <ProgramPickerScreen
          onBack={() => {}}
          hideHeader
          onApply={(template) => {
            onApplyTemplate(template)
            setSubTab('routines')
          }}
        />
      )}
    </div>
  )
}
