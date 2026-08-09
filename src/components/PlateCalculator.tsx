import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { ConfirmDialog } from './ConfirmDialog'

type Operator = '+' | '-' | '×' | '÷'

export function CalculatorModal({ onClose }: { onClose: () => void }) {
  const { tr } = useI18n()
  const [display, setDisplay] = useState('0')
  const [accValue, setAccValue] = useState<number | null>(null)
  const [pendingOperator, setPendingOperator] = useState<Operator | null>(null)
  const [waitingForNextNumber, setWaitingForNextNumber] = useState(false)
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [lastOperator, setLastOperator] = useState<Operator | null>(null)
  const [lastOperand, setLastOperand] = useState<number | null>(null)
  const [formula, setFormula] = useState('')

  // Refs for event listener to avoid stale closure issues
  const stateRef = useRef({
    display,
    accValue,
    pendingOperator,
    waitingForNextNumber,
    justEvaluated,
    lastOperator,
    lastOperand,
  })

  useEffect(() => {
    stateRef.current = {
      display,
      accValue,
      pendingOperator,
      waitingForNextNumber,
      justEvaluated,
      lastOperator,
      lastOperand,
    }
  }, [display, accValue, pendingOperator, waitingForNextNumber, justEvaluated, lastOperator, lastOperand])

  function handleDigit(digit: string) {
    if (justEvaluated) {
      setDisplay(digit)
      setFormula('')
      setAccValue(null)
      setPendingOperator(null)
      setLastOperator(null)
      setLastOperand(null)
      setWaitingForNextNumber(false)
      setJustEvaluated(false)
      return
    }

    if (waitingForNextNumber) {
      setDisplay(digit)
      setWaitingForNextNumber(false)
    } else {
      setDisplay((prev) => (prev === '0' ? digit : prev + digit))
    }
  }

  function handleDecimal() {
    if (justEvaluated) {
      setDisplay('0.')
      setFormula('')
      setAccValue(null)
      setPendingOperator(null)
      setLastOperator(null)
      setLastOperand(null)
      setWaitingForNextNumber(false)
      setJustEvaluated(false)
      return
    }

    if (waitingForNextNumber) {
      setDisplay('0.')
      setWaitingForNextNumber(false)
      return
    }

    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.')
    }
  }

  function clearAll() {
    setDisplay('0')
    setAccValue(null)
    setPendingOperator(null)
    setWaitingForNextNumber(false)
    setJustEvaluated(false)
    setLastOperator(null)
    setLastOperand(null)
    setFormula('')
  }

  function toggleSign() {
    const val = parseFloat(display)
    if (val !== 0 && Number.isFinite(val)) {
      setDisplay(String(-val))
    }
  }

  function handlePercent() {
    const val = parseFloat(display)
    if (Number.isFinite(val)) {
      const res = Math.round((val / 100) * 1e8) / 1e8
      setDisplay(String(res))
    }
  }

  function handleOperator(op: Operator) {
    const val = parseFloat(display)

    if (justEvaluated) {
      setAccValue(val)
      setFormula(`${val} ${op}`)
      setPendingOperator(op)
      setWaitingForNextNumber(true)
      setJustEvaluated(false)
      return
    }

    if (pendingOperator !== null && !waitingForNextNumber && accValue !== null) {
      const res = compute(accValue, val, pendingOperator)
      setDisplay(String(res))
      setAccValue(res)
      setFormula(`${res} ${op}`)
    } else {
      setAccValue(val)
      setFormula(`${val} ${op}`)
    }

    setPendingOperator(op)
    setWaitingForNextNumber(true)
  }

  function handleEqual() {
    const val = parseFloat(display)

    if (pendingOperator !== null && accValue !== null) {
      const secondVal = waitingForNextNumber ? accValue : val
      const res = compute(accValue, secondVal, pendingOperator)
      setFormula(`${accValue} ${pendingOperator} ${secondVal} =`)
      setDisplay(String(res))
      setAccValue(res)
      setLastOperator(pendingOperator)
      setLastOperand(secondVal)
      setPendingOperator(null)
      setWaitingForNextNumber(true)
      setJustEvaluated(true)
    } else if (justEvaluated && lastOperator !== null && lastOperand !== null) {
      const res = compute(val, lastOperand, lastOperator)
      setFormula(`${val} ${lastOperator} ${lastOperand} =`)
      setDisplay(String(res))
      setAccValue(res)
      setWaitingForNextNumber(true)
    }
  }

  function compute(a: number, b: number, op: Operator): number {
    let res = 0
    switch (op) {
      case '+':
        res = a + b
        break
      case '-':
        res = a - b
        break
      case '×':
        res = a * b
        break
      case '÷':
        res = b !== 0 ? a / b : 0
        break
    }
    return Math.round(res * 1e8) / 1e8
  }

  const handlersRef = useRef({
    handleDigit,
    handleDecimal,
    handleOperator,
    handleEqual,
    onClose,
  })

  useEffect(() => {
    handlersRef.current = {
      handleDigit,
      handleDecimal,
      handleOperator,
      handleEqual,
      onClose,
    }
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const h = handlersRef.current
      if (e.key >= '0' && e.key <= '9') {
        h.handleDigit(e.key)
      } else if (e.key === '.') {
        h.handleDecimal()
      } else if (e.key === '+') {
        h.handleOperator('+')
      } else if (e.key === '-') {
        h.handleOperator('-')
      } else if (e.key === '*') {
        h.handleOperator('×')
      } else if (e.key === '/') {
        e.preventDefault()
        h.handleOperator('÷')
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        h.handleEqual()
      } else if (e.key === 'Escape') {
        h.onClose()
      } else if (e.key === 'Backspace') {
        const { display: curDisplay, waitingForNextNumber: waiting } = stateRef.current
        if (curDisplay.length > 1 && !waiting) {
          setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'))
        } else {
          setDisplay('0')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ConfirmDialog title={tr('calc.title')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-end justify-end p-3 min-h-[72px] bg-[var(--row-bg)] border border-[var(--border)] rounded-xl">
          <div className="text-xs text-[var(--text)] min-h-[18px] font-mono">{formula}</div>
          <div className="text-3xl font-semibold font-mono text-[var(--text-h)] overflow-x-auto max-w-full whitespace-nowrap">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--row-bg)] text-[var(--text)] active:scale-95 transition-transform cursor-pointer"
            onClick={clearAll}
          >
            {display !== '0' || accValue !== null ? 'C' : 'AC'}
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--row-bg)] text-[var(--text)] active:scale-95 transition-transform cursor-pointer"
            onClick={toggleSign}
          >
            ±
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--row-bg)] text-[var(--text)] active:scale-95 transition-transform cursor-pointer"
            onClick={handlePercent}
          >
            %
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer ${
              pendingOperator === '÷'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => handleOperator('÷')}
          >
            ÷
          </button>

          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('7')}
          >
            7
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('8')}
          >
            8
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('9')}
          >
            9
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer ${
              pendingOperator === '×'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => handleOperator('×')}
          >
            ×
          </button>

          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('4')}
          >
            4
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('5')}
          >
            5
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('6')}
          >
            6
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer ${
              pendingOperator === '-'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => handleOperator('-')}
          >
            -
          </button>

          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('1')}
          >
            1
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('2')}
          >
            2
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('3')}
          >
            3
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer ${
              pendingOperator === '+'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => handleOperator('+')}
          >
            +
          </button>

          <button
            type="button"
            className="col-span-2 flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform cursor-pointer"
            onClick={handleDecimal}
          >
            .
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl bg-[var(--positive)] text-white active:scale-95 transition-transform shadow-sm cursor-pointer"
            onClick={handleEqual}
          >
            =
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl border border-[var(--border)] bg-[var(--row-bg)] text-[var(--text-h)] hover:bg-[var(--card-bg)] active:scale-[0.99] transition-all cursor-pointer mt-1"
          onClick={onClose}
        >
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
        className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] right-5 z-20 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label={tr('calc.title')}
        title={tr('calc.title')}
      >
        <Icon name="calculator" size={20} />
        <span>{tr('calc.btn')}</span>
      </button>

      {open && <CalculatorModal onClose={() => setOpen(false)} />}
    </>
  )
}
