import {
  Trash2,
  Pencil,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Plus,
  Clock,
  Calculator,
  X,
  Check,
  MoreVertical,
  Home,
  Calendar,
  BarChart2,
  Settings,
  Sun,
  Moon,
  Monitor,
  type LucideIcon,
} from 'lucide-react'

export type IconName =
  | 'trash'
  | 'pencil'
  | 'note'
  | 'repeat'
  | 'chevron-down'
  | 'chevron-up'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'plus'
  | 'clock'
  | 'calculator'
  | 'x'
  | 'check'
  | 'more'
  | 'home'
  | 'calendar'
  | 'chart'
  | 'settings'
  | 'sun'
  | 'moon'
  | 'monitor'

const ICON_MAP: Record<IconName, LucideIcon> = {
  trash: Trash2,
  pencil: Pencil,
  note: FileText,
  repeat: RefreshCw,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  plus: Plus,
  clock: Clock,
  calculator: Calculator,
  x: X,
  check: Check,
  more: MoreVertical,
  home: Home,
  calendar: Calendar,
  chart: BarChart2,
  settings: Settings,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
}

export function Icon({
  name,
  size = 18,
}: {
  name: IconName
  size?: number
}) {
  const LucideComponent = ICON_MAP[name]
  return <LucideComponent size={size} aria-hidden="true" />
}
