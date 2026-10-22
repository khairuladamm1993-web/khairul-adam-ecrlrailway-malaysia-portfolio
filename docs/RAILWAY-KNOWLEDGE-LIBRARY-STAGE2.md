# MR-S10 Railway Knowledge Library — Stage 2 Technical Contract

Status: DRAFT FRAMEWORK. No Stage 3 model specification publication permitted.

## Source baseline and preservation
- Derived from Chapter 01 commit `7249a46d51ae1e47417756edb77795f0f8412afd`.
- Keep `reading/railway-fundamentals-01.html` unmodified; do not reclassify it as finalized.
- Catalogue entries with `status: "planned"` have **no clickable published chapter URL**.
- The sole `available` chapter is the existing Chapter 01.
- Source files are static public assets; never place Member/Admin records or tokens into catalogue JSON.

## Future chapter template (Stage 3 requires separate approval)
1. Chapter ID, type, revision, locale, publication status, reviewer and last reviewed date.
2. Learning objectives, scope and prominent non-official-ECRL disclaimer.
3. Description of function, subsystem map and accessibility-first original diagrams.
4. Claims table: claim ID, value, units, variant/configuration, evidence class, source ID and page/section, verification date.
5. Mechanical, electrical, hydraulic, pneumatic, braking and control concepts as applicable.
6. Railway safety and typical inspection/failure concepts, **not operational authorization or safety-critical maintenance instructions**.
7. Neutral image placeholder with descriptive ALT, licensing and rights status.
8. Original references with bibliographic details and working URLs; no copied copyrighted manual extracts.
9. BM / EN / 中文 glossary with checked pinyin where relevant.
10. Review questions, changes and technical sign-off state.

## Mandatory evidence labels
- **VERIFIED:** A claim supported for the *exact equipment variant and configuration* by authoritative traceable documentation. Record source/page/edition.
- **FIELD OBSERVATION:** Identifiable non-confidential observation; not a certified manufacturer or ECRL limit.
- **GENERAL ENGINEERING REFERENCE:** Valid generic engineering concept but **not** a verified specification of the named ECRL vehicle.
- **MANUAL REQUIRED:** Value/limit cannot be stated without authoritative model-specific evidence.

Never infer lubricant quantity, wheel diameter, maintenance intervals, brake wear limits, pressures, electrical ratings, speed limits or operating status. Distinguish designed speed and permission to operate.

## Photo Manager — NOT IMPLEMENTED
Owner Photo Manager requires a separately approved Supabase migration and RLS/storage policies. No upload interface, admin-only capability or hidden write method is authorized in Stage 2. Public image placeholders may be replaced only through a future rights-checked workflow.

## Public navigation and scope
- `reading/index.html` loads `reading/library-catalogue.json` on demand.
- The existing Gateway is unchanged to avoid changing Public/Member/Admin access paths before the larger regression suite.
- Library is not published to Production or deployed. Stage 2 is a source-only feature branch.
- Themes may follow system preference or user selection in-page without writing browser storage.
- Catalogue titles are working English entries; translation and technical review remain Stage 3 work.

## Suggested safety and release gate
Run `node --test tests/reading-library-framework.test.cjs`, `npm test`, the isolated production/preview artifact checks, and full responsive Safari UAT before any integration/deployment. Restore via feature-branch revert only. A GitHub source commit by itself is **not** proof of public deployment.
