import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { useI18n } from '../i18n'
import { formatTimer } from '../lib/format'
import { Button, Input } from './ui'
import {
  loadTimerSnapshot,
  saveTimerSnapshot,
  type TimerStatus,
} from '../lib/timer'

const REST_PRESETS = [60, 90, 120]

export function RestTimer({ workoutId }: { workoutId: string }) {
  const { tr } = useI18n()
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [duration, setDuration] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [customMinutes, setCustomMinutes] = useState('2')
  const [idleExpanded, setIdleExpanded] = useState(false)
  const endAtRef = useRef(0)
  const audioRef = useRef<AudioContext | null>(null)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const snapshot = loadTimerSnapshot(workoutId)
    if (!snapshot) return
    const left = Math.max(0, Math.round((snapshot.endAt - Date.now()) / 1000))
    setDuration(snapshot.duration)
    setRemaining(left)
    if (left > 0) {
      endAtRef.current = snapshot.endAt
      setStatus('running')
    }
  }, [workoutId])

  useEffect(() => {
    if (status !== 'running') return
    const timer = setInterval(() => {
      const left = Math.max(
        0,
        Math.round((endAtRef.current - Date.now()) / 1000),
      )
      setRemaining(left)
      if (left <= 0) {
        setStatus('done')
        saveTimerSnapshot(workoutId, null)
        playDoneBeep()
        navigator.vibrate?.([200, 100, 200, 100, 200])
      }
    }, 250)
    return () => clearInterval(timer)
  }, [status, workoutId])

  function warmAudio() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      if (audioRef.current.state === 'suspended') {
        void audioRef.current.resume()
      }
    } catch {
      // Audio unavailable.
    }
  }

  function playDoneBeep() {
    const ctx = audioRef.current
    if (!ctx) return
    try {
      const now = ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, now + i * 0.25)
        gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.25 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.25 + 0.2)
        osc.start(now + i * 0.25)
        osc.stop(now + i * 0.25 + 0.22)
      }
    } catch {
      // Audio unavailable; vibration/visual still work.
    }
  }

  function start(seconds: number) {
    warmAudio()
    setDuration(seconds)
    setRemaining(seconds)
    endAtRef.current = Date.now() + seconds * 1000
    setStatus('running')
    saveTimerSnapshot(workoutId, { duration: seconds, endAt: endAtRef.current })
  }

  function startCustom() {
    const minutes = Number(customMinutes)
    const seconds = Math.max(5, Math.round((Number.isFinite(minutes) ? minutes : 0) * 60))
    start(seconds)
  }

  function reset() {
    setStatus('idle')
    setRemaining(duration)
    saveTimerSnapshot(workoutId, null)
  }

  const progress = duration > 0 ? (remaining / duration) * 100 : 0

  return (
    <div
      className={`flex items-center gap-2.5 flex-wrap w-full${
        status === 'idle' && !idleExpanded ? ' pt-0 border-t-0' : ''
      }`}
    >
      {status === 'running' ? (
        <>
          <button
            type="button"
            className="inline-flex items-center justify-center px-1.5 py-1 -ml-1.5 border-none rounded-[10px] bg-transparent text-inherit cursor-pointer hover:bg-brand-row focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
            onClick={reset}
            aria-label={tr('timer.resetAria')}
          >
            <span
              className="text-[38px] font-extrabold tabular-nums text-brand-heading min-w-[90px] leading-none"
              role="timer"
            >
              {formatTimer(remaining)}
            </span>
          </button>
          <div
            className="flex-1 min-w-12 h-1 rounded-full bg-brand-row overflow-hidden [&_div]:h-full [&_div]:bg-brand-positive [&_div]:transition-[width] [&_div]:duration-[250ms] [&_div]:ease-linear"
            aria-hidden="true"
          >
            <div style={{ width: `${progress}%` }} />
          </div>
          <Button type="button" sm variant="secondary" onClick={reset}>
            {tr('timer.reset')}
          </Button>
        </>
      ) : status === 'done' ? (
        <>
          <button
            type="button"
            className="inline-flex items-center justify-center px-1.5 py-1 -ml-1.5 border-none rounded-[10px] bg-transparent text-inherit cursor-pointer hover:bg-brand-row focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1"
            onClick={() => start(duration)}
            aria-label={tr('timer.restartAria')}
          >
            <span
              className="text-[38px] font-extrabold tabular-nums text-brand-heading text-brand-positive min-w-[90px] leading-none"
              role="timer"
            >
              0:00
            </span>
          </button>
          <span className="text-brand-positive text-[13px] font-semibold">
            {tr('timer.timeUp')}
          </span>
          <Button type="button" variant="positive" className="flex-1 text-[15px] font-bold" onClick={() => start(duration)}>
            {tr('timer.restart')}
          </Button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="text-[15px] px-3.5 py-2.5 rounded-[10px] border border-brand-border bg-transparent text-brand-heading cursor-pointer font-medium hover:border-brand-positive hover:text-brand-positive [&.active]:border-brand-positive [&.active]:text-brand-positive [&.active]:bg-brand-positive-bg flex-1 inline-flex justify-center items-center gap-2 text-[17px] font-bold px-4 py-3.5 rounded-xl bg-brand-row"
            onClick={() => start(duration)}
            aria-label={tr('timer.startRest', { durasi: formatTimer(duration) })}
          >
            {tr('timer.rest')}{' '}
            <span className="tabular-nums font-bold">{formatTimer(duration)}</span>
          </button>
          <button
            type="button"
            className="text-[15px] px-3.5 py-2.5 rounded-[10px] border border-brand-border bg-transparent text-brand-heading cursor-pointer font-medium hover:border-brand-positive hover:text-brand-positive [&.active]:border-brand-positive [&.active]:text-brand-positive [&.active]:bg-brand-positive-bg inline-flex items-center justify-center px-3.5 py-3 rounded-xl"
            onClick={() => setIdleExpanded((expanded) => !expanded)}
            aria-label={tr('timer.setRest')}
            aria-expanded={idleExpanded}
          >
            <Clock size={14} aria-hidden="true" />
          </button>
          {idleExpanded && (
            <>
              {REST_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={`text-[15px] px-3.5 py-2.5 rounded-[10px] border border-brand-border bg-transparent text-brand-heading cursor-pointer font-medium hover:border-brand-positive hover:text-brand-positive [&.active]:border-brand-positive [&.active]:text-brand-positive [&.active]:bg-brand-positive-bg${
                    duration === seconds ? ' active' : ''
                  }`}
                  onClick={() => start(seconds)}
                >
                  {formatTimer(seconds)}
                </button>
              ))}
              <Input
                type="number"
                min={0.1}
                step={0.5}
                inputMode="decimal"
                className="w-16! px-2.5 py-2 text-[15px]"
                value={customMinutes}
                aria-label={tr('timer.customMinutes')}
                onChange={(e) => setCustomMinutes(e.target.value)}
              />
              <Button type="button" sm onClick={startCustom}>
                {tr('timer.start')}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}
