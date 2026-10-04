# Responsive compatibility checkpoint — 4 October 2026

Previous saved checkpoint: `a83fd8ac56e237d3e953c15c86e07b282c48eb4a` on `migration/full-portfolio`. The restored workspace initially contained f272c26; a fast-forward recovered the approved identity/theme/reference changes from GitHub. No previous responsive fixes were present or reverted. Main remains `abc97fd6d79b3df5f7b640f342f37d11f873313a`.

## 1. Automated validation

35 Node/JSDOM/SQLite tests pass, including original analytics, unchanged 10 × 16 quiz banks, routing, BM/EN/Chinese and Pinyin persistence, theme persistence, and new Escape-menu focus regression. The test suite is not a browser-engine or physical-device test.

## 2. Actual preview-browser viewport validation

Available engine: cloud Chrome/Chromium. The same-origin iframe review fixture renders each page at a real CSS viewport width/height; it does not emulate hardware, operating systems, browser chrome, a notch, touch gestures or Safari.

| CSS viewport | Class | Four pages / three languages / two themes |
|---|---|---|
| 320 × 568 | Small phone | PASS |
| 390 × 844 | Phone | PASS |
| 430 × 932 | Large phone | PASS |
| 768 × 1024 | Portrait tablet | PASS |
| 1024 × 768 | Landscape tablet | PASS |
| 1024 × 1366 | Large portrait tablet | PASS |
| 1366 × 1024 | Large landscape tablet | PASS |
| 1366 × 768 | Laptop | PASS |
| 1440 × 900 | Desktop | PASS |

216 loaded-page combinations were checked: Welcome, Gateway, Portfolio, References × nine viewports × BM, EN, Chinese/Pinyin ON × dark/light. Each check waited for the theme control to render, then verified expected language/theme, no body horizontal overflow and absence of the analytics script. Preliminary measurements of unloaded frames were discarded. Classic scrollbars consumed 15 CSS pixels on scrolling pages; those narrower content widths also fitted.

Additional checks:
- Chinese/Pinyin long-text bounds on all four pages at nine sizes: no measured horizontal overflow.
- Nine quiz dialog rectangles fit within their viewport; 320px dialog scrolls vertically rather than clipping. Its content width equalled its scroll width. The 1024 × 1366 iframe pointer click could not be reliably dispatched by the automation surface; Enter opened the dialog successfully. This is a tooling/input limitation, not a physical touch pass.
- Answering a question moves focus to the Next action. Escape opens the existing discard confirmation; accepting closes the quiz and returns focus to Start Quiz.
- Expanded 320px portfolio navigation pushes main content below itself; it does not overlay the main content. Menu Enter activation works.
- Found and fixed: Escape did not dismiss the expanded portfolio menu. Added a small key handler to close it and return focus to Menu. No layout redesign or CSS overrides were needed.
- Existing safe-area zero fallbacks, svh sizing, scrollable dialogs, prefixed backdrop blur, visible focus rules and native button/link semantics retained. No hover-only essential action introduced.
- Welcome card remains 20% with 3px blur; original JPEG, framing CSS, quiz logic and production analytics code are unchanged.

## 3. Physical-device/browser status

All of the following are **not physically tested — compatibility checked through standards/responsive preview only**:
- iPad / Safari, including Adam's iPad Air 13-inch / iPadOS 26.7.1
- iPhone / Safari
- Android phone and tablet / Chrome
- Windows laptop / Chrome and Microsoft Edge
- macOS / Safari and Chrome

No Safari-specific, Android-specific or Windows-specific defect was established. Chromium viewport results are useful coverage for Chrome/Edge layouts but are not a claim of testing those OS/browser combinations.

## Preview isolation and reproducibility

`python3 scripts/build-preview.py /absolute/output/path` copies only the public page/assets allowlist plus a preview-only review fixture. It removes analytics script tags, replaces the preview analytics asset with a no-op, adds `connect-src 'none'` and noindex headers. It does not copy Worker/D1 code, credentials, logs or private configuration. Production source analytics remains intact. The preview fixture is not linked from the visitor UI.

## Remaining physical review

Mobile/tablet/desktop viewport checks PASS within the above Chromium scope. Final cross-browser physical acceptance remains pending. Adam should review photo framing/readability, touch scrolling, safe-area/browser-bar expansion, orientation, split-screen, 200% text scaling, native dialog focus/keyboard, and menu/quiz controls on actual devices. Temporary preview hosting can expire.
