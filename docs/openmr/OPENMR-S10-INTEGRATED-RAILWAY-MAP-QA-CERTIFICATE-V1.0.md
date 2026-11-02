# OPENMR-S10 — INTEGRATED RAILWAY MAP QA CERTIFICATE V1.0

**Internal QA record · MR-S10 Railway Systems**

- Product: OpenMR-S10Map — Official Protected Preview
- Owner: MR-S10 Railway Systems
- Scope: Malaysia, Singapore, Thailand; China source references remain a separate expansion phase.
- Build: 1.0.0-rc1 on the accepted V8.1 catalogue
- Branch: `candidate/openmrs10-my-sg-th-20261103`
- Deployed runtime SHA: `fc1600b35521457eb9ee90ad79070f4dff7726dd`
- QA revision: `3fde70401c276109ab1e63b570a2bae631c368b0` (later changes are QA-only; served runtime assets match current candidate bytes)
- Deployment: `dpl_GrsFbdbghy4g3VLLpqCqE3YANrwy`
- Issued: 2026-11-03T01:23:15+08:00
- Tested URL: https://openmr-s10map.vercel.app/

**Decision: GO for Owner protected Preview UAT, with explicit source gaps. Owner UAT: PENDING.**

## Actual coverage

| Scope | Routes | Listed / mapped route–station associations |
|---|---:|---:|
| Malaysia | 21 | 395 / 371 |
| Singapore | 17 | 288 / 288 |
| Thailand | 6 | 59 / 17 |
| Total | 44 | 742 / 676 |

Counts are route–station associations, not unique physical stations. ECRL remains a separate default-on reference overlay. Its 37 assets and 25 reference points are not approved surveyed station/PL/depot GPS.

## QA verdicts

| Evidence | Result and scope |
|---|---|
| Source/regression/build | VERIFIED: 155/155 assertions PASS; final CI 11/11 jobs SUCCESS |
| Route-level matrix | VERIFIED within source/UI scope: 44 routes × 6 desktop/portrait cases; 7 affected routes × 4 landscape cases |
| Final delta browsers | VERIFIED: Chromium/WebKit desktop, iPhone/iPad portrait/landscape; 7 affected routes × 10 cases, plus global checks |
| Protected hosted browsers | VERIFIED: 4/4 functional cases on the official alias; Chromium/WebKit iPad portrait and iPhone landscape |
| GPS | VERIFIED WITH SIMULATED INPUT: granted-location API, blue marker, accuracy ring, low accuracy, error callbacks and style/filter/fullscreen persistence. Physical device GPS and real Safari permission prompts: NOT VERIFIED |
| Orientation | VERIFIED: 2/2 hosted engines; deliberate 15° keyboard rotation preserved on focus/close; Reset returns north-up/MRS10/ECRL |
| Camera/filter restoration | VERIFIED on settled pre-focus state, captured snapshot and restored state; stale fixed-delay expectations were corrected without changing deployed runtime |
| Preview protection | VERIFIED: HTTPS, exact served SHA/asset bytes, Vercel Authentication; unauthenticated HTTP 302; temporary test grant revoked |
| Auth/RLS/private coordinates | PRESERVED, not newly certified: R2.6 bytes and canonical navigation unchanged; zero Supabase calls in map tests; no private calibration export |
| Physical Owner Safari UAT | PENDING — no Owner PASS asserted |

## Geometry and operational status

154 retained OSM-source segments; **zero official/survey-verified physical segments**. RTS, Sentosa and Changi APM have directly associated partial source geometry. Fifty-five OSM segments lack accepted service association. Thirteen optional secondary approximate segments remain explicitly unverified. Most route alignments remain DATA GAP; lineups are not substituted with artificial station-to-station tracks.

Operational, under-construction, planned and MR-S10 proposal classes are separate from geometry evidence. RTS is under construction in the pinned source, with a cited February 2027 service target, not certified operational. Padang Besar transfers do not establish regular through KTMB–SRT service. Tebrau service adjacency is not an invented physical LineString. China references are excluded from MRS10.

## Performance observation and limits

CI Chromium sample: RAF callback p95 16.8 ms; maximum 516.6 ms. A long callback gap was observed; this is not a rendered-FPS or freeze-free certification. Across 72 filter transitions, DOM counts stayed [597, 597, 597]; post-GC heap samples were [20.85, 24.34, 24.75] MB. These short-run samples do not prove absence of long-duration leaks. WebKit heap metrics were unavailable.

Managed local WebKit screenshot capture was unsupported/crashed after functional checks; hosted WebKit functional runs deliberately omit that artifact step. CI WebKit capture steps passed; hosted Chromium screenshots are supplied. These distinctions are retained in evidence.

## Evidence

- [Release report](REPORT.md)
- [Route-by-route coverage](MY-SG-TH-COVERAGE.md)
- [Final CI](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41488431805)
- [Full route assertions, including the earlier global failure](evidence/full-route-assertions.json)
- [Final CI receipt](evidence/final-ci.json)
- [Hosted assets and exact build receipt](evidence/hosted-http-assets.json)
- [Hosted browser reports](evidence/)
- [PDF copy](OPENMR-S10-INTEGRATED-RAILWAY-MAP-QA-CERTIFICATE-V1.0.pdf)

This is an internal MR-S10 QA record. It is **not government approval, official geospatial validation, an engineering survey, feasibility approval, or operational railway safety certification**. No private Owner coordinates, Production deployment or P02/P03 changes form part of this certificate.
