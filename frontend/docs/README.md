# Frontend Architecture

This document explains how the Expo Router app is organised, why it's shaped this way, and how
data flows through it. If you're new to this codebase, read this before diving into `src/`.

The reasoning behind the two big structural decisions here is written up in full in
[`docs/adr/`](./adr) — this file is the map, the ADRs are the "why".

## Folder structure

```
app/                      Expo Router route table — ONLY routing, nothing else
  (auth)/                 login, signup, onboarding routes
  (tabs)/                 home, schedule, squad, settings, events/[id], player/[id]
  _layout.tsx             root layout: renders the Stack, gated by useProtectedRoute()
  add-event.tsx           modal route
  index.tsx, +html.tsx, +not-found.tsx   framework-required special files

src/
  screens/                the actual screen implementations (one per route)
    auth/                 LoginScreen, SignupScreen, OnboardingScreen
  components/             reusable UI: AttendanceView, CoachSummary, ReviewForm, Themed
  hooks/                  useColorScheme, useClientOnlyValue
  navigation/             useProtectedRoute — the auth/onboarding route guard
  services/               all Supabase access, one file per domain
  types/                  TypeScript interfaces mirroring the DB tables
  styles/                 shared style/theme constants (Colors.ts)
  state/                  currently empty — reserved for shared client state (see Known gaps)
  utils/                  currently empty — reserved for pure helper functions
```

Every file under `app/` that represents a page is a one-line re-export:

```tsx
export { default } from '@/screens/HomeScreen';
```

Expo Router requires `app/` to stay at the project root as the file-based route table, so it can't
be eliminated — but nothing says the *implementation* has to live there too. Keeping route files
this thin means `app/`'s directory listing doubles as a table of contents for the app's routes,
and `src/screens/` is where you actually go to read or change a screen.

## Data flow

```
Screen (src/screens/*)
  → calls a named function from src/services/<domain>.ts
      → src/services/supabase.ts (the one Supabase client instance)
          → Supabase (Postgres + Auth)
```

Example — Squad screen loading its roster:

```ts
// src/screens/SquadScreen.tsx
const user = await getCurrentUser();                    // src/services/auth.ts
const profile = await getRoleAndTeam(user.id);           // src/services/profiles.ts
const players = await getTeamPlayers(profile.team_id);   // src/services/profiles.ts
```

No screen imports `supabase` directly — every read/write goes through a named, typed service
function. That's a hard rule, not just a convention: it means a table or column rename touches one
service file instead of hunting through every screen that happened to query it.

## Auth & routing

`src/navigation/useProtectedRoute.ts` is a hook (used only by `app/_layout.tsx`) that:

1. Tracks the current Supabase session (`getSession`, `onAuthStateChange` from `src/services/auth.ts`).
2. Once a session state is known, checks the user's `onboarding_complete` flag and redirects based
   on where they currently are:
   - no session + not already on an auth screen → `/(auth)/login`
   - session + onboarding incomplete + not already onboarding → `/(auth)/onboarding`
   - session + onboarding complete + still on an auth/onboarding/root screen → `/(tabs)/home`
3. Renders a loading spinner until the initial session check resolves, to avoid a flash of the
   wrong screen.

This is the one piece of business logic that lives in a hook rather than a service, because it's
inherently about *routing decisions*, not data access — hence `src/navigation/` rather than
`src/services/`.

## Domain model (`src/types/`)

| Type | Table | Notes |
|---|---|---|
| `Profile` | `profiles` | one row per auth user; `role` is `'coach' \| 'player'` |
| `Team` | `teams` | one per squad; has a `join_code` players use to sign up |
| `Event` | `events` | training session or match; `event_summary` is written by the separate backend AI processor |
| `EventAttendance` / `AttendanceStats` | `event_attendance` | a player's RSVP; no row = "no response" |
| `Questionnaire` | `questionnaires` | a player's post-event feedback form |

These were modelled directly from the fields each screen actually selects/inserts — there's no
Supabase-generated schema file in this repo to source them from. `../backend/` is a separate
Python service (posts AI-generated summaries back onto `events`); it doesn't define shared types
for the frontend.

## Known gaps / next steps

- **`src/state/` and `src/utils/` are empty on purpose.** Nothing in the app currently needs
  cross-screen shared state or pure helper functions beyond what's local to each screen — every
  screen independently calls `getRoleAndTeam` on focus. If that duplication starts to hurt (e.g.
  role/team flickering, or wanting to avoid the repeat fetch), that's the point to introduce a
  session/profile context in `src/state/`.
- **`LoginScreen` still has "Dev Quick Access" buttons** with hardcoded test credentials, marked
  in a comment for removal before shipping.
- **`catch (error: any)` is still used in most screens.** This was left alone deliberately —
  narrowing every catch block to `unknown` would touch nearly every screen for a purely cosmetic
  win. Worth doing in a dedicated pass if the team wants stricter lint rules later.
