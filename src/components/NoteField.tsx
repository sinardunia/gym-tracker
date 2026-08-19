import { Textarea } from './ui'

export function NoteField({
  value,
  onChange,
  placeholder,
  compact,
  label,
  onFocus,
  onBlur,
}: {
  value: string
  onChange: (note: string) => void
  placeholder: string
  compact?: boolean
  label: string
  onFocus?: () => void
  onBlur?: () => void
}) {
  return (
    <Textarea
      className={compact ? 'min-h-[36px] resize-none' : undefined}
      value={value}
      placeholder={placeholder}
      aria-label={label}
      rows={compact ? 1 : 2}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
}
