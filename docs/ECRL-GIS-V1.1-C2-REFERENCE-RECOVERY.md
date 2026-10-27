# MR-S10 P01 ECRL GIS V1.1 — C2 reference map recovery

27 October 2026 · isolated ECRL-only branch · **NO MERGE, NO Production**

## Owner Safari report
C2 contained 8 assets: Gombak + Serendah Baru + Puncak Alam + Kapar + Jalan Kastam + proposed Puncak Alam Freight Yard + Northport + Westports. Only historical Gombak location had a map point. Other items said NO VALID POINT and tapping could not move map. V1 deliberately refused to invent survey positions, but the educational map needed a sourced, visibly distinct **reference-only location view**.

## Sources checked
- Archived developer/project 2017 EIA Phase 2 Chapter 1, Table 1-2:
  https://govdocs.sinarproject.org/documents/ministry-of-natural-resources-and-environment/eia-reports/east-coast-rail-link-phase-2-project/4-ecrl-phase-2-eia-chapter-1-3.pdf
  - Serendah: 3°21′51.93″N, 101°35′19.36″E.
  - Puncak Alam: 3°14′55.31″N, 101°24′42.42″E.
  - Kapar: 3°07′30.00″N, 101°23′39.86″E.
  - Jalan Kastam: 3°00′55.16″N, 101°24′11.85″E.
  - **Historical proposed 2017 station points**; station service/track role labels changed in newer planning. Do not use these coordinates as current surveyed station sites.
- Port Klang Authority *Marine Information Handbook* updated 27 September 2022:
  https://www.pka.gov.my/phocadownload/Publication/MARINE%20HANDBOOK%20LPK.pdf
  - Northport: 03°01′N, 101°22.0′E.
  - Westports: 02°57′N, 101°18.5′E.
  - **Maritime facility area grid references**, not confirmed ECRL rail freight terminals, rail junctions, sidings or turnout geometry.
- Department of Environment EIA public exhibition for Section D from Jalan Kastam to Northport/Westports opened 19 October 2026; NOT acceptance of surveyed completed railway geometry:
  https://edl.doe.gov.my/overview/59192

## Implemented safety
- All 4 C2 station objects retain `point:null`, `geometryType:NONE` and no surveyed station GIS. An independent `referencePoint` contains explicitly old EIA planning points.
- Northport/Westports retain `point:null` and have `referencePoint` at official Port Klang Authority maritime-area grid.
- Proposed Puncak Alam Freight Yard has **no** `point` or `referencePoint`; only `focusReferenceAssetId:'ecrl-stn-18'` as approximate area context. Panel warns that this is not yard site.
- 4 amber dashed circles = *historic EIA 2017 proposals*; 2 purple dashed circles = *maritime port-area reference*; 1 original blue Gombak station locality marker. All 7 can be selected and map pans to reference area.
- Reserved verified crossing loop icon remains **outer square + inner circle**. Zero loops meet geometry validation. No drawn LineStrings or station speed data.
- Four-language BM/EN/中文/ไทย legend, references, source links and warning detail. C2 auto-viewport includes Serendah and Westports.
- Independent styles and files; Unified V6/V7, original Production, Supabase and Railway Simulator remain unchanged.
- Previous Owner iPad Safari 5/5 PASS is V1 only. **V1.1 Owner Safari UAT is PENDING**.

## QA checklist
- Data validates WGS84 DMS conversions against 2017 EIA and 2022 maritime Handbook.
- C2 marker count 7; A–C2 22; 4 EIA and 2 port-area categories; no verified rail tracks or loops.
- C2 list tap: 4 stations + freight-yard proxy + both ports; map focus, warning provenance and selectable panel.
- Chromium and WebKit Desktop/iPad/iPhone; 4 locales, dark mode, marker hit-target 44 px.
- Isolated non-production Preview only; no Unified integration permission.
