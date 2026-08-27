# 1. Introduce a `src/` tree; keep `app/` as routing-only

## Status
Accepted

## Context
The project used Expo Router's default layout: every screen's implementation lived directly
inside `app/`, alongside a top-level `components/`, `constants/`, and `lib/`. A `src/` directory
existed but was completely empty (9 folders, 0 files) — the intended target shape had never
actually been built out.

Expo Router requires `app/` to stay at the project root as the file-based route table; you can't
relocate it wholesale. Two realistic options existed for reorganising the rest of the code:

1. **Reorganise inside `app/`**, using Expo Router's supported underscore-prefix convention
   (`app/_components/`, `app/_services/`, etc.) to exclude helper files from routing.
2. **Move implementation into a sibling `src/`**, and reduce every `app/` route file to a thin
   re-export of the real screen living in `src/screens/`.

## Decision
We went with option 2: `src/screens/`, `src/components/`, `src/hooks/`, `src/services/`,
`src/navigation/`, `src/styles/`, `src/types/`, `src/utils/`; `app/` route files became one-line
re-exports (`export { default } from '@/screens/HomeScreen';`).

The `tsconfig.json` `@/*` path alias was repointed from the project root (`./*`) to `./src/*`.

## Consequences

**Costs accepted:**
- Every route needs a matching stub file in `app/` — small, mechanical duplication (one extra
  ~1-line file per screen), but a fixed one-time cost, not an ongoing tax.

**Benefits gained:**
- A hard, visible boundary between "this is a route" (`app/`) and "this is application logic"
  (`src/`) — meaningful given the app already has a role-gated auth flow and 8+ screens, with more
  planned.
- `src/state/`, `src/types/`, `src/services/` read as real application concerns; nesting them
  under `app/_state`, `app/_types` would bury domain modeling inside a folder whose only reason to
  exist is file-based routing.
- Matches the convention any RN/JS developer will recognise on sight, and matches what the
  project's own `__tests__/` folder already assumed (it mirrored `src/`, not `app/`, before this
  change).

**Alternative rejected:** the underscore-folder approach only reorganises *where shared code sits*
— it does nothing to force separation between routing concerns and business logic inside the
screen files themselves, which was the actual pain point (see ADR 0002).
