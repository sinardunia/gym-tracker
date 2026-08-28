import { useAuth } from '../lib/supabase/auth'
import { useApp } from '../store/AppContext'

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut, isConfigured } = useAuth()
  const { isSyncing, lastSyncAt } = useApp()

  if (!isConfigured) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        Offline mode only — Supabase not configured
      </div>
    )
  }

  if (loading) {
    return <div className="text-xs text-zinc-500">Checking auth…</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-medium">Sync across devices</div>
        <p className="text-xs text-zinc-500">
          Works fully offline. Sign in to backup & sync your workouts automatically in background.
        </p>
        <button
          onClick={() => signInWithGoogle().catch((e) => alert(e.message))}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M21.8 12.19c0-.64-.06-1.27-.17-1.88H12v3.56h5.5c-.24 1.26-.96 2.33-2.04 3.05v2.54h3.3c1.93-1.78 3.04-4.4 3.04-7.27z"
            />
            <path
              fill="currentColor"
              d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.3-2.54c-.92.62-2.1.98-3.32.98-2.55 0-4.71-1.72-5.48-4.04H2.12v2.56A10 10 0 0012 22z"
            />
            <path
              fill="currentColor"
              d="M6.52 13.97A6.3 6.3 0 016.17 12c0-.68.12-1.35.35-1.97V7.47H2.12A10 10 0 000 12c0 1.62.39 3.15 1.08 4.53l3.44-2.56z"
            />
          </svg>
          Continue with Google
        </button>
        <span className="text-[11px] text-zinc-400">Offline-first • data stays on device until you sign in</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <img
        src={user.user_metadata?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email ?? 'U')}`}
        alt=""
        className="h-8 w-8 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{user.user_metadata?.full_name ?? user.email}</div>
        <div className="truncate text-xs text-zinc-500">{user.email}</div>
        <div className="text-[11px] text-zinc-400">
          {isSyncing ? 'Syncing…' : lastSyncAt ? `Synced ${new Date(lastSyncAt).toLocaleTimeString()}` : 'Offline ready'}
          {!navigator.onLine && ' • Offline'}
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Sign out
      </button>
    </div>
  )
}

export function SyncBadge() {
  const { isSyncing, lastSyncAt } = useApp()
  const { user, isConfigured } = useAuth()
  if (!isConfigured || !user) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-white dark:text-zinc-900">
      <span className={`h-2 w-2 rounded-full ${isSyncing ? 'animate-pulse bg-amber-400' : navigator.onLine ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
      {isSyncing ? 'Syncing' : navigator.onLine ? (lastSyncAt ? 'Synced' : 'Online') : 'Offline'}
    </span>
  )
}
