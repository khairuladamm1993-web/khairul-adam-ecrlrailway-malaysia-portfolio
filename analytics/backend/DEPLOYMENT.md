# Cloudflare backend preparation

Status: prepared, locally tested; NOT deployed or connected to production.
The original 8 tests pass unchanged; 4 new transport/database-read checks pass.
The new checks use SQLite with a D1-compatible test adapter, not Cloudflare production.

## Added components
- worker.mjs imports the unchanged collector and implements exact-origin CORS for
  https://khairuladamm1993-web.github.io. Only POST /api/anonymous-counts is writable.
  Preflight is bounded; credentials/cookies are never forwarded to the collector.
  Origin checks limit browser access, not deliberate non-browser event forgery.
- wrangler.example.json configures the existing DB binding and original SQL migration.
  Logs/traces are disabled in Worker observability. Platform security logs are separate.
- prepare-client.mjs generates the existing client with only endpoint and credential
  transport substitutions. All metrics and counters remain unchanged. The original
  source hash must match before generation. It does not modify website HTML.
- dashboard.sql provides owner-only aggregate queries for the authenticated Cloudflare
  D1 console. There was no custom analytics dashboard in the original tested draft.
  No public read endpoint or fake browser-only owner check is added.

## Secure deployment
Use Cloudflare OAuth on an authorized machine/session. Never paste credentials into
chat, commit them, or place them in browser code. From this directory:

```sh
npm ci
npx wrangler login --device --browser=false
npx wrangler whoami
npx wrangler d1 create khairul-adam-railway-analytics
```

Select the intended Cloudflare account if more than one is available. Copy
wrangler.example.json to ignored wrangler.json and set database_id to the actual
created database ID. If necessary set account_id to the verified target account ID.
These IDs are identifiers, not tokens. Do not retain the placeholder or invent IDs.

```sh
npx wrangler d1 migrations apply DB --remote --config wrangler.json
npx wrangler deploy --config wrangler.json
```

No domain transfer or frontend hosting change is required. If Cloudflare requires
workers.dev onboarding, complete it in the authenticated Cloudflare dashboard.

## Frontend activation and production verification
Only after the Worker is deployed:
1. Take the actual endpoint from deployment output. Generate the transport-only client:
   `node prepare-client.mjs https://ACTUAL-WORKER.workers.dev/api/anonymous-counts`.
   The example is a placeholder and must never be published.
2. Copy the generated script to the frontend's assets directory, add its deferred
   script tag and required Continue id to the existing page, without CSS/content edits.
   The original client expects body data-screen and the existing original event hooks.
3. Validate preflight, valid POST, denied foreign origins, rejection of extra fields,
   privacy opt-outs, and no anonymous read access against the real endpoint.
4. Record an aggregate baseline using the authenticated D1 console. Open the actual
   published GitHub Pages site, click Continue, and verify successful browser POSTs.
   Query D1 again and verify the appropriate counters increased. Do not call synthetic
   HTTP posts "published-site events". Preserve honest counts and report any test visits.
5. Load dashboard.sql queries through the authenticated D1 console. Verify persisted
   aggregates and computed duration summaries. A 204 alone does not prove persistence.
6. Update the existing privacy notice for the actual Cloudflare backend and publish
   validated frontend changes to main; verify again from the live site.

Before frontend publication, a deployment preview on the same authorized GitHub origin
can validate transport; the final check must use the real main-branch Pages URL.
Do not expand CORS to unrelated origins just for previews.

## Coverage and dashboard limitation
The current GitHub page contains only Welcome and a Continue handoff to Sites.
Absent mode/language/Pinyin controls cannot emit events; the redirect destination
will not inherit this script. The original metrics remain supported but full funnel
validation awaits portfolio migration/integration. No events should be fabricated.
The D1 console is an authenticated aggregate viewer, not a custom visual dashboard.
If a separate dashboard is required, provision verified owner authentication first.

## Checks
From repository root:
```sh
node analytics/original/analytics/client.test.mjs
node analytics/original/analytics/collector.test.mjs
node analytics/backend/worker.test.mjs
```
No GPS, browser geolocation, protected location access or visitor identity is used.
Missing country metadata is ignored by the original tested collector. The Worker
Permissions-Policy header applies to its responses, not to GitHub Pages documents.
