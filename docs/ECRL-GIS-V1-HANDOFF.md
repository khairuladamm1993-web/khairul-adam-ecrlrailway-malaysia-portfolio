# MR-S10 P01 ECRL GIS V1 — Evidence-Based Handoff

## Source and baseline

- Baseline Unified V7: `c64aa0b19b68aeafbaeb03e568e5cd07e7e4790f`; no shared file modifications.
- `main` inspection: `3a2f3b958d6090acdbc5e080b61e46aa8b5415f3` as of 2026-10-27.
- `assets/corridor-reference.js` describes its own legacy coordinates as *public reference positions*, not official railway survey.
- MRL 2023 alignment: https://www.mrl.com.my/wp-content/uploads/2023/05/ECRL-Alignment-1552023.pdf (schematic, not GIS).
- October 2025 proposed freight yard: https://www.mrl.com.my/wp-content/uploads/2025/12/Plan-Profile.pdf (proposed, not operating).
- Selangor C2 scheme: https://dewan.selangor.gov.my/question/projek-landasan-keretapi-pantai-timur-ecrl-5/
- Selangor station identity: https://dewan.selangor.gov.my/question/projek-ecrl-2/
- MIDA project speed: https://www.mida.gov.my/ecrl-overview/

## Reconciliation and gates

- 20 ECRL station identities: A=6, B=8, C1=2, C2=4. Current `assetStatus` values are intentionally NOT_OPERATIONAL for public reference as of the source snapshot.
- 16 legacy *locality reference* points for A–C1; they are not surveyed station/track geospatial features.
- C2 four stations: **no verified station-track coordinates**. UI offers C2 asset list without misleading markers.
- 7 historical MR-S10 `PL` labels remain separate, `PENDING_VALIDATION` with no marker. **0 verified crossing loops**.
- `PL07 Alang Sedayu` remains historical C1 record, NOT copied into C2.
- Puncak Alam Freight Yard is **proposed** in October 2025 railway-scheme material; remains an unplotted information asset.
- Jalan Kastam (Port Klang) is the official port-interchange station identity. Northport/Westports interfaces are document-level schematic connections, NOT mapped geometry.
- C2 topology relation list is non-geometric adjacency metadata, NOT a claim of surveyed junction/turnout.
- ECRL 1,435 mm standard gauge given for scheme reference; track count remains unknown. MRL map's "double gauge" designation must not be equated to survey-verified three-rail dual gauge.
- Project-level 160 km/h passenger and 80 km/h freight are not approach/through/permitted station limits. Speed fields remain null; live TSR unavailable.
- Tunnel/bridge chains, portals and exact lengths remain data gaps, not fabricated geographic features.

## Integration contract

- Standalone route: `ecrl-gis-v1.html`.
- Data global: `window.MRS10ECRLGISV1`.
- Translation global: `window.MRS10ECRLI18N`, four languages BM / EN / 中文 / ไทย.
- QA diagnostic: `window.MRS10ECRLV1QA.getSnapshot()`.
- MapLibre geographic source: `mrs10-ecrl-v1-locality-reference-points`.
- MapLibre non-visible QA hit layer: `mrs10-ecrl-v1-reference-hitbox`.
- No physical track line layers. Future real track GeoJSON must use validated source IDs and its own layer, not this reference source.
- CSS markers: station circle + central dot; crossing loop style is square + central circle, optional dashed pending style. Pending loops are NOT plotted.
- `selectedId`, locale, theme and scope are local state, never communicated to Unified global.
- No Supabase, Authentication, or separate simulator dependencies.

## QA scope

GitHub source syntax/provenance validation is available. Real browser render tests, actual tile availability, iPad Safari Owner UAT and isolated Vercel deployment readiness are separate gates: never infer PASS from syntax or HTTP 200.

## Rollback

This is an additive isolated-branch module with zero edits to V6/V7, KTM, Thailand, Singapore, Borneo, Supabase or production. Roll back by ceasing Preview usage. Never merge into Unified automatically.
