import { useEffect, useRef, useState } from 'react'
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

  // On first render after animation, persist the new value
  useEffect(() => {
    if (!isAnimating) {
      prevStreakRef.current = stats.currentWeekStreak
    }
  }, [isAnimating, stats.currentWeekStreak])

  // Hide entirely if no sessions yet
  if (stats.totalSessions === 0) return null

  const { currentWeekStreak, totalSessions, gapDays } = stats

  // Comeback state: gap >= 7 days
  if (gapDays !== null && gapDays >= 7) {
    const copyKey = gapDays >= 14 ? 'consistency.comeback14' : 'consistency.comeback7'
    return (
      <div className="consistency-widget comeback">
        <span className="consistency-comeback-main">
          {tr(copyKey, { n: gapDays })}
        </span>
        <span className="consistency-comeback-sub">
          {tr('consistency.totalSessions', { n: totalSessions })}
        </span>
      </div>
    )
  }

  // No active streak (streak broke — a full elapsed week had no session)
  if (currentWeekStreak === 0) {
    return (
      <div className="consistency-widget">
        <span className="consistency-meta">
          {tr('consistency.newChapter')}
        </span>
        <span className="consistency-meta">
          {tr('consistency.totalSessions', { n: totalSessions })}
        </span>
      </div>
    )
  }

  // Show gap subtext if 3–6 days since last session (streak intact)
  const showLastTrained = gapDays !== null && gapDays >= 3 && gapDays < 7

  const streakLabel =
    currentWeekStreak === 1
      ? tr('consistency.weekStreakOne')
      : tr('consistency.weekStreak', { n: currentWeekStreak })

  return (
    <div className="consistency-widget">
      <div className="consistency-streak">
        <span
          className={`consistency-streak-number${isAnimating ? ' animating' : ''}`}
          aria-label={streakLabel}
        >
          {currentWeekStreak}w
        </span>
        <span className="consistency-streak-label">{streakLabel}</span>
      </div>
      <div className="consistency-meta">
        {showLastTrained
          ? tr('consistency.lastTrained', { n: gapDays! })
          : tr('consistency.totalSessions', { n: totalSessions })}
      </div>
    </div>
  )
}