# MR-S10 P01 — Singapore Railway V1.2 Integration Handoff
**As of:** 2026-10-27
**Source branch:** `feature/mrs10-p01-singapore-rail-v1-isolated`
**Isolation:** No writes to main, Production, Unified V6/V7, Shuttle Timur, Thailand, Borneo, ECRL or Supabase.

## Data entrypoints
- `singapore/data/lines.json`: immutable 17 route identities and colours (existing schema).
- `singapore/data/stations.geojson`: 273 existing source-linked Singapore station-code point records; not equivalent to 273 unique operational physical stations.
- `singapore/data/tracks.geojson`: 13 inherited secondary approximated polylines; not official surveyed rail.
- `singapore/data/route-topology.json`: **41 explicitly ordered path identities across 17 lines**; service adjacency; distinct direction and branch paths; carries partial statuses.
- `singapore/data/cross-border-terminals.geojson`: 4 supplementary sourced OSM POI/centroid markers (2 Shuttle Tebrau, 2 RTS); **not** included in original 273 record count.
- `singapore/data/cross-border-connections.json`: four explicit service / passenger transfer / nearby-area relationships with null physical geometry.
- `singapore/track-intelligence-adapter.js`: existing evidence-gated track information component. Never infer gauge, bridge, speed, official CH, crossing loop or track count from service lineup.
- `singapore/integration-manifest.json`: machine-readable integration contract.

## Lineup registry audit (reference IDs = station-line association tokens, not physical station count)
| Route | Distinct topology station IDs | Paths | Confidence scope |
|---|---:|---:|---|
| NSL | 27 | 2 | SOURCE_LINKED_TOPOLOGY |
| EWL | 35 | 4 | SOURCE_LINKED_TOPOLOGY |
| NEL | 17 | 2 | SOURCE_LINKED_TOPOLOGY |
| CCL | 33 | 4 | SOURCE_LINKED_TOPOLOGY |
| DTL | 37 | 3 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| TEL | 30 | 3 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| BPLRT | 13 | 2 | SOURCE_LINKED_TOPOLOGY |
| SK_E | 6 | 2 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| SK_W | 9 | 2 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| PG_E | 8 | 2 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| PG_W | 8 | 2 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| JRL | 24 | 3 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| CRL | 23 | 2 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
| SHUTTLE_TEBRAU | 2 | 2 | SOURCE_LINKED_TOPOLOGY |
| RTS | 2 | 2 | SOURCE_LINKED_TOPOLOGY |
| SENTOSA | 4 | 2 | SOURCE_LINKED_TOPOLOGY |
| CHANGI_APM | 3 | 2 | PARTIAL_TOPOLOGY_SOURCE_LIMITED |
- Main CCL ring: CC4→CC5…CC17→CC19…CC29→CC30 Keppel→CC31 Cantonment→CC32 Prince Edward Road→CC33 Marina Bay→CC34 Bayfront→CC4 Promenade; CC18 reserved. Separate CC1→CC2→CC3→CC4 spur. Ring has 30 distinct main line codes plus 3 spur station codes; total current CCL 33.
- Main EWL EW1→EW33 separate from Tanah Merah EW4→CG1 Expo→CG2 Changi Airport and reverse.
- Bukit Panjang LRT Service A via BP13 Senja; Service B via BP7 Petir; repeat of shared stem/loop closure is intentional.
- Sengkang/Punggol loops carry adjacency A/B only, with active service direction unverified.
- JRL, CRL, TEL5, DTL3e and Changi Skytrain retain PARTIAL future/service scopes.

## Cross-border evidence contract
- Source terminal markers use OpenStreetMap IDs and WGS84 **secondary** approximate coordinates from OSM-derived Mapcarta references. Do not promote to official station entrance/survey coordinates.
- JB Sentral `node/1639480363`; Woodlands Train Checkpoint `node/2014918590`; Bukit Chagar building `way/957459196`; Woodlands North RTS polygon `way/1101862890`.
- Shuttle Tebrau SG terminal is not Woodlands MRT, and RTS Singapore terminal is not TEL TE1; explicit transfer relation only.
- RTS is future, not open as of 2026-10-27; February 2027 target subject to certification.
- All actual cross-border physical rail coordinates / bridge segmentation are **unknown** in this package. No fabricated LineString.

## Integrator procedure
1. Read integration manifest and preserve version and namespace; import `route-topology.json` as service topology, distinct from physical geometry.
2. Register station metadata by stable station IDs, taking SG original GIS and separate supplementary border point source; never concatenate and call all records unique operational stations.
3. Render line selector → route.paths → explicitly ordered station IDs; for geometry-null station show location-unverified state.
4. Add border POI layer with secondary-provenance label; do not synthesize lines between terminals.
5. Retain evidence-gated Track Intelligence; do not mark `integrationReady` true without physical geometry provenance and Owner Safari approval.
6. Regression-test existing Unified V7 separately in integration branch; do not merge Singapore branch into main.
7. Record commit SHA, separate Preview ID, QA checks and rollback before any later Unified merge.

## Rollback
- Previous Safari-tested Singapore V1.1 code HEAD: `2595466b3a5f5d34295aa912788ff2575d49a062`.
- Earlier V1.1 Preview: `https://mrs10-p01-singapore-rail-v1-isolated-preview-r8lk5kjsl.vercel.app/`.
- For a safe rollback on Singapore branch, **revert the V1.2 commits** in a new forward commit after verifying current HEAD; never force-reset a shared branch or touch main/Production. For display-only rollback, use the V1.1 immutable Preview URL.
- Do not overwrite or promote a deployed Production alias.

## Release gate
- Data topology QA: test file `tests/singapore-topology-v12.test.cjs`; Browser QA: `tests/singapore-rail-browser.test.mjs`. Report actual run results, do not assume.
- `CROSS_BORDER_LINEUP_READY` may PASS independently of `PHYSICAL_GIS_READY`.
- `UNIFIED_INTEGRATION_READY` remains **BLOCKED** pending Owner Safari V1.2 and specialist GIS/source work.
