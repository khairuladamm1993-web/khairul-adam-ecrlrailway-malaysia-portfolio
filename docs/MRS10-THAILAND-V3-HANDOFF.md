# THAILAND V3 — VERIFIED CROSS-BORDER INTEGRATION HANDOFF (PARTIAL)

Date 2026-10-27, MR-S10 P01 Thailand module. Base fix/mrs10-thailand-v1-keyless-basemap commit d9ae3e95e70ea62e93ed71d296a1245ab09ac944. Isolated V3 branch feature/mrs10-p01-thailand-v3-cross-border. No edits to main, integrated branch, KTM, ERL, Supabase or Production. Exact final SHA/CI/deployment provided separately in release metadata.

## Source checkpoints
- SRT Southern timetable https://ttsview.railway.co.th/SRT_Schedule2022.php?line=4&ln=en&trip=2 supports principal SRT stations and selected ordered corridor. It does NOT certify train stop patterns for every train or represent a 2026 timetable snapshot.
- KTMB https://www.ktmb.com.my/TrainTime.html 2026 operator timetable index, without cached train times.
- Thai DRT official railway network GIS dataset https://data.go.th/dataset/drt2568_09 — identified, **not yet imported as certified full GIS track geometry**.
- OSM/Mapcarta source records for 13 source IDs support selected WGS84 Point markers, ODbL attributed in each feature. Publisher coordinates are secondary cross-check, not operator-survey certified.
- Padang Besar facts: https://www.thaitrainguide.com/international/malaysia/padang-besar/ and https://www.openstreetmap.org/node/3311975114 and https://www.openstreetmap.org/node/8258975420.

## Cross border schema
Canonical facility `MRS10-XB-MY-TH-PADANG-BESAR`, canonical station `th-my-padang-besar` (Malaysia, shared KTMB/SRT station building + border controls). Distinct `th-th-padang-besar` (Thailand SRT station) stays separate. Distinct relation types PASSENGER_TRANSFER and ACTIVE_RAIL_CONNECTION. Physical track-way mapping NULL, never inferred. NO direct active rail link to Rantau Panjang. Planned proposal only. MY UTC+8 and TH UTC+7, and no included historical schedule presented as current.

## Station model and geometry
54 stable station identities across six Southern corridor/branch catalogues, 13 OSM source-specific points and 41 with GIS coordinates pending. No invented station points. SRT/KTMB official station codes not verified: NULL. Southern selected nodes represent operator-listed order; not every stop, no guaranteed commercial stopping pattern. Freight capability and active status of individual stops remain UNVERIFIED, except network-level contextual classifications.

## Rendering and GIS provenance
MapLibre GL JS 6.13.0, OpenFreeMap no-key style dark/positron, semantic DOM popup and marker, theme style.load recovery, six filters + reset, four languages, synchronized station lineup. Browser can fetch OSM stations via Overpass; coordinates are accepted only after exact-name and country/bounds crosswalk. At zoom >=10 small viewport, genuine OSM railway ways are read via `out geom`; every feature retains OSM way ID, 2026-10-27-or-live date, WGS84 LineString, ODbL, ROUTE_RELATION_UNVERIFIED. This is a railway reference layer, NOT verified whole Southern corridor. Do NOT describe it as completed SRT alignment. No straight station-to-station pseudo-geometries.

## Gates and rollback
Integration remains NOT READY without official data version licensing & full physical way/relation crosswalk, 41 station coordinates, all intermediate station QA, user iPad Safari UAT, production-ready tile/data service agreement, WebKit UAT and source identity crosswalk with current KTM version. Do not merge. Rollback: remove only V3 country link or return to prior isolated V1 Preview; leave canonical apps untouched.

## Browser runtime fix
- MapLibre GL JS v6 is **ESM-only**; classic `dist/maplibre-gl.js` is not shipped and yielded HTTP / ORB failures on both unpkg and jsDelivr. This is not evidence of a provider authentication/API key issue.
- New `assets/mrs10-thailand-v3-bootstrap.mjs` imports pinned version `6.13.0` as an ES module, then loads the existing three isolated model/GIS/view units in a controlled order.

## Vendor repair completed: MapLibre v6.13.0
- GitHub Actions vendored the official npm ESM `dist/maplibre-gl.mjs` and matching CSS into `assets/thailand-v3-vendor/`, preserved full BSD-3-Clause license, plus SHA256SUMS.
- Page now imports the local `.mjs` and `.css` via the ESM bootstrap: no missing UMD, no runtime dependency on unpkg/jsDelivr. Verify checksums in isolated CI.
