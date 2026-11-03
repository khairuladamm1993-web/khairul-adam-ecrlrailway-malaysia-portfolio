# P01 R2.7 — visible session checks, 3 November 2026

Owner reports Check Session appears to do nothing on Safari. Inspection of deployed R2.6 source confirms the handler only awaited RailwayAccess.refresh() and rerendered. With no saved session the same page appeared, without explicit feedback. This establishes a UI feedback defect, not proof of a Safari engine failure.

## Implemented

- Check Session displays live progress, disables repeated clicks, then explicitly reports verified account/role, no existing session, a sanitized Auth failure or a 15-second timeout.
- It uses existing server getUser/account_role/enabled-profile validation. It never sends an email, verifies a pasted token, opens a link or creates a user.
- Signed-in users can also check their session. Logout invalidates a pending UI check and clears feedback so late results cannot display the old account.
- UI explicitly recommends normal Safari. Private Mode is not required; its session context is separate from normal Safari and other browsers. No private-mode detection or browser fingerprinting.
- Inbox arrival cannot create a session by itself. Email proof must still be validated once. Email delivery rate limits remain hosted provider constraints.
- No Supabase Auth/template/RLS/config changes, no Production/main/P02/P03/P04 changes, no paid services. Existing Vercel Authentication must remain enabled for all deployments.

Source SHA: 86093c7a3d7fc70db6ccb7ccd85d22a804a2b67a.
Branch: fix/mrs10-p01-session-feedback-r27-20261103.
Parent: 7ba34791d4e59ad34f697398fbe2ca06c66db103.
Changed: assets/member-gateway.js, scripts/build-owner-auth-recovery.cjs, tests/auth-wiring.test.cjs, tests/r22/gateway-recovery.cjs, existing isolated CI branch trigger.

## Validation

Local regression: 378/378 PASS, includes mock/DOM tests. Package and mocked provider: 19/19 PASS. Total 397 unit/package checks. New tests exercise explicit signed-out result without send/verify/exchange calls, verified-role result and duplicate-click suppression.

Real backend/browser CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41598608417 — completed SUCCESS, job 125791753299. Decoded logs confirm 397/397 unit/package and 28/28 real backend/browser scenarios PASS.
The existing real GoTrue/PostgREST Chromium/WebKit iPhone/iPad cases additionally click the actual Check Session UI after authentication and after logout, asserting its visible results and zero new email requests. These are normal independent browser contexts, not physical Apple Safari or actual Owner identity.

Deployment: dpl_69MeoJC8MQETyTL7v4RWE4PQYjfX, existing preview-safe project, staging on exact source SHA — READY confirmed. Canonical Preview alias reassigned after CI PASS, from dpl_91iA6hiYcjG2JvUGUMiWGnyPSp32. Project SSO remains enabled with deploymentType=all. Protected hosted Owner browser smoke was not performed; no protection bypass grant was generated.
Canonical handoff after PASS: https://khairul-adam-portfolio-preview-safe.vercel.app/gateway.html .

Physical Owner Safari normal-mode login on iPad/iPhone: NOT RUN. Hosted Owner end-to-end acceptance: NOT RUN. No credential or email was requested from the agent. Release remains NO-GO until applicable Owner acceptance. Vercel login (deployment access) and application login (Supabase account) are separate.

Rollback affects only Preview alias: dpl_91iA6hiYcjG2JvUGUMiWGnyPSp32. No database rollback required.
