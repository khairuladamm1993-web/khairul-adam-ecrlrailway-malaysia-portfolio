# MR-S10 BORNEO V2 — VERIFIED INTEGRATION HANDOFF

**Audit date:** 2026-10-27 (Malaysia)  
**Decision:** **PARTIAL — NOT INTEGRATION READY**; **genuine Chromium WebGL QA PASS**, Owner Safari iPad UAT **PENDING**.  
**Scope:** Isolated railway visitor viewer, public education only. No merge into Integrated or `main`, no MR-S10 Production changes, no Supabase/Auth/RLS changes.

## A. Source control / audited baseline
- Repository: [khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio).
- Branch: `feature/mrs10-p01-borneo-rail-art-v2`.
- Isolated base: historical Integrated commit `6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c`. Not `main`. This baseline is historic; other projects continue on newer isolated branches.
- Verified runtime code checkpoint: `ffe06442ea64ab0ffc00bfc82ea18ca5a1a624c2`. [GitHub Actions run 40397870447](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40397870447): **completed SUCCESS**, including full existing MR-S10 regression, Borneo Node/JSDOM contract, and **real Chromium 141 MapLibre/WebGL checks** (1024×768 iPad-like and 390×844 iPhone-like viewports).
- Screenshot artifact in that run: `borneo-v2-real-chromium-screens`, artifact ID `12687387453`. Logs record `BROWSER_RENDER_PASS ipad` and `BROWSER_RENDER_PASS iphone` with **15 visible rendered Sabah features**, three ART schematic lines, popup, filter/search/reset, dark mode and Chinese UI. This is **actual headless Chromium**, not Safari/WebKit.
- Subsequent manifest/handoff-only commits change branch HEAD without changing these four runtime files. Reconfirm newest CI as necessary; the Vercel runtime deployment is explicitly pinned to verified code checkpoint above.
- Runtime files: `borneo-v2.html`, `assets/borneo-v2.css`, `assets/borneo-v2.js`, `data/borneo-v2-registry.json`.
- Contract: `data/borneo-v2-integration-manifest.json`; tests `tests/borneo-v2.test.cjs`, `.github/workflows/borneo-v2-qa.yml`. This handoff: `docs/MRS10-BORNEO-V2-VERIFIED-INTEGRATION-HANDOFF.md`.
- No write to existing `assets/map-language-lab.js`, `assets/railway-track-registry-kl.js`, `data/owner-project-registry.json`, Supabase files, Production files, or `main`.

## B. Sabah JKNS station registry

**Operator authoritative ordered names:** https://railway.sabah.gov.my/untuk-penumpang/laluan-stesen/. JKNS publishes 15 station names, an ~134 km corridor, Main Line ~85 km Tanjung Aru–Beaufort, Gorge Line ~49 km Beaufort–Tenom.

| Order | ID | Official name | Segment | GIS |
|---:|---|---|---|---|
| 1 | SSR-01 | Sembulan | Reference-only in this viewer | Secondary point |
| 2 | SSR-02 | Tanjung Aru | Main | Secondary point |
| 3 | SSR-03 | Putatan | Main | Secondary OSM |
| 4 | SSR-04 | Kinarut | Main | Secondary OSM |
| 5 | SSR-05 | Kawang | Main | Secondary OSM |
| 6 | SSR-06 | Papar | Main | Secondary OSM |
| 7 | SSR-07 | Kimanis | Main | Secondary OSM |
| 8 | SSR-08 | Bongawan | Main | Secondary OSM |
| 9 | SSR-09 | Membakut | Main | Secondary OSM |
| 10 | SSR-10 | Beaufort | Main/Gorge transfer point | Secondary OSM |
| 11 | SSR-11 | Saliwangan | Gorge | Secondary OSM |
| 12 | SSR-12 | Halogilat | Gorge | Secondary OSM |
| 13 | SSR-13 | Rayoh | Gorge | Secondary point |
| 14 | SSR-14 | Pangi | Gorge | Secondary OSM |
| 15 | SSR-15 | Tenom | Gorge | Secondary OSM |

All coordinates are WGS84 GeoJSON `[longitude,latitude]`. Individual secondary source URL is stored at `sabah.stations[].location_source`; individual OSM feature ID at `osm_id` if established. Points are **not survey-grade official operator GIS**. Sembulan is official station catalogue entry, but no assumption it is a current stop on every train. No station is labelled served by every departure. See https://railway.sabah.gov.my/untuk-penumpang/jadual-keretapi/ for service-specific schedules and operator notices.

**GIS confidence:** `SECONDARY_OSM_OR_PUBLIC_REFERENCE` for points, `NO_VERIFIED_TRACK_LINE` for track geometry. No invented rail track polylines.

## C. Sarawak KUTS / ART source registry

Primary operator: https://www.mysarawakmetro.com/what-we-do/kuching-urban-transportation-system. Operator website progress imagery from **October 2026** names several construction stations; roster here is **partial** and cannot be represented as the entire 24-station Fasa 1 roster. Route and detailed GIS alignment are **not verified** in a downloadable authoritative form. The KUTS concept is **rubber-tyred trackless ART**, not conventional railway with steel rails. As of this handoff, public passenger operation is **not verified** and is not labelled open.

- **BLUE** (`#1976D2` temporary UI): `SM01 University`, `SM03 Sigitin`, `SM04 UNIMAS`, `SM05 Sarawak Heart Centre`, `SM06 Riveria`, `SM07 Stutong`, `SM09 The Spring`, `SM14 Hikmah Exchange`.
- **RED** (`#E0474C` temporary UI): `SR05 Kuching Sentral`, `SR06 Kuching International Airport`, `SR07 Pelita Heights`, `SR08 Jalan Tun Jugah`, `SR09 Swinburne`, `SR10 Simpang Tiga`.
- **GREEN** (`#1A9D70` temporary UI): official project axis Pending–Damai / published Green Line package Pending–Bulatan Yayasan Sarawak, **no station GPS or accepted complete interim stop roster** in this release.
- **Depot/OCC**: Rembus depot/OCC is identified from operator publication; no coordinate pin is invented.
- Interchange candidates are specifically `SECONDARY_SCHEMATIC_UNCONFIRMED_CURRENT_ALIGNMENT`, not official operational transfer guarantees. No KUTS stop point coordinates exist in registry; `sarawak.stations[].point === null`.
- Line colors blue/red/green are UI presentation colors only; NOT claimed to be approved operator hex codes.
- Operator website has presented about 50.6 km / 24 station-halts in some Phase 1 descriptions, while older publications refer to much larger network plans; do not merge conflicting scope figures or label them completed.
- **Critical transport classification:** `URBAN_TRANSIT_ART`, `rail_track:false`, `route_geometry:null`. Only clearly labelled schematic sequences of *available* official codes are rendered, with gaps indicated, not GPS track vectors.

## D. Rendering / interaction contract
- Entry point: `/borneo-v2.html`, standalone public-only asset; no auth, Supabase writes, or collection of user location.
- MapLibre GL 6.13.0, OSM raster tiles with copyright attribution. Style-load adds/restores source `borneo-points` and layer `borneo-stations`; GeoJSON Point features use stable `SSR-##` IDs, circle radius scaled with zoom.
- Category selectors: ALL, SABAH, SARAWAK, BLUE, RED, GREEN. ALL displays all Sabah points and partial Sarawak schematic; Sabah selects point network; Sarawak selects **regional Kuching view, never fictitious ART pins**.
- Lineup/search by names, coded identifiers, categories; reset; click point or station for Sabah popup, which links directly to the exact secondary coordinate source.
- Dark/light, responsive tablet/phone, BM/EN/简体中文/ไทย interface. Basemap OSM labels are not guaranteed localized.
- Built-in diagnostic `window.__BORNEO_V2_QA()` reports station count, GeoJSON count and **`renderedFeatureCount` from queryRenderedFeatures**. A true WebGL/browser pass requires a real browser running this code; Node/JSDOM MapLibre mock alone is not sufficient.
- Integrate only by additive namespaced MapLibre sources/layers, resolving styling and existing map lifecycle contracts; do not destructively override current MRT/LRT/Monorail/ERL/KTM/ECRL assets. Revalidate integration against actual latest Integrated HEAD before merge.

## E. Automated tests / acceptance
- GIS count, ordered official names, station IDs, coordinate ranges, duplicates, per-point provenance, ART classification and coordinate null, source schema.
- DOM simulated test covers filter, search, reset, popup click, schematic cards, 4 languages, theme and points for mock MapLibre.
- Github Actions workflow runs isolated tests plus existing `npm test`; it has no Vercel deploy step.
- **Actual MapLibre Chromium rendering:** **PASS** in an automated real browser using vendored MapLibre v6 ESM fixtures with simulated OSM tiles; screenshot artifacts captured.
- **Firefox/WebKit/Safari device testing:** **PENDING**; this CI proves neither live CDN reliability nor Safari/iPad ownership acceptance.
- **Owner Safari iPad UAT:** **PENDING**.
- Therefore **INTEGRATION READY = NO**, even if CI and Vercel HTTP status are both PASS.

## F. Vercel isolation / incident report

- Account/team: `1993khairuladam-3016` / `team_0JRmhxIIyLuWMPHsxwWxJfTv`.
- Dedicated new Vercel project: `mrs10-p01-borneo-v2-isolated-preview`, ID `prj_lANjBUS6Cq0l94Uox0SMeWFurwiw`. It is not Git-linked; only four public files were uploaded; SSO protection automatically enabled.
- **Latest verified nonproduction staging deployment:** `dpl_BGV4hVf6m72abjbv6oP1Z8haaVpg`, `target: staging`, **READY**, exact verified runtime code metadata `ffe06442ea64ab0ffc00bfc82ea18ca5a1a624c2`; URL: **https://mrs10-p01-borneo-v2-isolated-preview-ljtghfoaj.vercel.app/borneo-v2.html**. Contains repaired **MapLibre v6 ESM import** and all four public runtime files. This is the URL for Owner Safari UAT.
- **Incident — project-isolated unintended deployment target**: the Vercel API unexpectedly mapped an explicit `target:"preview"` request to **production** for the **new dedicated project**. Deployment `dpl_AHC1aT6fnJCoBKUGbSAmkqXKX1yf` became READY before it could be cancelled; cancellation returned 400 `deployment_not_canceled`. This is **not MR-S10 existing Production** (which was not accessed/altered), but it is still an unintended production-target deployment in the newly created isolated project. Record this openly. Later use `target:"staging"` explicitly; **do not promote** or assign any MR-S10 Production domain.
- **Latest staging HTTP smoke:** HTML, CSS, JS and JSON each returned HTTP 200 and correct ESM signature. Separate GitHub CI validated actual Chromium canvas rendering with identical code, but no remote Safari canvas inspection has occurred.
- **Root cause fixed:** MapLibre GL v6 is ESM-only. The original prototype used the nonexistent v6 UMD `dist/maplibre-gl.js`; this can leave the map blank despite HTTP 200. Fixed bootstrap to dynamic `import(".../dist/maplibre-gl.mjs")` and a safe station-list fallback if the CDN fails. Added a regression guard for this exact failure.

## G. Exact integration manifest and rollback
Machine-readable contract: [`data/borneo-v2-integration-manifest.json`](../data/borneo-v2-integration-manifest.json).

Suggested safe integration:
1. Obtain latest authoritative Integrated HEAD and review all concurrent railway module branches (don't use the Oct 25 historical SHA automatically).
2. Copy only the four module runtime files and manifest after Owner UAT, under unique names; do not copy replacement `map-language-lab.html` or modify existing auth/routing.
3. In Integrated bridge, register `SABAH_JKNS` as conventional railway station points **without fabricated LineString**, `SARAWAK_KUTS` as ART schematic-only. Preserve transport types, null geometry, GIS provenance, status and temporary color labels.
4. Add non-destructive overlays only; ensure MapLibre source/layer keys do not collide; validate `style.load`/filters/re-rendering on iPad Safari.
5. Require final browser tests, mobile screenshots/evidence and Owner UAT sign-off before approval. No owner approval has been granted for any merge.
6. Rollback future **owner-authorized** integration by reverting the specific integration PR/merge commit after saving its exact SHA; this isolated branch need not be deleted and does not modify the current site. To back out staging simply stop referring to the staging URL or disable the dedicated preview project with Owner review; do not affect existing MR-S10 projects.

## H. Remaining hold points

| Acceptance gate | Status |
|---|---|
| JKNS official names/order | VERIFIED |
| Sabah secondary point extents / dedup | VERIFIED BY DATA QA, operator-grade survey UNVERIFIED |
| KUTS official partial station names | VERIFIED PARTIALLY; complete roster PENDING |
| ART verified GPS geometry | NOT AVAILABLE; safely SCHEMATIC |
| Four-language controls and DOM mock | PASS, verified code CI 40397870447 |
| Existing MR-S10 regression | PASS, verified code CI 40397870447 |
| Isolated Vercel staging | READY for verified ESM runtime commit |
| Staging HTML/CSS/JS/JSON | HTTP 200, verified latest staging |
| Real MapLibre canvas browser | PASS, Chromium 141 at 1024×768 and 390×844; screenshots artifact 12687387453 |
| Safari iPad Owner UAT | PENDING |
| Integration approval | NOT GIVEN |

This document documents implementation and blockers. It does not assert production authorization or blanket visual PASS.
