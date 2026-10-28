# P01 — MR-S10 ECRL Single-Train Manual Alignment Laboratory R1
**Date:** 2026-10-29 · **Status:** IMPLEMENTED candidate, not physical track verified.
**Source baseline:** P01 GIS R3 evidence branch. **Isolation:** no P02, P03, public Production or PWA merge.

## Owner thesis and calibration model
- Objective: Build ONE TRAIN D102-SIM for manual CH run STN01 CH000+670 to STN17 CH524+160, preserving all 16 station IDs plus PL01–PL07 historical CH anchors.
- Use source-backed OpenStreetMap railway ways (railway=construction, proposed or rail), OpenRailwayMap as its visualization, and independent published railway plan/land registry as contextual cross-checks.
- Visual track candidate may be continuous **only** if imported railway segments connect within 1 m without inventing gap bridges. Any missing section remains a gap, not a guessed public LineString.
- Owner manual CH UAT logs model checks but never becomes an independent engineering survey. The candidate and test train pin are deliberately classed `SIMULATION_INFERRED_NOT_SURVEYED`.
- Import of a non-railway road, missing provenance, implausible coordinates, disconnected geometry or CH/geometric distance mismatch is rejected or held for review.

## Actual files
- `assets/unified-ecrl/route-lab-engine.js`: pure CH travel, checkpoint events, optional review, provenance validation, bidirectional railway-way joining, nearest rail-segment anchor fitting, map simulation position.
- `assets/unified-ecrl/route-lab-ui.js`: BM/EN/中文/ไทย controls, local autosave, JSON backup, route movement; no GPS APIs or server write.
- `ecrl-alignment-lab.html`: separate Safari/desktop-friendly MapLibre training lab, isolated from consumer navigation. `unified-map-v8.html` exposes optional link to it.
- Existing immutable `chainage-manifest.js` is the 23-item project CH authority **for simulation only**. It is not a survey datum. Names STN11 vs internal `ecrl-stn-10` remain mapped by official Owner convention.
- Automated QA tests cover math, continuity, security gates, iPad/iPhone/Desktop.
- Build copies the lab page and assets into the isolated `dist-unified-v8` Preview.

## CH travel and station model
`referenceRemainingKm = abs(destinationCH - simulatedCurrentCH) / 1000`.
A CH run can progress without GPS or track geometry. However, a physical candidate requires a georeferenced polyline, a plausible cumulative route length between station anchors, source IDs and direction.
The current R1 matching gate needs two named station/PL anchor controls with `{code,coordinates:[longitude,latitude],source}` and rejects:
- >250 m distance between an anchor and candidate railway;
- reversed or folded anchor order;
- >15% or >250 m difference between polyline length and accepted CH delta.

These are preliminary **training checks**, not engineering acceptance criteria. A true georeferenced CH-LRS requires documented chainage equations, project datum and independently verified point mapping. Other track candidates, tunnels, loops and spurs must remain separate from the mainline training route.

## Import a candidate without guessing
Use a lawful OpenStreetMap / regional GeoJSON export where each feature is a railway-tagged LineString (not roads) with source attribution such as `@id`, `sourceRef`, `source` or collection `source`.
- Prefer offline exports/cached filtered OSM extracts; do not query public Overpass API continuously from every consumer device.
- OpenRailwayMap visual layers represent OSM tags, not an independent surveyed railway geometry; do not count the same way twice.
- Sample GeoJSON schema (illustrative only, **NO actual STN location**):
```json
{
  "type": "FeatureCollection",
  "source": "OpenStreetMap ODbL 1.0",
  "anchors": [
    {"code": "STN01", "coordinates": [102.0, 3.0], "source": "TEST_ONLY"},
    {"code": "STN02", "coordinates": [102.298, 3.0], "source": "TEST_ONLY"}
  ],
  "features": [
    {"type": "Feature", "properties": {"railway": "construction", "sourceRef": "OSM_TEST_ONLY"}, "geometry": {"type": "LineString", "coordinates": [[102.0, 3.0], [102.298, 3.0]]}}
  ]
}
```
The numeric example is a **synthetic test**, not ECRL geometry; do not import it as real data.
- Browser file import never sends the file to a server. This Preview is **not authenticated**; do not use it for restricted engineering plans, personal location logs, private Owner coordinates or security-sensitive data.
- Local browser storage is not durable cloud sync. If Safari clears storage, data may be lost. Export the JSON backup regularly; failed quota writes are surfaced.
- OSM data is ODbL 1.0 and requires © OpenStreetMap contributors attribution; downstream data sharing must comply with the relevant ODbL derived-data rules. https://www.openstreetmap.org/copyright

## Outstanding acceptance before single unbroken 524 km map geometry
1. Obtain exportable railway way geometry for full actual ECRL mainline. The project is not covered by existing OSM/ORM assumptions alone.
2. Map station control points to their exact physical coordinates using independent supporting evidence, not locality centroids.
3. Resolve gaps or junctions only by data source review, NOT guessed straight-line bridges. Verify that relevant OSM sections distinguish existing, construction and proposed lines.
4. Compare physical distance and CH changes at each station, PL and chainage equation; retain residual log and Owner manual model review.
5. Treat Owner-reviewed model as **SIMULATION_ACCEPTED** only; independent authority and licensing still needed for **SURVEY_VERIFIED**.
6. Separate later work: automated encrypted Owner account sync, consumer route map rendering, route export, offline caching, credible timetable and live ETA.
7. No launch merge of this prototype without Owner acceptance and regression QA.

## Safe rollout
The interactive lab link is opt-in. Production remains unmodified; original Unified V8.1 GIS and mainline map/source files are unchanged except an opt-in link and builder file-copy list.
