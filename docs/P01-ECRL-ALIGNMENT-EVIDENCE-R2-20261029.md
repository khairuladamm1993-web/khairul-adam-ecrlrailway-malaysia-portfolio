# MR-S10 P01 — ECRL Alignment, PL01–PL07 & Freight Spur Evidence R2
**Checkpoint:** 29 Oct 2026 · **Scope:** isolated P01 GIS candidate, never Production / P02 / P03 / PWA

## Executive decision
- **GO** source-backed *infrastructure evidence register*, 7 PL CH records, 7 schematic freight interfaces, source and geometry verification gates, and visual QA.
- **NO-GO** claiming an accurately mapped mainline, PL turnout, freight transit lane, loading bay, railway-end coordinates, train map-match, live remaining distance, or railway operation from current public materials.
- No generated LineStrings, proximity-based auto-snap, synthetic turnouts, or disclosure of Owner/Admin private coordinate history.
- Preserve Owner-accepted Consumer Visual Baseline R1 and the Kuantan/Kemaman/Kerteh point references.

## Direct evidence hierarchy and interpretation
1. MRL public ECRL alignment brochure (May 2023): corridor and branch *schematic*. Not a survey/as-built shapefile. https://www.mrl.com.my/wp-content/uploads/2023/05/ECRL-Alignment-1552023.pdf
2. PLANMalaysia PeGTaECRL Vol I chapter 5 table 5.79: explicitly lists **MRL spurline projects** Kerteh, Kemaman, Kuantan Port, Temerloh and Port Klang north/west; distinguishes additional *studied proposals* Tok Bali, Kuala Terengganu, Tanjung Agas and Pulau Carey. Not as-built railway geometry. https://myplan.planmalaysia.gov.my/admin/uploads_publication/pdf_20250117162247_10.pdf
3. PLANMalaysia geospatial metadata (2025): REL2 rail lines can be represented as SHP/TAB under state GDM2000 Cassini; a metadata field schema does NOT make ECRL surveyed geometry available. Reprojection to EPSG:4326 requires documented CRS and datum transformation. https://myplan.planmalaysia.gov.my/admin/uploads_publication/pdf_20250417162849_13.pdf
4. Operator sources: Kuantan Port 9 Feb 2026 reports KP1/KP2 programme; EPIC/Kemaman 25 Mar 2026 reports port expansion and spur. Project notices do not fix End Lane or loading-bay coordinates.
5. OSM Kerteh way 537934577 is a *railway land-use reference*, not a verified ECRL rail centreline. Road/residential parcel and operational-safety audit remains open.
6. The Owner-accepted 23 CH reference records (16 stations, 7 historical PLs) are **not** surveyed geospatial control points; PL04/PL05 older layout evidence does not prove 2026 GPS position. PL07 remains labelled historical C1; do not automatically move to C2.
7. Supabase Owner location confidence classes distinguish personal field-validated, public reference and pending; none of PL01–PL07 was survey-grade at last read-only audit. Private coordinates remain behind authenticated gateway.

## Implemented architecture
- `assets/unified-ecrl/alignment-evidence-r2.js` — immutable seven PL / seven freight interface evidence register, provenance URL catalogue, and geometry promotion gate.
- Evidence gate requires line geometry with valid WGS84 bounds, authoritative as-built provenance and revision, independent engineering review, validated datum, railway land-use and road/residential parcel clearance, Owner approval, and asset identity.
- **Even when all programmatic inputs pass**, its result is `REVIEW_CANDIDATE_ONLY`, never `readyForPublicMap:true` (no fully automated publication).
- Consumer map: additional collapsed `Jajaran dan sisihan · status bukti` section beside historical PL CH; no new public pins.
- WebKit popup: stable top-positioned ECRL overlay to prevent `#details-toggle` and MapLibre attribution from intercepting engineering disclosure on Safari/WebKit. Main railway route and map source remain unchanged.

## Assets / uncertainty tracker
| Item | Owner project reference | Physical geometry | Current gate |
|---|---|---|---|
| PL01–PL07 | CH from Owner manifest | None independently verified | LIST_ONLY |
| Kerteh / PETRONAS | MRL spur scheme + OSM railway land-use | No turnout/End Lane survey | SCHEMATIC |
| Kemaman Port | MRL/PLANMalaysia + EPIC operator | No verified loading or transit track | SCHEMATIC |
| Kuantan Port KP1 / KP2 | MRL/PLANMalaysia + KPC operator | Separate terminal concepts, no as-built end | SCHEMATIC |
| Temerloh KTMB interface | PLANMalaysia scheme | No verified railway interchange turnout | SCHEMATIC |
| Northport / Westports | MRL/PeGTa + Section D scheme | No verified Section D port yard end | SCHEMATIC |

## Engineering acceptance still blocked pending independent data
Acquire (preferably officially from MRL/CCC/operator with lawful release rights):
- survey/as-built mainline centreline, WGS84 or declared EPSG/GDM2000, coordinates with accuracy, version/revision and chainage datum;
- each PL turnout and loop track layout with CH, source drawing and surveyed geospatial reference;
- Kerteh/PETRONAS, Kemaman Port and Kuantan KP1/KP2 rail terminal plans, loading/unloading points, transit sidings, clearances and right-of-way boundaries;
- roads, residential boundaries, industrial hazards, land parcels and verified sidings for safety/suitability spatial overlay;
- Section C2 and D revised scheme alignment with provenance; no reuse of obsolete C1 PL07 location.

Only after authorised source data + safety gates + Independent QA + Owner Safari UAT can a candidate be considered for future public physical-track geometry. This R2 release is NOT an operations map or route-distance/ETA provider.

## Validation
- Verify 7 PL + 7 spur evidence entries; 0 as-built lines; 0 exact PL public pins; 0 verified End Lanes; no personal coordinates bundled.
- Run deterministic node tests and real Chromium/WebKit Desktop/iPad/iPhone QA, especially tappable engineering disclosure.
- GitHub/Vercel Preview only; Production untouched. Record pass/fail from actual workflow, not from unit assumptions.
