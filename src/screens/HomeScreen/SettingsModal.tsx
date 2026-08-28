import type { RefObject } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { BackupControls } from '../../components/BackupControls'
import { FeedbackCard } from '../../components/FeedbackCard'
import { useI18n, type Lang } from '../../i18n'
import { useAuth } from '../../lib/supabase/auth'
import { GITHUB_URL, SAWERIA_URL } from '../../lib/config'
import { useApp } from '../../store/AppContext'
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
  const { user, loading, signInWithGoogle, signOut, isConfigured } = useAuth()
  const { isSyncing, lastSyncAt } = useApp()
  return (
    <ConfirmDialog
      title={tr('home.settings')}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      ariaLabel={tr('home.settings')}
    >
      <div className="flex flex-col gap-5">
        <BackupControls state={backupState} onImport={onImportBackup} />

        {isConfigured && (
          <section className="flex flex-col gap-3">
            <h3 className="text-brand-heading text-sm font-semibold uppercase tracking-wide">{tr('account.title')}</h3>
            {loading ? (
              <p className="text-brand-text text-[13px]">Checking auth…</p>
            ) : !user ? (
              <div className="flex flex-col gap-2">
                <p className="text-brand-text text-[13px]">{tr('account.notSignedIn')}</p>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M21.8 12.19c0-.64-.06-1.27-.17-1.88H12v3.56h5.5c-.24 1.26-.96 2.33-2.04 3.05v2.54h3.3c1.93-1.78 3.04-4.4 3.04-7.27z" />
                    <path fill="currentColor" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.3-2.54c-.92.62-2.1.98-3.32.98-2.55 0-4.71-1.72-5.48-4.04H2.12v2.56A10 10 0 0012 22z" />
                    <path fill="currentColor" d="M6.52 13.97A6.3 6.3 0 016.17 12c0-.68.12-1.35.35-1.97V7.47H2.12A10 10 0 000 12c0 1.62.39 3.15 1.08 4.53l3.44-2.56z" />
                  </svg>
                  {tr('account.signIn')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-card px-3 py-2.5">
                <img
                  src={user.user_metadata?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email ?? 'U')}`}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-brand-heading">{user.user_metadata?.full_name ?? user.email}</div>
                  <div className="truncate text-xs text-brand-text">{user.email}</div>
                  <div className="text-[11px] text-brand-text">
                    {isSyncing ? tr('account.syncing') : lastSyncAt ? tr('account.synced', { time: new Date(lastSyncAt).toLocaleTimeString() }) : tr('account.offlineReady')}
                    {!navigator.onLine && ` • ${tr('account.offline')}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-row dark:hover:bg-zinc-800"
                >
                  {tr('account.signOut')}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-brand-heading text-sm font-semibold uppercase tracking-wide">{tr('lang.title')}</h3>
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

        <section className="flex flex-col gap-3">
          <h3 className="text-brand-heading text-sm font-semibold uppercase tracking-wide">{tr('theme.title')}</h3>
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

        <section className="flex flex-col gap-3">
          <h3 className="text-brand-heading text-sm font-semibold uppercase tracking-wide">{tr('about.title')}</h3>
          <p className="text-brand-text text-[13px]">{tr('about.desc', { version: __APP_VERSION__ })}</p>
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
