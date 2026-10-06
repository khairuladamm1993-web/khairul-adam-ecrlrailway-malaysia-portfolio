# Phase 2 release-candidate validation — 6 October 2026

Branch: `migration/full-portfolio`

Starting commit for this RC pass:
`7ca0e8e1476ad9c1793d2f248cc698d22c8bf787`

Main was not merged or modified. No Cloudflare Worker/D1 deployment, Supabase project
recreation, schema migration or production analytics mutation was performed.

## RC corrections completed

- Session profile lookup is now scoped to the authenticated `user_id` in both initial
  session validation and the member data bundle. This prevents an Admin session from
  failing when RLS allows it to see multiple member profiles.
- Logout header state now immediately returns to Public rather than retaining the prior
  member identity until another render.
- Member engagement lifecycle now removes activity listeners/timers, flushes before
  logout while the authenticated session is still valid, flushes on hidden/pagehide,
  and prevents duplicate listener accumulation after consent toggles.
- Practical Member view now includes the protected Rolling Stock Library section.
- Generic protected member resources restore saved progress and can be marked complete
  through `save_progress(...)`; no direct table write is introduced.
- Existing Admin dashboard remains server-role gated and continues to use existing
  `admin_summary`, `admin_save_content` and `admin_set_member_enabled` RPCs.
- Public preview isolation is unchanged.

## Backend state verified

- Supabase project: MR Platform / `kfudisbzdgsefdjoopzu`, ACTIVE_HEALTHY.
- Auth users: 0 at this checkpoint; therefore a real production Member/Admin browser
  session cannot yet be claimed as tested.
- `member_content`: 0 rows.
- `member_files`: 0 rows.
- member profiles / attempts / progress / engagement: 0 rows before first real account.
- All ten approved `quiz_banks` contain exactly sixteen questions.
- `quiz_attempts.passed` is database-derived from `score >= 12`.
- Supabase Auth Site URL and Redirect URL are already configured for the production
  GitHub Pages domain. Production `main` still lacks the migration gateway, so the
  real magic-link callback test waits for controlled publication.

## Automated auth/runtime validation — 12 / 12 PASS

Node 22 targeted runtime checks executed against the RC access implementation:

1. no session -> Public
2. invalid user/session -> Public
3. server Member role
4. server Admin role
5. session profile scoped to authenticated user
6. logout -> Public
7. quiz persistence uses `submit_quiz`
8. progress uses `save_progress`
9. engagement blocked until explicit consent
10. Member denied Admin operation
11. role RPC failure fails closed
12. only browser-safe publishable key / server role RPC is used

Exact current `assets/access.js`, `assets/member-gateway.js`, and
`tests/auth-wiring.test.cjs` also pass JavaScript syntax parsing.

The repository test file additionally contains static regression checks for Public header
reset, tracker listener cleanup, pagehide/visibility lifecycle, pre-logout flush,
Rolling Stock Member rendering, and progress RPC use.

## Chromium responsive validation — 27 / 27 PASS

Headless Chromium was run against the actual Phase 2 gateway/member/admin CSS contracts
using representative Auth, Member and Admin dialog structures.

Viewports:

- 320 × 568
- 390 × 844
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1024 × 1366 (iPad 13-inch portrait CSS proxy)
- 1366 × 1024 (iPad 13-inch landscape CSS proxy)
- 1366 × 768
- 1440 × 900

Each viewport tested all three dialog states. Results: no document horizontal overflow,
no dialog/control clipping beyond viewport width, controls remain at least 42px high,
and long Member/Admin content scrolls vertically rather than horizontally.

This is browser/emulated validation, **not physical iPad Safari validation**.

## Existing public regression baseline

The previous master-correction checkpoint recorded 40 automated checks plus broad
Chromium public viewport coverage before Phase 2 auth wiring. The current RC preserves
the approved public design and preview builder; Phase 2-specific changes are covered by
the targeted checks above.

A branch-only GitHub Actions workflow (`.github/workflows/migration-rc.yml`) has been
added to execute `npm ci && npm test` and validate preview-builder Python syntax on
future migration pushes. No workflow result was surfaced through the available connector
at this checkpoint, so full-suite CI is not claimed as PASS here.

## Release boundary

This branch is suitable for controlled release-candidate review, not automatic merge.

Before production publication:

1. review the final branch diff;
2. publish the migration in a controlled step;
3. complete the first real verified email/magic-link session;
4. verify Member RLS reads, quiz persistence and progress writes with that real session;
5. explicitly map Adam's confirmed auth user into the existing private owner mapping;
6. verify Admin access and ordinary-Member Admin denial with real sessions;
7. run physical iPad Air 13-inch Safari checks for touch, safe areas, browser bars,
   portrait/landscape, split-screen and dialog scrolling;
8. publish approved protected member content/files separately; current protected content
   tables are intentionally empty.
