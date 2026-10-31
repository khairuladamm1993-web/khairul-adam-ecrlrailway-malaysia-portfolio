# MR-S10 Foundation — branding and multilingual review R1

Date: 2026-11-01 Asia/Kuala_Lumpur. Scope: preparation and isolated proposal only.
Base: R2.3 remote HEAD 0756ef2ff7f48c3fddcf7a4761af1f3b6b92564f. Branch: review/mrs10-p01-brand-locale-r1-20261101.
R2.3 source/worktree preserved. No existing UI, Auth, RLS, gateway, repository identifiers, P02/P03/P04 source, billing or Production changes.

## Audit findings by locale

| Locale | Observed issue and source | Proposed copy / correction | State |
|---|---|---|---|
| BM | 64/341 gateway dictionary keys have no ms value; Thai-only entries can render blank when neither ms nor en exists (assets/i18n.js text fallback) | Fill every required locale; English fallback must use the canonical key when no en value exists | OPEN in existing UI |
| BM | “Selamat datang ke perjalanan pembelajaran kereta api saya.” is literal (assets/ui-translations.js) | “Ikuti perjalanan pembelajaran rel saya.” | PROPOSED |
| BM | “Layakkan diri untuk memandu.” implies a qualification from study content | “Kenali sistem. Fahami prosedur. Asah kemahiran.” | PROPOSED |
| English | “E-BOOK TRAIN OPERATION” unnatural noun order; “PRACTICAL QUALIFICATION” sounds certified (assets/ui-translations.js) | “Train operations library”; “Practical learning” | PROPOSED |
| English | “Earn the drive.” / qualification claims blur training boundaries | “Explore railway systems. Practise procedures. Build your skills.” | PROPOSED |
| 简体中文 | 64/341 gateway dictionary keys lack zh; “列车操纵电子学习” is awkward | “列车运行学习资料” for train operations learning resources | PROPOSED |
| 简体中文 | “争取驾驶资格。” implies certified qualification | “了解系统，熟悉流程，提升技能。” | PROPOSED |
| ไทย | 224/341 gateway dictionary keys lack th; member-gateway.js lang() maps th to ms and renderAuth offers only ms/en/zh | Add real th selection and localize dynamic auth strings after the R2.3 gate | OPEN in existing UI |
| ไทย | Map PL uses “จุดผ่าน” (generic passing point), not a clear railway passing loop | “ทางหลีก (PL)” after railway terminology review | PROPOSED |
| All | auth-private-r2.html and auth-private-r2.js have hardcoded BM, mixed English terms and raw error codes | Localize titles, labels, status, loading, error mapping, QR alt text and migration confirmation; retain machine codes only in sanitized technical diagnostics | OPEN; R2.3 untouched |
| All | member-gateway.js dynamically inserts English that is not consistently routed through translations | Render through a common dictionary; keep role validation on backend | OPEN |
| All | public-gateway.js says full material opens after Magic Link; deployed E2E/real identity mapping still pending | “Member sign-in is being tested. Public content remains open.” / BM: “Log masuk Member masih diuji. Kandungan awam boleh terus dilihat.” | PROPOSED; login omitted from review |
| All | Gateway displays historical “OWNER ACCESS PROTECTED” banner | Replace with accurate build-scoped status; never infer backend authorization from banner | OPEN |

Counts: reproducible VM merge of translations.js, ui-translations.js, identity-translations.js, translations-th.js. 341 unique shared gateway keys: ms missing 64, zh missing 64, th missing 224. English uses canonical source keys, so missing English fallback keys = 0. These are dictionary counts, not full-site coverage or human translation scores. Full key lists: artifacts/brand-locale/dictionary-audit.json. Separate map, article and D102 dictionaries are outside that numeric denominator. Raw auth strings are outside it too. No claim of whole-site localization PASS.

## Product status and naming gate

| ID | Exact Owner proposed display name | Publication state | Evidence stage | Evidence limit |
|---|---|---|---|---|
| P01 | MR-S10 Train Portfolio | IN DEVELOPMENT | TESTED, partial scope | R2.3 synthetic backend/form CI checkpoint; real Owner and physical Safari remain NOT RUN; this branding review adds only proposal QA |
| P02 | MR-S10 Web OpenTrain Simulation | IN DEVELOPMENT | IMPLEMENTED, prior reported work | Existing candidate referenced in supplied history; no fresh P02 source/QA audit in this task |
| P03 | MR-S10 App OpenTrain Simulation | IN DEVELOPMENT | IMPLEMENTED, prior reported work | Swift recovery files referenced in supplied history; full device build/runtime not verified here |
| P04 | MR-S10 App Portfolio | IN DEVELOPMENT | IDEA | No implementation evidence supplied or inspected |

All names PENDING OWNER FINAL APPROVAL. No whole product is labelled VERIFIED. IDEA = concept; IMPLEMENTED = code exists; TESTED = named tests ran for a stated scope; VERIFIED = specified acceptance independently evidenced. Product publication state is separate from engineering evidence stage. Internal P01–P04 identifiers remain unchanged.

English wording suggestion for later approval only: “Web Train Simulator” / “Train Simulator App” reads more naturally than “Web/App OpenTrain Simulation”. Keep the four exact names in review until Owner decides. Do not silently rename.

## OpenTrain preliminary conflict screen

- OpenTrain AI uses OpenTrain for a live technology marketplace: https://www.opentrain.ai/about/ and https://www.opentrain.ai/terms-of-service/ .
- OpenTrain.Systems uses the term for a training platform: https://opentrain.systems/ .
- USPTO historical official gazettes contain OPENTRAIN entries: https://www.uspto.gov/web/trademarks/tmog/20040323_OG.pdf and https://www.uspto.gov/web/trademarks/tmog/20140513_OG.pdf . Historical entries do not establish current rights/status or territorial clearance.
- Status: POTENTIAL NAMING CONFLICT / NOT CLEARED. No current MyIPO, WIPO or relevant national registry clearance completed. No legal conclusion, exclusivity or registration claim made. Owner approval alone is not trademark clearance. Keep OpenTrain in the protected proposal preview until a proper clearance decision.

## Proposed glossary — pending Owner and railway language review

Brand spelling MR-S10 and proposed product names remain unchanged in all locales. Locale identifiers: ms / en / zh (BCP-47 zh-Hans) / th. “Track” below means generic physical track; use 股道 specifically for a numbered station track. “Hold” here is a UI action, not an unverified railway operational command. Preserve CH/STN/PL, route IDs, original official station names and source provenance; no translated geographic coordinates or signalling authority.

| Key | BM | English | 简体中文 | ไทย |
|---|---|---|---|---|
| development | Dalam pembangunan | In development | 开发中 | อยู่ระหว่างพัฒนา |
| pending | Nama cadangan · Menunggu kelulusan Owner | Proposed name · Awaiting Owner approval | 候选名称 · 待 Owner 批准 | ชื่อที่เสนอ · รอ Owner อนุมัติ |
| menu | Menu | Menu | 菜单 | เมนู |
| journey | Perjalanan kami | Our journey | 我们的历程 | เส้นทางของเรา |
| web | Simulasi tren di web | Web train simulation | 网页版列车模拟 | จำลองรถไฟบนเว็บ |
| native | Aplikasi simulasi tren | Train simulation app | 列车模拟应用 | แอปจำลองรถไฟ |
| portfolio | Portfolio rel | Railway portfolio | 铁路作品集 | พอร์ตโฟลิโอด้านรถไฟ |
| station | Stesen | Station | 车站 | สถานี |
| track | Landasan | Track | 轨道 | ทางรถไฟ |
| loop | Gelung persilangan | Passing loop | 会让线（PL） | ทางหลีก (PL) |
| chainage | Rantaian (CH) | Chainage (CH) | 里程（CH） | ระยะทางตามแนวเส้นทาง (CH) |
| provenance | Sumber dan rekod asal | Source and provenance | 来源与记录 | แหล่งที่มาและประวัติข้อมูล |
| unknown | Belum diketahui | Unknown | 未知 | ยังไม่ทราบ |
| confirm | Sahkan | Confirm | 确认 | ยืนยัน |
| hold | Tangguh | Hold | 暂停 | พักไว้ |
| resume | Sambung semula | Resume | 继续 | ดำเนินการต่อ |
| login | Log masuk | Sign in | 登录 | เข้าสู่ระบบ |
| logout | Log keluar | Sign out | 退出登录 | ออกจากระบบ |
| loading | Sedang memuatkan… | Loading… | 加载中… | กำลังโหลด… |
| error | Tidak dapat dimuatkan. Cuba lagi. | Could not load. Please try again. | 加载失败，请重试。 | โหลดไม่สำเร็จ โปรดลองอีกครั้ง |
| otp | Kod tidak sah atau sudah tamat tempoh. Minta kod baharu. | This code is invalid or has expired. Request a new code. | 验证码无效或已过期，请获取新验证码。 | รหัสไม่ถูกต้องหรือหมดอายุแล้ว โปรดขอรหัสใหม่ |
| access | Akses ini memerlukan akaun yang dibenarkan. | An authorized account is required for this access. | 此内容仅限获授权的账号访问。 | เนื้อหานี้ต้องใช้บัญชีที่ได้รับสิทธิ์เข้าถึง |

## QA scope and acceptance

Executed locally: 5/5 contract tests PASS via node --test tests/brand-locale-review.test.cjs. Browser cloud: four locale buttons render correct headings and html lang; Light theme toggle PASS; desktop width 1363 / content width 1348, no page overflow; zero login controls. No iOS device implied.

CI suite added: tests/brand-locale-review-browser.mjs (Chromium + WebKit × three viewports × four languages = 24 cases; each checks two themes, text/page overflow, four section navigation links, no login controls and page errors). Workflow uses standard public Ubuntu runner, no credentials, no cache, no artifact uploads, no paid features. CI result to be recorded after execution. Screenshots are created on runner only.

Existing full-site language/fallback quality: FAIL/PARTIAL due observed defects. New proposal complete locale contract: PASS locally. Real Public/Member/Owner authorization is not retested by this static review; carry forward R2.3 scope with account Owner/Safari NOT RUN. A static page with no private runtime is not proof of backend access control.

## Owner approval required before main UI implementation

1. Final four display names; whether to retain OpenTrain after conflict clearance.
2. Public minimum descriptions (proposal shown in brand-review/data.js); no current public copy approval inferred.
3. Four-language glossary and natural copy; native speaker review for Chinese/Thai and railway terminology.
4. Apply approved copy to gateway/auth/map only after R2.3 critical checkpoint is safe. Any later Production publication remains a separate approval.

Preview has only proposed minimum descriptions and UI sample text. No actual product login links, Owner assignments, backend credentials, imports or private data are shipped. Protection must remain enabled. Release remains NO-GO for main P01 until persistent backend/deployed login, Owner account and physical Safari acceptance pass.
