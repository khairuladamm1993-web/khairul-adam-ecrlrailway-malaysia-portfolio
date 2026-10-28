# P01 — ECRL authoritative georeferenced/as-built source trial R3
**Date:** 29 October 2026 (MYT) · **Mode:** research + isolated GitHub metadata probe · **Production / PWA:** unchanged

## Outcome at research checkpoint
1. MyGeoportal/MOT public railway polyline layer 16 is a REAL feature layer in EPSG:4326 with GeoJSON query support. Its published rail usage renderer identifies MRT, KTM, ERL, LRT, ETS and others, **but no explicit ECRL category**. The existence of generic railway geometry does not authorize classification as new ECRL as-built track.
   URL: https://mygos.mygeoportal.gov.my/gisserver/rest/services/MOT/MOT_MyLogistik_Public/MapServer/16
2. Selangor regional plan RSN_6_3_WFL1 has a layer **Rel ECRL CN (22)**, and another edition Map_RSN_6_1_WFL1 uses ID 17. These are GIS planning **candidates**. Raw attributes and line geometry were not inspected at this checkpoint, the actual publisher/rights are not validated and the layer was not independently matched to a current as-built railway alignment.
   URLs:
   - https://services-ap1.arcgis.com/25GhUqvPnzPICV7I/ArcGIS/rest/services/RSN_6_3_WFL1/FeatureServer/22
   - https://services-ap1.arcgis.com/25GhUqvPnzPICV7I/ArcGIS/rest/services/Map_RSN_6_1_WFL1/FeatureServer/17
3. Majlis Klang public TRANSPORTATION_NETWORK layer 9 covers generic rail network, **not proven ECRL**.
   URL: https://gis.mpklang.gov.my/server/rest/services/TRANSPORTATION_NETWORK/FeatureServer/9
4. MRL / PLANMalaysia public official diagrams confirm the corridor and Kerteh, Kemaman, Kuantan Port, Temerloh and Northport/Westports spur contexts but **not** physical engineering as-built coordinates.
   - https://www.mida.gov.my/wp-content/uploads/2024/06/Slides-MRL.pdf (visual railway schematic)
   - https://myplan.planmalaysia.gov.my/admin/uploads_publication/pdf_20250117162247_10.pdf (PeGTaECRL, table 5.79)
5. MyGeo Data Services explains that geospatial fundamental-data sharing is principally G2G with access rights; the existence of a data layer does not grant reuse permissions.
   https://www.mygeoportal.gov.my/en/applications/mygeo-data-services
6. MRL website terms restrict public reuse of its hosted materials without additional permission; before exposing MRL-derived surveyed GIS publicly, obtain an explicit lawful licence covering consumer web/PWA.
   https://www.mrl.com.my/my/hubungi-kami/terma-syarat/

## Actual R3 implementation
- `scripts/audit-ecrl-public-geoservices.mjs`: read-only ArcGIS metadata checks for four public GIS layers; asks only for layer descriptor, fields and counts. **Never requests or exports feature coordinates or Owner location data.**
- `tests/ecrl-public-geoservice-source.test.mjs`: generic MOT railway classification cannot promote itself to ECRL; named ECRL regional GIS remains a planning candidate; public-geometry publication gate stays CLOSED.
- `.github/workflows/mrs10-p01-ecrl-geosource-r3.yml`: isolated metadata research job plus regression tests, publishes only sanitized metadata findings as short-retention CI artifact. If a provider blocks network access, record `UNAVAILABLE`, not `no ECRL exists`.

## What an authoritative engineering file must provide
- Track centreline polyline in known CRS/datum with transformation to EPSG:4326 (preserve original CRS and version).
- Whether it is approved-for-construction, construction-stage or **as-built/surveyed**, with author, date, line IDs, asset range and measured horizontal accuracy.
- Linear Referencing System with continuous or segmented CH origin/equations for sections A/B/C1/C2/D; CH alone **cannot** position a point on a map.
- Seven distinct PL centreline/turnout controls, crossing track and signalled loop limits, station IDs. PL07 historical C1 must not be repurposed for revised C2.
- Freight junction interfaces for Kerteh/PETRONAS, Kemaman, Kuantan KP1/KP2, Temerloh/KTMB, Northport and Westports with actual siding, loading berth and buffers at the track end.
- Parcel/landuse rights, industrial clearance constraints and verified residential/road network overlays to rule out fictitious yards, homes and roads.
- Redistribution/public-display rights: licence, attribution, permitted derivatives and whether real-time positioning is separately authorized.

## Data matching sequence, conditional on getting genuine evidence
1. Preserve current Owner 23-CH manifest immutable and source link every station/PL to new survey dataset without silently rewriting accepted chainage.
2. Read source metadata and engineering alignment/version, confirm datum and CH LRS.
3. Construct a private review-only joined table of `assetCode, CH, approvedSurveyFeatureID, lon, lat, positionalAccuracy, sourceDate, reviewStatus` with **no public coordinates until the gate passes**.
4. Review turnouts and freight interfaces individually; require geometry to remain on track/railway land and not road/residential parcels.
5. Independent QA + Owner Safari review + explicit publish permission before any public LineString, PL pin or End Lane marker.

## Status
- **IMPLEMENTED:** public layer discovery, repeatable read-only metadata probe, no-publish regression.
- **UNDER EVALUATION:** live ArcGIS service metadata reachability and actual layer record counts.
- **UNVERIFIED:** any ECRL survey/as-built centreline, PL01–PL07 surveyed points, exact terminals/turnouts/loading bays.
- **NOT STARTED:** physical track overlay / real train map matching / consumer PWA.

## To request permission via MRL (not sent)
Request a public-release-authorized ECRL alignment GIS dataset or availability of a redacted consumer geometry, engineering chainage datum and 7 loop turnouts; also request an approved list of freight interfaces and terms of reuse. Do not ask for restricted operational/security drawings or publish safety-sensitive site plans.

## Live ArcGIS Results — 29 October 2026 (GitHub runner, read-only queries)
Execution: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40778324518

| Layer | HTTP API metadata | Feature count | EPSG | Outcome |
| --- | --- | ---: | ---: | --- |
| MOT MyGeoportal /16 | Available | 122 | 4326 | Generic railway; a literal `NAM LIKE '%ECRL%'` returned 0; **not a categorical proof that every feature excludes ECRL** |
| Selangor RSN /22 | Available | 2 | 3857 | ECRL-named planning polylines; no CH controls |
| Selangor alternate /17 | Available | 2 | 3857 | Same ECRL public attribute values; **not evidence of 4 distinct alignments** |
| Majlis Klang railway /9 | Available | 7 | 3375 | Generic railway network, unconfirmed ECRL |

Two publicly accessible features in each Selangor RSN ECRL layer expose ONLY these reviewed nonspatial attributes:
- `jenis`: Rel berkembar; `nama`: East Coast Rail Link (ECRL); `status`: Komited; `jarak`: '53.2489' and '54.3769' (field data **without independently confirmed units**).
- There are NO chainage, surveyed PL, turnout, as-built revision or railway-end fields in the returned layer metadata.
- The status `Komited` and plan-format `jenis` do not imply physical double tracking. Compare MRL 13 June 2024 project specification: single track on double-track formation. Treat the difference as a **scheme terminology/engineering-provenance discrepancy**, not as permission to correct physical rail count.
- Neither Selangor layer has a validated source license for incorporation into an independent public consumer application.
- We did **not** download these polylines or infer PL coordinates from them.

R3 code source-contract regression passed 13/13. The exact live-script commit is `7430efbd55b399dfab458c5b8f0ab64dc303f59d`, and both jobs succeeded. Re-run only on demand; no background monitor was scheduled.

### Decision
**Data acquisition attempt succeeded for public metadata and planning identities, not for survey-grade/as-built ECRL geometry.** Matching the 23 accepted CH control records to the railway centreline, PL01–PL07 positions, loading facilities or land parcels remains **NO-GO** until authoritative engineering referencing is supplied under terms permitting the intended use.
