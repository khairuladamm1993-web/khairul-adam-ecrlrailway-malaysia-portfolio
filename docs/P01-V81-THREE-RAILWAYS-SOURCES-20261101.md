# P01 V8.1 three railway source decision record

Date: 1 November 2026, Asia/Kuala_Lumpur. Public learning/exploration data only; not operational authority or as-built verification.

## Continued checkpoint

Remote branches inspected once before implementation:
- V8.1 baseline: e7e10b7644dabd1cd7c42af0eba1cfec27689596.
- ECRL candidate: f7f29414e841446dad9e4349e3b4c91261754577.
- QA recovery and selected parent: 1f82bf8791d46fc37e549f1657618fbe54051706. CI 40830523661 failed; prior evidence identified Consumer provenance and PL05 disclosure failures.
- R2.3 remains a separate branch and is not merged into this map candidate. No authentication source or backend is modified.

## Singapore sources

- Official Sentosa FAQ: https://www.sentosa.com.sg/en/faqs confirms the four station names. Official route brochure: https://www.sentosa.com.sg/-/media/sentosa/hero-asset/promos/discovery-pass/fun-discovery-pass/brochure/2025/fun-pass-brochureoct2025_en.pdf .
- Official HarbourFront to VivoCity Level 3 pedestrian transfer: https://www.rwsentosa.com/en/about/getting-here . This is not a physical railway junction.
- Official Changi terminal transfer: https://www.changiairport.com/en/at-changi/transport-and-directions/transferring-between-terminals-jewel.html confirms T1/T2/T3 and separate public/transit areas; T4 uses shuttle buses. Jewel is not a station: https://nowboarding.changiairport.com/content/jca/en/faqs.html .
- Changi Airport Operational and Safety Requirements revision 34, effective 27 November 2025, PDF page 128, Attachment A21-1, guideway layout: https://www.changiairport.com/content/dam/changiairport/sg/corporate/evergreen/resources/forms-and-manuals/documents/aos-manual-rev-34-effective-27-november-2025.pdf . PDF SHA256 c71cf918fdf57cae0bcc88744d9172d1cdf29e039e1d9c62372eeb390e68b99f. Visually reviewed. Confirms relative terminal guideway layout; not digitized into operational coordinates.
- Physical vectors and marker nodes: original OSM map API, exact source URLs and revisions preserved in each source snapshot. ODbL attribution and source node IDs retained. No inferred intersections, interpolated tracks or arbitrary station coordinates.

Four Sentosa markers use OSM station nodes. Three Changi markers are TERMINAL REFERENCES using station C at T1, E at T2, B at T3; they do not enumerate all airport platforms. OSM has additional A/A South/D/F stops. Six public/transit terminal links describe bidirectional terminal connectivity, NOT validated platform-specific service patterns or permission to cross immigration. Every guideway segment retains accessArea UNKNOWN.

Overpass acquisition CI 41243602931 failed with HTTP406/429. The original OSM map API succeeded for both bounding boxes. A dataset named SkyTrain Routes (Green Transport FeatureServer/15) was rejected after properties proved Canada/Millennium/Expo lines in Vancouver. It is not used.

Source snapshots filter to monorail ways whose vertices lie entirely within the audited bounding boxes, plus station/stop nodes. Usernames/UIDs are omitted. The extraction script preserves IDs, versions, timestamps, tags and all way vertices. 18 Sentosa ways + 48 Changi ways become 79 source-node segments. Source-node station-to-track anchors are UNKNOWN; the map does not claim passenger path validation or as-built clearance.

## ECRL staged intelligence

Existing registry unchanged: 16 accepted main-corridor station codes, seven PL, 23 control points. Gombak North EMU Depot is distinct, outside the 23-point manifest, with no invented coordinate.

PL04, STN07, STN08, STN11 and GNU-EMU accepted layouts are shown as OWNER_ACCEPTED / SCHEMATIC. No new surveyed tracks, signals, turnouts, permitted speeds or layout dimensions are verified. Existing CH and official area/yard sources remain authoritative for their stated limited purposes.

Three logical spurs link STN11 → Kuantan Port, STN08 → Kemaman Port, STN07 → PETRONAS Kerteh Yard. Each has a separate end identity with null coordinate and UNKNOWN status. Port/yard area markers already exist; they are not reused as endpoint coordinates. The new end identities are accessible through source-driven popup links and search, not false GIS pins. KP1/KP2 pending interface records remain intact.

## Consumer recovery

Raw provenance previously relied on native details/CSS/inline visibility plus a 300ms touch suppression heuristic. A trailing map tap could target the inserted disclosure; cross-engine innerText also made collapsed content unreliable evidence. The replacement requires an intentional disclosure activation and keeps raw fields in an inert template while collapsed. Closing removes them from rendered DOM again. Technical source records remain available on demand. This is a consumer presentation boundary, NOT an authorization boundary for secrets.

PL05 explicitly presents UNKNOWN in the localized key-facts summary, before Engineering opens. Its accepted CH415+180 stays visible; no pin is generated.

## Scope and release constraints

The public map artifact excludes backend/API/Owner command assets. R2.3 account verification and Owner-private storage are not redeployed or altered. No new cloud project, paid service, merge, Production promotion, unblock of an older deployment, or P02/P03/P04 change.

Safari hardware UAT, airport platform service mapping, all exact ECRL PL/depot locations, three freight endpoint coordinates and physical ECRL spur vectors remain outstanding. No RELEASE READY claim is permitted from map CI alone.

Gombak North EMU Depot has the separately accepted project-reference CH519+750; it is not added to or counted twice in the 23-point station/PL corridor. Its geolocation stays UNKNOWN.
