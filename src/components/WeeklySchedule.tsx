import { useI18n } from '../i18n'
import type { Routine, Weekday } from '../lib/types'

const DAY_NAMES: Weekday[] = [1, 2, 3, 4, 5, 6, 0]

export function WeeklySchedule({ routines }: { routines: Routine[] }) {
  const { tr } = useI18n()

  const scheduleMap = new Map<Weekday, { routineName: string; dayName: string }[]>()
  for (const routine of routines) {
    for (const [weekdayStr, dayId] of Object.entries(routine.schedule)) {
      const weekday = Number(weekdayStr) as Weekday
      const day = routine.days.find((d) => d.id === dayId)
      if (!day) continue
      const existing = scheduleMap.get(weekday) ?? []
      existing.push({ routineName: routine.name, dayName: day.name })
      scheduleMap.set(weekday, existing)
    }
  }

  const hasAnySchedule = scheduleMap.size > 0
  if (!hasAnySchedule) return null

  const today = new Date().getDay()

  return (
    <div className="flex flex-col gap-2">
      <h2>{tr('home.weeklySchedule')}</h2>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAY_NAMES.map((dayNum) => {
          const entries = scheduleMap.get(dayNum) ?? []
          const isToday = dayNum === today
          return (
            <div
              key={dayNum}
              className={`flex flex-col items-center gap-1 min-w-[48px] px-2 py-2 rounded-xl border text-center ${
                isToday
                  ? 'bg-brand-accent-bg border-brand-accent'
                  : entries.length > 0
                    ? 'bg-brand-row border-brand-border'
                    : 'bg-transparent border-transparent'
              }`}
            >
              <span className={`text-[11px] font-semibold uppercase ${isToday ? 'text-brand-accent' : 'text-brand-text'}`}>
                {tr(`weekday.${dayNum}`)}
              </span>
              {entries.length > 0 ? (
                entries.map((e, i) => (
                  <span key={i} className="text-[10px] text-brand-heading font-medium leading-tight line-clamp-2">
                    {e.dayName}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-brand-text opacity-40">—</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
