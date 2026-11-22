# P01 ECRL GIS evidence checkpoint — 22 November 2026

Status: **READ-ONLY VERIFIED (data shape)** / **TRACK GEOMETRY NOT VERIFIED**.

## Live Supabase read-only observations
- `public.member_content`, `kind='corridor'`: 25 records, all approved at inspection.
- 24 parseable, distinct chainages in `CHddd+ddd` format; 1 missing (`DEPOT-KTN`); 0 malformed nonempty values.
- Chainage endpoints: `CH000+670` to `CH524+160`.
- Location confidence: 5 Personal Field-Validated, 18 Public Reference, 2 Pending Validation, 0 Engineering/Survey-classified.
- No top-level `geometry`, `geojson`, `alignment` or `routeGeometry` in any of 25 Corridor bodies; 0 `surveySource` or `geospatialSource`; 3 records include `sourceReferences`.
- These results **do not establish surveyed railway geometry**, turnout topology, a polyline, a rail-grade gradient profile, or physical chainage accuracy.

## Source review
The previously existing P01 ECRL GIS branches examined had the same `assets/map-gateway.js` and `assets/corridor-reference.js` object SHAs. No independently verified route geometry was recovered from those inspected files.

## Repeatable diagnostic
`scripts/p01-ecrl-readonly-integrity.sql` contains a SELECT-only integrity probe. Do not interpret a valid chainage as an accurate geographic point. Never interpolate latitude/longitude from endpoint markers and claim engineering accuracy.

## Next evidence gate
Obtain a licensed/authorized railway alignment GeoJSON or surveyed coordinate-and-chainage dataset with provenance, coordinate reference system, coverage and accuracy. Keep candidate ingestion isolated; run geometric continuity, CH monotonicity, provenance and Safari rendering checks before approval.

No Production, P02, P03, Auth/RLS or live data mutation authorized.

## Candidate-only evidence gate QA (2026-11-22)
- Source: `scripts/p01-ecrl-alignment-evidence-gate.cjs`; tests: `tests/p01-ecrl-alignment-evidence-gate.test.cjs`.
- Local isolated execution of the fetched source and test contents: `node --check` PASS; `node --test` **5/5 PASS, 0 failed**.
- This proves the five included fixture cases in a local copy only. GitHub Actions push-run and end-to-end integration remain UNVERIFIED; no production runtime or actual ECRL geometry was tested.
- The gate returns `CANDIDATE_ONLY` on accepted fixture geometry, never `VERIFIED`. Source-provided `approvedForUse` and metadata require independent review before any Owner approval.

## GIS evidence gate V1.1 QA
- Gate commit `11d6a1570948262b7c7e726d6118e81948e42969`; fixture commit `39ee1676bfc571900e00e8add7f1f8d548e7e885`.
- Local copy of the revised gate and its seven fixture tests: `node --check` PASS; `node --test` **7 PASS / 0 FAIL**. The local files were transcribed from the connector-fetched source and corresponding test changes; CI execution on the GitHub runner remains UNVERIFIED.
- Added endpoint straight-line distance vs chainage-span plausibility and metre-based segment join tolerance. These are screening heuristics, not an engineering survey or route verification.

## V1.2 candidate gate checkpoint
- Added summed polyline-length plausibility guard to catch zigzag routes whose endpoints alone appear close. Source commit `4e267072b716d1696e7f297ebbd1341f201e76fe`.
- Added two regression scenarios for zigzag overlength and invalid CRS/approval flag, test commit `d80316360ba79e9d5f3aaef282894dbe3b27d4d3`.
- **QA status: IMPLEMENTED / NOT TESTED in this checkpoint.** Earlier V1.1 7/7 local result does not apply to the revised V1.2 code. CI evidence remains unverified. Candidate metadata and approval flag are untrusted self-assertions until reviewed independently.

## V1.2 execution evidence (2026-11-22)
- Fetched latest GitHub source and tests, reproduced them as a temporary local copy and executed with Node.js v22.16.0.
- `node --check scripts/p01-ecrl-alignment-evidence-gate.cjs`: PASS.
- `node --test tests/p01-ecrl-alignment-evidence-gate.test.cjs`: **9 PASS, 0 FAIL, 0 SKIPPED**, 94.827014 ms total.
- Evidence scope: local isolated fixture tests only; GitHub Actions workflow execution, real alignment, Safari UAT and production runtime remain UNVERIFIED.

## GitHub Actions CI verified — Run #46 (2026-11-22)
- Run ID `44966455635`, workflow `P01 UAT17 Candidate QA`, conclusion `success`, job `source-contract` ID `137036475249` conclusion `success`, SHA `ad1007e5b87f1d493e37e1d2c1e66646d1a8a08a`.
- Inspected actual job logs: **23 tests PASS, 0 FAIL, 0 SKIPPED**, Node syntax step PASS, `python3 scripts/build-production.py dist-production` PASS; protected legacy assets excluded.
- CI warning: `actions/checkout@v4` and `actions/setup-node@v4` rely on deprecated Node.js 20 runtime and are forced to Node.js 24; plan version bump in candidate, do not mistake warning for test failure.
- Evidence: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/44966455635
- This is **CI VERIFIED** for the specified SHA only, not physical alignment/survey validation or Production deployment.

## Actions v5 migration VERIFIED (2026-11-22)
- Commit `c1f74e6ebcd674f467934e2d636f99737814a9a1` updates candidate QA workflow to `actions/checkout@v5` and `actions/setup-node@v5`.
- GitHub Actions run #52 (`44966754626`), job `source-contract` (`137037411758`) concluded **SUCCESS**.
- Inspected actual logs: **23 tests PASS, 0 FAIL, 0 SKIPPED**; static artifact build PASS. Previous Node.js 20 deprecation warning not present in inspected logs.
- Evidence: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/44966754626
- CI validation is scoped to candidate source, not survey-grade ECRL geometry or production deployment.

## Existing private geospatial engineering continuity (2026-11-22)
- Read the owner's Drive reports `MR-S10-P01-R33-GEOSPATIAL-EVIDENCE-FINAL-REPORT.md` (2026-11-17) and `MR-S10-P01-R15B-LAPORAN-ROOT-CAUSE-V1.0.md` (2026-11-20); do **not** restart research or imply this candidate gate supersedes those mature private workpacks.
- R3.3 private engineering checkpoint: `feature/p01-ecrl-geospatial-evidence-r33` SHA `089dc275e0d57797377b395a982672d39bb0c1a6`. Historical ArcGIS planning layer: two feature objects / five polyline parts / 5,180 vertices; **0 accepted current alignment geometries**, source license and independent CH calibration absent. Private evaluation only, not public redistribution.
- R1.5b private engineering checkpoint: `research/p01-r15b-geometry-recovery` SHA `39da64c86fea2c9c022130af208f7cfbac07d188`. Nine private diagnostic candidates, 17/17 gaps HOLD; client graph 453 unique features, 2,843 nodes, 22 components; no proof of continuous physical rail alignment. 7 PL and 2 depot geometry/control targets remain unverified.
- Source-specific issue: R1.5b gap #9 way `1420666687` has approx. 9.5 km R32 endpoint chord; prioritize an independently authorized intermediate-linework package with source rights, revision/datum, matching endpoint IDs and independent controls before considering any promotion.
- The public-safe `scripts/p01-ecrl-alignment-evidence-gate.cjs` remains a **candidate-only structural plausibility filter**, not a replacement for R32/R33/R1.5b source lineage, calibration, owner acceptance or physical survey. No private historical linework should be copied into public artifacts without license authorization.
- Drive source references (private): https://docs.google.com/document/d/12q4ax2AgDKmgR6HLabAgAkGPYj5APuMM/edit and https://docs.google.com/document/d/1AcG8HsCDvZ-g7JWU5qVguIae7jq-tZiF/edit
- Next execution: reconcile against the exact private bundle and source receipts if accessible; do not claim bundle contents inspected from the report alone. No automatic merge/deploy/data writes.
