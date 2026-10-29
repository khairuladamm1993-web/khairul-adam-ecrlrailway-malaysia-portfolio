# P01 V8.1 — ECRL Candidate Recovery Checkpoint (29 Oct 2026)

Status: **NO-GO / ISOLATED QA ONLY**. No changes to Production or live Vercel configuration.

## Baseline and evidence
- Source baseline for QA: R1.5 HD/imagery `b4a09a3189bb4f2cae2daf2eb1b4ddef5136faa3`.
- QA branch: `test/mrs10-p01-v81-ecrl-ci-recovery-20261029`.
- Full integrated QA rerun: GitHub Actions [40825821997](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40825821997) — overall **FAIL**.
- Previous candidate failure: [40753414818](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40753414818) — V8.1 WebKit focus rendering went from 606 source-matched features to 0 rendered; wait timeout.
- QA branch corrected **test-only inventory drift**: verified adapter contains 37 assets and 25 reference points, including 1 yard reference; source registry IDs remained unique. No GIS positions, geometry, actual track alignment, application assets, or production source was modified.
- Current QA run: full legacy/ECRL unit suite, local build, **V8.1 browser regression PASS**, **V8 full map regression PASS**.
- Current QA run: **ECRL browser Chromium/WebKit FAIL**; examples observed: PL05 historical no-point panel omits visible literal `UNKNOWN` while engineering details are collapsed; in iPad scenario the legacy `LEGACY_PUBLIC_LOCALITY_REFERENCE` marker remains visible despite consumer summary boundary. Diagnose whether UI/provenance disclosure should change or tests must open details explicitly; do not mask by changing assertions alone.
- Vercel project `mrs10-p01-v81-ecrl-candidate`: latest staging deployment `dpl_2xmQsDVfQbzCig5db6LQL1G63aVC` is **BLOCKED** and `live=false`. No build events available for it. **Reason for blocking not independently established**, do not call it a compile error.
- Separate Vercel project `mrs10-p01-unified-v8-sg-geometry` has a R1.5 `READY` Preview at `dpl_7WuRzdqaRKA2HvCYTszYLw22aRfr`; READY is not Safari UAT PASS.

## Corrective sequence (not yet performed)
1. Inspect exact cause of the iPad legacy provenance label and PL05 unknown-label visibility against approved consumer design, preserving technical disclosure and correct source classification. Patch only isolated UI/QA scope; prove with exact before/after browser screenshot.
2. Rerun full Chromium/WebKit ECRL browser suite and V8/V8.1 regressions **at the exact same commit**; require all PASS.
3. Inspect Vercel project/deployment control and service limits separately; **do not unpause or alter candidate production alias without Owner approval**. If permitted, establish a fresh isolated Preview from the accepted commit only, confirm HTTP/assets/feature interactions and Safari iPad/iPhone Owner UAT.
4. Do not label candidate RELEASE READY until all browser and Preview gates plus Owner approval are recorded.

This checkpoint is a QA record, not a merge or a deployment authorization.
