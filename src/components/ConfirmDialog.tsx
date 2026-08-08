import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

export function ConfirmDialog({
  title,
  body,
  children,
  onClose,
  returnFocusRef,
  ariaLabel,
}: {
  title?: string
  body?: string
  children: ReactNode
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
  ariaLabel?: string
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    first?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || focusables.length === 0) return
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const target = returnFocusRef?.current ?? previous
    return () => {
      target?.focus()
    }
  }, [returnFocusRef])

  return (
    <div
      ref={dialogRef}
      className="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className="confirm-card">
        {title && <h3>{title}</h3>}
        {body && <p className="muted">{body}</p>}
        {children}
      </div>
    </div>
  )
}
