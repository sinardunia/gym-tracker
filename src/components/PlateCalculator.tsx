import { useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { ConfirmDialog } from './ConfirmDialog'

const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const BAR_PRESETS = [20, 15, 10, 0]

function calculatePlates(totalWeight: number, barWeight: number) {
  const sideWeight = (totalWeight - barWeight) / 2
  if (sideWeight <= 0 || !Number.isFinite(sideWeight)) {
    return { sideWeight: Math.max(0, sideWeight), plates: [], remainder: 0 }
  }

  let remaining = sideWeight
  const plates: { weight: number; count: number }[] = []

  for (const plate of STANDARD_PLATES) {
    const count = Math.floor(remaining / plate)
    if (count > 0) {
      plates.push({ weight: plate, count })
      remaining = Math.round((remaining - count * plate) * 100) / 100
    }
  }

  return {
    sideWeight,
    plates,
    remainder: remaining,
  }
}

export function PlateCalculator({
  onClose,
}: {
  onClose: () => void
}) {
  const { tr } = useI18n()
  const [totalWeight, setTotalWeight] = useState('60')
  const [barWeight, setBarWeight] = useState(20)

  const totalNum = Number(totalWeight)
  const isValid = Number.isFinite(totalNum) && totalNum >= barWeight
  const result = isValid ? calculatePlates(totalNum, barWeight) : null

  return (
    <ConfirmDialog
      title={tr('calc.title')}
      body={tr('calc.desc')}
      onClose={onClose}
    >
      <div className="plate-calc-body">
        <div className="field">
          <label>{tr('calc.barWeight')}</label>
          <div className="bar-presets">
            {BAR_PRESETS.map((weight) => (
              <button
                key={weight}
                type="button"
                className={`timer-chip${barWeight === weight ? ' active' : ''}`}
                onClick={() => setBarWeight(weight)}
              >
                {weight === 0 ? tr('calc.noBar') : `${weight} kg`}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="total-weight-input">{tr('calc.totalWeight')}</label>
          <input
            id="total-weight-input"
            type="number"
            min={barWeight}
            step="any"
            inputMode="decimal"
            value={totalWeight}
            onChange={(e) => setTotalWeight(e.target.value)}
            placeholder="60"
            autoFocus
          />
        </div>

        {result && (
          <div className="calc-result">
            <div className="result-header">
              <span className="muted">{tr('calc.perSide')}</span>
              <strong>{result.sideWeight} kg</strong>
            </div>

            {result.plates.length === 0 ? (
              <p className="muted calc-empty">
                {totalNum <= barWeight ? tr('calc.barOnly') : tr('calc.noPlatesNeeded')}
              </p>
            ) : (
              <div className="plate-badge-list">
                {result.plates.map(({ weight, count }) => (
                  <span key={weight} className="plate-badge">
                    <strong>{count}×</strong> {weight} kg
                  </span>
                ))}
              </div>
            )}

            {result.remainder > 0 && (
              <p className="error hint">
                {tr('calc.remainder', { amount: result.remainder })}
              </p>
            )}
          </div>
        )}

        <button type="button" className="secondary" onClick={onClose}>
          {tr('feedback.close')}
        </button>
      </div>
    </ConfirmDialog>
  )
}

export function FloatingPlateCalculatorButton() {
  const { tr } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="floating-calc-btn"
        onClick={() => setOpen(true)}
        aria-label={tr('calc.title')}
        title={tr('calc.title')}
      >
        <Icon name="calculator" size={20} />
        <span>{tr('calc.btn')}</span>
      </button>

      {open && <PlateCalculator onClose={() => setOpen(false)} />}
    </>
  )
}
