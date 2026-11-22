# MR-S10 P01 — Signature Port Candidate Release Readiness R1

Date: 2026-11-22 (Malaysia) · Scope: P01 candidate only · Decision: **HOLD PREVIEW DEPLOYMENT**

## Immutable QA baseline

- Candidate branch: `candidate/p01-signature-port-layer-r1-20261122`
- Verified source SHA: `9bfd8108c30d1a4e3e535ca94be034a04a3252dd`
- GitHub Actions run: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/45002848357
- Jobs: `signature-unit-regression` SUCCESS; `signature-browser` SUCCESS.
- Unit regression: 42/42 PASS; V8 build: `V8_PUBLIC_ONLY_BUILD_READY`.
- Browser smoke: 6/6 PASS (Chromium and WebKit; desktop 1180×820, iPad 810×1080, iPhone 390×844). Final snapshots confirmed `mapReady`, `styleLoaded`, `webglReady`, ECRL layers present, and nonzero canvas dimensions.
- Browser QA artifact: `p01-signature-browser-qa` on run 45002848357; JSON report, **not** visual screenshots on PASS.
- Rollback reference for the last test-only commit: `481e483f432ac3a24028cda5eac303b339df7a88`. **Not** a deployment rollback receipt. Before any Preview deploy, capture existing deployment ID/alias and its exact source SHA.

## Scope and source preservation

- Northport and Westports are **maritime locality reference points**, not verified ECRL rail endpoints, spurs, turnouts, or freight connections.
- `assets/unified-ecrl/port-klang-references.js` cites Port Klang Authority Marine Handbook and stores reference grid positions. The underlying grid transcription and licensing must be independently checked before claiming survey-grade accuracy or approved reuse.
- `assets/unified-ecrl/signature-port-layer.js` emits two Point features, purple halo and center layers, and a click popup warning that these are not verified rail endpoints.
- Existing Kuantan Port, Kemaman Port and Kerteh source-backed references remain in the signature registry. No physical rail LineString is created.
- Preserve station lineup, PL01–PL07, depots, Auth/RLS and all GIS baseline gates. The 17 ECRL spans remain **UNVERIFIED**.

## Release gates

| Gate | Status | Evidence / outstanding action |
|---|---|---|
| Unit and regression tests | VERIFIED PASS | CI run 45002848357 |
| Public-only V8 build | VERIFIED PASS | CI run 45002848357 |
| Headless Chromium/WebKit map readiness | VERIFIED PASS | 6 final MapLibre snapshots |
| Northport/Westports marker visual comparison | NOT TESTED | No accepted screenshot or pixel-level visual review |
| Northport/Westports popup click and copy | NOT TESTED | Existing browser smoke does not click these markers |
| iPad/iPhone physical Safari | NOT TESTED | Headless WebKit is not physical Safari |
| External source coordinate and license audit | UNVERIFIED | Official handbook claim in source; independent evidence pending |
| Protected Preview source/deployment receipt | NOT TESTED | No Preview deployment authorized or executed |
| Owner UAT | 0 | No Owner acceptance |

## Before requesting Preview deployment approval

1. Extend isolated browser QA to check both Port Klang markers and popup text; capture screenshots and evidence of non-rail disclaimer.
2. Check marker position, legend, overlays and visual layout against Owner vision without replacing or connecting ECRL physical geometry.
3. Record exact candidate SHA, build receipt, existing Preview deployment ID and rollback target. Verify Vercel protection remains enabled.
4. Request **specific Owner approval** for protected Preview deployment and alias only after the above evidence is available. Never infer Production authorization.
5. After approved Preview deployment: verify served SHA, hosted smoke, Public/Member/Owner access as applicable, reload/logout, ECRL zoom/popup, and physical Safari Owner UAT.

**Governance:** No Production, Preview alias, Supabase, Auth/RLS, P02/P03 or physical GIS changes are authorized by this document. QA PASS does not equal Owner UAT PASS.
