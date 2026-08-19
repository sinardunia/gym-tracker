/* eslint-disable react/only-export-components */
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react'
import type { ComponentProps } from 'react'

export const CARD_CLASSES =
  'bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col gap-3'

export function Card({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <section className={`${CARD_CLASSES} ${className}`.trim()}>{children}</section>
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-col gap-4 px-4 pt-6 pb-[calc(48px+env(safe-area-inset-bottom))] flex-1">
      {children}
    </main>
  )
}

const BUTTON_BASE =
  'px-4 py-3 rounded-[10px] border border-transparent cursor-pointer font-[inherit] text-base disabled:opacity-50 disabled:cursor-not-allowed'

const BUTTON_VARIANTS = {
  primary: 'bg-brand-accent text-white',
  positive: 'bg-brand-positive text-white',
  secondary: 'bg-transparent border-brand-border text-brand-heading hover:border-brand-accent',
  danger: 'bg-transparent border-brand-danger text-brand-danger hover:bg-brand-danger-bg',
} as const

export function Button({
  variant = 'primary',
  sm = false,
  className = '',
  ...rest
}: ComponentProps<'button'> & {
  variant?: keyof typeof BUTTON_VARIANTS
  sm?: boolean
}) {
  return (
    <button
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${sm ? 'text-[13px] px-2.5 py-1.5 rounded-md' : ''} ${className}`.trim()}
      {...rest}
    />
  )
}

const ICON_BUTTON_BASE =
  'inline-flex items-center justify-center shrink-0 w-11 h-11 p-0 rounded-lg border border-brand-border bg-transparent text-brand-heading cursor-pointer hover:border-brand-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1 disabled:opacity-35 disabled:cursor-not-allowed'

const ICON_BUTTON_VARIANTS = {
  default: '',
  danger: 'text-brand-danger border-brand-danger hover:bg-brand-danger-bg',
  positive: 'text-brand-positive border-brand-positive hover:bg-brand-positive-bg',
} as const

export function IconButton({
  variant = 'default',
  className = '',
  ...rest
}: ComponentProps<'button'> & {
  variant?: keyof typeof ICON_BUTTON_VARIANTS
}) {
  return (
    <button
      className={`${ICON_BUTTON_BASE} ${ICON_BUTTON_VARIANTS[variant]} ${className}`.trim()}
      {...rest}
    />
  )
}

const FIELD_BASE =
  'w-full px-3 py-2.5 border border-brand-border rounded-lg bg-brand-bg text-brand-heading text-base font-[inherit] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_BASE} ${className}`.trim()} {...rest} />
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD_BASE} cursor-pointer ${className}`.trim()} {...rest} />
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_BASE} resize-y min-h-10 text-sm ${className}`.trim()} {...rest} />
}