# Master correction validation — 5 October 2026 (Malaysia)

Branch: migration/full-portfolio. Starting commit:
66e5806551527e97cdc67ddb6e56259685b7ba70.
Implementation checkpoint: 51df1cc19bd5810f1fdcca295e3cbade40a012bc.
This report is committed with the final modal-controls checkpoint.
Main remains abc97fd6d79b3df5f7b640f342f37d11f873313a. No main merge,
production Pages update, production Worker/D1 mutation or Sites change.

## Implemented

- First visit Light; saved Light/Dark preference wins. Toggle label states the action
  (Dark Mode while Light is active), retained beside BM/EN/Chinese. Theme color updated.
- Light-only elevation, low-contrast borders, heading contrast and active category
  treatment. Preserved photo/glass; no new background, crop or photo manipulation.
- NEWS, INSIGHTS & REFERENCES: three ordered sections. News source-directory/empty
  editorial state; five public-summary Insight dialogs; one References destination.
- Dialog close and native Escape, modal focus containment, opener focus restoration,
  scrollable content; language/Pinyin/theme controls inside dialog preserve its state.
- Public locked states for corridor, map, ebook, coming-soon, full quiz and rolling stock.
  Ten module titles only; no question payload is requested by the public gateway.
- Public/member/admin server contract in ACCESS-ARCHITECTURE.md. UI is PUBLIC/pending;
  no fake login, owner controls, credential form, role switch or frontend secret.
- Official project signature selectively in portfolio closing: English source text
  “Knowledge gained through railway cooperation. Capability developed in Malaysia.”
  plus exactly “By 阿当93”, with translated body sentence when applicable.

## Still pending, not represented as completed

Secure verified-email backend, private storage and member/admin interfaces; full
corridor dataset/grid, authenticated image/zoom, full member ebooks/insights and
rolling-stock records; member quiz history; private Coming Soon backlog; actual
admin engagement extensions (median/max/idle-aware activity). Existing anonymous
analytics is unchanged and its current visibility-based time is not relabelled as
new idle-aware engagement. No invented analytics numbers or certification claims.

Map is deliberately not public or included in preview. Required map-only signature
is 阿当93; **the artwork has not been edited or signature-validated in this pass**.
The generated Library map is not substituted for the user's original compilation.
See the private-source selection/storage gate in ACCESS-ARCHITECTURE.md.

The public source repository/history is not private storage. Excluding existing
quiz assets from the preview does not revoke historical public copies. Production
member rollout must use a public-only build plus authenticated private content.

## Automated validation — 40 / 40 PASS

Original analytics and Worker suites, migration collector tests and quiz regression
suite retained. New tests verify forged storage roles cannot unlock the PUBLIC UI,
no question-script load, ten title previews, three rows/five dialogs/single reference
link, complete new translations/Pinyin, first-visit Light and saved theme persistence,
dialog language/theme continuity and focus restoration, anonymous public events.

The legacy 10 × 16-question workflow runs through an explicit **test-only fixture**
in the test runner. No member-role bypass exists in deployed code. Tests use JSDOM,
mocked transport and in-memory SQLite; no real production event is sent.

## Preview browser — Chromium viewport tests

Sizes: 320×568, 390×844, 430×932, 768×1024, 1024×768,
1024×1366, 1366×1024, 1366×768, 1440×900.

- 108 Light combinations: 4 pages × 9 sizes × BM/EN/Chinese with Pinyin ON.
- 36 Dark combinations: 4 pages × 9 sizes × Chinese/Pinyin ON.
- 45 category checks: all 5 categories × 9 sizes, Chinese/Pinyin Light.
- 18 dialog-bound checks: Insights and pending-member dialog × 9 sizes.
- No measured horizontal page overflow or clipped modal bounds; card headings/buttons
  checked for horizontal overflow in all category cases. Long modal content scrolls.
- Real browser keyboard Escape closes Insights and returns focus to its opener.
  In-modal language/theme controls work. Default theme observed Light on clean origin.
- Screenshot review confirms calm Light panels, cyan active category and green action.
- Welcome → gateway navigation works. Legacy quiz browser interaction is intentionally
  unavailable publicly; quiz logic remains covered by automated fixture tests.

Mobile/tablet/desktop: PASS **within the above Chromium viewport scope only**.
No physical iPad/iPhone/Android/Windows/macOS browser was available. All are
“not physically tested — compatibility checked through standards/responsive preview only”.
Adam still needs iPad Safari touch, safe-area/browser bars, orientation/split screen,
text zoom, original-photo readability, glass contrast and long-dialog scroll review.
Authenticated full-map zoom cannot be tested until private delivery is implemented.

## Preview isolation

Temporary deployment: khairul-railway-master-preview.responsible-pedestrian.workers.dev
Deployed asset version: 23eebbda-d48e-4014-a074-eccf76d7a926.
Static assets only, no D1 bindings or auth backend. Existing build strips analytics
script, replaces analytics asset with no-op and sets CSP connect-src 'none'. Question
bank, quiz core and legacy member gateway are excluded from the artifact. No map,
private dataset or backend configuration is copied. Browser matrix found no analytics
script in any loaded page. Legacy photo/quiz/analytics bytes are unchanged from start.

Direct URL negative checks could not establish HTTP 404: the shell network returned
403 even for the working home page; browser direct JS navigation was blocked by its
client. Absence is verified in the actual static deployment artifact, not claimed as
an independently observed HTTP 404. Live public pages rendered normally in browser.
Temporary hosting may expire and require redeployment. No paid/persistent hosting
change was made.
