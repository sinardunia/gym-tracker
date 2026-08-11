import { useI18n } from '../i18n'
import { Icon } from './Icon'

export type TabKey = 'home' | 'planning' | 'history' | 'progress'

export function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}) {
  const { tr } = useI18n()

  const tabs: { key: TabKey; label: string; icon: 'home' | 'calendar' | 'clock' | 'chart' }[] = [
    { key: 'home', label: tr('nav.home'), icon: 'home' },
    { key: 'planning', label: tr('nav.planning'), icon: 'calendar' },
    { key: 'history', label: tr('nav.history'), icon: 'clock' },
    { key: 'progress', label: tr('nav.progress'), icon: 'chart' },
  ]

  return (
    <nav className="bottom-nav" aria-label="Main Navigation">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <Icon name={tab.icon} size={20} />
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
