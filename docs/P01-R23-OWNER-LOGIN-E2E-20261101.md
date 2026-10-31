# P01 R2.3 Owner login end-to-end checkpoint

Date: 2026-11-01 Asia/Kuala_Lumpur.
Authorization: continue R2.2, zero additional cost, isolated Preview only. No cloud project, billing, Production, P02, P03 or P04 changes authorized or performed.

## Source and implementation

Base remote HEAD verified by git fetch: 8022f17cea5167705cd1c1ec7cdaf85a21c1cadf.
Preserved R2.2 run 41190417428: real-backend job SUCCESS on code 3292f53cff1c434b52cd53ca19897667cd48ed67.
Branch: test/mrs10-p01-r23-owner-login-e2e-20261101.
R2.3 code: 8497e363a24ce30ce3f19f1a4224a676d74c076b.

Delta: tests/r22/backend.cjs now uses providerFromEnv, the actual production provider adapter. Its injected fetch transport maps the dedicated synthetic https://r23-ci.supabase.co destination to the actual local Supabase HTTP server. Authorization, OTP, MFA, sessions, PostgreSQL/RLS and RPC remain real. No frontend session cookies are injected in the R2.3 browser scenarios. UI requests and verifies OTP, enrolls and verifies MFA, refreshes, recovers after reload, logs out across tabs, then signs in as a synthetic Member through the form. The R2.2 API isolation checks remain intact. The isolated standard public-runner workflow now triggers on the R2.3 branch.

## Local regression

- npm test with existing installed jsdom dependency via NODE_PATH: 367/367 PASS.
- node --test tests/unified-ecrl*.test.cjs: 82/82 PASS.
- node --test tests/auth-private-r2.test.cjs: 16/16 PASS (mock provider unit regression; separately labelled).
- node --test tests/p01-release-artifact.test.cjs: 3/3 PASS.
- Total executed local assertions: 468 PASS, zero FAIL. Build-auth-private-r2 completed.

## Real backend/browser CI

Run: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41229422431
SUCCESS confirmed from job 124620282649 and decoded logs: 10/10 real backend checks PASS (including all six Owner isolation cases), plus 6/6 real browser form/privacy cases PASS: Chromium and WebKit, desktop/iPad/iPhone viewport. No mocks and no injected cookies for those browser cases. OTP wrong/replay/expiry, AAL2, API/RLS isolation, refresh and logout checks PASS. Actual browser form request/OTP verification/MFA enrollment and verification/refresh/Member switching PASS. HTTPS is loopback with a test certificate and ignoreHTTPSErrors; this is NOT proof of deployed Preview TLS/callback or delivery to Adam's external inbox. Local test database was stopped successfully after the run. No screenshot artifacts were uploaded.

## HTTPS staging

Existing project prj_lCXBrXOHCNYABx8TLx2FhCEAIYus, team team_0JRmhxIIyLuWMPHsxwWxJfTv.
Deployment dpl_6bzT1Sb4UKkoAxgcUQVbzmMhDHV9: staging READY; git SHA 8497e363a24ce30ce3f19f1a4224a676d74c076b verified in deployment metadata and cloning/build log.
URL: https://mrs10-p01-unified-v8-sg-geometry-lcnwwty4p-1993khairuladam-3016.vercel.app/auth-private-r2.html
Build log confirms AUTH_R2_ISOLATED_ARTIFACT_READY_AUTH_DISABLED_UNTIL_SANDBOX_CONFIGURED.
No environment variables are configured in this existing project. Login cannot operate against a persistent isolated backend yet. Source remains fail closed when missing R2 configuration. Vercel web_fetch_vercel_url failed with deployment-not-found/access error both during build and after READY; CLI credentials unavailable. HTTP runtime and physical Safari verification are NOT RUN. Deployment READY is not equivalent to application HTTP PASS. Protection has not been disabled.

## Remaining gates and best zero-cost proposal

Owner Login Adam: NOT RUN. External inbox delivery: NOT RUN. Real existing Member identity mapping: NOT RUN. Physical Safari iPad/iPhone: NOT TESTED. Legacy full-journal/media migration is not covered by these fresh-browser tests. Magic Link PKCE remains covered by previous unit mocks, not a real R2.3 browser callback. Release NO-GO.

Best persistent option: Owner approval to create exactly one Free Supabase project named mr-s10-p01-auth-sandbox in organization MR-Malaysia Railway Project (azkoiktqdmxzaazljawl), subject to available Free quota, with no billing activation or upgrade. Read-only connector get_cost returned amount=0, monthly recurrence. No confirm_cost or create_project was called.

Risk/requirements: Free quota availability is not guaranteed by the price quote. Default hosted SMTP only delivers to organization team-member email addresses and has rate limits; existing Member external-email testing may require separately approved SMTP setup. Do not promise unrestricted free delivery. Official source: https://supabase.com/docs/guides/auth/testing-auth-flows . No paid SMTP is authorized.

After approval: verify Free slot -> create sandbox only if cost remains zero -> apply reviewed role/RLS schema to sandbox -> configure exact Preview origin/callback, short OTP expiry and provider rates -> set branch-scoped server credentials and cookie key -> verify email delivery and Owner identity mapping/MFA -> re-run same-origin browser/API QA -> physical Safari UAT. No Owner-private real data copied during setup.

Safari acceptance once backend connected: Owner email OTP -> MFA -> private room; refresh/reopen and recover; create synthetic record; logout in another tab; Member must be denied and synthetic Owner record absent from DOM and browser storage. Adam must review actual-device results before release.
