# MR-S10 + Asia Railway Explorer — Controlled integration contract

Base: `migration/full-portfolio` at `2fe65b618c257efc6a3af6c9f4739240f87689b2`.
Feature branch: `feature/map-asia-integration-safe`.
Explorer source: `feature/railway-first-v0.2`, approved QA3 commit `fa9dc751033b7472beee4cb17499793be766399b`.

## Stage 1: inactive adapter
- `assets/asia-railway-adapter.js` and `tests/asia-railway-adapter.test.cjs` are NEW. Nothing loads the adapter on any page.
- Original `assets/map-gateway.js`, `assets/map-intelligence.js`, `assets/corridor-reference.js`, `assets/owner-map.js`, `assets/owner-map-v01b.js`, gateway, access, Member data and Supabase configuration are untouched.
- The adapter accepts only explicitly supplied, independently sourced geometry; strips unapproved metadata, rejects missing URLs/IDs, de-duplicates by source ID and limits to 900 features.
- Uses a SEPARATE Leaflet map instance; no shared Corridor data, no geolocation, no network calls, no analytics, no privileged APIs, no persistent storage.

## Required next gates before UI activation
1. Verify current production/public build boundaries, Member backend authorization and Owner Editor regression suite.
2. Find or prepare licensed, verified railway geometries for a small Malaysia reference region; data completeness is not presumed. Do not fabricate ECRL route lines.
3. Implement isolated lazy mounting behind an optional MAP view; preserve existing ECRL interface and all access states.
4. Run end-to-end public/member/admin data leakage checks, cross-device Safari UAT, canonical and alias isolation, and rollback verification.
5. Only if all gates pass, propose isolated Preview; do NOT merge or deploy automatically without showing evidence and confirming agreed conditions.

Current state: Integration scaffold only, not visible in existing site.
