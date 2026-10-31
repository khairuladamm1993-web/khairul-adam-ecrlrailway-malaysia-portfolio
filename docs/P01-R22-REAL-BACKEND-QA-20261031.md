# P01 R2.2 real backend QA receipt

Scope: existing public repository, standard `ubuntu-24.04` GitHub-hosted runner, local Docker Supabase CLI 2.122.0. No paid runner, Actions cache or uploaded artifacts are configured. Numeric billing balance is not exposed by this connector; the compute eligibility decision uses the public repository + standard runner category. No Supabase cloud project, billing activation, Production merge/change or P02/P03/P04 change.

Base checkpoint: b704a41b828fd5ad275a9926e3c792197462bf5b.
QA branch: test/mrs10-p01-r22-real-backend-ci-20261031.

## Execution environment

An ephemeral local stack is initialized under RUNNER_TEMP, separate from source and any linked cloud project. Only local generated keys are captured in process memory. PostgreSQL, GoTrue/Auth, REST/RPC and Mailpit run as actual services. The role fixture and R2 Owner table/RLS proposal are applied to that database only. Test identities end in @r22.example.test. No Owner data or connected-account credentials are copied.

## Recorded first run

Code: 803846c29f78cb2830dacde5aca6d80f2f72d87c.
CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41190167640 .

Docker stack started and passed health checks. Real OTP wrong/replay and expiry tests, real MFA AAL2, five isolation cases and refresh recovery passed. The last logout assertion failed: the initial test adapter used a generic assertion for rejected provider requests, so the R2 handler mapped a real backend denial to 503. The test adapter now preserves the upstream HTTP denial status, matching the real provider contract. First-run FAILURE remains recorded; it is not retroactively marked PASS.

## Final run

Tested code SHA: `3292f53cff1c434b52cd53ca19897667cd48ed67`.
CI run: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41190417428 .
Final job conclusion: SUCCESS. Docker startup health checks PASS; real PostgreSQL/GoTrue/RPC/RLS tests 10/10 PASS, including six Owner isolation cases. Real-backend Chromium/WebKit desktop/iPad/iPhone privacy matrix 6/6 PASS. Total 16 recorded checks PASS, zero FAIL. The local stack was stopped at the end of the job.

Six backend isolation cases: unauthenticated Public API; authenticated Member API; Owner at AAL1; another MFA Owner with a different UID; direct database REST access under Public/Member/AAL1/other Owner roles; logout followed by denied old-session and Member-switch access.

Six browser cases additionally checked server-backed recovery after refresh, absence of Owner data in IndexedDB/Web Storage/Cache Storage, no-store responses, cross-tab logout and denied Member reads. Local GoTrue issued and verified email OTPs and MFA sessions used by these cases. No mock Auth/database provider was used.

BACKEND VERIFIED FOR SYNTHETIC CI SCOPE. Adam Owner login NOT RUN. Physical Safari UAT NOT RUN. Release NO-GO.

## Test boundaries

- OTP is generated and verified by real local GoTrue. Mailpit captures local test emails; external SMTP deliverability is not tested.
- TOTP is generated from each synthetic account's actual enrolled secret and verified by GoTrue. No fake provider accepts a predetermined code.
- RLS is exercised through PostgreSQL/PostgREST with real JWTs, including a different authenticated Owner, Member, AAL1 Owner and logged-out sessions.
- Browser cases use real OTP/MFA-validated sessions injected as encrypted HttpOnly test cookies. They verify the R2 room/session/private-data API, refresh, storage/cache absence, cross-tab logout and Member switching. They do not submit the login form to the BFF OTP routes.
- The test role fixture is synthetic and is not evidence that Adam's existing Owner account mapping is correct.
- Public CI runner ends the database at job completion. It is not a persistent HTTPS backend or a Safari UAT URL.

## Exact next gates

1. Supply an Owner-approved persistent test backend without changing Production; no cloud project is currently authorized.
2. Apply reviewed role mapping and R2 data/schema policies there, configure the exact HTTPS origin/callback, email template, delivery and rate limits. Keep keys server-side.
3. Test the BFF OTP/Magic Link forms, real Owner and existing Member account mapping, MFA enrollment/challenge, legacy migration/recovery and logout/account switching end-to-end.
4. Only after those pass, connect the isolated Preview to that backend and run Safari on the actual iPad/iPhone.

Release gate remains NO-GO until real Owner login and physical Safari Owner UAT meet acceptance. Automated real backend PASS is a separate milestone.
