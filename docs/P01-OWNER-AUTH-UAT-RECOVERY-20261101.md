# P01 Owner Auth UAT emergency recovery — 1 November 2026

> **Correction — 1 November 2026, R2.5:** HTTP method inspection shows OPTIONS + POST pairs, not proof of duplicate verification-email requests. The duplicate-request causal inference below is withdrawn. The latest iPhone failure is a confirmed PKCE challenge/verifier mismatch. See [R2.5 recovery and corrected evidence](P01-R25-EMAIL-PROOF-RECOVERY-20261101.md). Historical CI results remain valid within their stated synthetic scope.

Scope: Owner-authorized isolated recovery, existing accounts/infrastructure, zero additional paid services. No Production deployment, database write/schema/Auth configuration change, account deletion, billing, merge, or P02/P03/P04 source changes.

## Deployment/source mismatch

Canonical Preview initially resolved to `dpl_Fwz9Uyeh3NvFz779VCQoV2gGHrkX`, SHA `f54e03540c3cfa4eb3d6108edd9df7c0dbf5d693`, in project `khairul-adam-portfolio-preview-safe` (`prj_0VhBnAaagARpXZYHHTFPquxRf7xy`). This was the older browser SDK gateway flow, not the R2 server-cookie login.

R2 branch HEAD read from GitHub: `2d00e603359eb5b11527aff454f282b72fabe6ae`. R2 adds server Auth, MFA/private gates and newer session race/error fixes. R2.3 remote checkpoint `0756ef2ff7f48c3fddcf7a4761af1f3b6b92564f` is the recovery parent. Its code matches the preserved local `c110c63` checkpoint; the remote additionally contains the R2.3 evidence document. The recovery uses that remote parent, preserving the document and all prior source.

## Separate root-cause evidence

Read-only Supabase Auth/edge logs for 1 November Malaysia time, plus selected non-secret `auth.flow_state` metadata:

- **iPad verification-failed:** requests to `/auth/v1/otp` at 07:02:33 and 07:02:35 from the canonical Preview and iPad-style Safari user agent. Only one `mail.send` event is present for that pair. Verification at 07:03:09 issued an authorization code. Subsequent attempts at 07:03:32, 07:04:08 and 07:05:40 were rejected with `One-time token not found` / `Email link is invalid or has expired`. This confirms unavailable/consumed-token failure on retries; it does not prove natural expiry. Duplicate SDK requests can replace a local verifier even when the provider suppresses a duplicate email. The old deployment did not preserve a cross-tab/reload request guard.
- **iPhone pkce-exchange-failed:** the 07:06:33 request originated from the iPad-style Safari context; verification at 07:08:00 used an iPhone Safari user agent. Supabase issued a PKCE authorization code, but no `/auth/v1/token` exchange was present in the captured window. The retained flow state has an issued code and `s256` challenge. This supports a missing verifier in the different device/browser context, before role validation. It is distinct from the token-not-found error. No device localStorage was inspected, so the historical verifier contents are not claimed as directly observed.
- **Callback configuration drift:** live invalid-token probes, with no real account/secret/email, return the canonical `/gateway.html` callback when that canonical origin is requested. Unregistered generated Preview origins fall back to the older GitHub Pages Site URL. This is observed redirect behavior, not a complete export of the backend allowlist. No backend URL configuration was changed.

PKCE requires the original verifier/browser context; the repair does not transfer verifiers between devices or bypass PKCE. Official documentation: https://supabase.com/docs/guides/auth/sessions/pkce-flow and https://supabase.com/docs/guides/auth/auth-email-passwordless . Current changelog index was fetched; the pending TLS cipher change does not explain these callback/token lifecycle failures.

## Changes

- `assets/access.js`: serialize initialization/code exchange; check durable browser storage before requesting email; retain a non-sensitive 60-second pending marker across refresh/tabs; use Web Locks when available to serialize verifier write plus request; pin callback path to `/gateway.html`; reject configured-origin mismatch; clear attempt marker after successful callback/logout. Session validation remains live `getUser` → backend `account_role` → enabled own-profile lookup. Existing stale-response/sign-out protections remain.
- `assets/member-gateway.js`: newest-link/same Safari/device/site guidance and sanitized storage/origin errors. No secret values appear in UI diagnostics.
- `scripts/build-owner-auth-recovery.cjs`: restore authenticated gateway into isolated R2 artifact; **existing identities only in this recovery artifact**, without changing registration policy elsewhere; exact canonical-origin metadata; no-store/no-referrer; complete Owner script/registry dependencies; deployment SHA metadata. Private lab remains behind the R2 server role/MFA bootstrap.
- Tests/workflow: mock regression updates, recovery package safety tests, real pinned Supabase SDK + GoTrue Magic Link callback tests in Docker; keep real OTP/MFA/six database privacy cases; sanitize credential-bearing URLs in failure logs. Browser-to-GoTrue traffic uses a local HTTPS reverse proxy for the fixture; backend responses, SDK, token exchange, role/profile reads and RLS are real, not mocked. The deployed hosted Supabase URL is already HTTPS and was not altered.

The 60-second marker stores only an expiry timestamp, never email, OTP, verifier, session token or Owner data. Web Locks protection is conditional on browser support; timestamp suppression still operates without it. Existing SDK session persistence remains the gateway baseline. R2 private data continues to use its separate HttpOnly/backend path and is not downgraded to gateway localStorage.

## Live backend boundary

Read-only checks: hosted email provider enabled; one enabled Admin and three enabled Member profiles exist (no identities or records exported). Nine public and two app_private tables have RLS enabled; anon has no table SELECT grants. The public account_role wrapper is SECURITY INVOKER. The existing hosted project has no R2 owner_private_context_r2/owner_private_operation_r2 RPCs, so R2 Owner Private remains unavailable/fail-closed. Restoring gateway Admin does not prove R2 private-room readiness. No schema/configuration/roles were changed to bypass this boundary.

## Intermediate QA findings resolved

The first CI run passed all ten real backend checks, six real R2 browser privacy/form checks and two Chromium gateway PKCE checks, but rejected the WebKit SDK request against the HTTP loopback endpoint. The fixture was changed to HTTPS on the browser side, proxying requests unchanged to the real Docker Auth/PostgREST; this fixes a test transport mismatch with hosted HTTPS. It is not evidence of a live hosted WebKit failure. The initial staging package also missed three Owner script dependencies and its public-safe registry; these were restored and checked. Deployed no-store headers initially did not apply from the output-only vercel.json; source-level configuration now produces verified headers. The subsequent generic WebKit assertion required better diagnostics. The final suite counts actual OTP POSTs at the HTTPS proxy and waits for completed authenticated state instead of relying on browser event-count timing; named assertions and sanitized failure messages were added. The final run passes all four gateway cases. The previous generic assertion does not identify which timing assertion caused that earlier failure, so no unsupported claim of an additional product root cause is made. None of the intermediate candidates replaced the canonical alias.

## Evidence and release gate

Branch: `fix/mrs10-p01-owner-auth-uat-recovery-20261101`.
Code SHA: `d0b759e5bf5f30d09410bbea9d1f4c778fdb9f95`.
Local: 371 main regression tests PASS, 98 Auth/ECRL tests PASS, 3 recovery artifact checks PASS. These include mock SDK/provider cases; they are not existing Owner login evidence.

CI final run: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41253284632 — **SUCCESS**, job `124691062607`. Decoded final logs independently confirm **390/390 unit/package tests PASS** (371 main + 16 mocked provider + 3 artifact), **10/10 real backend checks PASS** including all six privacy cases, **6/6 real R2 browser form/privacy cases PASS**, and **4/4 actual SDK Magic Link gateway cases PASS**: Chromium/WebKit × iPad/iPhone viewports. All 20 integration cases use real local GoTrue/PostgreSQL with synthetic identities. No real Owner credentials/cookies are injected. Gateway tests use the real SDK and actual email verification/token exchange through the HTTPS fixture; R2 tests exercise the OTP/MFA forms. The gateway fixture is a focused integration page, not the full deployed gateway UI or physical Safari.
Staging deployment: `dpl_6zJnXW2mnAdENkfD2arFcCYpomK5` — staging READY; HTTP 200 gateway and actual code SHA verified. Gateway/Auth page Cache-Control no-store and no-referrer verified on deployed responses; source vercel.json is required because output-directory config alone did not apply headers.
Canonical Preview alias changed **only after final CI SUCCESS** from `dpl_Fwz9Uyeh3NvFz779VCQoV2gGHrkX` to `dpl_6zJnXW2mnAdENkfD2arFcCYpomK5`, same existing Preview project. Vercel read-back confirms the mapping; browser opened the canonical gateway and existing-account form successfully. Exact UAT URL: https://khairul-adam-portfolio-preview-safe.vercel.app/gateway.html . No Production target/domain was assigned.

Existing Owner account end-to-end, live Owner/Admin protected reads, live Member account switching, post-login Unified Map V8.1/PL01–PL07/depot/spurline/popups, and physical iPad/iPhone Safari UAT are NOT RUN by the agent. Source-level map regression is not equivalent to these live acceptance cases. No real Owner verification email was requested from the agent browser, which would establish a verifier in the wrong context for device UAT.

Release: **NO-GO** until Owner login on both physical devices and the required post-login gates pass. Rollback of a Preview-only alias update is to `dpl_Fwz9Uyeh3NvFz779VCQoV2gGHrkX`; no Production rollback is needed because Production is not changed.


## Owner physical UAT (now ready for gateway login)

Open the canonical URL in ordinary Safari. Let the existing session restore first. If Public, request exactly one fresh link from that device and open it in the same Safari context and origin. Each device must initiate its own sign-in; an iPad-requested link is not an iPhone sign-in. Check Owner/Admin, refresh/reopen recovery, protected views, then logout/revocation. Existing Owner data must not be cleared to run this test.

After successful Owner login, verify Unified Map V8.1, PL01–PL07, depot/spurline, station/track popups and logout; these live Owner acceptance cases remain NOT RUN until actual evidence is supplied. R2 Owner Private activation is a separate blocked backend gate and must not be represented as enabled by this gateway repair.

## Audit receipt

Authorization: Owner emergency recovery directive, 1 November 2026. Mutations: isolated GitHub branch/commits; standard public Ubuntu Actions with synthetic Docker stack; staging deployments on existing Preview project; final Preview-only canonical alias update. No connector messages/emails, paid resource provisioning, Production/database/Auth configuration mutation, role elevation, account deletion, merge or source changes to P02/P03/P04. No real Owner Magic Link was requested by the agent. Supabase hosted operations were read-only metadata/log/settings probes, including deliberately invalid-token redirect probes that sent no email.

Final deployment `dpl_6zJnXW2mnAdENkfD2arFcCYpomK5` is staging READY on tested SHA. Canonical gateway HTTP 200, no-store/no-referrer headers and build-info SHA were checked after alias change. R2 session API still returns sanitized 503 ISOLATED_AUTH_NOT_CONFIGURED with no-store: fail-closed, not an enabled private-room claim. Synthetic Docker stack cleanup succeeded after CI. Release remains NO-GO.
