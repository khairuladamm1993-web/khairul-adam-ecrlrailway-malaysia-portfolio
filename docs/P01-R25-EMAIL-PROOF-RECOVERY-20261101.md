# P01 R2.5 — email proof recovery, 1 November 2026

Owner request: investigate and resolve the continuing iPhone gateway callback error. Scope remains existing P01 infrastructure/accounts, isolated branch and Preview only; no Production, hosted database/Auth configuration, billing, P02/P03/P04 or account deletion changes.

## Corrected live diagnosis

Hosted project: `kfudisbzdgsefdjoopzu`. Canonical alias at task start: `dpl_6zJnXW2mnAdENkfD2arFcCYpomK5`, tested code `d0b759e5bf5f30d09410bbea9d1f4c778fdb9f95`. Recovery branch parent `c62d2573c65c635df4b0f6bba69940f72c4c3d3b` preserves the previous source/report.

Read-only logs for the latest reported incident show, in Malaysia time:

- 14:04:32: OPTIONS `/auth/v1/otp` (200), followed by ONE POST `/auth/v1/otp` (200).
- 14:05:24: GET `/auth/v1/verify` (303), followed by OPTIONS `/auth/v1/token` (200).
- 14:05:27: POST `/auth/v1/token` (400), with Auth error **code challenge does not match previously saved code verifier**.
- User agents for those latest events are iPhone Safari. The successful email verification followed by failed code exchange isolates the immediate failure to PKCE challenge/verifier matching. Matching user-agent strings do not establish identical Safari/in-app storage contexts. Actual historical device storage was not inspected, so its exact contents or the specific source of the mismatched verifier are not claimed as observed.

**Correction to earlier reports:** pairs of OPTIONS and POST were mistakenly treated as evidence of duplicate email requests. They are CORS preflight plus the actual POST. The duplicate-request causal inference is withdrawn. Request suppression remains a useful tested guard, but was not a demonstrated root-cause fix for this incident. The earlier 'different-device' diagnosis also does not explain this latest same-iPhone incident on its own.

A controlled invalid-token redirect probe with a non-secret `sb_flow_id` query marker was redirected to the historical GitHub Pages Site URL, with the marker lost. Therefore this change does NOT enable experimental flow-ID query redirects on the hosted project or alter its callback allowlist. It supports reading an existing explicit flow ID where present, but does not rely on that to make cross-browser email recovery work.

## Implemented recovery

- Keep the existing Supabase project/publishable key and backend identity → account_role → enabled own-profile authorization. No Auth.js migration or CSRF/PKCE security bypass.
- Namespace ONLY SDK PKCE verifier slots as `mrs10-r25:` to isolate fresh requests from older gateway clients. Existing session storage keys remain unchanged; historical browser records are not erased.
- Add `RailwayAccess.verifyEmailProof(email, evidence)` and an actual gateway form **Log masuk tanpa membuka pautan**. It accepts a six-digit email OTP if the existing email contains one, OR the original unused Supabase `/auth/v1/verify` link copied from the email.
- Parse original links locally. Accept only the exact existing Supabase HTTPS origin, `/auth/v1/verify`, email/magiclink type and bounded token format. Never fetch an arbitrary pasted URL or use its redirect destination.
- Submit the existing one-time email hash through supported `verifyOtp({token_hash,type:'email'})`, or the code through `verifyOtp({email,token,type:'email'})`. Supabase enforces validity, expiry and one-time use. This is normal email-token authentication and does not export/reconstruct a PKCE verifier or accept an auth-code URL as proof.
- Suppress intermediate SIGNED_IN hydration during proof verification. Independently verify the returned user and compare its email with the entered account before role/profile/private reads. Reject mismatches and revoke the new local session. Backend roles, RLS and existing MFA/private-room gates remain authoritative.
- Clear the proof input before sending, discard temporary proof variables, never persist proof text, and clear entered identity fields on UI logout. No tokens/OTP/links are put into app URLs or reports.
- Preserve normal PKCE Magic Link as an available flow. Direct link opening in an unrelated browser can still lack its verifier; the recovery form is the tested alternative, not a claim that cookies can be shared between browsers.
- Fix the Close control layout and use 16px inputs to avoid automatic iPhone input zoom. The copy explains the unused-link recovery flow explicitly.

## Hosted email boundary

The hosted email template, OTP length/expiry/rate limits and mail delivery provider were NOT changed. The form does not magically make a six-digit code appear in an email template that only contains a button. With that existing template, use **Copy Link** on a fresh unused email button, then paste it into the gateway recovery form. Previously clicked/consumed email links cannot be recovered and are rejected. Do not send the link/code through chat.

Default link-based sign-in remains single use. Email-security scanners or an already-opened link can consume the email token before manual verification; this remains a limitation of email bearer links. OTP template activation or a custom confirmation email would require an explicit hosted Auth configuration change, outside this task's Production-protected scope. No such change was made.

## QA evidence

Branch: `fix/mrs10-p01-pkce-flow-binding-r25-20261101`.
Initial implementation `f52faa8e35ece31ff71dcf192b0a020e49184385`: real CI SUCCESS https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41282827364, job 124778051245.

- 375/375 main unit/regression assertions PASS; includes mock SDK tests, explicitly not live Owner evidence.
- 3/3 package safety checks PASS, 16/16 mocked R2 provider tests PASS.
- 10/10 actual local Supabase Docker backend checks PASS, including all six Owner isolation cases, OTP wrong/replay/expiry, MFA and refresh.
- 6/6 actual R2 form/privacy browser cases PASS.
- 4/4 actual SDK PKCE gateway cases PASS.
- **8/8 actual cross-browser email-proof cases PASS**: copied-link and six-digit OTP form submission, Chromium/WebKit × iPad/iPhone viewport, each in a genuinely separate browser context with no initiating verifier. Existing synthetic Owner and Member roles, refresh, UI logout and replay rejection are checked. The proof is absent from the DOM and not persisted in browser storage.

Total: 394 unit/package checks plus **28 real backend/browser cases**, all synthetic identities. The real GoTrue/PostgREST backend sits behind a loopback HTTPS transport fixture; destination/path substitutions map test URLs only, with no fabricated authentication responses. The recovery UI uses the actual member-gateway/access/CSS modules and a minimal page shell. It is not full physical Safari or actual hosted Owner-account acceptance. No credential-bearing screenshots/traces/artifacts are uploaded.

Additional local ECRL/Auth regression: 98/98 PASS (82 ECRL + the 16 R2 provider cases). Final copy/logout cleanup local Auth + artifact checks: 62/62 PASS.

Final code/deployment SHA: `9049307271f4f0dae53b8db35ab957a91f0ad92e` (only wording and logout identity-field cleanup after the first CI).
Final CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41283132704 — **SUCCESS**, job `124778949978`, 394/394 unit/package assertions and 28/28 real backend/browser cases confirmed from decoded logs on the exact final SHA.
Final staging: `dpl_CxAh1nLsmcdzC1BLA3G75soxmswS`, target staging, READY, same SHA. Browser inspection confirmed the actual recovery form and instructions are visible. Canonical Preview alias updated after final CI SUCCESS from `dpl_6zJnXW2mnAdENkfD2arFcCYpomK5` to this final deployment. Staging HTTP 200, no-store/no-referrer and expected code SHA verified before the update; canonical alias read-back confirms the final deployment, and browser inspection confirms the recovery form on the canonical HTTPS gateway. No Owner credential was entered or email sent by the agent.

## Acceptance and boundaries

Physical iPhone/iPad Owner login, current hosted inbox delivery and protected Owner/Admin/map views remain **NOT RUN by the agent**. Hosted R2 Owner Private still has its existing configuration/RPC gate; this recovery does not enable that separate room. Do not label existing Owner Login VERIFIED or release READY from synthetic CI.

Once final Preview is verified: open canonical gateway → request one fresh email if no valid session restores → copy the original email button link without opening it → paste under **Log masuk tanpa membuka pautan**, enter the same account email → **SAHKAN & LOG MASUK**. If a six-digit code is present in the email, it may be entered instead. Then check account role, refresh/reopen and logout. Do not reuse the failed old link or clear device data.

Rollback: reassign only the Preview alias to `dpl_6zJnXW2mnAdENkfD2arFcCYpomK5`. No database rollback is needed. No paid resources, backend migrations, real Owner credential entry/email requests, merges, Production aliases or P02/P03/P04 source changes were made. Release remains **NO-GO** until physical Owner acceptance and remaining private-room gates pass.

Official references: https://supabase.com/docs/reference/javascript/auth-verifyotp ; https://supabase.com/docs/guides/auth/auth-email-passwordless ; https://github.com/supabase/auth/blob/master/internal/api/verify.go ; https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession .
