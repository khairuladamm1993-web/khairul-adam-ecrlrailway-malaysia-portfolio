# P01 R2.6 — simple login and release status, 1 November 2026

Scope: review P01 release status, simplify phone login on the existing recovery branch, and deliver one stable Preview before map configuration continues. Production, P02/P03/P04, hosted Auth settings/templates, databases, accounts and billing remain unchanged.

## Current status versus historical PASS

- Existing recovery project `prj_0VhBnAaagARpXZYHHTFPquxRf7xy`, team `team_0JRmhxIIyLuWMPHsxwWxJfTv`. At task start the canonical gateway alias points to staging READY `dpl_CxAh1nLsmcdzC1BLA3G75soxmswS`, code `9049307271f4f0dae53b8db35ab957a91f0ad92e`.
- Previous CI run `41283132704` was read again: completed SUCCESS on that exact code. Its 394 unit/package and 28 real synthetic-backend/browser cases remain historical valid evidence, not actual Adam-account acceptance.
- The most recent record returned for `target=production` in this recovery project is the historical ERROR deployment `dpl_HzgQuZTWrVVmGLx3UeLwAk2Z7QW6`, source `08df677bc59698c605e5920f965489d22a9d3a8e`, branch `migration/full-portfolio`, October 2026. This is not the currently served staging alias and was not changed.
- Other isolated P01 map projects have historical Vercel records labelled production READY. That provider environment label does not establish integrated P01 release approval, account acceptance, or current canonical routing.
- Read-only hosted Supabase catalog inspection confirms RLS enabled on `member_profiles`, `member_content`, `member_files`, `member_progress`, `quiz_banks` and `quiz_attempts`. `account_role` exists. No `public.r2_%` functions were returned; the separate R2 private backend gate is not repaired or enabled by this UI change.
- Real Owner login on physical iPhone and iPad remains NOT VERIFIED. Integrated Production release remains NO-GO.

## Minimal change

No new provider, Auth.js migration, project, subscription or server dependency. Keep the R2.5 supported Supabase proof recovery, PKCE, identity validation, backend role lookup, profile enablement and private/MFA boundaries unchanged.

1. Step 1 shows one email field and a send button. Repeated email confirmation typing is removed. Email ownership is still proved by Supabase.
2. Step 2 opens after the request and prefills the same email. It accepts a six-digit code if the current email has one, or the original unused email button link copied without opening it. A user arriving with an existing email can choose the explicit code/link entry button without sending another request.
3. Only one step is shown at a time. The email draft survives closing/reopening the dialog during the page visit; proof text is discarded and never stored by the UI. Logout clears the draft and recovery-step state.
4. Existing valid sessions continue restoring and refreshing through the same SDK and backend role checks. No session lifetime, rate limit or token expiry was extended.
5. The hosted email template is unchanged. A six-digit email code is not promised if the existing email contains only a button. Copy Link remains the supported alternative; already-opened or expired proof cannot be reused.

Changed files: `assets/member-gateway.js`, `scripts/build-owner-auth-recovery.cjs`, `tests/auth-wiring.test.cjs`, `tests/r22/gateway-recovery.cjs`, `.github/workflows/mrs10-p01-r22-real-backend.yml`.

## Map access boundary for the next stage

| Access | Current boundary retained | Next map work |
| --- | --- | --- |
| Public | Public approved/static references only; no account needed | Review which map layers and popups have approval to publish |
| Member | Live identity, backend `account_role`, enabled own profile and RLS | Review permitted Member layers/content without exposing Owner records |
| Owner/Admin | Backend Admin role; separate private features require existing server/MFA gates | Configure and verify private map workflow after Owner login acceptance |

No geometry, PL01–PL07, depot, spurline, popup data or map visibility rule is promoted in this login change. Map configuration remains a separate next task. The existing map build is included without map-source changes.

## Validation and handoff

Final source: `4681dc3732e83691eaf9323f5bc872f70adff1be`, tree `0bb4b002dcdb6f376e3f5d0e7245f38973c801d9`.
Branch: `fix/mrs10-p01-simple-login-r26-20261101`, based on the recorded R2.5 report checkpoint `3ddb726260c016f3622aa077e1ff69c34916aa09`.

- Local final regression: 376/376 PASS; unit tests include mocked Auth and browser DOM fixtures.
- Local final artifact and isolated R2 provider checks: 19/19 PASS. Total unit/package 395.
- Final real CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41287593378 — completed SUCCESS on the exact final source SHA; job `124791946247`. Decoded logs confirm 376 + 3 + 16 = 395 unit/package PASS and 28/28 real backend/browser integration cases PASS.
- Real browser tests request synthetic email through the actual Step 1 form, verify prefilled Step 2, then authenticate copied-link and OTP proof in an independent browser context. Existing real backend role/RLS, reload/logout/replay and isolation tests remain included. No real Owner email or secret is entered by the agent.
- Final Preview deployment: `dpl_91iA6hiYcjG2JvUGUMiWGnyPSp32`, staging, exact final source SHA. READY confirmed. Gateway and existing Unified Map V8 HTML return HTTP 200. Gateway headers retain private/no-store and no-referrer. Build-info matches the exact final source. After final CI SUCCESS the existing canonical Preview alias was reassigned from `dpl_CxAh1nLsmcdzC1BLA3G75soxmswS` to this deployment; connector read-back and canonical cloud Chrome UI confirm the new two-step login. No Production alias was changed.
- Cloud Chrome UI inspection confirms one initial email field and a separate proof step with no duplicate send form. This is UI inspection, not hosted Owner authentication.

Single intended handoff: https://khairul-adam-portfolio-preview-safe.vercel.app/gateway.html . Use this origin for login and callbacks. Unique staging URLs are not alternative callback origins.

Rollback, if required: reassign only the existing Preview alias to `dpl_CxAh1nLsmcdzC1BLA3G75soxmswS`. No database rollback required. Production release requires physical Owner iPhone/iPad PASS and the remaining applicable private/map gates; this Preview does not waive those gates.
