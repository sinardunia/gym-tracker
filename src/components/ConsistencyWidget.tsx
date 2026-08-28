import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import { useI18n } from '../i18n'
import type { ConsistencyStats } from '../lib/types'

export function ConsistencyWidget({ stats }: { stats: ConsistencyStats }) {
  const { tr } = useI18n()
  const prevStreakRef = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const prev = prevStreakRef.current
    if (
      prev !== null &&
      stats.currentWeekStreak > prev &&
      stats.currentWeekStreak >= 1
    ) {
      setIsAnimating(true)
      const timeout = setTimeout(() => setIsAnimating(false), 450)
      return () => clearTimeout(timeout)
    }
    prevStreakRef.current = stats.currentWeekStreak
    setIsAnimating(false)
  }, [stats.currentWeekStreak])

  useEffect(() => {
    if (!isAnimating) {
      prevStreakRef.current = stats.currentWeekStreak
    }
  }, [isAnimating, stats.currentWeekStreak])

  if (stats.totalSessions === 0) return null

  const { currentWeekStreak, currentDayStreak, totalSessions, gapDays } = stats

  if (gapDays !== null && gapDays >= 7) {
    const copyKey = gapDays >= 14 ? 'consistency.comeback14' : 'consistency.comeback7'
    return (
      <div className="px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-[10px] flex items-center justify-between gap-3 bg-brand-positive-bg border-brand-positive flex-col items-start gap-1">
        <span className="text-[15px] font-semibold text-brand-positive">
          {tr(copyKey, { n: gapDays })}
        </span>
        <span className="text-[13px] text-brand-text">
          {tr('consistency.totalSessions', { n: totalSessions })}
        </span>
      </div>
    )
  }

  if (currentWeekStreak === 0 && currentDayStreak === 0) {
    return (
      <div className="px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-[10px] flex items-center justify-between gap-3">
        <span className="text-[13px] text-brand-text text-right">
          {tr('consistency.newChapter')}
        </span>
        <span className="text-[13px] text-brand-text text-right">
          {tr('consistency.totalSessions', { n: totalSessions })}
        </span>
      </div>
    )
  }

  const showLastTrained = gapDays !== null && gapDays >= 3 && gapDays < 7

  const dayStreakLabel =
    currentDayStreak === 1
      ? tr('consistency.dayStreakOne')
      : tr('consistency.dayStreak', { n: currentDayStreak })

  return (
    <div className="px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-[10px] flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {currentDayStreak > 0 && (
          <div className="flex items-center gap-1.5">
            <Flame size={20} className="text-orange-500" aria-hidden="true" />
            <span
              className={`text-[22px] font-extrabold text-orange-500 tabular-nums leading-none${isAnimating ? ' animate-[streak-count-in_400ms_ease-out_forwards]' : ''}`}
              aria-label={dayStreakLabel}
            >
              {currentDayStreak}
            </span>
          </div>
        )}
        {currentWeekStreak > 0 && (
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-[15px] font-bold text-brand-accent tabular-nums leading-none${isAnimating ? ' animate-[streak-count-in_400ms_ease-out_forwards]' : ''}`}
            >
              {currentWeekStreak}w
            </span>
          </div>
        )}
      </div>
      <div className="text-[13px] text-brand-text text-right">
        {showLastTrained
          ? tr('consistency.lastTrained', { n: gapDays! })
          : tr('consistency.totalSessions', { n: totalSessions })}
      </div>
    </div>
  )
}