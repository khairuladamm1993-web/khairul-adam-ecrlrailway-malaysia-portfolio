# MR-S10 — Owner Railway Track-Only Train Movement Rule (R1.2)
**Owner mandate:** Train movement in ECRL simulations must be over ECRL railway tracks, never streets, roads or invented straight connectors. This is the acceptance contract for P01 Consumer Route Lab and future shared geometry modules used by P02 browser simulator and P03 Swift simulator. P02/P03 source files have **not** been modified by this change.

## Meaning of orange
- OpenRailwayMap **standard main railway usage** paints mainline orange `#FF8100`; visual styles also differentiate branches, industrial railways, proposed/construction, sidings, etc. Orange **does not encode the 1435 mm gauge**. Source: https://github.com/OpenRailwayMap/OpenRailwayMap/blob/master/styles/standard.mapcss
- The public MRL engineering specification, separately, defines ECRL **1435 mm standard gauge**, **25 kV AC electrification**, and **single track on double-track formation** for the cited mainline reference. Do not convert formation width into two operational tracks. Source: https://www.mida.gov.my/wp-content/uploads/2024/06/Slides-MRL.pdf
- Section D interfaces must explicitly distinguish ECRL 1435 mm from existing KTM metre gauge when route graph design expands. Track color from other operators does not authorize cross-gauge train movement.

## Mandatory movement contract
1. **Never compute a train marker location from the OpenRailwayMap raster pixels**; they are a background reference, not geometry.
2. Display train marker on map **only** when candidate vector geometry is a continuous LineString from railway-tagged ways, spans the relevant model travel and has at least two ordered, geospatially fitted CH anchors with plausible chainage-distance residuals.
3. Each candidate imported railway LineString must report a gauge tag exactly `1435`; if missing, mixed, or explicitly incompatible, block map movement pending review rather than infer the tag from orange.
4. Reject candidate road vectors (`highway=*`), non-rail tagged lines, road/area tag conflicts and detached railway fragments. Real railway-over-road crossings and bridges may exist; do not falsely reject legitimate grade-separated or legal level crossings simply because a road feature intersects the railway in plan view. An independent road/parcel survey is still outstanding.
5. Preserve CH-only manual training separately when map geometry is absent; show **NO TRAIN MAP PIN / TRACK LOCKED**. Do not draw a route as accepted railway track.
6. Keep confidence labels separated: `OSM_VISUAL_REFERENCE` vs `OSM_VECTOR_SIMULATION_CANDIDATE` vs `OWNER_SIMULATION_REVIEWED` vs `AS_BUILT_SURVEY_VERIFIED`. Owner UAT **never automatically upgrades** to as-built.
7. Future simulator occupancy, signalling, crossings, shunting, trains, passenger map-matching and live ETA must share a route graph using source-verified track IDs, node connectivity, turnout permissions, direction, gauge, provenance and speed authority. No movement simply because two markers are geographically near.
8. Protect existing P01 Unified Map, P02 frozen simulator baseline, P03 Swift recovery and Production; implementation in P01 R1.2 is an isolated Preview candidate pending browser QA and Owner Safari acceptance.

## R1.2 implementation
- `route-lab-rail-overlay.js` adds genuine OpenRailwayMap standard **raster tiles** with attribution and a visible toggle.
- `route-lab-track-metadata.js` contains MRL gauge spec and strict `movementEligibility` gate (no rail geometry, incomplete CH anchors, missing 1435 on any segment, mixed gauge, highway line tag ⇒ no train map pin).
- `route-lab-ui.js` uses this gate **before** rendering its tentative vector and train marker. If gate fails, both are absent from accepted movement display, while CH-only manual simulation remains.
- Source-native OpenStreetMap/ORM track line data for the full ECRL corridor is **not yet acquired**. The orange visual layer does not fulfill that milestone.

## Acceptance / limitations
- Unit tests must reject highway vectors, 1000 mm, missing gauge, disjoint segments and absent CH control.
- Chromium/WebKit Desktop/iPad/iPhone must show the actual rail reference overlay and obey the toggle; railway tile fetch successes must be reported separately from layer installation.
- Do not claim geometrical precision or physical-road avoidance is survey-verified merely because OSM declares railway tags; independent authoritative alignment and land use overlap inspection remains a prerequisite for public release.
- No PWA, Production merge, real-time GPS or operator-authorized railway operations based on this candidate.
