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
      if (target && document.contains(target)) {
        target.focus()
      }
    }
  }, [returnFocusRef])

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-10 flex items-center justify-center px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))] bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-[400px] flex flex-col gap-3 p-4 bg-brand-card border border-brand-border rounded-xl shadow-[0_16px_32px_rgba(0,0,0,0.2)]">
        {title && (
          <div className="flex items-center justify-between gap-2">
            <h3>{title}</h3>
            <button
              type="button"
              className="inline-flex items-center justify-center w-11 h-11 p-0 rounded-lg text-[var(--text)] hover:text-[var(--text-h)] hover:bg-[var(--row-bg)] border-none bg-transparent cursor-pointer transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {body && <p className="text-brand-text">{body}</p>}
        {children}
      </div>
    </div>
  )
}
