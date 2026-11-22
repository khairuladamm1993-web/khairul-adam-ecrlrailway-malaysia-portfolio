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
