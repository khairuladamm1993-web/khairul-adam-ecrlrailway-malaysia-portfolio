# MR-S10 P01 R2.17.1 — MRT Kajang Line physical alignment audit (candidate stage)

Audit date: 2026-10-26 (MYT). This is a **discovery checkpoint**, not an infrastructure approval or an operator survey.

## Scope and preservation

- Preserve R2.17 green identity for the 29 MRT Kajang passenger-service stops and source-matched `KG16 Pasar Seni`/`KG35 Kajang` map POIs.
- Preserve unverified physical railway rendering; **no track/rail way has been approved for green alignment styling**.
- Do not merge R2.18 Kelana Jaya or R2.19 Ampang work.
- No changes to `main`, Production, Supabase, P02 or P03.

## Proven findings

| Source | Observation | Audit classification |
| --- | --- | --- |
| MRT Corp [current Kajang overview](https://www.mymrt.com.my/projects/kajang-line/) | Kwasa Damansara–Kajang, 29 stations, 46 km published alignment, approx. 9.5 km underground | Official **aggregate** service corridor, not source way/track topology |
| [Wikidata Q6717618](https://www.wikidata.org/wiki/Q6717618) | P402 points to OSM relation `8000326`, with no cited reference in indexed entry | Candidate relation; **not** verified as current OSM relation type, route members or complete alignment |
| [Geoview third-party OSM way snapshot](https://my.geoview.info/laluan_kajang%2C10778403716w) | OSM way `778403716` labelled 'Laluan Kajang', source snapshot dated 2025-07-14, reported length 4,193 m, railway=subway | Candidate physical way; **not** verified current OSM way data, membership, continuity, or full 46 km route |
| [SELANGOR_RAILWAY_MAP FeatureServer listing](https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer) | Advertises 'MRT KAJANG LINE' layer index 15 and 'KAJANG LINE STATION' index 6 | Candidate thematic GIS data; feature geometry, provenance, currency, license, and physical precision unverified |

Direct OSM relation/full-way and ArcGIS detail retrieval was attempted but not accessible in the available research environment. No direct OSM entity XML, relation members, GeoJSON geometry, or transport layer feature IDs were received.

## Critical hazards

1. `relation=route` and `route_master` may represent passenger service, directions, route variants and stop/platform membership; **do not treat relation membership as surveyed single-track geometry**.
2. Only names `KG16 Pasar Seni` and `KG35 Kajang` have exact observed cartographic POI crosswalks; other 27 green nodes are ordered list entries without accepted map coordinates.
3. Kajang has nearby KTM infrastructure. Close POIs or parallel geometry cannot prove same railway operator/service.
4. Different main-map sources use `poi` and `transportation` vector layers. Painting all rail/subway features by class risks recolouring KTM/other MRT/LRT.
5. Third-party GIS thematic routes may not follow physical track centrelines, may be dated, or may have usage restrictions.

## Required gates before colouring any physical alignment

- Retrieve current live OSM relation `8000326` and way `778403716` with versions, tags, geometry and relation memberships; reject stale/reassigned IDs if inconsistent.
- Confirm that the candidate relation is a current Kajang service relation; inspect its member railway ways, direction variants, role and continuity; a service route alone cannot certify individual physical tracks.
- Fetch every candidate physical OSM way and validate topology, duplicates/branches and adjoining segments. Separate elevated, tunnel and ancillary/depot alignments where the evidence supports it.
- Validate station progression, including interfaces with Putrajaya Line and separation from KTM Kajang. Do not infer from name proximity or line colour.
- Reconcile geometry with the current MRT Corp Kwasa Damansara–Kajang corridor and validate source rights/attribution for any new GeoJSON or tiles.
- Only then build opt-in green alignment highlighting for **matched way IDs**, with transparent attribution, tests rejecting any unverified segments, and Owner Safari UAT for KTM separation.

## QA / release policy

`osmRelationAudit.relationCandidateIds=['8000326']`; `wayCandidateIds=['778403716']`.
`acceptedRelationIds=[]`; `acceptedWayIds=[]`; `verifiedPhysicalTracks=0`; `acceptedGeometry=null`.

This is a **source-audit checkpoint**. It is not permission to paint the full 46 km line, invent coordinates, promote to Production, or mark R2.17 completed.
