# P01 — ECRL PL Owner Calibration (2026-10-29)

## Owner direction
- Hide consumer-facing accuracy disclosure control; retain source warnings inside station/PL engineering details.
- Reuse canonical approved Owner/Admin locations, never GPS of device or guessed OSM point as exact alignment.
- Protect V8.1 visual baseline and Production.

## Read-only Supabase findings
- There are 25 approved Corridor records and 29 map location version history entries at inspection time.
- PL01–PL07 all have canonical coordinate fields: PL01 Personal Field-Validated, PL02–PL05 Public Reference, PL06–PL07 Pending Validation.
- None of seven is labelled Engineering/Survey Validated; approved coordinates do not prove that physical ECRL alignment passes through them.
- No raw Owner-approved coordinates are shipped in isolated Preview JavaScript, HTML or public cache.

## Implemented
- Browser module owner-calibration.js syncs read-only from RailwayAccess.fetchMemberBundle only after backend-authenticated Admin role.
- On authenticated railway-access-change refreshes owner reference markers; logout and failed auth clear in-memory source.
- Amber dashed square + dot means Owner reference, not physically verified loop.
- Public standalone V8 Preview does not load member authentication. Therefore it cannot inherit a login from the separate Owner portal domain or render private Owner pins.

## Remaining gates
1. Integrate existing RailwayAccess gateway in a same-origin owner-authorized host; do not pass tokens across domains.
2. Verify actual Owner login/logout sync on iPhone/iPad Safari using canonical approved rows and source version.
3. Compare asset positions to approved physical ECRL georeferenced alignment before asserting exact track location.
4. Owner approval before publishing private coordinates to the public map or modifying Production.

## QA contract
- No accuracy button visible; engineering provenance retained.
- Unauthorized viewers have no Owner location source points.
- Valid PL01–PL07 IDs only; no dynamic hardcoded lat/lon in public source.
- No fabricated LineStrings or claimed surveyed geometry.