# Access architecture — migration only, 5 October 2026

Status: Supabase browser authentication and server-authorized member/admin session wiring
are now implemented on migration/full-portfolio. The browser uses only the public
publishable key. Access remains Public until Supabase returns a valid user and
public.account_role() returns member or admin. No frontend-selected role, URL parameter
or local storage flag can unlock protected content. No IC or passport is requested.

End-to-end email verification is still **unverified in production** because the project
currently has zero real auth users/sessions. Supabase Auth redirect URLs must include the
actual migration/preview origin before the first real magic-link acceptance test.

## Public delivery boundary

`gateway.html` loads title-only module previews and short public editorial summaries.
It does not request quiz questions, corridor data, map pixels, development details,
member records or an admin API. `RailwayAccess` is an immutable PUBLIC/pending view
model, not an authorization mechanism. Neither storage nor URL parameters can
unlock content. Public portfolio, News directory and References remain accessible.

The existing quiz banks and controller are retained unchanged in source for tests
and a future server-authorized bundle. The preview build explicitly excludes
`questions.js`, `quiz-core.js`, and the legacy `gateway.js`. A fresh output directory
is mandatory so old content cannot remain accidentally deployed.

**Repository limitation:** this GitHub repository and its history are public.
Existing questions have already been public. Removing a script tag or excluding
an asset from preview does not make repository copies confidential. Do not add a
full map or any new restricted dataset here. Before production member rollout,
use a private content repository/store, authenticated delivery, and a public-only
build artifact. Do not deploy this source tree wholesale through Pages main.
Current live main is deliberately unchanged and retains its previous public scope.

## Implemented Supabase access contract

`assets/access.js` initializes the pinned Supabase browser client using the project URL
and browser-safe publishable key. It restores the SDK session, validates the user with
Auth, then calls `account_role()`. Any missing, invalid, expired or rejected session
fails closed to Public.

- Email entry calls `signInWithOtp` using a one-time email flow. Success means
  "verification sent", not member access.
- Member/admin access is granted only when `account_role()` returns that role.
- Approved member content, quiz banks and member-file metadata are fetched only after
  that server result. Own profile/progress/attempts remain RLS-scoped.
- Quiz writes call `submit_quiz(...)`; score and PASS are server-calculated.
- Progress writes call `save_progress(...)`.
- Activity recording is blocked client-side until explicit `set_activity_consent(true)`
  and is independently enforced by the RPC.
- Admin summary/content/member-enable operations use the existing admin RPCs and the UI
  is not rendered unless the role RPC returns admin.
- Logout clears in-memory member data and returns the UI to Public.
- Protected file access uses short-lived signed Storage URLs after authenticated metadata
  access; no private object URL is embedded in the public HTML.

The public static preview remains intentionally different: its build removes the Supabase
CDN and member UI, replaces `access.js` with a Public-only stub and keeps
`connect-src 'none'`. Preview therefore cannot become a back door to production data.

## Member content manifest (not in public asset bundle)

- Full practical assessment: existing ten modules × sixteen questions are delivered from
  RLS-protected `quiz_banks` after verified member authorization; no new question bank
  is copied into the public frontend.
- E-book notes; approved simulator material; detailed Insights: content approval pending.
- Corridor: station code/name, section, approved chainage, classification, detail and
  source/evidence flag (`public-confirmed`, `personal-field-reference`, `development-only`).
  No full dataset was present in the migration checkpoint; do not synthesize it.
- Corridor Master Overview appears before the station grid. Public sees a text-only
  locked placeholder; no blurred full-resolution original in CSS/HTML/network.
  After auth: private image response, scroll/zoom with reset, keyboard and touch;
  no public R2 bucket or permanent signed URL. Viewer is pending auth/private asset.
- Map must be the original user compilation, not a generated substitute. The Library
  includes both `IMG_1059(1).jpeg` and a generated `ECRL Corridor Railway Overview Map.png`.
  Generated map description has extra signature text and is not used. Asset selection,
  faithful signature correction and private upload remain pending. Required artwork
  signature is exactly `阿当93`, small at the bottom, no `By` or `Adam93`.
- Coming Soon approved owner backlog: Section D — PL07 Alang Sendayu → North Port Klang
  & West Port Klang; Expanding PL04; Expanding STN08; fourth slot empty. Not rendered
  in public UI. Store/deliver via private backend when available.
- Rolling Stock Library: title-only CR200J teaser. No unsupported FXD3-J equivalence or
  exact specification added. Full approved records need source validation before upload.

## Admin areas (planned, not fake dashboards)

Visitor statistics; member registrations; aggregate quiz usage/results; content and
roles; rolling-stock/station records; News/Insights/References; Coming Soon;
simulator/project status; security/activity logs. Admin UI should be delivered only
through authenticated owner access. Never embed example counts that look like live data.

## Engagement analytics and privacy contract

Production anonymous analytics source and deployment are unchanged. Existing
`duration_seconds`, `active_seconds`, `section_seconds`, entry/exit and aggregate
counts retain their original meaning. Existing visibility-based time is not claimed
to be a new interaction-aware idle-filtered metric.

Admin must label **Visit Duration** separately from **Active Engagement Time**.
Required future aggregation: total visits, estimated unique/returning visitors, mean,
median, longest duration, active time and per-section engagement, entry/exit and
Public/Member separation. Existing sum/count storage can support means; median and
longest cannot be reconstructed from those sums. Do not fabricate them.

Backend extension gate (not deployed in this pass): anonymous duration histogram for
median estimate, bounded max reducer, section sums/counts, idle-aware active time.
Use monotonic deltas; pause while hidden, unfocused where reliable or inactive for
60 seconds. User pointer/key/scroll/navigation activity renews the window; flush
bounded deltas on lifecycle changes, avoid double counting bfcache restores. No
keystrokes, pointer coordinates, raw URLs/referrers or identity payloads are retained.
No new persistent identifier is required for aggregate metrics. Any future anonymous
session identifier must be random, short-lived and non-identifying.

Authenticated activity belongs in a separate service/store with an explicit member
privacy notice, minimal account association, retention and deletion policy. Anonymous
public traffic must not be enriched from login identities. Preview never writes to
production. New engagement logic needs dedicated tests and approved backend rollout
before claiming these dashboard metrics are implemented.


## Phase 2 frontend checkpoint — 6 October 2026

Implemented files: `assets/access.js`, `assets/member-gateway.js`, `gateway.html`,
preview isolation script, gateway auth/member styling and `tests/auth-wiring.test.cjs`.

The member gateway preserves the existing Light/Dark, BM/EN/Chinese/Pinyin and public
locked-preview design. Member data is memory-cached only for the active page. Practical
assessment selects one or two approved banks and builds exactly sixteen questions
(16 from one bank or 8 + 8 from two); answers are submitted to the server RPC using a
client attempt UUID. The displayed PASS threshold remains 12/16 and is explicitly
described as personal self-assessment, not an official qualification.

Authenticated member engagement uses a random per-page UUID and monotonically increasing
sequence only after explicit consent. Visit Duration is accumulated separately from
Active Engagement Time; active time pauses while hidden/unfocused or after 60 seconds of
inactivity. No keystroke contents, pointer coordinates or browsing identity are recorded.

Remaining gate: configure/confirm the real allowed Auth redirect URL, create the first
verified account through the UI, and perform browser/Safari end-to-end checks. Until that
happens, email delivery, callback exchange, session restore and admin ownership are
implemented but cannot honestly be marked production-validated.
