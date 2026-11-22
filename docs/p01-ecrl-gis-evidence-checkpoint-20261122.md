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
