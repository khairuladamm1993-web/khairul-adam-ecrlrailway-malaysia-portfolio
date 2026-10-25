# MR-S10 R2.17.4 — Operator GTFS candidate shape audit

26 October 2026 — Source-only stage, not a finished MRT Kajang physical rail layer.

## Why this source

The official [Malaysia GTFS Static API](https://developer.data.gov.my/realtime-api/gtfs-static) publishes Prasarana Rapid KL rail schedules and geographic feed data. The Government API [FAQ](https://developer.data.gov.my/faq) identifies CC BY 4.0 as its reuse license, subject to clear attribution. Previous discovery work established that the Selangor ArcGIS layer indexed as MRT KAJANG contains mixed KTM/LRT/MRT route geometries and lacks independently verified physical OSM way members.

A [public archived Rapid KL feed](https://www.transit.land/feeds/f-rapid~rail~kl/versions/ba6dedba3db6f0c4002fab43a969f29ac0cc01e5) contains `routes.txt`, `trips.txt`, `stop_times.txt`, `stops.txt` and `shapes.txt`, but does NOT prove the **current** official feed is the same.

## Implementation

`scripts/audit-kajang-gtfs-static.py` queries exactly:
`https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl`.

- Bounded HTTPS request (14 second timeout, 16MB compressed cap, 3MB per CSV).
- Uses Python built-in ZIP/CSV; no credentials, persistent user tracking, or external dependencies.
- Requires the route name to identify **exactly one** Kajang/SBK service. Does not match adjacent KTM, LRT, or Putrajaya routes by proximity.
- Requires 29 distinct service stop IDs, one or more shape IDs actually referenced from Kajang trips, and plausible regional latitude/longitude/length checks.
- Reports SHA-256 of downloaded ZIP plus metadata (shape counts and rough lengths), **not** raw coordinates, saved ZIP, or a public geometry file.
- Distinguishes GTFS passenger *service shape* from infrastructure track, rail-way and platform topology.
- Emits `SERVICE_GEOMETRY_CANDIDATE` only if all programmed gates pass. Even then physical tracks remain `UNVERIFIED`.

## Explicit boundaries

No changes to `assets/map-language-lab.js`, `assets/railway-track-registry-kl.js`, popup styles, 29-station Registry, `main`, Production, Supabase, R2.18/R2.19/R2.20, P02 or P03. No Vercel Production deployment.

**Never claim a source-only audit changes the live map line colour.** A later dedicated service-*reference* line overlay could use properly sourced, attributed GTFS shapes after the actual feed and station progression pass QA. Physical rail centreline and connected track ID still require separate validation.
