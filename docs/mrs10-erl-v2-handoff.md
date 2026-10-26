# MR-S10 P01 — ERL V2 · Isolated integration handoff
Checked 2026-10-26 (Malaysia). This is a **visitor service model**, not an operational signalling, track/way, chainage or dispatch dataset.

## Baseline and preservation
- Integrated baseline branch: `feature/mrs10-p01-r2175-r220-integration-qa`; audited HEAD `6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c`.
- ERL branch `feature/mrs10-p01-erl-v2` is isolated. No change to the central map, production builds, Supabase, or the four-line baseline.
- New files only: `erl-v2.html`, `assets/mrs10-erl-v2-model.js`, `assets/mrs10-erl-v2-gis.js`, `assets/mrs10-erl-v2-view.js`, `tests/mrs10-erl-v2.test.cjs`, this handoff.
- Do NOT overwrite `assets/railway-track-registry-kl.js`, `assets/map-language-lab.js`, `map-language-lab.html` or `scripts/build-preview.py` without a separately reviewed integration commit.

## Sources and inference discipline
- Operator Ekspres (regular three-stop pattern, late-night all-stops warning, train status): https://www.kliaekspres.com/products-fares/klia-ekspres/
- Operator Transit (six stops in order): https://www.kliaekspres.com/products-fares/klia-transit/
- Operator timetable (check each departure, not inferred from wall clock): https://www.kliaekspres.com/schedule
- Official ERL schematic colour identity, updated March 2023 (purple/magenta #6 and cyan/teal #7, **not** certified hex): https://www.kliaekspres.com/media/wkxnzajm/erl_kv-integrated-transit-map_updated-mar23.pdf
- MOT shared physical corridor (does NOT verify individual ways/tracks): https://www.mot.gov.my/en/land/infrastructure/current-rail-services
- Secondary hosted ArcGIS station POI layer ID 4: https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/4
- OpenStreetMap attribution and licence: https://www.openstreetmap.org/copyright

## Model
Regular KLIA Ekspres: KL Sentral > KLIA T1 > KLIA T2 (3).
KLIA Transit: KL Sentral > Bandar Tasik Selatan > Putrajaya & Cyberjaya > Salak Tinggi > KLIA T1 > KLIA T2 (6).
Regular shared stops: KL Sentral, KLIA T1, KLIA T2 (3). The operator also advertises a late-night Ekspres all-stops pattern from 23:00; the client **does not infer a per-train stopping pattern**.
KLIA Transit Putrajaya & Cyberjaya has a Putrajaya Sentral interchange connection; retain distinct ERL station ID from MRT PY41. KL Sentral connections to other services refer to a station complex rather than platform/physical track equivalence. The names above remain original source spelling across languages.

## Cartographic gates
- Service colours are UI-tuned hex values matching schematic families, NOT sampled/certified exact operator brand hex.
- ArcGIS layer 4 has a reported count of nine features, which should NOT be confused with nine ERL stations. The decoder independently matches six canonical station identities, checks bounds and unique coordinates, rejects unrecognized names and ambiguous duplicates, does not trust secondary GIS station codes as official codes, and does not ship geometry.
- Map pin split colours represent the passenger services stopping there in the **regular** pattern; split does NOT imply separate rail lines.
- Physical GIS geometry, route-to-way relations, topology continuity, actual track count, geometry reuse licence, and platform identity: UNVERIFIED. No customer-facing physical polyline is drawn.
- Data source layer copyright field is blank. Permission to redistribute/embed a static dataset is **not established**; viewer fetches transient public features directly and links attribution. Review ArcGIS publisher policy and terms before broad release.
- If the query fails or returns no verified matches, the map remains neutral; the schematic remains available and no fake pin is generated.

## QA plan & gate
Command: `node --test tests/mrs10-erl-v2.test.cjs`; broad regression `npm test`.
Integration patch, upon separate owner approval: reference the standalone ERL page from the existing integrated shell and package its isolated assets in a preview-only builder. DO NOT replace the four integrated lines. Confirm no CSP conflict with ArcGIS and MapLibre CDN and confirm No Production changes.
Mandatory separate UAT on real iPhone Safari and iPad Safari; Light/Dark, BM/EN/中文/ไทย, all/focus/reset, source-positive and source-offline, touch marker popups, KL Sentral and Putrajaya interchange, late-night warning; screenshots and measured findings required before UAT PASS.
No CI, source QA, Preview or mobile UAT may be called PASS merely because files/commit exist.
