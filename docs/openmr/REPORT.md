# OpenMR-S10 MY–SG–TH controlled Preview release

**GO for Owner protected Preview UAT with declared source gaps. Physical Owner Safari UAT remains PENDING.**

Official entry: **[OpenMR-S10Map — Official Protected Preview](https://openmr-s10map.vercel.app/)**

- Product owner: MR-S10 Railway Systems.
- Build: 1.0.0-rc1 over the accepted V8.1 44-route integration.
- Branch: `candidate/openmrs10-my-sg-th-20261103`.
- Deployed runtime SHA: `fc1600b35521457eb9ee90ad79070f4dff7726dd`.
- QA-only revision: `3fde70401c276109ab1e63b570a2bae631c368b0`. All app assets, builders, HTML and source registries are byte-identical to the deployed runtime revision; subsequent changes correct/extend QA and evidence only. Do not describe the QA/docs HEAD as deployed.
- Deployment: `dpl_GrsFbdbghy4g3VLLpqCqE3YANrwy`, existing map project `prj_lCXBrXOHCNYABx8TLx2FhCEAIYus`, target staging.
- Evidence issued: 2026-11-03T01:23:15+08:00 (Malaysia local time; underlying build was 2 November UTC).

## Checkpoint comparison and preservation

Started from `integration/mrs10-p01-complete-map-20261101` HEAD `c7450e1438adef60a86954da488fee62df6240b3`; recorded deployed map `67dd39f4e05e0817084bd71692ca9962ed0fa787` was verified READY at `dpl_DMmsDLvEM2eq5hkKAx5KPEkb5DAA`. Its accepted CI 41305238353 was SUCCESS. Those previous PASS baselines were retained rather than restarted.

Canonical Gateway independently resolved to Auth R2.6 runtime `4681dc3732e83691eaf9323f5bc872f70adff1be`, deployment `dpl_91iA6hiYcjG2JvUGUMiWGnyPSp32`. It was not assumed to serve the map checkpoint, reassigned or overwritten. Locked Auth files and source registries remain unchanged. No Supabase configuration/schema/RLS, private Owner coordinate, main merge, Production, P02/P03/P04 or paid service changes.

## Actual runtime changes

1. MRS10 replaces the combined “Semua/All” filter and opens automatically on first load and Reset. It combines all 44 accepted MY/SG/TH catalogues, plus existing Malaysian supplementary references. China code/campus records remain available only through the separate China/source-reference experience, not the MRS10 default.
2. ECRL's master/four reference kinds initialize ON; stale OFF storage is ignored and Reset reenables ECRL. Its controls and fit-bounds now recognize MRS10. Original STN/PL/depot/spur identities, CH manifest, UNKNOWN endpoints and schematic classifications remain unchanged.
3. Station/track selections focus the assigned service, build the complete accepted lineup in its source color, hide unrelated routes, and fit available source points/vectors. Interchange buttons select a specific associated service, including Padang Besar. Close restores the captured layers, category, selection, camera center/zoom/bearing/pitch/padding and cancels stale focus intent. No interpolated alignment is generated.
4. Physical connectivity no longer infers service membership from neighboring segments. Only the tapped segment's explicit route IDs identify its service. Fifty-five unassigned OSM segments retain UNKNOWN service association; their source-connected component is not relabeled as RTS/another through service.
5. North-up initializes and Reset restores bearing/pitch zero. Deliberate user rotation is preserved through focus/close; a 15° actual MapLibre keyboard gesture was checked on both hosted engines. No Owner screenshot was attached, so the exact cause of an earlier screenshot's rotation is not claimed proven.
6. Smaller zoom-dependent station markers reduce clutter. Operational/construction/planned/proposal labels are separate from geometry evidence, while accepted route colors are unchanged. Ordinary station/track popups are compact; provenance/technical details expand. Popup Close stays in the viewport on mobile; Light/Dark contrast is tested.
7. Existing MY–TH and MY–SG relationships are surfaced with source details: physical corridor versus passenger transfer versus service adjacency versus planned/under-construction work. No invented passenger through-service is asserted. RTS remains under construction in the pinned source, citing the February 2027 target, not a fresh operational confirmation.

## Proven GPS omission and implemented recovery

The accepted map entry/controller had no Geolocation API request or MapLibre device-location marker. Location Services alone therefore could not make a device point appear. This omission is proven from source; it is not a claim that a particular Owner device's Safari permission setting was diagnosed remotely.

The small My Location control now requests one foreground high-accuracy position only after a tap. The exact received coordinate creates a blue device marker; a geodesic accuracy polygon uses the received metre value. There is no station/track snapping. Successful user-requested fixes center the map only while their camera intent is still current; a later railway interaction prevents a stale GPS response from stealing focus. Style changes reinstall the accuracy source without repeated idle writes. The GPS source/DOM marker is independent of railway filters, focus and private calibration.

No watchPosition, background loop, coordinate persistence, upload, analytics or Supabase calls are present in the GPS module. Hidden-page/stale callbacks are rejected. Denied/unavailable/timeout/low-accuracy states have BM/EN/Chinese/Thai messages. Error callbacks are simulated; granted positions use the browser's geolocation emulation. Physical iPhone/iPad GPS and actual Safari permission prompts remain NOT VERIFIED.

## Actual QA and evidence

| Layer | Result |
|---|---|
| Source/regression/build | 155/155 assertions PASS; exact final CI source-artifact job SUCCESS |
| Full route assertions | 44 × 6 desktop/portrait route rows and 7 × 4 landscape route rows checked in run 41486960142. That earlier run failed a later global camera assertion; its overall result remains FAIL |
| Final corrected global/delta CI | [41488431805](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41488431805): all 11 jobs SUCCESS; 7 affected route rows × 10 browser/viewport scenarios plus global GPS/filter/geometry/track/contrast/fullscreen/privacy checks |
| Real protected hosted entry | 4/4 functional cases PASS on the official alias: Chromium/WebKit iPad portrait and iPhone landscape; 5 representative routes per case; network responses not mocked |
| Hosted rotation/reset | 2/2 engines PASS: actual 15° gesture, exact focus-close restoration, north-up Reset/MRS10/ECRL |
| GPS states | Simulated coordinate/accuracy and error callbacks PASS; no physical GPS or real Safari permission-prompt PASS claimed |
| Build/assets/HTTPS | HTTP 200 through temporary authorized test access, entry HTML exact, 36 local JS assets + 4 source JSON files verified; served product receipt matches deployed SHA/ID |
| Security | Vercel Authentication remains; unauthenticated official entry returns 302. Temporary share grant rotated/revoked; zero grants remain. No real Owner role/RLS login rerun claimed |
| Physical Owner Safari | PENDING |

The full-route filter initially treated an empty environment variable as an empty selection; six initial jobs therefore had zero route rows. Those are retained as **global-only** evidence, not 44-route PASS. The guard now requires the expected nonzero row count. A fixed 450 ms wait also sampled a still-moving camera on some runners; final tests wait for stable frames and compare pre-focus, actual captured and restored cameras. No deployed runtime change was made to hide that assertion. The final CI and hosted reports contain the three snapshots.

Managed local WebKit's native screenshot API closed the browser after functional checks. Hosted WebKit functional checks explicitly omit that artifact capture; CI WebKit default capture steps passed, and hosted Chromium images are supplied. A temporary CI-hosted alternative could not write a repository secret (GitHub integration returned 403); no secret was created or permissions broadened, and that temporary workflow was removed. This is not an outstanding Owner action or an invented hosted PASS.

## Performance and limits

The final CI Chromium sample recorded RAF callback p95 **16.8 ms**, max **516.6 ms**; a long callback gap was observed. These callbacks are not rendered/GPU FPS and do not establish freeze-free physical-device performance. Over 72 filter transitions, DOM counts remained **[597, 597, 597]**; post-GC heap samples were **[20.85, 24.34, 24.75] MB**, showing a bounded short-run sample, not long-duration leak certification. WebKit heap was unavailable. The snapshot is preserved rather than reporting unsupported memory/FPS claims. This is P01 map evidence, not the separate P03 performance gate.

## Coverage and remaining gaps

[Route-by-route matrix](MY-SG-TH-COVERAGE.md): MY 21 routes / 395 listed / 371 mapped associations; SG 17 / 288 / 288; TH 6 / 59 / 17. Total 44 / 742 / 676; not unique physical stations.

Physical geometry remains partial: 154 OSM-source segments, zero official/survey-verified segments and 13 optional secondary approximate segments. Directly assigned OSM geometry exists for RTS, Sentosa and Changi APM only. Fifty-five source segments have no accepted service association. Malaysia-wide, Singapore-wide and Thailand-wide physical completeness is **not claimed**. Thailand retains 41 unique missing locations; ART partial rosters/GPS remain unresolved; Shuttle Timur retains ten excluded markers. ECRL reference positions/schematics are not verified physical track or station/depot GPS. China is preserved separately with its existing order/color/geometry gaps. No new coordinates, railway-source datasets or artificial railway connections were created.

## Changed runtime/build/source-test files

- `.github/workflows/mrs10-p01-complete-map.yml`
- `assets/openmr/gps.js`
- `assets/openmr/network.js`
- `assets/unified-ecrl/adapter.js`
- `assets/unified-ecrl/integration-ui.js`
- `assets/unified-v8-map.js`
- `data/openmr-baseline-lock.json`
- `scripts/build-complete-map.cjs`
- `scripts/build-unified-v8.cjs`
- `tests/complete-map-browser.test.mjs`
- `tests/openmr.test.cjs`
- `unified-map-v8.html`


## Durable delivery

- [Internal QA certificate — Markdown](OPENMR-S10-INTEGRATED-RAILWAY-MAP-QA-CERTIFICATE-V1.0.md)
- [Internal QA certificate — PDF](OPENMR-S10-INTEGRATED-RAILWAY-MAP-QA-CERTIFICATE-V1.0.pdf)
- [Evidence JSON/screenshots](evidence/)
- [Machine-readable certificate receipt](certificate-data.json)

Decision is GO for protected Owner Preview review with the declared data limitations. It is not a Production promotion, physical Owner acceptance, government approval, survey, feasibility approval or operational railway safety certification. No previous USER PASS is reassigned to this new build.
