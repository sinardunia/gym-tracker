import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { formatTimer } from '../lib/format'
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
      className={`rest-timer${status === 'done' ? ' done' : ''}${
        status === 'idle' && !idleExpanded ? ' compact' : ''
      }`}
    >
      {status === 'running' ? (
        <>
          <button
            type="button"
            className="timer-display-btn"
            onClick={reset}
            aria-label={tr('timer.resetAria')}
          >
            <span className="timer-display" role="timer">
              {formatTimer(remaining)}
            </span>
          </button>
          <div className="timer-progress" aria-hidden="true">
            <div style={{ width: `${progress}%` }} />
          </div>
          <button type="button" className="btn-sm secondary" onClick={reset}>
            {tr('timer.reset')}
          </button>
        </>
      ) : status === 'done' ? (
        <>
          <button
            type="button"
            className="timer-display-btn"
            onClick={() => start(duration)}
            aria-label={tr('timer.restartAria')}
          >
            <span className="timer-display" role="timer">
              0:00
            </span>
          </button>
          <span className="timer-done-msg">{tr('timer.timeUp')}</span>
          <button
            type="button"
            className="btn-sm positive"
            onClick={() => start(duration)}
          >
            {tr('timer.restart')}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="timer-chip timer-quick"
            onClick={() => start(duration)}
            aria-label={tr('timer.startRest', { durasi: formatTimer(duration) })}
          >
            {tr('timer.rest')}{' '}
            <span className="timer-chip-duration">{formatTimer(duration)}</span>
          </button>
          <button
            type="button"
            className="timer-chip timer-settings"
            onClick={() => setIdleExpanded((expanded) => !expanded)}
            aria-label={tr('timer.setRest')}
            aria-expanded={idleExpanded}
          >
            <Icon name="clock" size={14} />
          </button>
          {idleExpanded && (
            <>
              {REST_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={`timer-chip${duration === seconds ? ' active' : ''}`}
                  onClick={() => start(seconds)}
                >
                  {formatTimer(seconds)}
                </button>
              ))}
              <input
                type="number"
                min={0.1}
                step={0.5}
                inputMode="decimal"
                className="timer-custom"
                value={customMinutes}
                aria-label={tr('timer.customMinutes')}
                onChange={(e) => setCustomMinutes(e.target.value)}
              />
              <button
                type="button"
                className="btn-sm primary"
                onClick={startCustom}
              >
                {tr('timer.start')}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
