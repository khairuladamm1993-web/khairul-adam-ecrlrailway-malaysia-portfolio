# MR-S10 ECRL — Owner policy: ORM training only, MR-S10 map model independently rendered
29 October 2026 · Isolated P01 branch. No changes to P02, P03, PWA or Production.

## Binding design rule
OpenRailwayMap raster is a **temporary visual reference for the ECRL learning lab**, never a train movement geometry source or a mandatory runtime dependency of the future MR-S10 consumer map. Eventually, the consumer map renders a separate, QA-reviewed MR-S10 railway vector dataset with route topology, 23 CH anchors, PL01–PL07, stations, and track IDs. It must render and function **with all OpenRailwayMap tiles disabled**.

The project specification uses 1,435 mm standard gauge; ORM orange colour does **not** itself mean gauge 1,435 mm. Train pins cannot move along roads, fabricated station connectors, non-rail vector features, gauge-incompatible track or disconnected geometry. Crossings, bridges and tunnels require accurate rail vectors and appropriate attributes.

## Mandatory source origin and licence distinction
An edited or calibrated OSM railway geometry is not made proprietary or independent by renaming it, changing its style, incorporating manual CH checks or hiding ORM tiles. For OSM-derived geometry keep ODbL source lineage, contributor attribution and appropriate derivative database sharing obligations upon public use. Separately licensed official survey data must be tracked independently, with reuse rights checked before publication. Crediting OpenRailwayMap as an **inspiration/visual research reference** is appropriate, but does not replace mandatory OSM-derived-data credits.

Resources:
- https://www.openstreetmap.org/copyright
- https://osmfoundation.org/wiki/Attribution_Guidelines
- https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ
- https://www.openrailwaymap.org/

## Four distinct engineering stages
1. EXPLORE: ORM raster as temporary training overlay, no extraction of coordinates from pixels.
2. MODEL: import lawful railway GeoJSON with original way/feature IDs, `railway=*`, gauge evidence, gap status and CH anchor residuals; never auto-connect missing tracks.
3. OWNER MODEL UAT: review station CH, topology and simulated train movements; log history. `OWNER_SIMULATION_REVIEWED` != `AS_BUILT_SURVEY_VERIFIED`.
4. CONSUMER DATASET: separate MR-S10 vector with independently validated geometry, road/parcel/geospatial QA and permissions; no ORM runtime dependency.

## Current implementation versus outstanding work
IMPLEMENTED: CH-only train simulation, local browser autosave, vector import gate, OpenRailwayMap training overlay, gauge/road checks, provenance categorisation, exportable geometry-free calibration manifest.
NOT IMPLEMENTED: complete real ECRL 524-km centreline, surveyed PL locations, automated cloud Owner ledger or server-side sync, full consumer map geometry integration. The manifest does NOT include any private Owner review notes or raw geometry.
Future consumer publication is CLOSED pending true source permissions and independent engineering QA. Keep Production and P02/P03 frozen.
