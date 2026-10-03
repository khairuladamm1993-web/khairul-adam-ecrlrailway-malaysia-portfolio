# Khairul Adam Railway Portfolio — migration review

This branch is **migration/full-portfolio**. Main/GitHub Pages, the original Sites portfolio and the production Cloudflare Worker/D1 are unchanged by this draft. Do not merge or deploy until the owner approves after review.

## Preview locally

Use Node 22.13 or newer (the analytics tests use `node:sqlite`).

```sh
npm ci
npm test
npm run preview
```

Open `http://localhost:8765` in your own browser. Do not open the HTML using a file URL: language/storage behaviour should be reviewed over HTTP. Browser previews from a non-GitHub origin are intentionally rejected by the production analytics CORS policy. Tests mock the frontend transport and use in-memory SQLite for the D1-compatible collector; they do not send trial data into the live database.

## Flow

Welcome (`index.html`) → Learning & Operations Gateway (`gateway.html`) → local full portfolio (`portfolio.html`). The old Sites redirect is removed only on this migration branch.

- Five gateway categories and ten practical modules.
- Sixteen questions per module; one or two selected modules; sixteen questions per attempt; PASS 12/16, personal study only. Taking the quiz is optional.
- Full Portfolio → Home; Railway Journey → Journey; Field Experience → Experience; Simulator Lab → Lab. Module selection suggests Field Experience (inspection/machinery) or Simulator Lab (electric rolling-stock study); visitors can change the destination.
- BM default, English and Simplified Chinese; Pinyin initially off. Language, Pinyin and latest completed study result persist locally. Category/module/destination selection persists only in the tab session.
- Portfolio source and styling are migrated from the existing Sites project; Activities and Contact placeholders remain, with a new Resume / Certificates placeholder. No invented records.

## Review documents

- [Source register and limitations](docs/SOURCES.md)
- [Validation report](docs/VALIDATION.md)
- [Pending analytics extension](analytics/migration/README.md)

The original railway photograph is unchanged (SHA-256 `fabd30d5c79262f9b968a38a86b06afb483b3223206c4be32439fb975ffa433f`). Existing opening-screen inline design remains unchanged; additions are navigation and language/safe-area support.

## Analytics boundary

Existing production-compatible counters and Worker endpoint are preserved. Cross-page funnel continuation uses only a fixed next-stage flag. New category/module/quiz counters are implemented and tested but capability-gated until the owner approves deployment of the compatible backend allowlist. This branch does not deploy or recreate the Worker or D1 and contains no credentials. See the staged extension README before enabling it.
