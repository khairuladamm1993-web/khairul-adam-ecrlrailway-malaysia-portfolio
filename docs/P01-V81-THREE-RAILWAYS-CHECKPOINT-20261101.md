# P01 V8.1 three railway integration checkpoint

Date: 1 November 2026, Asia/Kuala_Lumpur.
Branch: feature/mrs10-p01-v81-three-railways-20261101.
Selected parent: 1f82bf8791d46fc37e549f1657618fbe54051706 (QA recovery).
Code candidate: 9662fc77babc4a3e3d7ede116fca514fbdc1a672.

## Delivered code

- assets/unified-v81/three-railways.js: additive seven sourced station/terminal markers; 79 OSM source-node guideway segments; two Sentosa directions, six Public/Transit terminal connectivity views; explicit HarbourFront pedestrian transfer.
- assets/unified-ecrl/master-intelligence.js: derived view of existing registry/CH; 16 main stations, seven PL, 23 control points and distinct GNU-EMU Depot CH519+750; three logical freight spur paths and separate UNKNOWN endpoint identities; five preserved Owner-accepted schematic layouts.
- assets/unified-ecrl/integration-ui.js: inert Engineering disclosure with intentional pointer/keyboard activation; visible PL05 UNKNOWN summary; source-driven spur navigation and depot CH.
- assets/unified-v8-map.js and unified-map-v8.html: consume additions in existing single MapLibre map; original route focus/restore, themes, languages and source registries retained.
- Read-only public OSM snapshots + reproducible extraction and source notes. No service-order interpolation or fake endpoint coordinates.

## QA evidence

First complete candidate db1366a7a3dcc2cfa38d51f22f77168353364387:
https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41244018360 — SUCCESS.
467 unit/regression/package tests PASS (367 baseline + 100 map/ECRL/integration).
26 browser scenario records PASS: V8 6/6; V8.1 8/8; ECRL 6/6; three railway integration 6/6.
Chromium and WebKit, desktop/iPad/iPhone; V8.1 additionally Android viewport.

Final code 9662fc77babc4a3e3d7ede116fca514fbdc1a672 additionally includes separate depot CH, visible ODbL attribution, and native track taps for BOTH Sentosa and Changi. Final CI:
https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41244556828
SUCCESS — five jobs completed successfully. Final logs confirm 367/367 baseline + 100/100 map/ECRL/source/privacy tests, and 26/26 browser scenarios (V8 6, V8.1 8, ECRL 6, three railway integration 6). Both native Sentosa and Changi guideway taps PASS in all six integration scenarios. No failed checks.

Source and topology invariants: raw snapshots SHA256 pinned; marker coordinates exactly match source nodes; all 79 added segment vertices refer to original nodes; no proximity joins; endpoint coordinates null; original physical dataset remains 88 segments. Runtime has 154 OSM segments (75 original + 79 added), 13 original optional secondary segments. Original 273 Singapore source records + four border points stay intact; seven supplemental points are added through the view adapter.

Public artifact checks: no backend/API, Owner command module, gateway/member scripts or secret patterns in added modules. All local map script references resolve. Fresh browser storage reports empty local/session/cache/IndexedDB lists in the first six integration cases. This validates the isolated map artifact; it does not re-certify R2.3 authenticated/private API access.

Visual review of first-candidate and final WebKit iPad screenshots: map and compact engineering popup render; unknown/source conflict status readable; popup scroll is available. Final Changi guideways and visible ODbL attribution render correctly in Light Mode. Final six integration reports also confirm empty local/session/cache/IndexedDB lists. Screenshots are CI artifacts with one-day retention. The source hashes and durable test descriptions remain in this repository.

## Isolated staging

Vercel project prj_lCXBrXOHCNYABx8TLx2FhCEAIYus; team team_0JRmhxIIyLuWMPHsxwWxJfTv.
Deployment dpl_G2kKsJyETiPhjUTNyh2gnU14tjkr — staging READY, exact code SHA 9662fc77babc4a3e3d7ede116fca514fbdc1a672 confirmed in deployment metadata.
https://mrs10-p01-unified-v8-sg-geometry-a8x06v90y-1993khairuladam-3016.vercel.app/unified-map-v8.html

HTTPS smoke: standard TLS validation succeeded; HTTP302 redirects to https://vercel.com. Protection is preserved. Connector authenticated fetch failed with deployment access/not-found error; no local Vercel CLI credential was configured. Cloud browser reached Vercel login. Therefore authenticated application HTTP/asset smoke is BLOCKED in this session, not PASS. No protection rule was weakened, bypass token generated, old blocked deployment unpaused or Production alias promoted.

## Status and open data

- Consumer recovery: IMPLEMENTED / browser TESTED on final code, 6/6 ECRL scenarios PASS.
- Sentosa: IMPLEMENTED / source and browser TESTED; OSM-derived reference geometry, not as-built VERIFIED.
- Changi: IMPLEMENTED / PARTIAL terminal intelligence. Three terminal reference markers do not enumerate all A/A South/B/C/D/E/F platform stops. Public/Transit connectivity is separated, but per-platform service patterns and per-way access areas remain UNKNOWN. No T4/Jewel station.
- ECRL: IMPLEMENTED / PARTIAL staged intelligence. Three port/yard area references and distinct endpoint identities are present. Physical mainline/spur vectors, exact PL/depot positions and all three rail-end coordinates are not supplied by accepted source evidence. Those end identities are list/popup/search only, with no GIS marker.
- Owner Safari iPad/iPhone: NOT TESTED.
- Official release: NO-GO pending authenticated Preview smoke, physical Safari UAT and Owner acceptance. Data gaps remain visible; no operational certification is claimed.

## Safari iPad Owner UAT

1. Open the immutable Preview with an authorized Vercel session. Confirm title and map appear (not a Vercel login page). This is the public-only map candidate; R2.3 login remains on its separate immutable Preview.
2. Search VivoCity; tap its station marker. Check Sentosa plus HarbourFront transfer context; close × and verify restoration. Test Resorts World, Imbiah and Beach. Expand route details and reverse Sentosa direction.
3. Search Changi Airport Skytrain/Terminal 1, 2, 3. Tap markers and guideway; confirm Public/Transit warning, source/UNKNOWN fields and no Jewel/T4 station.
4. Search PL05/Chenor: CH415+180 and UNKNOWN visible before Engineering. Search Kota SAS: no raw LEGACY_PUBLIC_LOCALITY_REFERENCE until Engineering is intentionally opened. Close and reopen; raw data must again be collapsed.
5. Open STN07/STN08/STN11 and GNU-EMU: retained layout is SCHEMATIC. Follow each freight path to the port/yard and End of Spurline; endpoint stays UNKNOWN with no fake pin. Confirm GNU-EMU CH519+750.
6. Switch BM/EN/简体中文/ไทย and Light/Dark. Tap ×, pan/zoom/fullscreen as supported; verify original routes and focus restore. Record PASS/FAIL and screenshot for any failure.

## Governance and rollback

No merge, Production change, cloud project, billing/upgrade, Supabase mutation, P02/P03/P04 change or R2.3 auth source change. GitHub Actions uses standard public Ubuntu runners; existing Vercel staging project is reused. No paid feature was activated. Rollback is to stop using this immutable staging candidate and retain the previous immutable URL; no Production rollback is necessary.
