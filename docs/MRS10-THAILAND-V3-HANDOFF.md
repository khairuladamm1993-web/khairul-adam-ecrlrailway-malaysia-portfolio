# THAILAND V3 — VERIFIED CROSS-BORDER INTEGRATION HANDOFF (PARTIAL)

Date 2026-10-27, MR-S10 P01 Thailand module. Base fix/mrs10-thailand-v1-keyless-basemap commit d9ae3e95e70ea62e93ed71d296a1245ab09ac944. Isolated V3 branch feature/mrs10-p01-thailand-v3-cross-border. No edits to main, integrated branch, KTM, ERL, Supabase or Production. Exact final SHA/CI/deployment provided separately in release metadata.

## Source checkpoints
- SRT Southern timetable https://ttsview.railway.co.th/SRT_Schedule2022.php?line=4&ln=en&trip=2 supports principal SRT stations and selected ordered corridor. It does NOT certify train stop patterns for every train or represent a 2026 timetable snapshot.
- KTMB https://www.ktmb.com.my/TrainTime.html 2026 operator timetable index, without cached train times.
- Thai DRT railway-network catalogue https://data.go.th/dataset/drt2568_09 — CSV route inventory, **not a dataset of surveyed railway line geometries**. It is not certified GIS input. Full Southern alignment from official licensed GIS remains pending.
- OSM/Mapcarta source records for 13 source IDs support selected WGS84 Point markers, ODbL attributed in each feature. Publisher coordinates are secondary cross-check, not operator-survey certified.
- Padang Besar facts: https://www.thaitrainguide.com/international/malaysia/padang-besar/ and https://www.openstreetmap.org/node/3311975114 and https://www.openstreetmap.org/node/8258975420.

## Cross border schema
Canonical facility `MRS10-XB-MY-TH-PADANG-BESAR`, canonical station `th-my-padang-besar` (Malaysia, shared KTMB/SRT station building + border controls). Distinct `th-th-padang-besar` (Thailand SRT station) stays separate. Distinct relation types PASSENGER_TRANSFER and ACTIVE_RAIL_CONNECTION. Physical track-way mapping NULL, never inferred. NO direct active rail link to Rantau Panjang. Planned proposal only. MY UTC+8 and TH UTC+7, and no included historical schedule presented as current.

## Station model and geometry
54 stable station identities across six Southern corridor/branch catalogues, 13 OSM source-specific points and 41 with GIS coordinates pending. No invented station points. SRT/KTMB official station codes not verified: NULL. Southern selected nodes represent operator-listed order; not every stop, no guaranteed commercial stopping pattern. Freight capability and active status of individual stops remain UNVERIFIED, except network-level contextual classifications.

## Rendering and GIS provenance
MapLibre GL JS 6.13.0, OpenFreeMap no-key style dark/positron, semantic DOM popup and marker, theme style.load recovery, six filters + reset, four languages, synchronized station lineup. Browser can fetch OSM stations via Overpass; coordinates are accepted only after exact-name and country/bounds crosswalk. At zoom >=10 small viewport, genuine OSM railway ways are read via `out geom`; every feature retains OSM way ID, 2026-10-27-or-live date, WGS84 LineString, ODbL, ROUTE_RELATION_UNVERIFIED. This is a railway reference layer, NOT verified whole Southern corridor. Do NOT describe it as completed SRT alignment. No straight station-to-station pseudo-geometries.

## Gates and rollback
Integration remains NOT READY without official data version licensing & full physical way/relation crosswalk, 41 station coordinates, all intermediate station QA, user iPad Safari UAT, production-ready tile/data service agreement, operator-compatible station-id reconciliation and source identity crosswalk with current KTM version. Do not merge. Rollback: remove only V3 country link or return to prior isolated V1 Preview; leave canonical apps untouched.

## Browser runtime fix
- MapLibre GL JS v6 is **ESM-only**; classic `dist/maplibre-gl.js` is not shipped and yielded HTTP / ORB failures on both unpkg and jsDelivr. This is not evidence of a provider authentication/API key issue.
- New `assets/mrs10-thailand-v3-bootstrap.mjs` imports pinned version `6.13.0` as an ES module, then loads the existing three isolated model/GIS/view units in a controlled order.

## Vendor repair completed: MapLibre v6.13.0
- GitHub Actions vendored the official npm ESM `dist/maplibre-gl.mjs` and matching CSS into `assets/thailand-v3-vendor/`, preserved full BSD-3-Clause license, plus SHA256SUMS.
- Page now imports the local `.mjs` and `.css` via the ESM bootstrap: no missing UMD, no runtime dependency on unpkg/jsDelivr. Verify checksums in isolated CI.

## Browser worker fix
- Added locally vendored `assets/thailand-v3-vendor/maplibre-gl-worker-6.13.0.mjs` from the same npm 6.13.0 distribution, included in SHA256SUMS.
- `bootstrap.mjs` calls `maplibregl.setWorkerUrl(new URL('./thailand-v3-vendor/maplibre-gl-worker-6.13.0.mjs', import.meta.url).href)` before rendering. Prevents worker requests to an unavailable relative path and ensures same-origin worker in Preview.

## Verified technical handoff — 2026-10-27 (MYT)
- Branch: `feature/mrs10-p01-thailand-v3-cross-border`. Tested source-deployment SHA: `0762632a363b3dd38d05173164145d78bca31803`. Handoff metadata may create a later HEAD; resolve HEAD on integration and compare all source files before acceptance.
- Node GIS/topology, map contract, languages, cross-border & same-origin MapLibre Worker: **16/16 PASS**, original MR-S10 regression **367/367 PASS**. Full static CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40400926894
- Chromium 390px: 13 default station DOM markers, 3 filtered border markers, popup KTMB + station-lineup activation, Thai UI, style/theme re-add, reset, **0 page errors**. WebKit 1024px: same checks and values, **0 page errors**. GitHub browser QA: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40400926654
- Browser screenshot artifact `thailand-v3-browser-screenshots`, artifact ID `12688207788`, four screenshots (`chromium-default.png`, `chromium-reset.png`, `webkit-default.png`, `webkit-reset.png`): https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40400926654/artifacts/12688207788 . GitHub controls artifact retention.
- Protected isolated Preview `https://asia-railway-explorer-preview-qn9p93hig-1993khairuladam-3016.vercel.app/`, deployment `dpl_GWvh5tfF9SfQWqFVQsidZSfV9LXP`, Project `prj_cdfMEldu52twg5JTbbcipHxfyqoq`, `READY`, `target:null`, `alias:[]`, Vercel Authentication protection enabled. Source files include self-hosted MapLibre ESM+worker+CSS. Existing MR-S10 Production not redeployed.
- UI contracts: `window.MRS10ThailandV3` provides `stations`, `corridors`, `links`, `interchange`, `station(id)`, `route(id)`, `audit()`, `filter(kind)`. GIS `window.MRS10ThailandV3GIS` provides `points(model)`, `sourceMatch()`, `mergePoints()`, `railwayWays()`. Opt-in standalone route at `thailand-railway-v3.html` only, no host/global map writes. Filter keys: `all,border,main,east,branches,planned`. Colours: border #f4b942, main #26b4cc, east #e17eb1, branches #ae92ed. Colours are UI choices, not certified SRT brand specifications. MapLibre physical OSM ways rendered in orange with `serviceRouteId:null`; not a verified service alignment.
- Source checkpoint differences: 54 unique station identities with representative operator-context sequences, 13 secondary OSM-located nodes, 41 pending GIS points. `SRT/KTMB official station identifiers are not yet resolved (null). Active rail transport at the Padang Besar gateway is supported; the explicit per-train timetable/freight and border-process details are not certified 2026 real-time feeds. Rantau Panjang remains PLANNED_CONNECTION only.`
- **NOT integration ready** for complete Southern Line GIS, operator-official station ID merge, production map layers, live timetable, or Safari Owner UAT. Browser test passed in GitHub-hosted Chromium and WebKit, not physical owner iPad Safari. `Owner Safari UAT = PENDING` and geographical source-way full corridor relation crosswalk = PENDING.
- Integration procedure: use `data/mrs10-thailand-v3-integration-manifest.json`; read-only import model and geometry only after KTM crosswalk; compare canonical facility ID; create distinct Thai station record; do NOT autocreate direct KTM connection to Su-ngai Kolok. Do not merge this branch or promote Vercel. Roll back by unlinking isolated country view or selecting historical Thailand V1 deployment, without altering KTM/ERL or ECRL.

- Southern Bangkok inbound order correction: Taling Chan Junction precedes Bang Bamru en route to Krung Thep Aphiwat. Source cross-check Thai government Light Red Line operator explanation: https://www.thailand.go.th/issue-focus-detail/001_01_098 ; SRT Southern line https://ttsview.railway.co.th/SRT_Schedule2022.php?line=4&ln=en . This is *selected-station physical traversal order*, not every service's stopping pattern.

## Final V3 code snapshot — 2026-10-27
- **Tested and deployed code SHA:** `0762632a363b3dd38d05173164145d78bca31803` (later metadata-only handoff commits may advance branch HEAD).
- **Code CI:** 16/16 Thailand V3 and 367/367 existing MR-S10, all PASS. https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40400926894 .
- **Final visual CI:** Chromium 390×800 and WebKit 1024×800 (automated desktop), 13 default station markers, 3 Padang Besar corridor markers, popup, theme, Thai UI, reset, 0 observed page errors, PASS. https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40400926654 . Screenshot artifact ID `12688207788`, accessible through the Actions run. This is NOT physical owner iPad Safari UAT.
- **Isolated Vercel Preview:** https://asia-railway-explorer-preview-qn9p93hig-1993khairuladam-3016.vercel.app/ , deployment `dpl_GWvh5tfF9SfQWqFVQsidZSfV9LXP`, project `prj_cdfMEldu52twg5JTbbcipHxfyqoq`, READY, `target:null`, `alias:[]`.
- **Integration decision:** `PARTIAL_BROWSER_QA_PASS_SAFARI_OWNER_PENDING`. Do not auto-merge. 41 station coords + physical railway route matching to a recognized SRT GIS relation and exact station codes outstanding. Explicit no false through-line to Rantau Panjang. KTM canonical station registry must be reconciled by MR-S10 Integrated owner prior to any adoption.
