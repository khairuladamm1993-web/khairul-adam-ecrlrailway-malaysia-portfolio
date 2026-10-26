# MR-S10 P01 — LRT Sri Petaling V2 · isolated integration handoff

Observed 2026-10-26 (Asia/Kuala_Lumpur). This is a source-backed non-production candidate, NOT integrated, NOT operational railway data.

## Git and deployment evidence
- Source repository: khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio
- Protected feature branch: `feature/mrs10-p01-sri-petaling-v2`
- Baseline integrated HEAD at branch creation: `6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c`
- Tested code source commit: `49ea3a24358637bf0203b36dbb6f663a76506603`
- Staging deployment: `dpl_GiohdUEGLPkBbKmKEH4yQcLKipfz`
- Staging URL: https://mrs10-p01-sri-petaling-v2-isolated-p9g6ny04z.vercel.app/
- Vercel project: `prj_JeQGsr5C68dTQa5tkwMNKDL0pCET`
- Target: `staging` (NOT portfolio Production); Vercel Authentication = all.
- Recorded build logs: 29/29 public source ArcGIS POI names/codes matched, 0 rejected, 7/7 Node tests pass, 0 failed.
- Integrated preview branch, Ampang R2.19 renderer, main, Supabase Auth/RLS, ECRL simulators were NOT edited.
- Branch compare to baseline includes only new `p01/sri-petaling-v2/*` files and a new isolated CI workflow.

## Railway service model
- Service 4 / Sri Petaling: Sentul Timur ↔ Putra Heights; exactly **29 current service stops**.
- Stations SP1…SP22, SP24…SP29 and SP31; no invented SP23/SP30 passenger stops.
- Shared service **11** stops: Sentul Timur (SP1/AG1) to Chan Sow Lin (SP11/AG11).
- Exclusive southern service section **18** stops: Cheras (SP12) to Putra Heights (SP31).
- Shared passenger identity does NOT establish separate tracks, platforms, signals, points, turnout geometry, or track capacity.
- Passenger interchanges are connection references, not claims of shared platform/physical track.
- Maroon is Rapid KL service colour family; design tokens `#862448` light, `#F2A6C0` dark; exact official hex UNVERIFIED.
- Render sourced **station points only**, not a geographic line. The maroon connection in the lineup is a schematic service sequence, NOT surveyed rail alignment.
- Public ArcGIS station layer 2 has 29 candidate POIs; live read-only audit found FID 3 source label `TITWANGSA`, code `SP03`. Decoder includes an exact FID+raw-label+code guard to map to canonical `Titiwangsa`. Original source x/y unchanged. Do not replace with synthetic coordinates.
- Public ArcGIS line layer 11 is **not** accepted as verified physical track geometry; do not automatically use or render it.

## Source references
1. Operator map: https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf
2. Government route description: https://www.mot.gov.my/en/land/infrastructure/current-rail-services
3. Station order secondary crosscheck: https://www.mrt.com.my/stations.htm
4. SP code secondary crosscheck: https://www.transportmalaysia.com/services/lrt-sri-petaling-line/
5. SP31 / KJ37: https://mrt.com.my/lrt_sri_petaling/Putra_Heights.htm
6. GIS station layer: https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/2

## Integration contract for the Integrated chat
1. Recheck fresh HEADs, merge base and conflicts. Never merge blindly or force-push.
2. Transfer/consume `catalogue.js` and `gis.js` in a safe integration patch; no changes to Ampang R2.19 renderer.
3. Shared canonical passenger station keys: `agsp-1`…`agsp-11`. Rendering of a physical station must not create a second phantom station when Ampang and Sri Petaling service markers overlap.
4. Dual-service popups must retain both `SPn` and `AGn` with maroon/orange service chips; preserve a single physical station reference.
5. Add Sri Petaling as a 5th category to integrated default all-completed-lines map ONLY after isolated Safari and source QA gates. Preserve existing four colours and overlays.
6. The GIS points are candidates. Any route-polyline/track alignment requires separate independently sourced way geometry plus topology evidence and QA approval.
7. Default all-visible, category Focus/All/Reset and station-to-station list should remain usable at iPhone zoom. No iframe integration.

## Outstanding gates / safety report
- **PASS**: source live candidate 29/29 matched, 0 rejected; exact station sequence fixtures; 11 Ampang shared identities matched by name/AG code; 7/7 Node tests; protected staging READY; scope-only Git compare.
- **NOT YET PASS**: real iPhone/iPad Safari UI/UX UAT (including live CORS, glyph placement, dark mode tap targets); production/integrated regression; physical railway geometry/topology; officially measured colour hex.
- Initial deployment to this **new isolated project** was unexpectedly reported as `target:production` by Vercel even though the source project was not the original portfolio. It remained Vercel-Auth protected. It could not be canceled after READY. This is NOT approved as an MR-S10 Production release. Subsequent approved candidate explicitly targeted `staging`. Owner may remove the unintended old isolated deployment using the Vercel dashboard; do not silently remove other releases.
- No PR, no merge, no push to main, no promotion, no edits to portfolio Production.
