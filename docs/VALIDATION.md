# Migration validation — 2026-10-03

Branch: `migration/full-portfolio`. Starting commit: `abc97fd6d79b3df5f7b640f342f37d11f873313a`. No main merge, GitHub Pages publish, Sites change, Worker deploy or D1 mutation was performed for this migration.

## Automated results

32 tests passed across five suites:

| Suite | Passed | Coverage |
|---|---:|---|
| Original analytics client | 3 | Original funnel, clicks, language/Pinyin, dimensions, durations, opt-out, cache restore |
| Original collector | 5 | Aggregate storage, payload validation, no identity/precise location, retention, missing-country fallback |
| Original Worker adapter | 4 | Exact CORS origin, methods/headers/read restrictions, original collector integration, SQL reads |
| Migration functionality | 16 | 10 × 16 questions, translations, Pinyin exclusions, question/answer randomization, five categories, ten cards, ten full quiz completions, PASS/latest result, incorrect-answer feedback, navigation, persistence, portfolio anchors, original photograph, analytics event shapes, DNT, local links, CSS contracts |
| Staged collector extension | 4 | Allowlist-only delta, new metric writes/reads using unchanged D1-compatible schema, unsafe bucket rejection, CORS, GPC, missing-country fallback |

`npm test` runs all five files. Some Node environments summarize each file as one subtest (5/5). Direct test execution or `node --test --test-isolation=none ...` lists the individual 32 tests. Dependencies are development-only; the published static frontend needs no npm runtime.

Tests use JSDOM, local resources, mocked fetch and in-memory SQLite implementing the D1 binding interface. They do **not** prove browser rendering or a new live Cloudflare deployment. No trial events were written into live D1.

## Routing and state

- Welcome Continue → `gateway.html`.
- All five categories render. Coming Soon has no replacement module.
- Each module has 16 distinct question records; correct-answer identity survives answer shuffling.
- One module: 16 questions. Two modules: 8 random questions from each bank. PASS 12/16. Quiz is optional.
- Full Portfolio → Home; Journey → Journey; Field → Experience; Simulator Lab → Lab.
- Local portfolio includes Home, Railway Journey, Field Experience, Simulator Lab, Activities, About, Contact and Resume / Certificates. No redirect or link returns visitors to the old Sites portfolio.
- BM default, EN, simplified Chinese; Pinyin off initially and shown only for Chinese. Language changes retain in-progress answers and feedback. Preferences persist across pages. Technical IDs/numbers are excluded from question Pinyin lines.
- All local HTML links, scripts, styles and section anchors resolve. Primary external references were researched/read; MRL's JavaScript-rendered page was not visually tested here.

## Responsive checks and remaining visual gate

| Target | CSS/structure verified | Actual visual/touch result |
|---|---|---|
| iPhone / narrow Android phone | Single column below 720px, wrapping controls, safe areas, scrollable modal | **Not run on device/browser** |
| iPad 13-inch portrait/landscape | Two-column modules, width breakpoints, svh shell, internal overflow | **Not run on device/browser** |
| Android tablet / split-screen | Width-based single/two-column fallback | **Not run on device/browser** |
| Desktop | Two-column grid, compact controls, original opening inline CSS preserved | **Not visually rendered here** |

The local preview server started, but the Work browser rejected `http://127.0.0.1:8765` with `net::ERR_BLOCKED_BY_CLIENT`. No supported preview connection was exposed. This is an environment limitation, not a visual pass. Horizontal-overflow, text-zoom, orientation and touch checks remain mandatory before merge. Short/narrow screens may scroll rather than clip ten module cards or enlarged Pinyin text.

## Analytics deployment boundary

- Existing endpoint and original metrics retained.
- A consumed fixed stage marker continues the new Welcome → Gateway → Portfolio funnel across documents without an identifier.
- New category/module/quiz buckets are capability-gated. The production collector does not currently allow them; premature submission would reject a batch.
- `analytics/migration/` contains the compatible allowlist extension, tested with the unchanged schema/CORS adapter but **not deployed**. Frontend remains `pending` until approval and subsequent live write/read validation.
- Resume views share About. A separate Resume bucket exists in the staged collector but is not activated in the client.
- No public dashboard or unauthenticated read API added; owner reads remain authenticated Cloudflare/D1 access.
- No GPS, precise location, browser location permission, identity fields or frontend secrets. Tests make location/permission APIs throw if accessed.

## Source review gate

See [SOURCES.md](SOURCES.md). One inherited electrical answer was corrected against supplied notes. GMC48 manufacturer/origin/model specifications remain unconfirmed; only general awareness is offered. ECRL platform lineage does not imply identical specifications. The separate trainee assessment form was not recovered; original scope questions retain their original attribution. Technical wording and translations require owner/instructor review before publication.

## Outcome

Ready for **branch review**, not merge/publication. Outstanding: responsive visual/touch review, owner content review, approved backend allowlist deployment and live new-metric write/read validation. Main and the old Sites version remain rollback references.

## Identity / theme / references checkpoint — 2026-10-04 (Malaysia)

34 automated tests pass (the original 32 plus preference-preserving theme navigation and public references coverage). Quiz banks, quiz logic, original photograph and analytics implementation remain unchanged.

Opening glass is now rgba(4,13,20,.20), blur 3px, smaller name, lighter existing overlay. Shared explicit light/dark palette defaults dark; preference persists locally. Language labels shrink from 13px to 11px, padding 9px to 3px/5px and gaps reduce; 44px touch areas are preserved, so the total tap area is intentionally not reduced 40%. Chinese Pinyin remains opt-in. Reference page has six organisations and the four requested equipment labels; it sends no analytics because no additional production route has been introduced.

Responsive CSS retains svh, safe areas, width breakpoints and phone scrolling. Device-specific Safari/iPadOS 26.7.1 rendering and glass readability over the actual photo still require visual review; DOM checks do not constitute a device pass. Production and main are unchanged. Preview packaging removes the analytics script and blocks outbound fetch using connect-src 'none'.

Live preview browser review: welcome photograph/glass, light gateway, and light portfolio inspected at the available desktop viewport. Theme persisted Welcome → Gateway → Portfolio → References. A legacy dark portfolio language-bar background was identified and corrected in theme.css. Actual iPad Safari is not available in this environment; portrait, split-screen and physical touch review remain pending. CHEC Malaysia, MRL, CARS and CRRC reference URLs returned HTTP 200; CRCC returned HTTP 403 to automated retrieval and remains unverified in a normal browser.
