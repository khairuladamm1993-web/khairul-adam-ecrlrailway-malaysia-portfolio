# Tested analytics migration — staged, not activated

This branch preserves the previously tested analytics implementation byte-for-byte.
All 8 original checks were rerun successfully before this snapshot.
No existing GitHub Pages file, image, design, content, or redirect has been changed.
The original Sites source and live site are unchanged.

## Files
- original/dist/analytics.js: unchanged client
- original/analytics/collector.mjs: unchanged aggregate collector
- original/analytics/client.test.mjs: unchanged 3 client checks
- original/analytics/collector.test.mjs: unchanged 5 collector checks
- original/drizzle/0000_loose_northstar.sql: unchanged database schema

Run with Node supporting node:sqlite:
```sh
node analytics/original/analytics/client.test.mjs
node analytics/original/analytics/collector.test.mjs
```

## Exact remaining activation requirements
GitHub Pages serves static files and cannot run the existing collector or D1 database.
The client currently posts to /api/anonymous-counts at its page origin.
Copying this script into the page alone will not collect data on GitHub Pages.

The least disruptive compatible backend is a Cloudflare Worker with a D1 database,
because the original collector already implements that API. This session has no
connected Cloudflare provisioning/deployment tool or configured Cloudflare account
and API token. No backend, database, endpoint, or dashboard has been provisioned.
Do not merge this snapshot as if analytics is active.

Once secure backend access is available:
1. Provision D1 and apply the unchanged schema. Keep database access owner-only.
2. Deploy the collector with a narrowly scoped cross-origin transport adapter for
   https://khairuladamm1993-web.github.io. Reject other origins and unsupported
   methods/headers; never use wildcard credentialed CORS or expose database reads.
   Keep the collector's payload validation, counter logic and retention unchanged.
3. Configure the actual HTTPS endpoint in a separate client deployment adapter,
   omit credentials and referrers, and retain the exact original snapshot.
   Do not monkey-patch global fetch or put deployment credentials in browser code.
4. Add only the script integration and DOM event hooks required by the existing
   client (for example the Continue control id). Preserve all visual markup/styles.
5. Repeat the original 8 tests and add transport/CORS tests; then verify a real
   published-page POST and an aggregate database increment through owner access.
   Successful script loading or HTTP 204 alone is not proof of durable storage.
6. Update PRIVACY.md accurately and publish main only after end-to-end validation.

## Existing page coverage limitation
At inspected main commit 0a118752061345e57ef5f7e3d813ecf4561de28d, index.html
contains a welcome screen with Continue linking to portfolio.html. portfolio.html
redirects to the old Sites portfolio. The GitHub welcome page does not contain
the three-step flow, language selectors, or Pinyin controls. These events remain
supported in the unchanged analytics code, but cannot be observed on absent
GitHub controls. The separate Sites page will not inherit this GitHub script.
Full funnel and portfolio coverage therefore requires the separately requested
portfolio migration or an authorized integration on the actual portfolio host.
Do not invent events or claim full funnel validation.

## Privacy
No GPS, browser location permission, precise location, identity collection, or
visitor profiles. Optional coarse country uses only the collector's existing
platform country metadata; omit it if unavailable. Honor DNT/GPC. Browser date
flags are estimates, not unique visitor identifiers. No public analytics-read
endpoint. Hosting provider operational logs are separate from these counters.
GitHub Pages does not provide this draft's Worker response security headers;
do not claim a deployed Permissions-Policy header unless verified.

## Original SHA-256 checksums
34b315a854e35a81e62af7ec57cd99846ed3559e3c918e50464b5d3d4b69ba6c  original/dist/analytics.js
5b7f58e4d1b06ca3f87a3d2371c1adf60e55e90e20d345cb69526f58490d04c8  original/analytics/collector.mjs
3abfb31f73c8735107752a2f86a78fb7fdc92a133e1d8475447aed13f009b957  original/analytics/client.test.mjs
62fe122761b9d89a9112c95e27f6251dc36930f59bd711234545f6215fb55d8a  original/analytics/collector.test.mjs
c4a7ce5397aa0526bde50ce6ace5901990772392d7304633229b18c93363cf7c  original/drizzle/0000_loose_northstar.sql
