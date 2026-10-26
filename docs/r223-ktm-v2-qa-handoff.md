# KTM KOMUTER V2 — INTEGRATION HANDOFF
**Status:** PARTIAL / BLOCKED FOR INTEGRATION (CI recovered; safe Vercel Preview and Owner Safari UAT pending)
**Date:** 2026-10-27 (MYT)
**Repo:** khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio
**Branch:** feature/mrs10-p01-ktm-komuter-v2
**CI-passing implementation commit:** `952acd645631a1fcce5807e4d708b6ca9491cc46`
**CI evidence:** https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40358895169
**Do not merge or promote** until a controlled non-production Preview and Owner UAT are verified.

## 1. CI root cause and recovery
Failing run: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40336118704 (201 PASS / 31 FAIL; npm test failed).
Root cause: `.github/workflows/r223-ktm-komuter-v2-ci.yml` ran `npm test` without installing Node development dependencies. Both package.json and package-lock.json already declare `jsdom@26.1.0`. No dependency version change or test disabling was necessary.
Remediation: pinned Node 22; `npm ci --ignore-scripts --include=dev --no-audit --no-fund`, `npm ls jsdom --depth=0`, `npm test`, KTM-specific and backward-compatibility tests; fetch-depth 0 for read-only baseline guard; strict public artifact file allowlist.
Successful CI run: 40358895169 on implementation SHA `952acd645631a1fcce5807e4d708b6ca9491cc46`: full Node regression **367/367 PASS**, KTM V2 **8/8 PASS**, R2.22 **6/6 PASS**; aggregate 381/381. All workflow steps completed successfully.
After this handoff file was added, the new HEAD requires its **own** passing workflow run to qualify as final HEAD.

## 2. Standalone KTM files (integration file manifest)
- `ktm-komuter-v2.html` — MapLibre UI with focus/reset, light/dark, BM/EN/zh/th, colored schematic lineup, interactive public station POIs
- `assets/mrs10-r223-ktm-service.js` — validated GIS station feature matcher, per-route marker identities, shared-station de-duplication
- `assets/mrs10-r223-ktm-catalogue.json` — 6 services, 96 route-stop memberships; null coordinates/codes and physical geometry unless verified
- `tests/r223-ktm-komuter-v2.test.cjs` — 8 isolated tests
- `.github/workflows/r223-ktm-komuter-v2-ci.yml` — isolated GitHub Actions and public-artifact gate
- Inherited `tests/r222-ktm-komuter.test.cjs` — six passing compatibility tests

**Integration patch proposal only** (not applied): central map shell imports `assets/mrs10-r223-ktm-service.js` and catalog by scoped adapter; preserve the four existing route registries and marker layers; include the KTM filter and legend as an opt-in category; inject GIS layer only after provenance checks. No central registry, existing map shell, main, previous routes, Supabase, or Production modified.

## 3. Rail-source evidence and limitations
Primary operator: https://www.ktmb.com.my/TrainTime.html — Komuter Lembah Klang, Komuter Utara and Shuttle Selatan; southern services include Paloh–JB Sentral and Kempas Baru–Pasir Gudang. Operator route-level evidence is present; **individual stop sequencing requires independent up-to-date GTFS/timetable confirmation**.
National KTMB GTFS source: https://developer.data.gov.my/realtime-api/gtfs-static.en (CC BY 4.0; daily feed). **Live feed was not downloaded or imported.**
Secondary POI GIS: https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/0 — KTMB LINE STATION, 61 features in agency server estimates. Only candidate name-matched points within declared bounds; NOT KTMB operational station survey. Layer does not cover all north/south services. No GIS topology or geographic route polyline validation.
Catalogue: 27 Seremban, 34 Port Klang, 13 Padang Besar–Butterworth, 13 Butterworth–Ipoh, 7 Paloh–JB Sentral, 2 Kempas Baru–Pasir Gudang = **96 service-stop memberships**, not 96 unique physical stations. Source color HEX are UI approximations, and south colors are explicitly provisional. KTM station codes remain unverified. Shared stations represented in one unique map-label layer and separate colored per-route marker layers. Map rail lines are **schematic lineup only**, not geographic track geometry.

## 4. Visual, security and Safari QA
Automated code assertions: marker/lineup color token parity, station de-duplication, bounds/duplicate GIS fail-closed behavior, focus/reset presence, BM/EN/Chinese/Thai labels, 44px controls, Light/Dark selectors and public-file allowlist **PASS** (static/test doubles).
Real browser/Safari mobile UI interactions and real public GIS endpoint matching **NOT VERIFIED**. Owner iPad and iPhone Safari UAT **PENDING**, not PASS.
The isolated Preview artifact allowlist contains exactly `index.html`, `assets/mrs10-r223-ktm-service.js`, `assets/mrs10-r223-ktm-catalogue.json`; security gate checks for member/admin/secret patterns. External basemap/GIS accessibility, CORS and third-party map tile availability remain unverified.

## 5. Vercel deployment safety
Isolated KTM project: `prj_fkpyU8AaADaIeKJNDw6Rh6078Uub` / `mrs10-p01-ktm-komuter-v2-isolated` (`live:false`).
Old deployment: `dpl_1GMrVd2T266KUjwqHaXyFWTVbQ7T`, `READY` but **target=production**. Old source SHA `6d4ddb10ef279f84c4a2b26b65026c5ca8f23995`. This is not a Preview PASS and not the CI recovery commit.
Project-level Vercel Authentication for **Preview** was enabled on the KTM project only (no main portfolio project changes).
Attempt to create a 3-file public-only deployment with explicit `target=preview` was rejected HTTP 400 before deployment, because that API accepts production, staging or a custom environment identifier only. After the previous omitted-target request produced Production, **no repeat using omitted target** was attempted, per Owner safety gate.
**No protected non-production Preview deployment ID/URL exists yet.** Existing production-target deployment is excluded as evidence. No merge, promote, unpause, force-push, or Production change performed.

## 6. Final gates
- Required GitHub CI on implementation SHA: PASS. CI on handoff commit HEAD: check separately.
- KTM automation and original-four-route preservation: PASS.
- Official per-station ordering and geographic topology: PARTIAL; GTFS verification pending.
- Operator color exact HEX: NOT VERIFIED (provisional colors labelled).
- Public-artifact security as assembled in CI: PASS.
- Protected Preview READY on exact final SHA: **BLOCKED**.
- Safari Owner UAT: **PENDING**.

**Final decision: BLOCKED (do not integrate)** pending verified, protected, non-production Vercel Preview, operator GIS/station source gate, and user-visible Safari Owner UAT.