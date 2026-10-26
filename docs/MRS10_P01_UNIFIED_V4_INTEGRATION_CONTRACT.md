# MR-S10 P01 — Unified Railway Map V4 integration contract

## Source and isolation
Baseline branch: feature/mrs10-p01-r2175-r220-integration-qa
Baseline full SHA: 6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c
V4 branch: feature/mrs10-p01-unified-v4-isolated
Standalone UI: /unified-map-v4.html
Existing production, map-language-lab.html, Ampang viewer and other module branches are not overwritten.

## Four-route service contract
Route | Stop sequence | Color token | GIS point layer
---|---:|---|---:
MRT Kajang | 29 | #087D43 | 6
LRT Kelana Jaya | 37 | #D50032 | 3
LRT Ampang | 18 | #A65100 | 1
MRT Putrajaya | 36 | #FBCD20 | 8

Service sequence and colors: assets/railway-track-registry-kl.js plus assets/mrs10-r219-ampang-service.js.
Third-party GIS reference: https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer
These are PUBLIC GIS STATION POINTS, not surveyed railway track alignment. Runtime rejects invalid geometry, ambiguous duplicate station matching, and unexpected GIS failure. Station lineup is retained even if GIS markers are unavailable.

## Mandatory source-module handoff
Each additional module (Sri Petaling, Monorail, ERL, KTM, ECRL, Thailand, Sabah, Sarawak ART) must supply:
1. Immutable full source commit SHA and branch; source ownership remains with that module.
2. Module ID; route IDs; service/operator/category/status; documented official code; ordered stops; official or cited service color HEX with authority.
3. One station ID per service. Separately identify physical station/facility, passenger interchange, transfer link, shared alignment, historical link, and planned interchange. Never merge by proximity alone.
4. Coordinates from a verifiable geospatial source, with per-feature provenance and schema, capture date, permitted use/license, bbox, reference system (WGS84), confidence, nonambiguous 1:1 station match.
5. Railway track LineString only after way geometry, membership, continuity and track topology are independently verified. Ordered stop sequence never justifies geographic polyline drawing.
6. Node checks, browser rendering and interaction evidence, language controls, Safari iPad UAT, GitHub Actions URL, public-only non-production preview, deployment ID, known failures.
7. Exact expected station counts with rejected/accepted source-feature inventory, GIS fallback, accessibility and dark/light style-load recovery.
8. A compatibility flag for initial DEFAULT ALL visibility; no module may disable four original routes upon failure.

Integration acceptance: SOURCE_IDENTIFIED, COMMIT_SHA, DATA_VALIDATION, GIS_PROVENANCE, NODE_QA, BROWSER_QA, OWNER_SAFARI_UAT, SAFE_PREVIEW, CONFLICT_REVIEW. Unpassed modules remain isolated.

## Verified read-only module branch HEAD observations (not imported)
Sri Petaling: 7a6e49b6d852cea3abd3e59dd8b98b681719bed0
Monorail: 0f0c49232e500234916bc54e5311493a1a7e6915
ERL: bae689ade7bec85e02a654c6c87fee55da3f5d40
KTM multilingual repair: da46c810bc7d3ab48ddebb6f0de7f277956e7674
Thailand V3: cb3ba1b721b933fe3e5e4596c8a2f1cc7431f6f5
Borneo V2: 2bd2f16e662a12c568b5768562fe36ff3841c2f2

## Release safety
- CI PASS does not imply browser markers visible; count n/120 live source matches.
- Browser smoke is a distinct gate, Owner iPad Safari UAT is distinct again.
- Public-only preview uses allowlisted third-party GIS, basemap and MapLibre CDNs; no Supabase/member/quiz auth scripts.
- No Production merge, no paused-project unpause, no admin/auth/RLS changes.
- Rollback: stop or delete the isolated preview and revert the V4-only branch; baseline SHA and original production remain unchanged.
