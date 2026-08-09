import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'
import { ConfirmDialog } from './ConfirmDialog'

type Operator = '+' | '-' | '×' | '÷'

export function CalculatorModal({ onClose }: { onClose: () => void }) {
  const { tr } = useI18n()
  const [display, setDisplay] = useState('0')
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [lastActionWasEqual, setLastActionWasEqual] = useState(false)
  const [lastOperand, setLastOperand] = useState<number | null>(null)
  const [lastOperator, setLastOperator] = useState<Operator | null>(null)
  const [formula, setFormula] = useState('')

  function inputDigit(digit: string) {
    if (lastActionWasEqual) {
      setDisplay(digit)
      setFormula('')
      setPrevValue(null)
      setOperator(null)
      setWaitingForOperand(false)
      setLastActionWasEqual(false)
      return
    }

    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  function inputDecimal() {
    if (lastActionWasEqual) {
      setDisplay('0.')
      setFormula('')
      setPrevValue(null)
      setOperator(null)
      setWaitingForOperand(false)
      setLastActionWasEqual(false)
      return
    }

    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }

    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  function clearAll() {
    setDisplay('0')
    setPrevValue(null)
    setOperator(null)
    setWaitingForOperand(false)
    setLastActionWasEqual(false)
    setLastOperand(null)
    setLastOperator(null)
    setFormula('')
  }

  function toggleSign() {
    const value = parseFloat(display)
    if (value !== 0) {
      setDisplay(String(-value))
    }
  }

  function inputPercent() {
    const value = parseFloat(display)
    setDisplay(String(value / 100))
  }

  function performOperation(nextOperator: Operator) {
    const inputValue = parseFloat(display)

    if (lastActionWasEqual) {
      setPrevValue(inputValue)
      setFormula(`${inputValue} ${nextOperator}`)
      setOperator(nextOperator)
      setWaitingForOperand(true)
      setLastActionWasEqual(false)
      return
    }

    if (prevValue === null) {
      setPrevValue(inputValue)
      setFormula(`${inputValue} ${nextOperator}`)
    } else if (operator && !waitingForOperand) {
      const result = compute(prevValue, inputValue, operator)
      setPrevValue(result)
      setDisplay(String(result))
      setFormula(`${result} ${nextOperator}`)
    } else {
      setFormula(`${prevValue} ${nextOperator}`)
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  function handleEqual() {
    const inputValue = parseFloat(display)

    if (prevValue !== null && operator) {
      const secondVal = waitingForOperand ? prevValue : inputValue
      const result = compute(prevValue, secondVal, operator)
      setFormula(`${prevValue} ${operator} ${secondVal} =`)
      setDisplay(String(result))
      setPrevValue(result)
      setLastOperand(secondVal)
      setLastOperator(operator)
      setOperator(null)
      setWaitingForOperand(true)
      setLastActionWasEqual(true)
    } else if (lastActionWasEqual && lastOperator && lastOperand !== null) {
      const result = compute(inputValue, lastOperand, lastOperator)
      setFormula(`${inputValue} ${lastOperator} ${lastOperand} =`)
      setDisplay(String(result))
      setWaitingForOperand(true)
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key)
      else if (e.key === '.') inputDecimal()
      else if (e.key === '+') performOperation('+')
      else if (e.key === '-') performOperation('-')
      else if (e.key === '*') performOperation('×')
      else if (e.key === '/') {
        e.preventDefault()
        performOperation('÷')
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        handleEqual()
      } else if (e.key === 'Escape') onClose()
      else if (e.key === 'Backspace') {
        if (display.length > 1 && !waitingForOperand) {
          setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'))
        } else {
          setDisplay('0')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

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
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--row-bg)] text-[var(--text)] active:scale-95 transition-transform"
            onClick={clearAll}
          >
            {display !== '0' || prevValue !== null ? 'C' : 'AC'}
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--row-bg)] text-[var(--text)] active:scale-95 transition-transform"
            onClick={toggleSign}
          >
            ±
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--row-bg)] text-[var(--text)] active:scale-95 transition-transform"
            onClick={inputPercent}
          >
            %
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 ${
              operator === '÷'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => performOperation('÷')}
          >
            ÷
          </button>

          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('7')}
          >
            7
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('8')}
          >
            8
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('9')}
          >
            9
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 ${
              operator === '×'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => performOperation('×')}
          >
            ×
          </button>

          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('4')}
          >
            4
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('5')}
          >
            5
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('6')}
          >
            6
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 ${
              operator === '-'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => performOperation('-')}
          >
            -
          </button>

          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('1')}
          >
            1
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('2')}
          >
            2
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('3')}
          >
            3
          </button>
          <button
            type="button"
            className={`flex items-center justify-center h-12 text-lg font-semibold rounded-xl border transition-all active:scale-95 ${
              operator === '+'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent)]'
            }`}
            onClick={() => performOperation('+')}
          >
            +
          </button>

          <button
            type="button"
            className="col-span-2 flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={() => inputDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-h)] hover:bg-[var(--row-bg)] active:scale-95 transition-transform"
            onClick={inputDecimal}
          >
            .
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-12 text-lg font-semibold rounded-xl bg-[var(--positive)] text-white active:scale-95 transition-transform shadow-sm"
            onClick={handleEqual}
          >
            =
          </button>
        </div>
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
