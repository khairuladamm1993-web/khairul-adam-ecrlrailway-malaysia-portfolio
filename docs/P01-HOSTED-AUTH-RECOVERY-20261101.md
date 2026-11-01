# P01 final hosted Auth recovery — 1 November 2026

Branch remains `integration/mrs10-p01-v81-rc-20261101`. Application SHA remains `6cbc4390e0e47ea00188535d4dc22d4d05d1cd53`. No application changes, reintegration, new branch, Production change or rerun of completed CI suites.

## Hosted deployment/source verification

Deployment `dpl_2K9j4vqkJaWGeaFFsbJcYYFnAARS` is staging READY in existing project `prj_lCXBrXOHCNYABx8TLx2FhCEAIYus`, team `team_0JRmhxIIyLuWMPHsxwWxJfTv`.

Immutable staging: https://mrs10-p01-unified-v8-sg-geometry-cbaoqx93u-1993khairuladam-3016.vercel.app/gateway.html

Exact RC callback origin: https://mrs10-p01-unified-v8-sg-geometr-git-6f80d2-1993khairuladam-3016.vercel.app/gateway.html

Actual hosted gateway, access.js and build-info.js were fetched through authenticated Vercel share access. Gateway HTTP200, Cache-Control private/no-store/max-age=0 and Referrer-Policy no-referrer confirmed. Hosted build-info matches application SHA. Hosted gateway pins the exact RC origin; hosted SDK code constructs `location.origin+'/gateway.html'` and passes it as `options.emailRedirectTo`, with existing-account-only registration behavior. No stale GitHub Pages URL was found in this callback construction.

## Active redirect behavior and email evidence

Controlled real Supabase `/auth/v1/verify` probes used a deliberately invalid token, no identity and no email send. Only `redirect_to` differed:

- Canonical gateway request: HTTP303 back to canonical `/gateway.html`.
- Exact RC callback request: HTTP303 to the legacy GitHub Pages Site URL.

This independently proves hosted Auth rejects/replaces this RC redirect while accepting the canonical control. It does not export the complete active allowlist or distinguish a missing entry from an unsaved/wrong-project entry. Client redirect construction and deployment origin are verified correct. The failure occurs without email-template execution, so a hardcoded email link is not required to explain this server-side fallback.

One previously delivered sign-in message in the connected Owner mailbox was inspected privately. Its link uses this project's Supabase `/auth/v1/verify` endpoint and the canonical `/gateway.html` `redirect_to`; it is not a direct GitHub Pages hyperlink. No token/link, email identity or private data is retained in this report. This is delivered-message evidence, not a configuration export or proof of the current template contents. Supabase connector has no Auth config/template API, and environment has no Supabase Management token. No template change is justified by current evidence.

Owner was given one exact configuration delta: append the RC callback URL above to existing Redirect URLs and Save, preserving Site URL, all other entries and templates. Approval was already granted. Owner supplied the URL again; the subsequent live probe still returned GitHub Pages. Application of the configuration is not confirmed. A factual saved/not-saved status question is pending.

## Allowed protected access

The generic Vercel authenticated-fetch connector failed to access this deployment. A deployment-scoped Vercel share grant with TTL1800 seconds was then successfully created under the Owner's hosted-access mandate. Its secret was held privately and not committed. The share URL established the normal Vercel browser access cookie. Both the immutable deployment and the exact RC branch alias returned the actual application. Project SSO remains enabled for Preview; no protection override, permanent bypass, canonical alias update or Production assignment was made.

## New hosted browser results

Actual hosted application, real Chromium and WebKit, iPad viewport:

- Protected gateway HTTP200 and initial Public state: PASS both engines.
- Error callback handling (`otp_expired`): verification-failed, no Admin access: PASS both.
- Callback error parameters removed from URL: PASS both.
- Reload without an authenticated session returns Public: PASS both.
- Logout without an authenticated session remains Public/signed-out: PASS both.

These are hosted signed-out/error-path tests, not successful Owner sign-in/session/logout evidence. No auth responses, session tokens or roles were mocked or injected. Chromium trusted only the managed proxy CA SPKI for the environment transport; WebKit used the system CA bundle. General TLS verification was not disabled. WebKit dependencies were unpacked under /tmp; its local wrapper was adjusted to preserve the library path, and host-requirement preflight was skipped after actual successful browser launch. No system/application files or deployment dependencies were altered.

Successful hosted Owner login, authenticated reload/reopen recovery, actual local-scope sign-out and other-tab revocation are still NOT RUN because the RC callback is rejected. No new real sign-in email was requested while the callback remains invalid. Earlier CI PASS evidence remains unchanged and is not substituted for these hosted checks. No Safari Owner UAT is requested.

## Final receipt

Final redirect probes used unique random invalid tokens plus Cache-Control no-cache; both responses reported CF-Cache-Status DYNAMIC. The RC still fell back to GitHub Pages, while canonical remained accepted. Sanitized exact request/response-origin evidence is retained in `qa/p01-hosted-redirect-evidence-20261101.json`. No token is included.

Hosted WebKit existing-account login dialog rendered both email confirmation fields and the verification-link button successfully. No verification email was submitted. Existing connected mailbox identity privately matched one enabled Admin profile; no identity or protected content was exported. Account creation/deletion, role changes and global sign-out were not performed.

The temporary deployment share grant is revoked at test cleanup; normal authorized Vercel users can continue opening staging. The pending team-consent link was not required for these share-authorized tests. No general protection setting changed.

Status: NO-GO. The protected-staging access blocker is resolved for automation through a permitted temporary share grant. Active RC callback rejection is still unresolved; successful hosted login/authenticated recovery/logout remain BLOCKED, not PASS. Complete previous CI results are preserved. Owner configuration instruction is the single append-and-Save delta above; it has not been verified applied. Do not request physical Safari UAT.
