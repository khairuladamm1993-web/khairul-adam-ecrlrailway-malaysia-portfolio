# MR-S10 R2.6 — Four-Language Site and Railway Map Localization

## Scope and goal

Owner request: one language choice on MR-S10 consistently governs the site, reading materials, owned map controls, popups and searches, with **BM, English, 简体中文, ภาษาไทย**. Users should be able to read the map when exploring China and Thailand.

## Current R2.6 Phase A foundation (development branch only)

- Added fourth language selector (Thai / ไทย) to Welcome, Gateway and Portfolio.
- Single persisted key `railway-language` is shared with Chapter 01; chapter deep links may override and then persist the new choice.
- Translated Thai educational Chapter 01 content, headings, reference disclaimers, learning outcomes, concept descriptions, review questions and answers. Original citations remain; original BM/EN/Chinese preserved.
- New Thai website dictionary, merged non-destructively into existing BM/EN/Chinese translations.
- New `map-locale.js` translates **map-owned interface** BM/EN/Chinese/Thai: search, category filters, map focus, captions, warnings and basic metadata without altering canonical coordinates.
- When Map is mounted, switching language retains Leaflet viewport and markers; never reinitialize map solely because of localization.
- R2.6 QA: 225/225 Node PASS, 14/14 Catalogue PASS, production and public artifact builders PASS.
- Translation coverage audit: 117 out of 341 current shared interface string keys have a Thai translation. Untouched keys safely fall back to English. **This is NOT 100% Thai site coverage.** Complete source-authored content requires separate reviewed translations.
- All ECRL place names, reference coordinates, confidence classifications and Member/Admin access policies remain unaltered.

## Unsolved: language of underlying map tiles

The existing Leaflet map uses raster tiles:
- `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- `https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png`

Text on raster images is pre-rendered and cannot follow a website locale switch. Chinese and Thai place names visible on those map images will remain in their source language, even when the website is set to English or Malay. The UI now displays an honest explanation in the selected locale.

**R2.6 Phase B — target for a genuinely multilingual map:**
1. In an isolated prototype, evaluate a legally usable and sustainable OSM-based *vector-tile* map renderer/style with `name:en`, `name:ms`, `name:zh`, `name:th` when the data supports them.
2. Use label fallback: user-selected field → English/international name → original local name; never translate proper names speculatively. Show bilingual label or transliteration when appropriate.
3. Preserve OpenRailwayMap railway layer, attribution, current ECRL canonical vs reference confidence, coordinate integrity, popup and search.
4. Verify reading, panning, zooming and memory/performance on Safari iPhone and iPad; test Mainland China and Thailand labels and source-data gaps. Only advance after explicit acceptance.
5. Translate remaining website/portfolio/owner/reading string keys; editorial and domain language review required.
6. Keep public-safe source metadata, no geospatial fabrication, no automatic production release or auth/RLS changes.

## Status labels
- PHASE_A_DEV_QA_PASS
- FOUR_LANG_FULL_SITE_UAT_PENDING
- RASTER_LABEL_LOCALIZATION_BLOCKED_UNTIL_VECTOR_PROTOTYPE
- PRODUCTION_NO_CHANGE

R2.5 Verified Two-Way Workflow continues unaffected. R2.4 same-domain MR-S10 Owner Dashboard remains the planned integration target; Swift simulator remains a separate product.
