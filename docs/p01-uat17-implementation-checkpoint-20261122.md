# MR-S10 P01 · UAT 01–17 · Implementation checkpoint (2026-11-22)

## Scope and evidence
- Owner finished iPhone Safari UAT collection (17 records; not 17 distinct defects).
- Source branch: `candidate/p01-railway-discovery-r0-20261114`; isolated continuation: `candidate/p01-uat17-maintenance-preview-20261122`.
- Vercel project `prj_0VhBnAaagARpXZYHHTFPquxRf7xy`; 2026-11-19 latest observed READY deployment `dpl_8wYGntqcGEbWbAbQbXBCbUtpRM8r`. Deployment metadata lacks Git SHA. READY is not QA PASS.
- Earlier tested Preview `dpl_83X4Dtzn8FtgxhkwumkBoC8u6wAK` is distinct and older. Never treat the canonical alias as immutable SHA evidence.

## Implemented in isolated branch
- `public-maintenance-preview.html`: static responsive regional concept teaser; no authentication, redirect or routing changes; does not publish protected GIS data.
- The teaser is NOT an activated maintenance gate. The existing `gateway.html` and Supabase role validation remain unchanged.

## Source-backed diagnosis
- `gateway.html` hardcodes R2.5 + R2.6 label, regardless of deployment metadata.
- `assets/build-info.js` is a SOURCE placeholder with null Git SHA/deployment ID; build-time injection or authoritative deployment metadata is needed.
- `assets/map-gateway.js` explicitly states `No route line / no polyline`; therefore adding a validated ECRL corridor rendering is an engineering change, not just a CSS fix.
- `assets/corridor-reference.js` is public-safe approximate locality reference, not engineering/survey geometry. It contains 16 STN, 7 PL, 2 Depot rows (25 total), with Pending Validation and Public Reference confidence. Do not join these points as a purported exact rail alignment.
- `assets/owner-center-shortcut.js` hides its link unless `RailwayAccess.canAdmin === true` and authenticated. The destination must independently verify backend role.
- `vercel.json` has headers, not a maintenance rewrite/redirect. Do not deploy public maintenance routing until secure server-side Owner bypass and login flow are tested.

## Next isolated implementation gates
1. Reconcile the actual latest source branch/commit with deployed artifacts. Preserve existing map/Owner/auth functionality.
2. Implement a non-sensitive, explicitly labeled ECRL corridor visualization from a **validated line geometry source**. When unavailable, use a clearly labeled schematic only; never present straight connections between locality markers as rail geometry.
3. Add map brand stamp, safe-area fullscreen layout, non-overlapping legend/controls, refresh that checks current deployment/version and canonical data without logging out Owner.
4. Add Public/Member maintenance routing only after testing authenticated Owner bypass and direct URL protection; do not use client-only checks as authorization.
5. Verify 16 STN, 7 PL, 2 depots; no invented STN10; no accidental exposure of protected data.
6. Safari iPhone/iPad regression, auth and route QA; deploy Preview only after review. Production, P02/P03, Auth/RLS remain untouched.

## Current status
- Source file creation: IMPLEMENTED / VERIFIED BY READBACK.
- Maintenance activation: NOT IMPLEMENTED.
- ECRL line and mobile fixes: NOT IMPLEMENTED.
- Runtime tests, physical Safari UAT: NOT TESTED.
- Production: UNCHANGED.
