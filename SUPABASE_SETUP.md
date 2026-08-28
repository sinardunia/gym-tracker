# Supabase Backend Setup — Offline-First

This app is **offline-first**: it works 100% locally (IndexedDB + localStorage) and syncs to Supabase in the background when you are online and signed in.

## 1. Create / confirm Supabase project

- URL: `https://kniqcstlfsohslhwobjb.supabase.co`
- Anon key already in `.env`

## 2. Run database migration

Open **Supabase Dashboard → SQL Editor → New query**, paste and run:

```sql
-- Copy full content from supabase/migrations/20260829_init.sql
```

File: `supabase/migrations/20260829_init.sql:1`

Verify: `Table Editor` should show `workouts`, `routines`, `user_state`, `profiles`.

Test anon can query (should return empty, not 404):

```js
// in browser console after login
import { supabase } from './src/lib/supabase/client.ts'
await supabase.from('workouts').select('id').limit(1)
```

## 3. Configure Google OAuth

1. **Google Cloud Console** → APIs & Services → Credentials
   - Client ID: `158697693366-qsiiiegj76ttrp9bm45fhg41j72e6ecb.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-...` (keep secret)
   - **Authorized redirect URI (exact, no wildcard):** `https://kniqcstlfsohslhwobjb.supabase.co/auth/v1/callback`
   - **Authorized JavaScript origin:** `https://kniqcstlfsohslhwobjb.supabase.co` and `http://localhost:5173`
   - Save and wait 5 minutes for propagation.

2. **Supabase Dashboard → Authentication → Providers → Google**
   - Enable Google
   - Paste Client ID + Client Secret
   - Save

3. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `http://localhost:5173` (dev) — after deploying, change to your prod URL `https://your-domain.vercel.app`
   - **Additional Redirect URLs (one per line, must be exact origin without trailing slash):**
     ```
     http://localhost:5173
     http://localhost:5173/
     https://your-domain.vercel.app
     https://your-domain.vercel.app/
     ```
   - If you test on Vercel preview, add that preview URL too. Wildcard `/*` is supported but add both with/without slash to avoid `redirect_uri_mismatch`.
   - App code now uses `window.location.origin` (`src/lib/supabase/auth.tsx:44`) so it matches whatever domain you are on.

## 4. How offline-first sync works

- **Local is source of truth**: every `setState` writes immediately to `localStorage` + `IndexedDB` (`src/lib/storage.ts:60`). UI never blocks on network.
- **Push** (`src/lib/supabase/sync.ts:45`): debounced 1200ms, upserts `workouts` / `routines` / `user_state` with `user_id = auth.uid()`. If offline, queued in `localStorage` (`gym-tracker.pendingSync`) and flushed on `online` event.
- **Pull** (`src/lib/supabase/sync.ts:102`): on sign-in, fetches remote `workouts`/`routines`/`user_state`, merges with `mergeStates` (last-write-wins by `savedAt`, with empty-check to avoid data loss) — `src/lib/supabase/sync.ts:168`.
- **Conflict**: last write wins. For gym data this is safe; future improvement could be per-entity merge.
- **RLS**: all tables have `auth.uid() = user_id` policies, so users only see their own data (`supabase/migrations/20260829_init.sql:78`).

## 5. Verify

```bash
bun run dev
# Open http://localhost:5173
# 1. Use app offline (airplane mode) — should work
# 2. Sign in with Google — banner shows Synced
# 3. Add workout offline, go online — auto push
# 4. Open second device/incognito, sign in — pull shows same data
```

## 6. Troubleshooting

- `Could not find table...` → migration not run. Run step 2.
- **`Error 400: redirect_uri_mismatch` / `Access blocked: This app's request is invalid`** → This is Google rejecting the redirect. Fix:
  1. Google Cloud Console must have `https://kniqcstlfsohslhwobjb.supabase.co/auth/v1/callback` in **Authorized redirect URIs** (exact string, no slash variant).
  2. Supabase Dashboard → Auth → URL Config → **Redirect URLs** must include your current origin exactly as shown in browser address bar (e.g. `http://localhost:5173` or `https://xxx.vercel.app`). Add both with and without trailing `/`.
  3. Clear site cookies for `supabase.co` and `accounts.google.com`, wait 5 min, retry.
  4. Verify Vercel env vars are set: Vercel → Project Settings → Environment Variables → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID` → Redeploy.
- Sync not happening → check browser console `[supabase sync]`, ensure `VITE_SUPABASE_URL` + `anonKey` correct and user is signed in (`AuthButton` shows email).
- Need to reset: `localStorage.clear()` + delete rows in Supabase Table Editor.

## 7. Next improvements (optional)

- Enable Realtime: uncomment `alter publication` lines in migration and set `realtime: true` in sync.
- Supabase Storage for progress photos.
- Background Sync API for more robust offline queue.
