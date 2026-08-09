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
  const [formula, setFormula] = useState('')

  function inputDigit(digit: string) {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  function inputDecimal() {
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
      const result = compute(prevValue, inputValue, operator)
      setFormula(`${prevValue} ${operator} ${inputValue} =`)
      setDisplay(String(result))
      setPrevValue(null)
      setOperator(null)
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
      <div className="calc-container">
        <div className="calc-screen">
          <div className="calc-formula">{formula}</div>
          <div className="calc-display" role="textbox" aria-label="display">
            {display}
          </div>
        </div>

        <div className="calc-keypad">
          <button type="button" className="calc-btn function" onClick={clearAll}>
            {display !== '0' || prevValue !== null ? 'C' : 'AC'}
          </button>
          <button type="button" className="calc-btn function" onClick={toggleSign}>
            ±
          </button>
          <button type="button" className="calc-btn function" onClick={inputPercent}>
            %
          </button>
          <button
            type="button"
            className={`calc-btn operator${operator === '÷' ? ' active' : ''}`}
            onClick={() => performOperation('÷')}
          >
            ÷
          </button>

          <button type="button" className="calc-btn number" onClick={() => inputDigit('7')}>
            7
          </button>
          <button type="button" className="calc-btn number" onClick={() => inputDigit('8')}>
            8
          </button>
          <button type="button" className="calc-btn number" onClick={() => inputDigit('9')}>
            9
          </button>
          <button
            type="button"
            className={`calc-btn operator${operator === '×' ? ' active' : ''}`}
            onClick={() => performOperation('×')}
          >
            ×
          </button>

          <button type="button" className="calc-btn number" onClick={() => inputDigit('4')}>
            4
          </button>
          <button type="button" className="calc-btn number" onClick={() => inputDigit('5')}>
            5
          </button>
          <button type="button" className="calc-btn number" onClick={() => inputDigit('6')}>
            6
          </button>
          <button
            type="button"
            className={`calc-btn operator${operator === '-' ? ' active' : ''}`}
            onClick={() => performOperation('-')}
          >
            -
          </button>

          <button type="button" className="calc-btn number" onClick={() => inputDigit('1')}>
            1
          </button>
          <button type="button" className="calc-btn number" onClick={() => inputDigit('2')}>
            2
          </button>
          <button type="button" className="calc-btn number" onClick={() => inputDigit('3')}>
            3
          </button>
          <button
            type="button"
            className={`calc-btn operator${operator === '+' ? ' active' : ''}`}
            onClick={() => performOperation('+')}
          >
            +
          </button>

          <button type="button" className="calc-btn number zero" onClick={() => inputDigit('0')}>
            0
          </button>
          <button type="button" className="calc-btn number" onClick={inputDecimal}>
            .
          </button>
          <button type="button" className="calc-btn equals" onClick={handleEqual}>
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
        className="floating-calc-btn"
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
