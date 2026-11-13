# MR-S10 P01 — Railway Discovery R0

Status: source candidate implemented; hosted UAT and full regressions not yet verified.

## Purpose
Make existing R3 Economic Intelligence records searchable by railway enthusiasts, students, industrial operators and researchers while preserving the map-first MR-S10 ecosystem.

## Baseline and preservation
- Based on existing candidate/openmr-r3-economic-intelligence-20261103 at 00bb93b990ad7f8fce928f300a43da2973615d89.
- No change to production branch, live deployment, aliases, Auth/RLS, P02/P03/P04, or physical rail geometry.
- Public candidate page: discovery/index.html.
- Uses read-only existing data/openmr-r3/intelligence.json (14 facilities, 6 documentary relationships, 11 sectors).
- Does not invent train timetables, freight capacity, real-time tracking, yard permissions, precise coordinates or operational connections.

## Delivered capability
- Responsive Malay railway discovery page (iPad/iPhone), search by keyword, category filters and per-entry source details.
- User-facing categories: terminal/kawasan, hubungan rangkaian and bidang industri.
- Links to existing railway map and knowledge library. The map and library source files are unchanged.
- Source provenance and outstanding verification displayed per entry, while keeping the user experience product-focused.
- Basic metadata for future search engine discovery; public indexing or rankings are not claimed.

## Tests / release gates
1. Syntax and static data checks must pass; node --test tests/discovery-r0.test.cjs covers interactive search, result count and source links.
2. Compare candidate against the latest accepted P01 source: this historic 3 November branch must not overwrite more recent P01 checkpoints.
3. Run full P01 regression, protected Preview and real Safari iPad/iPhone UAT.
4. Only after Owner approval decide whether to integrate navigation, sitemap, canonical domain and public release.

## Product vision
MR-S10 makes railway, freight, industrial and economic information understandable and connected; it does not exist primarily to narrate how a website was coded.
Content may expand to research publications, private/university resources and international networks only with source permission, correct attribution, and reviewable evidence.

## Actual change scope
- ADD discovery/index.html
- ADD tests/discovery-r0.test.cjs
- ADD docs/P01-RAILWAY-DISCOVERY-R0-20261114.md
- NO deployment or production mutation
