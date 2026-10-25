# MR-S10 P01 — R2.17.3 MRT Kajang physical line source audit
Date: 2026-10-26 MYT. Status: **READ-ONLY SOURCE AUDIT PASS / PHYSICAL TRACK NO-GO**.

## Preservation baseline
- Parent source: R2.17.2 commit `b6fc699c9c69e9f62613c82e6ce07be7cc0901da`.
- Owner Safari (05:41 MYT) confirms sourced `KG13 Pusat Bandar Damansara` map circle green and candidate `9/29` popup; existing `KG16`, `KG35`, and green 29-service-stop Registry preserved.
- No edits to `assets/map-language-lab.js`, `assets/railway-track-registry-kl.js`, map paint styles, `main`, Production, Supabase, R2.18 Kelana Jaya, R2.19 Ampang, P02 or P03.

## Source investigation — live read-only results

### 1. Official operator boundary
MRT Corp current [Kajang Line overview](https://www.mymrt.com.my/projects/kajang-line/) verifies **Kwasa Damansara–Kajang, 29 service stations, 46 km route, 9.5 km underground**. [Official alignment map May 2025](https://www.mymrt.com.my/wp-content/uploads/2025/05/MRT-Kajang-Line-Alignment-Map-MAY-2025-scaled.jpg) shows service schematic green but does not provide transport infrastructure way IDs.

### 2. Selangor ArcGIS hosted FeatureServer layer 15 — MIXED COLLECTION
[SELANGOR_RAILWAY_MAP](https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/15) returned **62 GIS features, 23,805 vertices**. Despite its `MRT KAJANG LINE` directory name, its records include Kelana Jaya, KTM Port Klang, Sri Petaling, Ampang, KLIA Transit and other service geometries. **All 62 records MUST NOT be painted Kajang green**.

The only two exact label matches selected at this checkpoint:
- `Laluan Kajang (Kwasa Damansara → Kajang)` — `osm_type=relation`, `osm_id=5690837`, `full_id=r5690837`; 12 geometry paths, 778 vertices.
- `Laluan Kajang (Kajang → Kwasa Damansara)` — `osm_type=relation`, `osm_id=8000325`, `full_id=r8000325`; 11 paths, 789 vertices.

Directed candidates together have **1,567 vertices**, un-deduplicated total geodesic feature-path length **93.52 km** (both directions included; NOT 93.52 km of distinct physical track). Source bounds **[101.56374, 2.98245, 101.79046, 3.17652]** (lon/lat WGS84).
These are *passenger service direction route geometries*, not validated physical railway-way members. Neither relation is independently verified from live OSM API. Distinct relation candidates are **5690837 and 8000325**, while older third-party/Wikidata candidate **8000326** still requires direct membership verification.

### 3. DBKL ArcGIS FeatureServer MRT 1 layer
[DBKL `Laluan_MRT 1` layer 13](https://cps.dbkl.gov.my/server/rest/services/CPS_Public/CPS_Public/FeatureServer/13) returned 1 polyline, 189 vertices, computed length about **24.90 km**, bounds **[101.61478, 3.07891, 101.74853, 3.15348]**. Fields: `Operator='Prasaran'`, `sistem='MRT'`, `jenis_trek='Elevated/bawah tanah'`; `dari_stese`/`hingga_ste` contain blanks. This does **not** establish all 29 stations or precise surveyed rails, and its bounding box cannot cover Kajang terminus.

### 4. Direct OSM and Overpass
- `GET https://api.openstreetmap.org/api/0.6/relation/8000326` -> HTTP 429 in deployment QA.
- `GET https://api.openstreetmap.org/api/0.6/way/778403716/full` -> HTTP 429.
- Alternate Overpass probe for both IDs -> timeout (9 s).
- No current live OSM member-way list or individually identifiable physical track geometry accepted.

## Engineering interpretation

- **The 93.52 km is a two-direction feature sum**; 46 km is the operator's approximate service corridor, and neither value proves distinct surveyed rail length.
- Route relation geometries may overlap, include duplicated travel directions or diverge near depots/interchanges; they must never be translated directly into infrastructure ownership or individual track IDs.
- KTM Kajang, Putrajaya at TRX/Kwasa Damansara and parallel railway ways require independent discrimination before any physical-track overlay.
- OSM-derived hosted data copyright, attribution and reuse conditions require verification; absence of a copyright field is not license approval.
- MapLibre source `transportation` rail class is generic; colouring every rail/subway feature would incorrectly recolour nearby services.
- Current green numbered Registry and exact station POI source matches must remain unchanged.

## QA and next release gates
- Read-only diagnostic: `scripts/audit-kajang-source-readonly.cjs`. Bounded public HTTPS GET only, no credentials, no mutation, no raw geometry copied into website, untrusted response never auto-accepts physical track.
- Additional negative and preservation tests: `tests/r2173-kajang-physical-source-audit.test.cjs`.
- Last tested staging source commit `294c0b2c472978d89f10afbbfaa9411c1a4e7a22`, deployment `dpl_DtgfxVoMLvgDaLcQNpYkCbmDwmVQ`; build **337/337 Node PASS, 14/14 catalogue PASS**, target `staging`, `READY`.
- No Owner Safari retest required for new audit-only code because map asset source and styles are untouched; R2.17.2 partial Safari PASS remains the only direct visual evidence.

**NO-GO:** full-green physical railway alignment, public distribution of copied ArcGIS geometry, route relation conversion into verified track IDs, and Production merge. Required before proceeding: verified live OSM relation membership + physical way geometry, continuity/branch topology, KTM exclusion, and data reuse/attribution clearance. Subsequent green *service schematic geometry* could be separately considered, explicitly labelled as non-surveyed and reviewed by Owner, but is NOT implemented here.
