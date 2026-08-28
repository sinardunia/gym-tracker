# Move Google Login to Settings & Make Optional

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Google OAuth sign-in/sign-out UI from HomeScreen into the Settings modal, and ensure the auth feature is fully optional (hidden when Supabase not configured).

**Architecture:** The `AuthButton` component currently renders directly in HomeScreen. We move its logic into `SettingsModal` as a new "Account" section. When Supabase is not configured, the entire section is hidden. The `AuthButton.tsx` component is kept for the `SyncBadge` export but the main `AuthButton` export is removed from HomeScreen.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4

## Global Constraints

- Run `bun run typecheck` and `bun run lint` after each task
- Run `bun run test` after tasks that modify testable logic
- Do not add comments unless the fix requires explanation
- Do not change public interfaces or types
- Follow existing code patterns in the codebase

---

### Task 1: Add auth section to SettingsModal

**Files:**
- Modify: `src/screens/HomeScreen/SettingsModal.tsx`
- Modify: `src/i18n.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/lib/supabase/auth.tsx` (user, loading, signInWithGoogle, signOut, isConfigured)
- Consumes: `useApp()` from `src/store/AppContext.tsx` (isSyncing, lastSyncAt)
- Produces: auth section in SettingsModal

- [ ] **Step 1: Add i18n keys for account section**

Add to both ID and EN dictionaries in `src/i18n.tsx`:

```typescript
// ID
'account.title': 'Akun',
'account.notSignedIn': 'Belum masuk. Login untuk sinkronisasi otomatis.',
'account.signIn': 'Masuk dengan Google',
'account.signedIn': 'Masuk sebagai',
'account.syncStatus': 'Sinkronisasi: {status}',
'account.syncing': 'Menyinkronkan…',
'account.synced': 'Tersinkron {time}',
'account.offlineReady': 'Siap offline',
'account.offline': 'Offline',
'account.signOut': 'Keluar',

// EN
'account.title': 'Account',
'account.notSignedIn': 'Not signed in. Sign in for automatic sync.',
'account.signIn': 'Sign in with Google',
'account.signedIn': 'Signed in as',
'account.syncStatus': 'Sync: {status}',
'account.syncing': 'Syncing…',
'account.synced': 'Synced {time}',
'account.offlineReady': 'Offline ready',
'account.offline': 'Offline',
'account.signOut': 'Sign out',
```

- [ ] **Step 2: Add auth section to SettingsModal**

Add an "Account" section to `SettingsModal.tsx` between BackupControls and the Language section. Only render when `isConfigured` is true.

```tsx
import { useAuth } from '../../lib/supabase/auth'
import { useApp } from '../../store/AppContext'

// Inside the component, before the language section:
const { user, loading, signInWithGoogle, signOut, isConfigured } = useAuth()
const { isSyncing, lastSyncAt } = useApp()

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
```

- [ ] **Step 3: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen/SettingsModal.tsx src/i18n.tsx
git commit -m "feat(settings): add Google account section to settings modal"
```

---

### Task 2: Remove AuthButton from HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen/index.tsx`

**Interfaces:**
- Consumes: none
- Produces: HomeScreen without AuthButton

- [ ] **Step 1: Remove AuthButton import and usage**

In `src/screens/HomeScreen/index.tsx`:
- Remove the `import { AuthButton } from '../../components/AuthButton'` line
- Remove the `<AuthButton />` JSX element (line 137)

- [ ] **Step 2: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 3: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen/index.tsx
git commit -m "feat(home): remove AuthButton from home screen (moved to settings)"
```

---

### Task 3: Clean up AuthButton.tsx

**Files:**
- Modify: `src/components/AuthButton.tsx`

**Interfaces:**
- Consumes: none
- Produces: trimmed AuthButton (SyncBadge only)

- [ ] **Step 1: Remove the AuthButton component, keep SyncBadge**

Since `AuthButton` is no longer used in HomeScreen (moved to SettingsModal inline), remove the `AuthButton` export. Keep `SyncBadge` as it may be used elsewhere.

```tsx
// Remove the entire AuthButton function component
// Keep only SyncBadge
```

- [ ] **Step 2: Check if SyncBadge is used anywhere**

Search for `SyncBadge` usage. If unused, remove it too.

- [ ] **Step 3: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AuthButton.tsx
git commit -m "refactor(auth): remove unused AuthButton component"
```

---

### Task 4: Final verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `bun run build`
Expected: PASS

---

## Production Configuration Notes

The `redirect_uri_mismatch` error is a configuration issue, not a code bug. For production, ensure:

1. **Google Cloud Console** → Credentials → OAuth 2.0 Client → Authorized redirect URIs:
   - `https://kniqcstlfsohslhwobjb.supabase.co/auth/v1/callback`

2. **Supabase Dashboard** → Auth → URL Configuration → Redirect URLs:
   - `https://gym-app-tracker-test.vercel.app`
   - `https://gym-app-tracker-test.vercel.app/`

3. The `VITE_GOOGLE_CLIENT_ID` env var is declared but not used in code (Google OAuth is handled server-side by Supabase). It can be removed from `.env` and `env.d.ts` if desired.
