# 2. Extract a service layer and shared types out of inline Supabase calls

## Status
Accepted

## Context
After ADR 0001, screen bodies lived in `src/screens/`, but every screen still called
`supabase.from(...)` / `supabase.auth.*` directly, inline, mixed in with UI code and local state
typed as `any` or `any[]`. `src/types/` was empty — there was no schema reference anywhere in the
frontend to work from, and no schema-generation setup (no Supabase CLI codegen, no shared Pydantic
models usable from the sibling `backend/` — that's a separate Python service that only writes AI
summaries back onto `events`; it doesn't define types for this app).

Roughly 30 distinct query call-sites were spread across 10 screens and 1 shared component, each
selecting slightly different columns and mixing `.single()` / `.maybeSingle()` / thrown vs.
swallowed errors inconsistently — not because of a coherent design, but because each screen grew
independently.

## Decision
1. **`src/types/`**: `Profile`, `Team`, `Event`, `EventAttendance`/`AttendanceStats`,
   `Questionnaire` — modelled directly from the fields each screen actually reads or writes.
2. **`src/services/{auth,profiles,teams,events,attendance,questionnaires}.ts`**: one named,
   documented function per distinct query pattern found in the screens (e.g.
   `getRoleAndTeam(userId)`, `getTeamPlayers(teamId)`, `setAttendanceStatus(...)`). Every screen
   was then rewired to call these instead of touching `supabase` directly.
3. Where two call-sites made literally the same query, they were consolidated into one function.
   Where they didn't — different columns, or different `.single()`/error semantics — they were
   kept as distinct functions rather than force-fit into one parameterised mega-function.

## Consequences

**Verified outcomes:**
- `grep`-confirmed: no screen or component imports `supabase` directly any more; every access goes
  through a named service function. A future table/column rename touches one service file instead
  of N screens.
- `any`/`any[]` eliminated from screen state and service return types, except `catch (error: any)`
  blocks — left alone deliberately (see the main architecture doc's "Known gaps").
- `tsc --noEmit` passes throughout; the refactor was done and verified one screen at a time.

**Deliberate behavior-preservation calls made during the refactor:**
- Several inline queries used `.single()` but never actually read the returned `error` — for
  those, the equivalent service function uses `.maybeSingle()` instead, which is behaviorally
  identical for every caller that ignores the error (verified individually, not assumed).
- The one query that *did* check and re-throw the error (`profiles` lookup by id, for the
  Player Detail screen) kept `.single()` + throw in `getProfileById`.
- `AddEventScreen.handleSave` gained one new guard (`if (!user) throw new Error(...)`) that wasn't
  in the original — previously a null user would have silently queried with an `undefined` id.
  This is the one intentional behavior change in the whole refactor, and it only fires on an edge
  case (no session) that should already be unreachable behind the route guard from ADR 0001.

## Alternatives considered
- **A generic repository/CRUD wrapper** (e.g. `db.get('profiles', filters)`) — rejected as
  needlessly abstract for 6 tables and ~30 call sites; named functions per use case are more
  self-documenting and just as reusable at this scale.
- **Supabase CLI-generated types** from the live schema — the more scalable long-term answer, but
  out of scope here since it requires DB/project access this refactor didn't touch. Worth revisiting
  once the schema stabilises; `src/types/` was deliberately written to match generated-type shape
  (flat interfaces, snake_case fields) so swapping later is a drop-in, not a rewrite.
