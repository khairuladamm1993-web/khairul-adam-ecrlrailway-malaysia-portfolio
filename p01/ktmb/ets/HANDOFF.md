# KTM ETS V1 — ISOLATED FOUNDATION HANDOFF
Status: **FOUNDATION_ONLY · NOT_READY_FOR_INTEGRATION** (not an operational or customer-ready station map).

GitHub source: `khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio`.
Source baseline at branch creation: `6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c`.
Feature branch: `feature/mrs10-p01-ktmb-ets-v1-isolated`.

## Evidence
- OFFICIAL_OPERATOR_SCHEDULE: https://www.ktmb.com.my/TrainTime.html — KTMB ETS North–South schedule, 2026-06-01 effective listing; confirm live departures before publish
- OFFICIAL_GOV_GTFS: https://developer.data.gov.my/realtime-api/gtfs-static.en — KTMB GTFS feed documented as daily refreshed, CC BY 4.0; feed not yet imported

## Contracts
- Module identity: `mrs10-p01-ktmb-ets-v1`.
- Known operator family: KTMB; category: KTM ETS.
- 1 service identity records, **zero imported station stops**, zero coordinates, zero geography/track LineStrings.
- UI design colours are `PROVISIONAL_UI_TOKENS_NOT_OPERATOR_CERTIFIED`, never operator-certified hex.
- Colour for the station marker and service sequence must use the same token **after** station validation, but this foundation intentionally displays no station pin/line.
- User-facing standalone responsive card shows evidence status and source links; BM/EN/中文/ไทย and Light/Dark.
- Service source entries: ktmb-ets-north-south.
- No shared registry, map shell, KTM Komuter module, integrated branch, Production, Supabase, P02/P03 modified.

## Hard blockers before integration
1. Download and audit the latest official KTMB GTFS (routes/trips/stops/stop_times) and 2026 operator PDFs for exact ordered stops and variants; preserve source timestamp and licences.
2. Verify per-service station names/codes and interchange relationships without inventing endpoints or treating a timetable corridor as a train-stopping pattern.
3. Verify map POI coordinates and railway geometry independently, including sources, rights and topology; no synthetic geographic lines.
4. Implement standalone MapLibre station rendering and station-to-station lineup once verified. Match marker colours to route tokens; use large contrast halos and zoom visibility like Ampang.
5. Perform full regression plus exact feature branch CI, Preview security and protected non-Production deployment with exact SHA.
6. Real Safari iPad and iPhone UAT must be recorded before final approval. No merge to integrated branch or Production automatically.

## Service-specific cautions
- Do not infer individual train stop patterns from corridor termini.
- ETS Express/Platinum/Gold/Silver require operator/GTFS mapping before publication.

### Integration handoff
Status **MODULE_FOUNDATION_READY**, not **READY_FOR_INTEGRATED_REVIEW**. Integrated chat can use this branch only to design KTMB adapters and future data import; must not represent it as completed railway map.
