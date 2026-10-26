# MR-S10 P01 Unified V6 — Sri Petaling + KL Monorail + ERL isolated integration
Base V5 source HEAD: 764dbdd6c1ea481cfae97c25ad811327f6e6928b and Owner Safari screenshot visually passed for basemap and the four V5 layers, not the complete interactive Safari UAT.
New isolated branch: feature/mrs10-p01-unified-v6-sri-mono-erl-isolated. Source module SHAs: Sri Petaling 7a6e49b6d852cea3abd3e59dd8b98b681719bed0, Monorail 0f0c49232e500234916bc54e5311493a1a7e6915, ERL bae689ade7bec85e02a654c6c87fee55da3f5d40.
V6 entry: unified-map-v6.html. V5 remains untouched.

## Contract
8 passenger-service layers in one classic MapLibre 5.12.0 map: MRT Kajang 29, LRT Kelana Jaya 37, LRT Ampang 18, MRT Putrajaya 36, LRT Sri Petaling 29, KL Monorail 11, KLIA Ekspres 3, KLIA Transit 6. Total 169 passenger-service station associations when all third-party source matches exist; distinct physical station count is lower. The 11 shared Ampang–Sri Petaling stations, as well as 3 shared ERL Ekspres/Transit stations, are not inferred as separate physical platforms/tracks. ERL nested circles indicate overlapping *service identity* only, not track count. All 8 route GIS sources and MapLibre layers have unique IDs; missing source never triggers fallback guessed coordinates.

## GIS provenance
Baseline ArcGIS layers 6/3/1/8 unchanged. Sri Petaling ArcGIS public layer 2, isolated source decoder and exact observed FID spelling exception. ERL ArcGIS layer 4, strict source-code/name matching, no official station code claim; 6 unique source station POIs decoded into 9 service associations. Monorail strict monorail-tagged OSM POI via Overpass, no claimed 11/11 until live verified. No physical polylines, guideway, line geometry, alignment source rights, or operational accuracy asserted.

## Isolation / QA gates
Only copied audited immutable module files and a new V6 adapter; untouched source branches and previous V5 page. Public-only additive build, no private scripts, no Supabase calls or production changes. Node regression, live GIS provenance, browser DOM/WebGL/marker screenshot, dark/light source recovery, language, filters, popup and transfers must pass before any broader integration.
Safari Owner UAT on real iPad separately required (V6 has not received Owner confirmation). Exact count per source, Overpass network response, visually visible Monorail pins, no blank V5 regression, and ERL service split require independent validation. Monorail unavailable is a partial GIS source state, not a passed Monorail geospatial gate.
Roll back by opening the verified V5 isolated preview; do not change MR-S10 Production or legacy routes.

## V6 map remediation
Initial 3-viewport browser test run 40411406524 exposed 158/169 actual features, with public Overpass returning zero verified Monorail markers (0/11). Other sources 120/120 V5 + 29/29 Sri + 9/9 ERL rendered. The new V6-only Monorail adapter uses additional verified public ArcGIS feature *station points* layer 5 (eleven records according to service GetEstimates) with exact name, MR code, extent, duplicate and coordinate checks. Source module's OSM matcher is preserved but not used to infer locations. Mandatory live GIS matching test added; do not claim 11/11 before it passes.
