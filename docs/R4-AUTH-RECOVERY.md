# MR-S10 R4 authentication recovery package

Prepared 21 October 2026 (Malaysia). Investigation and local QA only; no deployment.

## Source and preservation

- Repository: `khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio`.
- Working branch: `migration/full-portfolio`.
- Base: `2fe65b618c257efc6a3af6c9f4739240f87689b2`.
- `feature/map-asia-integration-safe` remained at `a3445b6731d312e990cfec46669892ef8fe19929`. Its auth layer and member gateway match this base; its MAP/public gateway additions were not overwritten or merged.
- The older dirty checkout was preserved. This package uses a separate checkout of the existing development branch.
- No main merge, remote push, deployment, email, Auth account creation/deletion, role update, SMTP change, RLS change, billing change, railway-data change, or frozen Development Control Centre R3.1 change.

## Confirmed implementation defects

The added regression tests fail on the original code and pass with these changes:

1. A delayed role/profile validation could finish after sign-out and restore stale Member/Admin UI access. An auth revision now invalidates stale validation after local or SDK sign-out. Local sign-out revokes UI access immediately, before awaiting the SDK.
2. Protected bundle responses could populate cache after sign-out. Stale responses are discarded, and the gateway discards loads from an obsolete access revision.
3. Session loss cleared in-memory bundle state but left rendered protected content and quiz controls on screen. The public renderer now restores public content on access loss, and the member gateway clears the active quiz.
4. Session/profile/content/OTP errors could display or log raw backend messages, including private values. Auth errors now use fixed actionable messages; the member bundle catch no longer logs the raw backend error object.
5. Malformed addresses threw before setting visible error state. They now produce visible validation feedback with zero SDK OTP calls.
6. Repeated calls after a successful email request or a rate-limit response could send another OTP. Pending-link and rate-limit guards now block those calls, preserving the outstanding PKCE request.
7. A thrown OTP transport error left the UI in `sending`. It now fails closed with sanitized network/client feedback.
8. A `SIGNED_IN` event arriving during an older hydration could reuse that older promise, receive its empty-session result, and leave the UI Public without validating the new session. Auth events now wait for the old hydration and revalidate, provided no newer sign-out invalidated the event. A separate regression confirms a queued event cannot undo sign-out.

These are reproduced defects, not proof that they caused the owner's historical Yahoo/Safari Public state. That end-to-end root cause remains unconfirmed.

## Signup policy and bounce risk

`shouldCreateUser:true` remains explicit. The approved original policy permits automatic registration after email verification, without Owner approval. No separate registration path is implemented in this gateway. Setting it to `false` here would silently prevent legitimate new registration, so the condition for that policy change is not established.

The UI now asks for a matching second email entry and explains that a new address begins registration. A mismatch sends zero OTPs. This reduces accidental input mistakes; it is not a server-side signup restriction and cannot detect a consistently repeated typo or prove mailbox deliverability. Existing and unknown addresses continue to receive the same Public pending state; no role derives from an email string.

The safest strict account-creation prevention would be an explicitly approved existing-account-only login policy (`shouldCreateUser:false`), with a separately reviewed registration path. That policy decision is outside this repair. A browser option alone would not globally disable direct signup against an otherwise signup-enabled Auth backend.

The Supabase bounce warning and earlier misspelled addresses are treated as risk evidence. The precise bounce cause/provider response was not independently established. No diagnosis email was sent, no SMTP purchase/configuration was made, and the two accidentally created accounts were not altered.

## Auth and backend investigation

- Client remains pinned to supabase-js `2.117.2`, PKCE, SDK session persistence and automatic token refresh. URL detection remains manual.
- Query `code` is exchanged once by the initialization path before session/user/role validation. Error query/fragment and unsupported token callbacks fail closed and are cleaned. The SDK manages the verifier; it is not copied, fabricated or bypassed.
- `getSession()` is followed by expiry refresh when needed, then `getUser(access_token)`, `account_role()`, and an enabled own-profile lookup.
- Auth callbacks schedule async validation outside the SDK callback. Sign-out invalidates pending work. Admin operations remain guarded by the backend role result, not the profile role or email text.
- Protected quiz/content fetch failures are covered using rejected table mocks. Backend RLS enforcement was not newly proven live: the read-only SQL tool request was rejected, and no bypass/retry was attempted.
- Supabase project inspection returned `ACTIVE_HEALTHY`. Owner-supplied verification of the correct Member profile is recorded as owner evidence, not a new independent database acceptance test.
- Official PKCE documentation requires the same browser/device holding the verifier; Auth codes are single-use and time-limited. A Yahoo embedded browser, another origin, missing browser storage, an expired code, and a reused link remain distinct hypotheses requiring device evidence.
- The current Supabase changelog was reviewed. Its October TLS cipher deprecation is scheduled for November and does not establish a cause for this historical auth issue.

## Current canonical deployment evidence

Read-only Vercel inspection returned:

- Project `prj_0VhBnAaagARpXZYHHTFPquxRf7xy`.
- Deployment `dpl_Fwz9Uyeh3NvFz779VCQoV2gGHrkX`, READY, API target `null` (Preview).
- Source SHA `f54e03540c3cfa4eb3d6108edd9df7c0dbf5d693`.
- Canonical `gateway.html`, `assets/access.js`, and `assets/build-info.js` returned HTTP 200. Build metadata agrees with that source SHA/deployment ID.
- This older deployed source does not include the R4 repair. No deployment or alias was changed.

## Automated QA results

- `npm test`: **155/155 PASS**; includes **51/51 auth wiring/behavior tests**.
- `npm run build:production`: PASS initially. After the final event-race repair, `python3 scripts/build-production.py /tmp/mrs10-r4-final-artifact`: PASS with a fresh output directory; protected legacy assets (`questions.js`, `gateway.js`, `quiz-core.js`) excluded. The builder correctly refused reuse of the older populated output directory; it was not overwritten.
- Final `node tests/production-responsive.mjs /tmp/mrs10-r4-final-artifact`: **27/27 PASS**, nine viewports (320 to 1440 px), Public/Member/Admin. Uses mocked sessions/backend and blocks requests to the real Supabase origin and analytics collector.
- Syntax checks for the three changed JS assets, artifact-builder Python compilation, and `git diff --check`: PASS.
- Added coverage includes stale sign-out races, stale protected responses/DOM, malformed and mismatched email, repeated requests, rate limits, raw error sanitization, thrown network failures, expiry refresh success/failure, fresh mocked page restoration, and rejection of profile/email privilege escalation.
- Existing callback success/failure/expiry, unsupported fragment, Public boundaries and disabled-profile tests remain green.
- Smoke required a local Chromium binary; Chromium 153.0.8010.0 from pinned `@sparticuz/chromium@153.0.0` was unpacked outside the repository. No app dependencies/lockfile were changed. The initial browser-unavailable run was not counted as PASS.
- These are newly run local checks, not GitHub Actions CI or Safari UAT. Mocked session restoration does not prove Safari storage or a real Yahoo callback.

## Controlled Preview readiness and next authorization

The code candidate and safe artifact are ready for a controlled Preview review. Live Member/Admin authorization and RLS remain pending; do not mark authentication acceptance or a release candidate PASS.

Next Owner action: approve publishing this exact repair commit to the existing development branch and one controlled deployment to the existing Canonical Preview, with no Production changes and no email attempts. No remote push/deployment is included in this package.

After an approved Preview deployment, begin with existing sessions only:

1. In the original ordinary Safari browser, open the canonical `/gateway.html`. Do not clear storage or sign out.
2. Use CHECK SESSION if available. Record only the visible status/error category, not URLs containing codes/tokens.
3. For an existing Member session, confirm Verified Member, one protected-content read, refresh/revisit persistence, and absent Admin controls. For the existing Owner session, confirm Admin and a read-only protected Admin view; do not alter members/content/locations.
4. If Public remains, stop and report the sanitized status. Do not request another link while email delivery risk is unresolved. A later real callback test requires separate permission for a single email, same canonical origin and same Safari context; Yahoo's embedded browser must not be treated as equivalent without evidence.

## References

- https://supabase.com/docs/guides/auth/sessions/pkce-flow
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/reference/javascript/auth-signinwithotp
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated
