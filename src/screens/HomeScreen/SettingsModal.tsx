import type { RefObject } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { BackupControls } from '../../components/BackupControls'
import { FeedbackCard } from '../../components/FeedbackCard'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
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
}: {
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
  theme: Theme
  onSetTheme: (theme: Theme) => void
  backupState: PersistedState
  onImportBackup: (state: PersistedState) => void
}) {
  const { tr } = useI18n()
  return (
    <ConfirmDialog
      title={tr('home.settings')}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      ariaLabel={tr('home.settings')}
    >
      <div className="settings-content">
        <BackupControls state={backupState} onImport={onImportBackup} />

        <section className="about-sub">
          <h3>{tr('theme.title')}</h3>
          <div
            className="theme-options"
            role="group"
            aria-label={tr('theme.title')}
          >
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                className={`theme-option${theme === option ? ' active' : ''}`}
                onClick={() => onSetTheme(option)}
              >
                <Icon
                  name={
                    option === 'light'
                      ? 'sun'
                      : option === 'dark'
                        ? 'moon'
                        : 'monitor'
                  }
                  size={16}
                />
                <span>{tr(`theme.${option}`)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="about-sub">
          <h3>{tr('about.title')}</h3>
          <p className="muted">{tr('about.desc', { version: __APP_VERSION__ })}</p>
          <div className="backup-actions">
            <a
              className="file-button btn-sm secondary"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
            >
              {tr('about.github')}
            </a>
            <a
              className="file-button btn-sm secondary"
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