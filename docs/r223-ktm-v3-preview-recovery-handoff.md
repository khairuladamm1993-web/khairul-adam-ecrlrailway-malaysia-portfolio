# KTM KOMUTER V3 — VERIFIED INTEGRATION HANDOFF

**Decision:** BLOCKED — CI verified, but non-production Vercel Preview remains unverified. Do not merge, promote, or treat Production READY as Preview PASS.
**Project:** khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio
**Branch:** feature/mrs10-p01-ktm-komuter-v2
**Historical CI-success SHA:** 85b15dcc7d9db197ec2ff2e7faefe2a3f4c8cae0
**Historical CI-success run:** https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40359740892
**Final HEAD and run:** Resolve from current GitHub branch/run before use; this handoff document is included in a newer CI-triggering commit.

## Audit evidence
- Full Node 367/367 PASS; KTM V2 8/8 PASS; inherited R2.22 6/6 PASS = 381/381 PASS on historical checked SHA. Reverify final HEAD workflow.
- Vercel project `prj_fkpyU8AaADaIeKJNDw6Rh6078Uub`, isolated `mrs10-p01-ktm-komuter-v2-isolated`, `live:false`; no linked Git project, production branch, or custom environment reported by accessible API.
- Old deployment `dpl_1GMrVd2T266KUjwqHaXyFWTVbQ7T`: `READY`, **target=production**, obsolete SHA `6d4ddb10efe279f84c4a2b26b65026c5ca8f23995`.
- Vercel Authentication enabled for Preview only; old production-target deployment does not inherit this protection.
- REST `create_deployment` with `target=preview` returned HTTP 400: API schema allows production, staging, or custom environment identifier. A prior omitted target generated a Production deployment. No non-production custom environment is configured; no valid non-production staging target proven.
- Vercel docs distinguish standard Preview from custom staging targets. Until CLI `--target=preview` can be used on a correctly linked isolated KTM project, **do not retry omitted REST target or send staging without configuration**.
- No new Vercel deployment attempted in V3 and no deployment ID or safe Preview URL can be claimed.

## Isolated public artifact / provenance
- GitHub Actions takes the three allowlisted files only: `ktm-komuter-v2.html` as `index.html`; `assets/mrs10-r223-ktm-service.js`; `assets/mrs10-r223-ktm-catalogue.json`.
- Strict allowlist excludes owner/member assets. `PROVENANCE.json` binds exact GitHub push SHA and per-file SHA-256; `SHA256SUMS` independently checks all three; upload-artifact action is pinned at `ea165f8d65b6e75b540449e92b4886f43607fa02`.
- Artifact is **UNDEPLOYED**; a GitHub Actions artifact is not a Vercel Preview and cannot be used as deployment proof.
- Before manual deployment compare the on-disk SHA-256 to `PROVENANCE.json`/`SHA256SUMS`; after deployment verify Vercel project ID, target=preview, protection, deployment state and source SHA.

## KTM GIS and visual integrity
- Six service records: Batu Caves–Pulau Sebang (27); Tanjung Malim–Port Klang (34); Padang Besar–Butterworth (13); Butterworth–Ipoh (13); Paloh–JB Sentral (7); Kempas Baru–Pasir Gudang (2) = **96 station-service memberships**, not unique physical station count.
- Official timetable https://www.ktmb.com.my/TrainTime.html advertises Klang Valley 2026 (Apr/Jul), Komuter Utara effective July 24, and Southern Shuttle August 8. National KTMB GTFS https://developer.data.gov.my/realtime-api/gtfs-static.en is CC BY 4.0, refreshed daily, but current feed has not been imported/audited.
- Candidate secondary station points https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/0 cover a limited extent; north/south positions require separate sources; route topology not approved.
- Railway geographic polylines, unknown coordinates and station codes are not fabricated. Colors are approximate UI palette, Southern colors provisional; `lineup` is a schematic station-order diagram.
- Automated static/test-double assertions cover marker token parity, shared station handling, focus/reset, popup, four UI languages, light/dark, min 44px controls, fail-closed GIS and existing four-line guard. **Actual mobile Safari/real GIS rendering not independently UAT-verified**.

## Integration file manifest (KTM-only, no cross-project mutation)
- `ktm-komuter-v2.html`
- `assets/mrs10-r223-ktm-service.js`
- `assets/mrs10-r223-ktm-catalogue.json`
- `tests/r223-ktm-komuter-v2.test.cjs`
- `tests/r222-ktm-komuter.test.cjs` (inherited)
- `.github/workflows/r223-ktm-komuter-v2-ci.yml`
- `docs/r223-ktm-v2-qa-handoff.md`
- `docs/r223-ktm-v3-preview-recovery-handoff.md`
- **Integration patch proposal only**: import KTM module into shared map shell after separate coordinator review. No edits to main, integrated branch, Kajang/Kelana/Ampang/Putrajaya, other transit branches, Supabase or Production.

## Gates
| Gate | Status |
|---|---|
| A GitHub CI | PASS on verified prior SHA; recheck final HEAD |
| B KTM visual automated QA | PASS (static and test-double only) |
| C Railway source evidence | PARTIAL (GTFS and southern/Utara station-level QA pending) |
| D Public artifact security | PASS in Actions static checks; live deployment not checked |
| E Vercel non-Production target | BLOCKED |
| F New deployment READY | BLOCKED |
| G Exact SHA artifact provenance | VERIFY generated CI SHA256 after final HEAD run; deployment link BLOCKED |
| H Safari Owner UAT | PENDING |
| I Integration readiness | BLOCKED |

**Smallest Owner action (only if a safe non-production deployment is required now):** Use the authenticated Vercel CLI linked specifically to project `prj_fkpyU8AaADaIeKJNDw6Rh6078Uub`, verify project/team via `vercel project inspect`, and deploy the downloaded, SHA256-validated GitHub Actions **public-only** artifact with `vercel deploy --target=preview` (never `--prod`); then provide the resulting deployment ID/URL for a read-only safety and UAT audit. Do not provide tokens, OTPs or credentials.
