import type { RefObject } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { BackupControls } from '../../components/BackupControls'
import { FeedbackCard } from '../../components/FeedbackCard'
import { useI18n, type Lang } from '../../i18n'
import { GITHUB_URL, SAWERIA_URL } from '../../lib/config'
import { THEMES, type Theme } from '../../lib/theme'
import type { PersistedState } from '../../lib/types'

export function SettingsModal({
  onClose,
  returnFocusRef,
  theme,
  onSetTheme,
  backupState,
  onImportBackup,
  lang,
  onToggleLang,
}: {
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
  theme: Theme
  onSetTheme: (theme: Theme) => void
  backupState: PersistedState
  onImportBackup: (state: PersistedState) => void
  lang: Lang
  onToggleLang: () => void
}) {
  const { tr } = useI18n()
  return (
    <ConfirmDialog
      title={tr('home.settings')}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      ariaLabel={tr('home.settings')}
    >
      <div className="flex flex-col gap-4 mt-3 pt-3 border-t border-brand-border">
        <BackupControls state={backupState} onImport={onImportBackup} />

        <section className="flex flex-col gap-2.5">
          <h3>{tr('lang.title')}</h3>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={tr('lang.title')}>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-[13px] font-[inherit] cursor-pointer transition-[background,color,border-color] duration-[120ms] ${
                lang === 'id'
                  ? 'bg-brand-accent-bg border-brand-accent text-brand-heading font-semibold'
                  : 'border-brand-border bg-brand-card text-brand-text hover:border-brand-accent'
              }`}
              onClick={() => lang !== 'id' && onToggleLang()}
            >
              <span className="text-base">🇮🇩</span>
              <span>Bahasa Indonesia</span>
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-[13px] font-[inherit] cursor-pointer transition-[background,color,border-color] duration-[120ms] ${
                lang === 'en'
                  ? 'bg-brand-accent-bg border-brand-accent text-brand-heading font-semibold'
                  : 'border-brand-border bg-brand-card text-brand-text hover:border-brand-accent'
              }`}
              onClick={() => lang !== 'en' && onToggleLang()}
            >
              <span className="text-base">🇺🇸</span>
              <span>English</span>
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3>{tr('theme.title')}</h3>
          <div
            className="grid grid-cols-3 gap-2"
            role="group"
            aria-label={tr('theme.title')}
          >
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                className={`flex flex-col items-center gap-1 px-1 py-2 border rounded-lg bg-brand-card text-brand-text text-[13px] font-[inherit] cursor-pointer transition-[background,color,border-color] duration-[120ms] ${
                  theme === option
                    ? 'bg-brand-accent-bg border-brand-accent text-brand-heading font-semibold'
                    : 'border-brand-border hover:border-brand-accent'
                }`}
                onClick={() => onSetTheme(option)}
              >
                {option === 'light' ? (
                  <Sun size={16} aria-hidden="true" />
                ) : option === 'dark' ? (
                  <Moon size={16} aria-hidden="true" />
                ) : (
                  <Monitor size={16} aria-hidden="true" />
                )}
                <span>{tr(`theme.${option}`)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3>{tr('about.title')}</h3>
          <p className="text-brand-text">{tr('about.desc', { version: __APP_VERSION__ })}</p>
          <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
            <a
              className="file-button flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent text-sm font-medium"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
            >
              {tr('about.github')}
            </a>
            <a
              className="file-button flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border rounded-[10px] text-brand-heading cursor-pointer hover:border-brand-accent text-sm font-medium"
              href={SAWERIA_URL}
              target="_blank"
              rel="noreferrer"
            >
              {tr('about.support')}
            </a>
          </div>
          <FeedbackCard />
        </section>
      </div>
    </ConfirmDialog>
  )
}
