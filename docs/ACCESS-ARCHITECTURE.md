# Access architecture — migration only, 5 October 2026

Status: PUBLIC UI implemented; verified-email authentication, private content storage,
member services and Adam-only admin are **not connected**. No login is simulated.
No email, password, IC, passport or session credential is requested by this build.

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

## Server contract to implement before enabling members

Use a separate auth/backend deployment from the anonymous analytics Worker/D1.
Prefer a reputable verified-email provider, PKCE/one-time email-link flow and a
first-party secure session. Cross-site Pages/backend cookie behavior must be tested
in Safari; a same-site custom-domain architecture may be needed. Never persist
bearer/session secrets in localStorage or query strings. No credential goes in Git.

- GET `/session`: validated server session -> public/member/admin and verified-email
  status. No frontend role assertion is trusted.
- POST `/auth/email/start`, `/auth/email/complete`: rate-limited, one-time, expiring,
  anti-enumeration email verification. Provider credentials remain server secrets.
- POST `/logout`: revoke session; clear member data in memory, invalidate private URLs.
- GET `/member/{resource}`: 401 unless authenticated, 403 unless approved verified member;
  validate authorization on **each** request. `Cache-Control: private, no-store`.
- Quiz history/progress is pending server storage; current retained quiz is local-only.
- GET/POST `/admin/*`: server-side immutable Adam owner subject allowlist, not an email
  suffix or self-selected role. MFA/reauth for sensitive changes, CSRF protection,
  audit trail, and least privilege. No public admin route, toolbar or data in this build.
- Exact origin allowlist + credential policy; CORS is not authentication. Do not reuse
  anonymous analytics credentials or expose authenticated data on that collector.

## Member content manifest (not in public asset bundle)

- Full practical assessment: existing ten modules × sixteen questions, unchanged.
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
