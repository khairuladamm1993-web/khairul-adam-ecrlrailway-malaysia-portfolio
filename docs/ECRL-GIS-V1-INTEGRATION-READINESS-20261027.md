# MR-S10 P01 — ECRL GIS V1 integration readiness audit
**Date:** 27 October 2026 (Asia/Kuala_Lumpur)  
**Audit type:** read-only Unified compatibility and owner-acceptance reconciliation  
**Decision:** **GO — standalone educational Preview; GO — read-only data handoff; NO-GO — direct Unified integration/merge.**

## Evidence checkpoint
- Owner Safari iPad: **5/5 PASS**, explicitly reported 27 October 2026. This is Owner-attested UAT, not claimed to be an automated Safari device execution.
- ECRL source HEAD before audit: `86900c8c9c2df1ba162b6fcdda63d1c82e3505f0`.
- Baseline Unified V7 HEAD: `c64aa0b19b68aeafbaeb03e568e5cd07e7e4790f` (unchanged when audited).
- `main` HEAD: `3a2f3b958d6090acdbc5e080b61e46aa8b5415f3` (unchanged when audited).
- ECRL Preview: `dpl_84jyX7fjGtqtDzLTAgUw3LTGby3j`, target Preview (`null`), **READY**, six deployed application assets.
- Owner-tested URL: https://mrs10-p01-ecrl-gis-v1-isolated-preview-jd6a8gi1r.vercel.app/ecrl-gis-v1.html
- Head-matched automated QA: [Data QA PASS](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40446719381) (16/16 static/data tests); [browser QA PASS](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40446719384) (Chromium + WebKit × desktop/iPad/iPhone, all four languages). These browser tests ran on GitHub's local static server; Owner independently checked the Vercel Preview on iPad Safari.

## Actual compatibility with Unified V7
| Domain | Finding | Gate |
| --- | --- | --- |
| Data registry | `window.MRS10ECRLGISV1` source-backed metadata, unique stable IDs and historical flags; no apparent V7 registry global collision | **CANDIDATE FOR READ-ONLY REUSE** |
| Locales | BM/EN/中文/ไทย codes match Unified V7 `ms/en/zh/th`; official names remain unchanged | **PASS STANDALONE; INTEGRATED QA NOT RUN** |
| MapLibre source IDs | ECRL `mrs10-ecrl-v1-*` vs V7 `mrs10-v7-*`; namespaces disjoint | **NO KNOWN SOURCE ID COLLISION** |
| Unified rendering | Unified V7 owns a single `#map` instance, `state.manifest`, route layers and language/theme state. ECRL standalone app creates `new ML.Map` in `#ecrl-map` and uses separate `#theme/#reset/#asset-list` controls | **BLOCKER: adapter required** |
| Styles | ECRL CSS has top-level `:root`, `body`, `button`, `.legend`; copying it directly into Unified risks unrelated appearance changes | **BLOCKER: scoped CSS required** |
| Route semantics | ECRL station intelligence is **infrastructure metadata**, not a passenger service with official GIS for every station. Do **not** append it as a 17th V7 service route: the strict GIS completeness check would misclassify locality reference points | **BLOCKER: separate infrastructure overlay/registry** |
| Geography | 20 named stations; 16 A–C1 historical *locality reference* points; 4 C2 station-track GIS points unavailable; 7 historical PL records pending; 0 verified crossing-loop geometry | **LIMITED, EXPLICITLY DISCLOSED** |
| Physical track | 0 verified LineStrings. C2–D is metadata topology, not a surveyed physical rail trace | **NO VERIFIED TRACK TAP ENABLED** |
| Source conflicts | Puncak Alam and Jalan Kastam station service classifications unresolved. Section D separate ECRL/KTMB gauge scheme documented but its precise rail path is unavailable | **KEEP CONFLICT FLAGS** |
| iOS UAT | Owner Safari iPad 5/5 PASS on standalone Preview | **PASS STANDALONE ONLY** |
| Production/other regions | Git diff is additive within ECRL isolated branch. Unified V6/V7, KTM, Shuttle Timur, Singapore, Thailand, Borneo, Supabase and simulator were not edited | **PASS SOURCE ISOLATION; cross-module runtime regression not run** |

## Integration requirements before any candidate can be accepted
1. **Single MapLibre instance**: build an ECRL *infrastructure overlay adapter* that accepts Unified V7's existing `map` and lifecycle callbacks. Never bootstrap `app.js` as a second map inside Unified.
2. **Registry, not fake route**: add ECRL assets in a distinct infrastructure collection, **not** V7 passenger route `state.manifest`. Preserve stable `assetId`, `assetType`, `sourceIds`, `assetStatus`, `verificationStatus`, `geometryProvenance`.
3. **Explicit geometry gate**: show the 16 legacy points only as *locality references* (opt-in and clearly labeled); show C2, ports, junctions, unresolved PLs as list-only until independently validated GIS exists. No straight join LineStrings, no guessed turnouts or speeds.
4. **Style and marker isolation**: scope any embedded styles under a dedicated ECRL component class; use unique layer/source IDs, square-outer/circle-inner markers *only when loop evidence and location are verified*. Restore layers on Unified `style.load`/`idle` after light/dark MapLibre style changes. Do not duplicate station+loop markers over shared facilities.
5. **State contract**: maintain Unified language, selected marker, search, filter, and theme consistently across BM/EN/中文/ไทย without replacing the map or losing other services; avoid `fitBounds` loops and popup leaks.
6. **Combined integrated candidate gate**: run Unified V7 existing route regression, ECRL metadata checks, non-overlap checks, 4-language desktop/iPad/iPhone browser tests, marker taps, theme/style reload and owner iPad Preview UAT for *new integration candidate*. Current standalone 5/5 PASS cannot substitute for integrated-UAT.
7. **Deployment**: only a separate Preview project/isolated candidate branch; verify target is not Production, READY, deployed SHA and path. Do not change `main`, Unified V6/V7, original Production, Supabase or the separate Simulator without explicit authorization.

## Decision
**GO:** continue using the Owner-approved **isolated ECRL GIS V1 educational Preview** and submit its **data registry + translation resources + manifest** as a read-only handoff to Unified Integration.

**NO-GO:** direct merge or script/CSS inclusion in Unified, claim of C2/PL surveyed accuracy, or promotion to Production. An integrated candidate has not been built/tested; separate authorization remains required.

## Rollback
The audit changes only ECRL isolated-branch metadata/tests/documentation. The Owner-approved Preview remains pinned to source commit `86900c8c…`, so no changes to its rendered application occur. To stop the candidate, cease using its Preview. Preserve the source branch/QA evidence; deletion requires a separate Owner decision.
