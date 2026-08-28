import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useI18n } from '../../i18n'
import {
  SET_TYPES,
  type Exercise,
  type ExerciseUnit,
  type SetType,
} from '../../lib/types'
import { Button, Input } from '../ui'

export type PreviousSet = {
  reps: number
  weightKg: number
  unit: ExerciseUnit
}

export function SetEntryForm({
  exercise,
  previous,
  prefillToken,
  onAddSet,
}: {
  exercise: Exercise
  previous: PreviousSet | null
  prefillToken: number
  onAddSet: (
    reps: number,
    weightKg: number,
    type: SetType,
    parentId?: string,
  ) => void
}) {
  const { tr } = useI18n()
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [setType, setSetType] = useState<SetType>('working')
  const [dropParentId, setDropParentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const setFormRef = useRef<HTMLFormElement | null>(null)
  const previousSetCount = useRef(exercise.sets.length)

  useEffect(() => {
    if (!previous) return
    setReps(String(previous.reps))
    if (previous.unit === exercise.unit) {
      setWeight(String(previous.weightKg))
    }
  }, [previous, exercise.unit])

  useEffect(() => {
    if (exercise.unit === 'bodyweight') setWeight('')
  }, [exercise.unit])

  useEffect(() => {
    if (prefillToken === 0 || !previous) return
    setReps(String(previous.reps))
    setWeight(String(previous.weightKg))
    setError(null)
  }, [prefillToken, previous])

  useEffect(() => {
    const previousLength = previousSetCount.current
    previousSetCount.current = exercise.sets.length
    if (exercise.sets.length <= previousLength) return
    const node = setFormRef.current
    if (node) {
      const rect = node.getBoundingClientRect()
      if (rect.bottom > window.innerHeight) {
        node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [exercise.sets])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const repsValue = Number(reps)
    if (!Number.isInteger(repsValue) || repsValue < 1) {
      setError(tr('ex.repsError'))
      return
    }
    let weightValue = 0
    if (exercise.unit === 'bodyweight') {
      weightValue = 0
    } else if (exercise.unit === 'plate') {
      weightValue = Number(weight)
      if (!Number.isInteger(weightValue) || weightValue < 0) {
        setError(tr('ex.plateError'))
        return
      }
    } else {
      weightValue = Number(weight)
      if (!Number.isFinite(weightValue) || weightValue < 0) {
        setError(tr('ex.weightError'))
        return
      }
    }
    const wasDrop = dropParentId !== null
    onAddSet(repsValue, weightValue, setType, dropParentId ?? undefined)
    if (wasDrop && previous) {
      // Kembalikan ke nilai working set supaya set working berikutnya
      // tidak memakai berat drop yang lebih ringan.
      setReps(String(previous.reps))
      setWeight(String(previous.weightKg))
    } else {
      setReps(String(repsValue))
      setWeight(String(weightValue))
    }
    if (wasDrop) setSetType('working')
    setDropParentId(null)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-brand-row border-[1.5px] border-brand-accent rounded-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-wider uppercase text-brand-accent">
          {tr('ex.currentSet', { n: exercise.sets.length + 1 })}
        </span>
      </div>
      <form
        ref={setFormRef}
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-3 items-end [&_button]:col-span-2 [&_.error]:col-span-2"
      >
        <div className="col-span-2 flex gap-2 flex-wrap items-center">
          <div
            className="flex gap-1.5 flex-1 min-w-0"
            role="group"
            aria-label={tr('ex.setTypeLabel')}
          >
            {SET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`flex-1 text-[13px] px-2.5 py-2 rounded-lg bg-transparent border border-brand-border text-brand-heading cursor-pointer hover:border-brand-accent [&.active]:border-brand-accent [&.active]:bg-brand-accent-bg${
                  setType === type ? ' active' : ''
                }`}
                onClick={() => {
                  setSetType(type)
                  if (type === 'dropset') {
                    const workingSets = exercise.sets.filter((s) => s.type === 'working')
                    const lastWorking = workingSets[workingSets.length - 1]
                    setDropParentId(lastWorking?.id ?? null)
                  } else {
                    setDropParentId(null)
                  }
                }}
              >
                {tr(`setType.${type}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 [&_label]:text-[13px]">
            <label htmlFor={`reps-${exercise.id}`}>{tr('ex.reps')}</label>
            <Input
              id={`reps-${exercise.id}`}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={reps}
              onChange={(e) => {
                setReps(e.target.value)
                setError(null)
              }}
              placeholder="10"
            />
          </div>
          {exercise.unit !== 'bodyweight' && (
            <div className="flex flex-col gap-1 [&_label]:text-[13px]">
              <label htmlFor={`weight-${exercise.id}`}>
                {exercise.unit === 'plate' ? tr('ex.plates') : tr('ex.weightKg')}
              </label>
              <Input
                id={`weight-${exercise.id}`}
                type="number"
                min={0}
                step={exercise.unit === 'plate' ? 1 : 'any'}
                inputMode={exercise.unit === 'plate' ? 'numeric' : 'decimal'}
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value)
                  setError(null)
                }}
                placeholder={exercise.unit === 'plate' ? '2' : '60'}
              />
            </div>
          )}
        </div>
        {error && <p className="text-brand-danger text-sm m-0">{error}</p>}
        <Button
          type="submit"
          variant="positive"
          className="flex items-center justify-center gap-2 min-h-12 text-base font-semibold w-full"
        >
          <Check size={18} aria-hidden="true" />
          <span>{tr('ex.completeSet')}</span>
        </Button>
      </form>
    </div>
  )
}