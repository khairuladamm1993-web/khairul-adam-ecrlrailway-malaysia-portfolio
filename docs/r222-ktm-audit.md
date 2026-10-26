# MR-S10 P01 R2.22 — KTM Komuter isolated candidate

- **Base checkpoint**: `feature/mrs10-p01-r2175-r220-integration-qa` at `6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c`.
- Target branch: `feature/mrs10-r222-ktm-komuter-isolated`.
- Four services independently modelled; no modifications to existing four integrated routes.
- Operator schedules / maps support ordered stop list. Legacy code prefixes and equipment/station code claims are intentionally absent until KTMB confirmation.
- **CRITICAL:** Color hex values are evidence-aligned UI approximations, not verified operator-published exact hexadecimal brand values. Historical north colors may change.
- Station GIS layer 0 is a **secondary reference**, not the KTMB operational survey. Exact name + valid extent required. No fabricated physical alignments.
- User-facing schematic lineup line represents stop **order only**, never track geometry.
- Dedicated stand-alone `ktm-komuter-r222.html`: default all four service lists visible; a focus filter, light/dark and BM/EN/中文/ไทย UI labels; MapLibre point layer only if actual GIS features pass defensive matching.
- No integrated-preview modifications, no Vercel deployment, no production changes.
- Integration gates: live GIS query / operator GTFS attribution, verification of missing or duplicate station matches, independent Safari iPad UAT, full regression and controlled isolated preview.
- Komuter Selatan Paloh–JB Sentral is a separate post-2026 operator route requiring a future independent station audit. Skypark Link is temporarily closed per official KTMB 2025 T&C.