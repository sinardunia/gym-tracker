import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { WEEKDAY_KEYS, type ScheduleConflict, type Weekday } from '../lib/types'
import { Button, Select } from './ui'

export function DayScheduleSelect({
  id,
  assignedWeekday,
  takenWeekdays,
  getConflict,
  onSchedule,
}: {
  id: string
  assignedWeekday: string
  takenWeekdays: number[]
  getConflict: (weekday: Weekday) => ScheduleConflict | null
  onSchedule: (weekday: Weekday | null) => void
}) {
  const { tr } = useI18n()
  const [draft, setDraft] = useState(assignedWeekday)
  const [pending, setPending] = useState<{
    weekday: Weekday
    conflict: ScheduleConflict
  } | null>(null)

  useEffect(() => {
    setDraft(assignedWeekday)
    setPending(null)
  }, [assignedWeekday])

  function handleChange(raw: string) {
    setDraft(raw)
    if (raw === '') {
      onSchedule(null)
      return
    }
    const weekday = Number(raw) as Weekday
    const conflict = getConflict(weekday)
    if (conflict) {
      setPending({ weekday, conflict })
    } else {
      onSchedule(weekday)
    }
  }

  return (
    <div className="flex flex-col gap-1 mt-1">
      <label htmlFor={`weekday-${id}`} className="text-brand-text">
        {tr('routine.weekday')}
      </label>
      <Select
        id={`weekday-${id}`}
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="">{tr('routine.notScheduled')}</option>
        {WEEKDAY_KEYS.map((key, w) => (
          <option
            key={key}
            value={String(w)}
            disabled={takenWeekdays.includes(w) && String(w) !== draft}
          >
            {tr(`weekday.${key}`)}
          </option>
        ))}
      </Select>

      {pending && (
        <div className="flex flex-col gap-2 p-3 rounded-[10px] bg-brand-row">
          <p>
            {tr('routine.conflict', {
              weekday: tr(`weekday.${WEEKDAY_KEYS[pending.weekday]}`),
              routine: pending.conflict.routineName,
              day: pending.conflict.dayName,
            })}
          </p>
          <div className="flex gap-2 flex-wrap [&_button]:flex-1">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                onSchedule(pending.weekday)
                setPending(null)
              }}
            >
              {tr('routine.replace')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDraft(assignedWeekday)
                setPending(null)
              }}
            >
              {tr('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}