# Staged analytics compatibility extension — NOT DEPLOYED

The live Worker, D1 binding/database, schema and GitHub main remain unchanged.

`../original/` preserves the tested collector, original same-origin client and schema. `../backend/worker.mjs` preserves the deployed transport adapter and origin restrictions. The existing 8 + 4 tests are retained.

`collector.mjs` is a compatible allowlist extension only: category, module, quiz_start, quiz_complete, plus resume route. Existing validation, privacy opt-outs, retention, country fallback and aggregate-only SQL remain identical. No schema migration is required because the current table already stores metric/bucket counters.

The migration client preserves the existing transport and metrics, adding:

- fixed `railway-analytics-next-stage` sessionStorage marker consumed at the next page; values are only `modes` or `portfolio`, not a visitor identifier;
- Welcome → Gateway → Portfolio progression, omitting the retired System Ready screen for this requested flow;
- strict fixed-bucket event listener for categories/modules/quiz lifecycle;
- pending capability gate to avoid sending unsupported new counters to the unchanged live Worker;
- Resume grouped under About until the extended backend is approved.

`gateway.html` deliberately uses `railway-analytics-extension=pending`. Thus original counters continue working, and new category/module/quiz counters are tested locally but **not active on the production Worker**. Do not describe them as deployed.

After owner approval, deploy the same transport adapter importing this extended collector, retaining the existing Worker, D1 binding and exact GitHub Pages CORS origin. Then enable the frontend meta flag, validate real events/readback and only subsequently merge the approved frontend. Use existing authenticated Cloudflare tooling; never put owner credentials in static files. No anonymous dashboard-read endpoint is added. Owner reads remain through the existing authenticated Cloudflare/D1 API.

No deployment commands are automated in this branch. The site cannot become fully migration-analytics-ready until that explicit post-review deployment step is approved.
