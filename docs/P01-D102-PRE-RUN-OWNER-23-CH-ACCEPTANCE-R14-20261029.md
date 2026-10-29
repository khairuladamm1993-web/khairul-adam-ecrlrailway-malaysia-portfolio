# P01 — D102 Full Corridor Readiness & Owner Coordinate Review R1.4
29 October 2026 · isolated branch · **NOT an engineering survey** · Production/P02/P03 untouched.

## Owner decision and acceptance definition
- Before any **georeferenced** D102 run, present all 16 STN codes and all PL01–PL07 (23 accepted CH control points) for source-backed Owner model review.
- STN01 Kota Bharu remains origin CH000+670; destination STN17 ITT Gombak CH524+160. Keep STN10 absent; legacy asset key `ecrl-stn-10` maps to officially accepted `STN11` in Owner display.
- Show station locality coordinates as **candidates**, never as confirmed physical track centreline; **NO PL latitude/longitude synthesized** by CH distance or straight-line interpolation.
- Owner must explicitly enter/review each candidate lat/lon WGS84, evidence source and explanatory note, and select model-only acknowledgement.
- Compare consecutive **direct geodesic air-distance** against CH difference only as a *lower-bound plausibility check*, not as a method for obtaining coordinates or proving track geometry. Same chainage datum/equations need engineering re-verification.
- Geographic train movement remains blocked until independently sourced continuous vector rail centreline and source/gauge/CH anchor QA pass, irrespective of the count of Owner confirmations.

## Implemented R1.4 assets
- `route-lab-satellite.js` — independent EOxCloudless 2016 satellite-style imagery with required EOX attribution and street mode fallback. EOX 2016 free CC BY 4.0 public raster is **historical imagery**, no present-day rail survey. Not Google/Apple proprietary imagery. Tile network may fail and has no SLA.
- `route-lab-station-intelligence.js` & `route-lab-station-map.js` — 16 public-locality station pins; Station Intelligence shows CH, section, project gauge, source and unknown physical layout. Unknown PL positions remain list-only.
- `route-lab-freight-area-map.js` — 4 purple port area markers (Northport, Westports, Kemaman, Kuantan) plus an amber historical PETRONAS/Kerteh railway-landuse square. No cargo end-lane or spur-track verification is claimed.
- `route-lab-ch-trail.js` — deterministic CH breadcrumb each 100 m from manually saved D102 movement events. No geographic coordinate inferred and no road tracing.
- `route-lab-d102-preflight.js` — immutable 23 CH checkpoint references, per-asset source, Owner candidate acceptance, rejection, local recovery, geodesic lower-bound discrepancy log, private export.
- `route-lab-d102-preflight-ui.js` — WGS84 input/confirmation for each STN/PL; on-map click fills **candidate input only**, not automatically accepted; private JSON export and status gates. Public preview **has no Owner authentication**: do not enter restricted/secret railway engineering data.
- `route-lab-d102-observations.js` — CH-anchored observations with evidence class, timestamps, source and QA pending status, local restoration and private JSON export.
- `route-lab-ui.js` integrates candidate controls, engineering event log and map state; local storage only, no Supabase/cloud sync.

## D102 pre-run acceptance matrix
1. 23 assets enumerated in preserved CH order. No invented STN10, no accidental C2 reassignment of historical C1 PL07.
2. Owner model coordinate acceptance stored privately per device with source link or document label and review note. Pending list remains accurate and revocable.
3. Any consecutive pair with direct geographic distance greater than CH interval by tolerance must be flagged, never automatically adjusted.
4. Separate `OWNER_SIMULATION_CANDIDATE` from `SURVEY_VERIFIED` and from `PHYSICAL_RAIL_LINK_ACCEPTED`.
5. Road/house avoidance: no train map pin or track line if continuous suitable 1435-mm railway geometry is unverified. Crossings/grade separations allowed on verified rail geometries.
6. Per-sample D102 CH logs with trainId, CH label, time, source, quality class, manual station/PL arrival/departure, signals, switches, bridge/tunnel/grade/curve/speed references and data gaps.
7. GPS, location accuracy, physical speed, TSR, gradient, curve radius, track ID and actual turnout alignment remain **NULL/UNKNOWN** until real measurement/source; never backfill from guess.
8. Browser refresh preserves session, coordinate drafts and observations only on that same device; export JSON private backup. Deleting browser data loses local entries. No secured cloud Owner ledger yet.
9. Browser Chrome/WebKit iPhone/iPad/Desktop QA + Owner visual Safari UAT before we call Preview accepted.

## Extended observations to collect when supporting evidence exists
- **Geometry:** rail vector ID, CH start/end, segment ID, CRS/datum, map-matching residual, odometer delta, cumulative CH, surveyed reference quality, turnout node, bridge/tunnel portals.
- **Track:** standard gauge 1435 mm project specification versus local verified tag, ballast/slab, electrification, single/double line, gradient, curve direction/radius, superelevation, track clearance (only if authorized).
- **Operations:** station and passing loop arrival/through, movement authority reference, simulated signal aspect, switches, occupancy, speed reference category (design/permitted/TSR clearly separate), hold/release sequence.
- **Environment:** bridge, tunnel, cutting, embankment, water crossing, terrain, vegetation, industrial zone, land-use/reference, weather source and timestamp, localization confidence.
- **Provenance:** source URL/ID/date, map screenshot evidence pointer (not uploaded by current client), data version, reviewer note, corrected-vs-original, visual quality class, private/public rights.
- **QA:** per CH gap and length residual, impossible neighbor geodesic distance, discontinuity, off-rail tag conflict, outdated satellite imagery, source licence, final Owner acceptance.
Never claim simulated observations equal actual rail operations.

## Remaining before geographical D102 journey
- 23/23 individual Owner-reviewed model coordinate candidates (currently zero in code; stored per device after Owner input).
- A real georeferenced, legally usable and physically plausible railway vector network for the full corridor. Prior screenshots only prove ORM raster tiles; complete continuous physical geometry still unknown.
- Independent CH-LRS normalization and chainage equations.
- Production-quality secured Owner account sync (not yet implemented); other assets are still excluded from consumer publication.
- Owner's final approval and Safari UAT. No automatic merge to Production.

## Data licences
https://www.openstreetmap.org/copyright
https://cloudless.eox.at/documentation/faq
