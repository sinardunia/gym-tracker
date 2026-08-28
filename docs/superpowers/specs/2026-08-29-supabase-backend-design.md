# Supabase Backend Design for Gym Tracker

**Date**: 2026-08-29  
**Status**: Approved for Implementation

---

## 1. Architecture: Local-First with Background Sync

Using **Legend-State + Supabase** per Supabase's own offline-first guides.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   React App     │────▶│  Legend-State    │────▶│  Supabase   │
│   (UI)          │     │  (Local Cache)   │     │  (Postgres) │
└─────────────────┘     └──────────────────┘     └─────────────┘
                              │                        │
                              ▼                        ▼
                        ┌─────────────┐          ┌─────────────┐
                        │ IndexedDB   │          │    Auth     │
                        │ (Persist)   │          │  (OAuth)    │
                        └─────────────┘          └─────────────┘
```

**Why Legend-State:**
- Built-in offline queue with exponential backoff retry
- Automatic conflict resolution (last-write-wins by default)
- Tiny bundle size (~3kb)
- Works with existing React/Vite stack
- Supabase team recommends it for offline-first apps

---

## 2. Database Schema (Postgres)

```sql
-- Users table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  username text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workouts (sessions)
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  routine_id uuid references public.routines(id),
  day_id uuid,
  started_at timestamptz not null,
  finished_at timestamptz,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

-- Exercises within a workout
create table public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  name text not null,
  unit text not null check (unit in ('kg', 'plate', 'bodyweight')),
  note text,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

-- Sets within an exercise
create table public.workout_sets (
  id uuid default gen_random_uuid() primary key,
  exercise_id uuid references public.workout_exercises(id) on delete cascade not null,
  reps int not null,
  weight_kg numeric(6,2) not null,
  type text not null check (type in ('working', 'warmup', 'dropset')),
  parent_id uuid references public.workout_sets(id), -- for dropsets
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

-- Routines
create table public.routines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

-- Routine days
create table public.routine_days (
  id uuid default gen_random_uuid() primary key,
  routine_id uuid references public.routines(id) on delete cascade not null,
  name text not null,
  exercise_names text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Routine schedule (weekday -> day_id)
create table public.routine_schedules (
  routine_id uuid references public.routines(id) on delete cascade not null,
  weekday int not null check (weekday between 0 and 6),
  day_id uuid references public.routine_days(id) on delete set null,
  primary key (routine_id, weekday)
);

-- Exercise library (global + user custom)
create table public.library_exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id), -- null = global/default
  name text not null,
  aliases text[] not null default '{}',
  created_at timestamptz default now()
);

-- Enable Realtime for live sync
alter publication supabase_realtime add table workouts, workout_exercises, workout_sets, routines, routine_days, routine_schedules, library_exercises;

-- Trigger for updated_at
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger handle_updated_at_workouts before update on public.workouts
for each row execute procedure handle_updated_at();
-- repeat for other tables...
```

---

## 3. Row Level Security (RLS)

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_schedules enable row level security;
alter table public.library_exercises enable row level security;

-- Profiles: users see/edit own profile
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

-- Workouts: users see/edit own workouts
create policy "own workouts" on public.workouts
  for all using (auth.uid() = user_id);

-- Exercises: users see/edit exercises in their workouts
create policy "own workout exercises" on public.workout_exercises
  for all using (
    workout_id in (select id from public.workouts where user_id = auth.uid())
  );

-- Sets: users see/edit sets in their workout exercises
create policy "own workout sets" on public.workout_sets
  for all using (
    exercise_id in (
      select id from public.workout_exercises 
      where workout_id in (select id from public.workouts where user_id = auth.uid())
    )
  );

-- Routines: users see/edit own routines
create policy "own routines" on public.routines
  for all using (auth.uid() = user_id);

-- Routine days: users see/edit days in their routines
create policy "own routine days" on public.routine_days
  for all using (
    routine_id in (select id from public.routines where user_id = auth.uid())
  );

-- Routine schedules: users see/edit schedules for their routines
create policy "own routine schedules" on public.routine_schedules
  for all using (
    routine_id in (select id from public.routines where user_id = auth.uid())
  );

-- Library exercises: users see global + their own
create policy "library exercises" on public.library_exercises
  for select using (user_id is null or user_id = auth.uid());
create policy "own library exercises" on public.library_exercises
  for insert with check (user_id = auth.uid());
create policy "update own library" on public.library_exercises
  for update using (user_id = auth.uid());
```

---

## 4. Sync Strategy (Legend-State)

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { configureSynced, syncedSupabase } from '@legendapp/state/sync-plugins/syncedSupabase'
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage'
import AsyncStorage from '@react-native-async-storage/async-storage' // or use idb for web

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export const synced = configureSynced(syncedSupabase, {
  persist: {
    plugin: observablePersistAsyncStorage({ AsyncStorage }),
  },
  supabase,
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  fieldDeleted: 'deleted',
  generateId: () => crypto.randomUUID(),
})

// Collection factories
export const workouts$ = synced({
  supabase,
  collection: 'workouts',
  select: '*, workout_exercises(*, workout_sets(*))',
  actions: ['read', 'create', 'update', 'delete'],
  realtime: true,
  persist: { name: 'workouts', retrySync: true },
  retry: { infinite: true },
})

export const routines$ = synced({
  supabase,
  collection: 'routines',
  select: '*, routine_days(*), routine_schedules(*)',
  actions: ['read', 'create', 'update', 'delete'],
  realtime: true,
  persist: { name: 'routines', retrySync: true },
  retry: { infinite: true },
})

export const libraryExercises$ = synced({
  supabase,
  collection: 'library_exercises',
  select: '*',
  actions: ['read', 'create', 'update', 'delete'],
  realtime: true,
  persist: { name: 'library', retrySync: true },
  retry: { infinite: true },
})
```

---

## 5. Auth Flow (OAuth)

```typescript
// lib/auth.ts
import { supabase } from './supabase/client'

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return error
}

export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
```

---

## 6. Migration Strategy (Local → Supabase)

```typescript
// lib/migration.ts
// Run once on first login after Supabase setup
export async function migrateLocalToSupabase(localState: PersistedState, userId: string) {
  // 1. Create routines first
  for (const routine of localState.routines) {
    const { data: routineData } = await supabase
      .from('routines')
      .insert({ ...routine, user_id: userId })
      .select()
      .single()
    
    // 2. Create routine days
    for (const day of routine.days) {
      await supabase
        .from('routine_days')
        .insert({ ...day, routine_id: routineData.id })
    }
    
    // 3. Create schedule
    for (const [weekday, dayId] of Object.entries(routine.schedule)) {
      await supabase
        .from('routine_schedules')
        .insert({ routine_id: routineData.id, weekday: Number(weekday), day_id: dayId })
    }
  }
  
  // 4. Create workouts (sessions)
  for (const workout of localState.sessions) {
    const { data: workoutData } = await supabase
      .from('workouts')
      .insert({ ...workout, user_id: userId })
      .select()
      .single()
    
    // 5. Create exercises + sets
    for (const exercise of workout.exercises) {
      const { data: exData } = await supabase
        .from('workout_exercises')
        .insert({ ...exercise, workout_id: workoutData.id })
        .select()
        .single()
      
      for (const set of exercise.sets) {
        await supabase
          .from('workout_sets')
          .insert({ ...set, exercise_id: exData.id })
      }
    }
  }
}
```

---

## 7. Implementation Phases

1. **Phase 1**: Supabase project setup, schema, RLS, Auth config
2. **Phase 2**: Legend-State integration, sync collections
3. **Phase 3**: Auth UI (OAuth buttons, callback route)
4. **Phase 4**: Migration script for existing local data
5. **Phase 5**: Replace local storage with synced collections
6. **Phase 6**: Test offline/online transitions, conflict handling

---

## 8. Required Credentials from User

- **Supabase Project URL** (e.g., `https://xxx.supabase.co`)
- **Supabase Anon/Public Key**
- **Google OAuth Client ID & Secret** (for Google auth)
- **GitHub OAuth Client ID & Secret** (for GitHub auth)

These will be stored in `.env` as:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_CLIENT_ID=...
VITE_GITHUB_CLIENT_ID=...
```

---

## 9. Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Realtime sync across devices? | Yes, enabled via `realtime: true` |
| Conflict resolution? | Last-write-wins (default), can customize later |
| Storage for images? | Not needed for MVP |
| Platform? | Web PWA (Vite), IndexedDB for persistence |

---

## 10. Next Steps

1. User provides Supabase credentials
2. Run `writing-plans` skill to create detailed implementation plan
3. Execute implementation phases