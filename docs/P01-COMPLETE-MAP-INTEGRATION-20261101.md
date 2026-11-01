# P01 complete unified map integration — 1 November 2026

Branch: `integration/mrs10-p01-complete-map-20261101`, isolated from latest RC report HEAD `126e979`. No main merge, Production deployment, Supabase/schema/RLS/Auth configuration change, paid service, cloud project or P02/P03/P04 modification.

## Source and Auth delta audit

The original map code `6cbc439` and its 26 browser scenarios were preserved as a checkpoint, not restarted. Later accepted Auth work was found on `fix/mrs10-p01-simple-login-r26-20261101`, report HEAD `7ba3479`, accepted runtime `4681dc3732e83691eaf9323f5bc872f70adff1be`. The accepted access.js, member-gateway.js, gateway.css, Auth builder and server/private gate remain byte-identical; `data/unified-complete/accepted-auth-lock.json` and the regression test enforce their hashes. Copied proof-recovery tests remain exact accepted versions.

Accepted R2.6 real-backend/browser CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41287593378 — 395 unit/package and 28 real synthetic-backend/browser cases PASS, retained rather than rerun because Auth/RLS/private code is unchanged. This is not a fresh hosted Owner login or physical Safari claim.

The new map's Gateway navigation uses the current canonical allowlisted Auth origin. Its own gateway entry redirects there; it does not offer an older login on an unregistered new map host. The canonical gateway and existing immutable map deployment are not reassigned. R2 private calibration continues behind its existing backend/MFA gates; this work cannot activate the absent private backend or expose stored Owner coordinates.

## Selected implementation

One MapLibre instance, one catalogue/filter/search/legend/lineup system and the existing compact popup/no-coordinate panel. Reused sources:

- Existing 33 Malaysia/Singapore route definitions, accepted category colors, all original station identities/paths and Sentosa/Changi source-node geometry.
- KTM recovery decoder from branch `feature/mrs10-p01-ktm-v3-safari-credentials-render-recovery` (`3ecb3f2`); its six-service catalogue exactly matches the pinned V7 registry. Official station membership validation, fail-closed duplicate handling, credentials-omit public transport and the late-data/style route-focus fix are retained.
- Thailand V3 model `0762632`/`dae5460`: six selected source corridors, 54 unique catalogue stations, 13 unique sourced point references, 41 unresolved locations. Corridor order is not a complete train stopping pattern. All actual line geometry remains unavailable because service-to-way mapping is unverified.
- Borneo V2 source registry: Sabah's 15 operator-catalogued stations and Main/Gorge section directions; three Sarawak ART partial source catalogues. ART is trackless, not conventional rail. ART line colors remain explicitly UI_PROVISIONAL; station coordinates are null. Kuching is a regional locator, never a station/depot pin. Rembus depot/OCC is a name-only source reference.
- Shuttle Timur V2: the existing public 40-stop audit table was reused, not downloaded/recomputed. Original and effective source coordinates and citations remain available for audit. Thirty acceptable source-reference points are displayed; nine APPROXIMATE and SG MENGKUANG BARU SUSPECTED_MISMATCH are deliberately excluded from markers while all 40 lineup records remain. No physical track is created.
- China: five exact source-verified code records, with English/Hanzi/pinyin and leading-zero codes intact; LRVTC Guantang campus remains an educational campus-area point. No source gives an approved route color, complete station order or geometry for the two coded lines. Those fields remain DATA GAP; three station-code records are not falsely assigned to either line.

Pulau Sebang's existing Komuter identity is linked explicitly to pinned official ETS stop `25100`, named `PULAU SEBANG/TAMPIN`, using the exact already-saved point. This is a shared physical stop-reference crosswalk, not fabricated Komuter GTFS trip membership or interpolated coordinates. Source dataset bytes are unchanged. Secondary ArcGIS points link to their actual ArcGIS source rather than being attributed to GTFS.

## ECRL delta and interaction rules

- ECRL master and four reference kinds start ON every fresh load and reload. Stored OFF preferences cannot override initialization. Malaysia is the initial category, including all sourced Malaysian networks, Sabah and the Kuching regional reference; initial bounds include visible service points and ECRL references.
- Reference types retain accepted colors and labels. No ECRL physical mainline, PL/depot GPS or freight endpoint is fabricated. Source track geometry and logical/SCHEMATIC connections stay distinct.
- Accepted identity mapping is explicit: immutable asset `ecrl-stn-10` represents accepted STN11 Kuantan Port City. STN10 has no accepted station record, so no renumbering or fake extra station is performed. STN01–09/STN11–17, PL01–07, CH and depot identities remain intact.
- GNU search now resolves the accepted Gombak North EMU depot alias. Its CH519+750, five accepted schematic layouts, three freight-path identities and UNKNOWN endpoints remain in the same popup/catalogue navigation.
- Focus captures prior visible layers/filters. Station, source-track and no-GPS popups restore that state on close, including ECRL. Search does not first replace the saved Malaysia visibility with All.
- Compact horizontal category controls and a collapsed ECRL source-options disclosure keep the map visible; the default ECRL master remains directly accessible. Lineups and popups scroll. Fullscreen transitions are serialized; unsupported native fullscreen uses the existing map container at viewport size. Pan/zoom and four themes/languages are checked in real browsers.
- Shared search preserves Thai/Hanzi and accent-insensitive pinyin without altering the identity normalizer used by GIS matching. The Padang Besar relationship uses the documented Malaysian shared building, not the distinct nearby Thai station or the planned Kolok–Rantau Panjang link.

## QA checkpoints (final receipt follows)

First combined run https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41300270005: 376 baseline + 144 source/artifact assertions PASS. All 44 route rows reached PASS in all six scenarios; three global scenarios failed at fullscreen/pan. Those failures remain in history.

Fullscreen/native-touch correction run https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41300937368: source/artifact and all six Chromium/WebKit desktop/iPad/iPhone jobs SUCCESS. This validated 44 × 6 route interactions plus real mobile touch track/marker taps. Follow-up source/layout/search deltas receive their own final run; the unrelated 376 baseline tests are retained instead of repeated.

Local affected checks: 11 new unit assertions PASS; existing affected source suites PASS; local Chromium iPhone sample includes source-line taps, multilingual search, explicit MY/TH interchange, ECRL default/reload, fullscreen and pan. These are distinguished from CI, hosted checks and physical Owner UAT. No PASS is inferred from deployment READY.

Known source limits are data availability, not coordinates to guess: no surveyed railway geometry/anchors, incomplete Thailand points, partial ART roster/GPS, ten excluded Shuttle pins, China route order/colors/geometry, and absent R2 private backend. Physical Owner iPhone/iPad Safari acceptance remains pending.
