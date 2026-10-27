# MR-S10 P01 — Singapore Railway V1 Isolated
- Isolated branch based on Unified V7 `c64aa0b19b68aeafbaeb03e568e5cd07e7e4790f`. No modifications to V6, V7, main, Supabase or Shuttle Timur.
- Open `/singapore/index.html` or configure Vercel Project Root Directory to `singapore` and open `/`.
- Pinned MapLibre GL JS v4.7.1; OpenFreeMap vector basemap light Positron / dark Dark (no API key, provider and OSM attribution). Previous CARTO raster endpoint caused Owner Safari `API KEY REQUIRED` watermark. Network failures surface as errors, never silently PASS.
- `data/stations.geojson`: coordinates from third-party repackaging of LTA/URA government data; read LICENSE-DATASET in upstream `elliotwutingfeng/singapore_train_station_coordinates` and Singapore Open Data Licence. CCL6 three stations moved to OPERATIONAL based on LTA 12 July 2026 release. TEL5/DTL3e remain UNDER_CONSTRUCTION unless opening evidence is obtained.
- `data/tracks.geojson`: **13 secondary OSM-derived preliminary polylines** via `cheeaun/sgraildata`; this source itself warns geometry may not match physical tracks. OSM way IDs absent; no OSM way-level tag bridge/tunnel count/chainage included. Do not promote this to engineering georeference or cite as verified physical rail.
- `track-intelligence-adapter.js`: reusable platform-independent adapter. Unknowns stay null. Official chainage requires known official datum, source URL and official flag. Only genuine feature-backed bridge/tunnel should set structure types.
- `integration-manifest.json`: handoff, **integrationReady=false** until licensed verified whole-network track geometry, routing reconciliation, browser QA and Safari review.
- Lines: 6 MRT, 5 LRT loop identities, JRL, CRL, Shuttle Tebrau, RTS, Sentosa Express, Changi Skytrain.
- Future lines visible only when toggled. Unlocated cross-border identities are catalogued, not represented by fabricated map pins.
- Track popup is intentionally annotated **secondary/unverified**. Gauge MRT track uses LTA EGD09106A2 design standard (1435 mm); rubber-tyred APM is `null`. Shuttle Tebrau 1000 mm system characteristic, no inspected segment claim.
- Source provenance as of 2026-10-27: [LTA rail](https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network.html), [CCL6](https://www.lta.gov.sg/content/ltagov/en/upcoming_projects/rail_expansion/circle_line_6.html), [RTS](https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/10/news-releases/grantors-informed-rts-link-service-targeted-feb-2027.html), [LTA design specification](https://www.lta.gov.sg/content/dam/ltagov/industry_innovations/industry_matters/development_construction_resources/civil_standards/pdf/EGD09106A2_Overall.pdf), [LTA/URA station data provenance](https://github.com/elliotwutingfeng/singapore_train_station_coordinates/blob/main/LICENSE-DATASET.md), [OSM](https://www.openstreetmap.org/copyright).
- **Open QA gates**: 33 operational CCL station points plus CC18 Bukit Brown reserved (PLANNED); CE1/CE2 legacy codes are mapped to CC34 Bayfront and CC33 Marina Bay after 12 July 2026; physical track features lack source OSM way IDs, bridge/tunnel tagging and full-system GIS. Preview-browser rendered test and Owner Safari UAT not implied by unit tests.

## V1.1 baseline recovery and UI handoff
- CSS/HTML/JS and manifest only. Station points 273 and secondary track polylines 13 are **unchanged** (exact original blob hashes must match HEAD baseline).
- iPhone 29% bottom panel with one collapsible routes/filters disclosure; iPad compact 275–305px side panel; tap marker or secondary track for provenance-aware popup. Track geometry remains unverified.
- Default full station lineup is intentionally not expanded until a line, category, or search is selected; all 273 source-backed points remain in the GeoJSON and the 214 operational point filter (before future toggle) remains unchanged.
- Cross-border Shuttle Tebrau and RTS 0 GIS points represent an explicit data provenance gap. Do not manufacture coordinates or lines.
- Operational speed, approach speed, through speed, TSR, chainage and crossing loop metadata are unknown unless verified source-backed field values exist.
- Integration: ingest `integration-manifest.json`, lines, stations, tracks, and adapter under singapore namespace without changing Unified V7. Physical Track Intelligence gate remains CLOSED even when visual QA passes.

## Singapore V1.2 — Explicit station topology and safe cross-border recovery
- Four additional **OSM-secondary markers** are loaded as a separate GeoJSON source. They are NOT merged into the existing 273 Singapore station-code points. The 13 original secondary polylines remain unchanged. No border track LineString has been invented.
- Shuttle Tebrau: JB Sentral ↔ Woodlands Train Checkpoint (two terminal passenger service). RTS: Bukit Chagar ↔ Woodlands North RTS (future passenger service; target Feb 2027 subject certification).
- Terminal OSM point / polygon centre coordinates are for orientation only, not surveyed station/platform geometry; stations mapped from OSM building polygons are approximate.
- Station order is resolved by explicit path arrays in `data/route-topology.json`; no `stationCode.localeCompare` or coordinate-proximity route derivation. User selects direction/branch using the compact `#direction` selector.
- A stop with `geometry:null` remains selectable in the lineup; UI does not navigate to synthetic coordinates.
- CCL6 continuous loop separated from Dhoby Ghaut spur. EW4 / CG branch separated from EWL through service. Sengkang and Punggol LRT loops retain explicit forward/reverse schematic adjacency, **not verified live operating direction**.
- Future JRL/CRL/TEL5/DTL3e and airport terminal service details remain explicitly PARTIAL and must not be treated as certified operating paths.
- References: LTA system map, LTA CCL6 and wayfinding, LTA JRL/CRL, KTMB Shuttle FAQ, RTS Link official, Singapore MOT Sentosa Monorail report, Changi Airport transfer guide, OSM feature IDs.
- Owner Safari test for V1.2 is a separate acceptance gate, regardless of browser CI success.
