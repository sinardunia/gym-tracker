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
   - Authorized redirect: `https://kniqcstlfsohslhwobjb.supabase.co/auth/v1/callback`

2. **Supabase Dashboard → Authentication → Providers → Google**
   - Enable Google
   - Paste Client ID + Client Secret
   - Save

3. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `http://localhost:5173` (dev) and your prod URL
   - Redirect URLs: `http://localhost:5173/*`, `https://your-domain/*`

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
- `Google sign-in error: redirect mismatch` → check redirect URLs in Google + Supabase.
- Sync not happening → check browser console `[supabase sync]`, ensure `VITE_SUPABASE_URL` + `anonKey` correct and user is signed in (`AuthButton` shows email).
- Need to reset: `localStorage.clear()` + delete rows in Supabase Table Editor.

## 7. Next improvements (optional)

- Enable Realtime: uncomment `alter publication` lines in migration and set `realtime: true` in sync.
- Supabase Storage for progress photos.
- Background Sync API for more robust offline queue.
