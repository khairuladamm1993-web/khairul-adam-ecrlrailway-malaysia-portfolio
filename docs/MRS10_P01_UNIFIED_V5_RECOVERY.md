# MR-S10 P01 — Unified V5 visual recovery & integration gate
Baseline V4 SHA: 4ec4fa8f7b9060d2badb765eea8b50c7bd64a8ce.
V5 branch: feature/mrs10-p01-unified-v5-visual-gate.
V5 entry: unified-map-v5.html. V4 files, source branches, production main and Supabase are unmodified.

## Actual recovery root cause
Earlier MapLibre 6 ESM build: worker failed, style never became fully loaded, map layers absent, 0 rendered features despite 118 (then 120) GIS records matched. Proven by GitHub Actions 40403452625. Classic MapLibre 5.12.0 bundle and load/style.load/idle retry fixed the worker and layer installation. Chromium proof at 40404596537: four layers/120 rendered and 120/120 matched on desktop and mobile viewport. Owner Safari remains separate.

## V5 stronger invariants
- One actual MapLibre Map instance. No iframes or app redirects as substitute for service integration.
- Distinct source IDs per route: mrs10-v5-source-<routeId>; distinct circle layer IDs: mrs10-v5-<routeId>.
- Root operator-registry identities preserved: MRT Kajang 29/#087D43; LRT Kelana Jaya 37/#D50032; LRT Ampang 18/#A65100; MRT Putrajaya 36/#FBCD20.
- Public third-party GIS POINT sources from ArcGIS SELANGOR_RAILWAY_MAP FeatureServer layers 6,3,1,8. Source coordinates never edited; two exact ID/name/code source corrections for Kajang are preserved from V4.
- Canonical interchange relations remain typed, no de-duplication of separate service IDs by name/proximity alone; popup can switch between matched services.
- No physical alignment claimed; no LineString authored.
- Unmatched GIS is source failure, not imagined railway position.
- UI status must not claim visual readiness without WebGL, loaded tiles, style, 4 route sources/layers and actual rendered features.
- Browser acceptance explicitly validates per-route rendered features, pixel screenshot, raster/vector tile HTTP evidence, filter visibility, language, theme layer recovery, popup, layout, WebGL.
- Browser/Chromium QA success is not Owner iPad Safari success.

## Module imports
Sri Petaling, Monorail, ERL, KTM, Thailand, Sabah, Sarawak and ECRL remain **isolated** until exact current module SHA, GIS provenance, Node, browser and Owner Safari gates and source branch handoff pass. Never copy a complete module-owned branch onto the integrated shell.

## Deployment safety
Public-only build, non-Production target only. Reuse existing isolated Vercel project with omitted API target (Vercel resolves this as Preview), confirm returned target=null with alias=[], no promotion, no custom domains. If actual target=production, stop release. No Production MR-S10 changes. Rollback: revert the V5-only branch or point Owner back to already verified V4 SHA above. Do not delete source module branches.
