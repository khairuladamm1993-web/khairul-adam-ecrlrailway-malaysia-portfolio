# MR-S10 P01 — KL Monorail V2 isolated delivery
Base integration commit: `6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c` (read-only).
Branch: `feature/mrs10-p01-kl-monorail-v2`.
Files: `kl-monorail-v2.html`, `assets/mrs10-p01-kl-monorail-v2-registry.js`, `assets/mrs10-p01-kl-monorail-v2-viewer.js`, `tests/p01-kl-monorail-v2.test.cjs`, `.github/workflows/p01-kl-monorail-v2.yml`.

## Evidence and limits
- Ministry of Transport: 8.6 km, 11 stations, endpoints KL Sentral → Titiwangsa: https://www.mot.gov.my/en/land/infrastructure/current-rail-services
- Government open data Prasarana GTFS, CC BY 4.0: https://developer.data.gov.my/realtime-api/gtfs-static.en (direct feed verification not completed during authoring)
- MRT Corp integrated map (operator network/colour family): https://www.mymrt.com.my/projects/travel-with-mrt/
- Secondary station code cross-check MR1–MR11: https://www.mtrec.name.my/network/mrl.html
- OSM POI and legal attribution: https://www.openstreetmap.org/copyright
- The light-green hex values are ACCESSIBLE MR-S10 DESIGN TOKENS; NOT operator-certified hex.
- OSM query only reads physical station POIs tagged monorail=yes, railway=monorail or MR station ref; exact station name/ref and bounds are validated; ambiguous name matches are rejected. Public POI centre is not surveyed equipment or actual platform alignment.
- No downloaded GTFS shapes were inspected; route/guideway geometry, physical track way IDs and route relation topology remain UNVERIFIED. Therefore geographic line colouring is intentionally NOT implemented. Lineup line is strictly schematic. Missing OSM POIs are not fabricated.
- Interchange names describe passenger connections, not the same physical railway track. MR8 → Dang Wangi requires pedestrian transfer.
- Foreign-language controls are translated; station names remain verified source spellings, not invented Chinese/Thai names.

## Release conditions
- GitHub Actions branch-specific Node suite + pre-existing `npm test` + static packaging + source/no-auth checks.
- Actual iPhone/iPad Safari at 375px and 768px: capture normal, focus, popup with full name, long labels, dark/light, compact 11-stop lineup, user-facing source-outage fallback, zoom 11/13/16.
- GIS online match count and OSM attribution verified during browser UAT. At least one source-backed station must render before claiming GIS marker PASS. Complete 11/11 is not asserted.
- Production, `main`, integrated QA branch, Supabase and other service branches MUST stay unchanged.
- Integration owner must explicitly approve shared-shell/catalogue changes after branch QA. Never merge isolated viewer directly.
