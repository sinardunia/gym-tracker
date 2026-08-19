import { useI18n } from '../i18n'
import { Home, CalendarDays, Clock, ChartNoAxesColumn } from 'lucide-react'

export type TabKey = 'home' | 'planning' | 'history' | 'progress'

export function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}) {
  const { tr } = useI18n()

  const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
    { key: 'home', label: tr('nav.home'), icon: Home },
    { key: 'planning', label: tr('nav.planning'), icon: CalendarDays },
    { key: 'history', label: tr('nav.history'), icon: Clock },
    { key: 'progress', label: tr('nav.progress'), icon: ChartNoAxesColumn },
  ]

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] h-[64px] z-10 bg-brand-card border-t border-brand-border grid grid-cols-4"
      aria-label="Main Navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            type="button"
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium border-none bg-none cursor-pointer transition-colors ${
              isActive ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-text'
            }`}
            onClick={() => onTabChange(tab.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}