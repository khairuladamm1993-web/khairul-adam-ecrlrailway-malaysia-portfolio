# MR-S10 Authentication Recovery — OTP / 100 Member (Development only)

## Policy
- Public visitors may request email verification. A genuinely verified new email obtains `member` by default if capacity is available.
- `admin` is never assigned from a typed email. A pre-existing server-side Owner mapping is mandatory.
- Hard target: **maximum 100 enabled Member profiles**, with Owner/Admin separate.
- Member progress and assessments remain owned per account; no account merging.
- No passwords, identity documents, or shared email tokens in chat.

## Current implementation in this branch
- `assets/access.js`: `verifyEmailOtp(email, code)` calls Supabase `auth.verifyOtp({email,token,type:'email'})`; after verification it calls the existing getSession/getUser/account_role/profile checks.
- `assets/member-gateway.js`: six-digit code is entered on the same website, with no magic-link click or redirect required.
- Existing send rate-limit, same-origin Magic Link and token-error recovery remain intact.
- OTP interface **OFF by default**: `window.MRS10AuthPilot = { emailOtp:true }` would need to be intentionally set **before** loading `assets/access.js` on an approved *isolated* test page. The flag is UI configuration, never authority.
- Seven new OTP unit cases added to the Node auth wiring test suite. These require execution in a permitted Node/CI environment.

## Not yet deployed or activated
1. The live Supabase email template still sends a Magic Link. Changing it to `{{ .Token }}` affects all users of this project and requires **separate owner approval**.
2. The concurrency-safe cap is only a **review-only SQL draft** in `member-capacity-review.sql`; do NOT apply to the shared MR Platform database.
3. The migration and OTP email template must first be tested against a separate, non-Production Supabase Auth instance. Until this gate passes, no real user should be asked to enter an OTP that isn't delivered.
4. No push/merge to `main`, no Preview/Production deployment, and no Supabase mutation are part of this checkpoint.

## Mandatory acceptance tests before release
- Baseline: full existing test suite and artifact packaging, no regression in Public, Map, practical modules, and sessions.
- Security: failed/expired/wrong OTP denied; source email mismatch denied; rate-limit; session reload; Member cannot access Admin; Owner/Admin is server-mapped.
- Capacity: 99/100 success; registration 101 denied enabled membership; two simultaneous registrations at 99 cannot exceed 100; existing Member unaffected; Admin excluded from count; admin enable blocked when full.
- iPhone Safari: in-page six-digit code, no Gmail link-preview interaction, Verified Member/Owner Admin, reload persistence, logout.
- Explicit release decision after confirmed evidence.

## Rollout caution
Never enable the frontend pilot while the live email template still sends Magic Links. Avoid modifying the existing Vercel canonical Preview (or any Production deployment) during this development work.
