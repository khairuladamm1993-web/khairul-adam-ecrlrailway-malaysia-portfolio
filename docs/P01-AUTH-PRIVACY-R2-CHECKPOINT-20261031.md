# P01 authentication and privacy recovery R2

Owner-authorized scope: isolated P01 code, QA and Preview only. P02/P03/P04 and Production are unchanged.

## Actual checkpoint

Base: `5c2ce75f2f21d51b8fe71e382c91e80f00b88bc6` on `test/mrs10-p01-release-readiness-20261031`.
Candidate: `feature/mrs10-p01-auth-privacy-recovery-r2-20261031`.

The old R1.7 IndexedDB store is origin-scoped, not account-scoped. Its Owner confirmation checkbox is a simulation approval, not authentication. The public-only packaging disables Supabase login. These are separate causes of the previous six privacy failures and of inability to prove live Owner login on that artifact.

## Implemented

- New backend-for-frontend API validates Supabase user and backend `account_role()`; never trusts `user_metadata` for authorization.
- OTP verification is provider-side. New six-digit requests, expiry, resend and brute-force behavior are exercised with a synthetic provider, not a homegrown production OTP generator.
- Encrypted, Secure, HttpOnly, SameSite browser-session cookies; no token response bodies or persistent Web Storage tokens.
- Magic Link fallback with a server-held PKCE verifier and fixed origin callback. Existing canonical login remains linked and unchanged.
- Owner requires backend admin role plus MFA `aal2`; private RPC additionally checks active Auth session and RLS.
- Cross-tab logout invalidation, stale response rejection, no-store responses, pagehide/bfcache clearing.
- Separate R2 packager gates laboratory modules before executing them, replaces the IndexedDB assignment store with a backend adapter and uses page memory for synchronous simulation storage.
- Legacy migration archives and verifies backend readback before deleting browser records. Files above the single-request migration limit remain untouched and explicitly require a chunked migration implementation.
- Proposed sandbox-only SQL adds Owner-specific records and RPCs with optimistic concurrency. No SQL in this proposal has been applied to any live project.

## Verification boundaries

Local baseline 367/367 and map/D102 119/119 PASS. New security/artifact suite 18/18 PASS. Browser matrix is recorded in the candidate GitHub Actions run and must be read before claiming a result.

Mock browser QA is not live Supabase QA. Real email delivery, actual account mapping, SMTP template, OTP expiration/rate configuration, deployed SQL, real MFA enrollment and physical Safari Owner UAT are NOT RUN.

Existing backend read-only regression: 9/9 public tables retain RLS and `anon` has zero SELECT grants. No policies or Auth settings were modified.

## Actual infrastructure blocker

Supabase `create_branch` returned `PaymentRequiredException: Branching is supported only on the Pro plan or above`. There are no existing development branches. No upgrade or paid provider was activated. A separate sandbox project is an alternative; the connector requires the Owner to select its organization before project creation or cost lookup. Do not apply the proposal to the main project as a shortcut.

The new API intentionally returns `503 ISOLATED_AUTH_NOT_CONFIGURED` without approved sandbox configuration. It rejects the existing main-project URL even if accidentally supplied. This is a fail-closed Preview, not a working live login deployment.

Required isolated configuration: `P01_R2_SUPABASE_URL`, `P01_R2_PUBLISHABLE_KEY`, random 32-byte base64 `P01_R2_COOKIE_KEY`, exact `P01_R2_ORIGIN`, and `P01_R2_AUTH_ENABLED=true` only after sandbox policy verification. Keep all values server-side. The sandbox must set email template `.Token`, OTP expiry target 300 seconds, verification/request limits and exact callback allowlist; also support the Magic Link fallback in its template.

## Phase B

WhatsApp: official Twilio Verify supports the channel. Account eligibility, sender/business onboarding, Verify service, server credentials and Malaysia-specific charges require review before activation. Pricing is not assumed to be free. Links: https://www.twilio.com/docs/verify/whatsapp and https://www.twilio.com/en-us/verify/pricing .

WeChat and WeCom: official documentation endpoints were not accessible in this run. App qualification, organization authority, approved callback domain, provider credentials and current charges are NOT VERIFIED. No OAuth button, identity linking or account elevation has been faked. Do not enable either until the official requirements and credentials are verified. Never map a third-party account to Owner by matching unverified email or client metadata.

## Remaining limitations and release gate

- No real sandbox backend exists yet; SQL is a proposal and has not been executed or validated on Postgres.
- Legacy archives preserve data, but full restoration of every legacy media/host record and chunked large-file migration remain to be verified.
- R2 auth identity is not yet a replacement for every old Member content/quiz workflow; canonical fallback remains available.
- Full D102 host autosave durability across browser termination requires backend integration QA, beyond privacy/API mock tests.
- Production release: NO-GO until real sandbox integration, existing test Member, Owner MFA, legacy recovery and physical Safari UAT pass.
