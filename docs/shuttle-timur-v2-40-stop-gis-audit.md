# Shuttle Timur V2 — GTFS Trip 51 railway GIS audit (40 stops)

> **Isolated research / visitor map ONLY. NOT an engineering survey, train-movement authority or track-centerline certificate.**
> Baseline: `bdfef366f328c32e5af9f85940209b51ec11991b`. Changes are not merged to MR-S10 Integrated or Production.
> Source snapshot: 2026-10-26T22:40:45.226096+00:00; GTFS SHA-256 `9a8b431c73747b4397a05eed5006aab88f668370a64c2c45449db7d0f7983b3e`.

## Source and provenance

- Official GTFS: https://api.data.gov.my/gtfs-static/ktmb, CC BY 4.0. Trip `51` on route `SH`, timetable stop sequence validated against `trips.txt`, `stop_times.txt`, `stops.txt`.
- OSM railway geometry and named stations (ODbL 1.0) via https://overpass-api.de/api/interpreter; 418 railway ways, 81 named railway POIs; accessed 2026-10-26T22:40:45.226096+00:00.
- Nearest railway is measured to OSM polyline geometry. This is not a topology proof and missing OSM rails can inflate distances.
- All original GTFS coordinates immutable. Only sourced station replacements were emitted; candidate station nodes have OSM feature identities. Never draw fabricated straight tracks.

## Root cause

There are material mismatches between numerous official GTFS station marker coordinates and independently named, rail-adjacent OSM station POIs. This is a station-position data-quality problem; it is distinct from MapLibre symbol rendering. Some OSM alignments and station names may still be incomplete and need review. The 12 station position recoveries are **for visitor display**, not survey accuracy.

## Decisions

- Corrected coordinate count: **12 / 40**.
- Source-audit outcome: **PARTIAL_REVIEW_REQUIRED**.
- Counts: {"ACCEPTABLE_STATION_OFFSET":1,"APPROXIMATE":9,"SUSPECTED_MISMATCH":1,"UNRESOLVED":0,"VERIFIED":29}.
- Explicit outstanding issue: **SG MENGKUANG BARU** (Stop ID 80700), original roughly 5.4 km from mapped OSM way; no legitimate replacement established.
- APPROXIMATE means railway-way proximity or unverified named geometry and remains review-required even at small offsets.
- **VERIFIED means OSM named-station/rail-way reconciliation, not railway operator/engineering certification.**
- Effective offset is recalculated when a source-backed station point was substituted. Original offset is preserved separately.

## Full 40-stop audit

All coordinates are `latitude, longitude` WGS84. Distances are metres.

| Order | Station | GTFS Stop ID | GTFS original | Preview effective | Original railway offset (m) | Effective railway offset (m) | Decision | Confidence | Evidence |
|---:|---|---:|---|---|---:|---:|---|---|---|
| 1 | TUMPAT | 86300 | 6.198990, 102.167621 | 6.198990, 102.167621 | 22.2 | 22.2 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/182970715) |
| 2 | WAKAF BHARU | 85700 | 6.118313, 102.200519 | 6.118313, 102.200519 | 3 | 3 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/532504043) |
| 3 | BUNUT SUSU | 85500 | 6.096380, 102.176230 | 6.096380, 102.176230 | 5.4 | 5.4 | ACCEPTABLE_STATION_OFFSET | MEDIUM | [railway](https://www.openstreetmap.org/way/927043709) |
| 4 | PASIR MAS | 85100 | 6.042713, 102.142574 | 6.042713, 102.142574 | 15.1 | 15.1 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/953005701) |
| 5 | TO UBAN | 84600 | 5.982360, 102.116870 | 5.965805, 102.143948 | 2872.3 | 0 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/2630733974) + [railway](https://www.openstreetmap.org/way/1488097033) |
| 6 | BUKIT PANAU | 84200 | 5.891260, 102.157270 | 5.891260, 102.157270 | 4.7 | 4.7 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/423236143) |
| 7 | TANAH MERAH | 83700 | 5.806077, 102.146729 | 5.806077, 102.146729 | 3.4 | 3.4 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/423236141) |
| 8 | TEMANGAN | 83100 | 5.702410, 102.151650 | 5.702410, 102.151650 | 31.8 | 31.8 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/421586667) |
| 9 | KRAI | 82100 | 5.529884, 102.202808 | 5.529884, 102.202808 | 28.3 | 28.3 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/421642334) |
| 10 | PAHI | 81700 | 5.548470, 102.239770 | 5.471462, 102.222674 | 4453 | 0 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/2630745473) + [railway](https://www.openstreetmap.org/way/1003919073) |
| 11 | MANEK URAI | 81200 | 5.391030, 102.232630 | 5.391030, 102.232630 | 69.3 | 69.3 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/1003916320) |
| 12 | SG MENGKUANG BARU | 80700 | 5.389890, 102.146390 | 5.389890, 102.146390 | 5421.3 | 5421.3 | SUSPECTED_MISMATCH | LOW | [railway](https://www.openstreetmap.org/way/236081806) |
| 13 | ULU TEMIANG | 80500 | 5.307650, 102.156290 | 5.307650, 102.156290 | 13.9 | 13.9 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/236081808) |
| 14 | KG BARU BUKIT ABU | 80300 | 5.329830, 102.121400 | 5.329830, 102.121400 | 1 | 1 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/236081802) |
| 15 | BUKIT ABU | 80000 | 5.372670, 102.085130 | 5.372670, 102.085130 | 27.4 | 27.4 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/236081793) |
| 16 | KUALA GRIS | 79800 | 5.493790, 102.080470 | 5.390330, 102.064280 | N/A | 0.5 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/6997825867) + [railway](null) |
| 17 | DABONG | 79300 | 5.377071, 102.010175 | 5.377071, 102.010175 | 0.8 | 0.8 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/236081810) |
| 18 | KEMUBU | 78900 | 5.352710, 102.311750 | 5.300110, 102.020000 | N/A | 12.5 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/2630752129) + [railway](null) |
| 19 | SRI JAYA | 78700 | 5.307850, 102.009060 | 5.268240, 102.009520 | 1367 | 0.1 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/10971399485) + [railway](https://www.openstreetmap.org/way/235001288) |
| 20 | SRI MAHLIGAI | 78500 | 5.313320, 101.772860 | 5.248340, 102.009640 | N/A | 0.2 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/2630752130) + [railway](null) |
| 21 | SRI BINTANG | 78400 | 5.160115, 102.085970 | 5.230680, 102.010270 | 4551 | 0.4 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/11416821606) + [railway](https://www.openstreetmap.org/way/1501338581) |
| 22 | SUNGAI TASIN | 78300 | 5.195180, 102.013530 | 5.213380, 102.012480 | 3.8 | 0.1 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/2630752132) + [railway](https://www.openstreetmap.org/way/1501338589) |
| 23 | JEREK BARU | 78100 | 5.173900, 102.009930 | 5.173900, 102.009930 | 4.2 | 4.2 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/1501338587) |
| 24 | BERTAM | 77900 | 5.148000, 102.050660 | 5.151628, 102.043852 | 665.7 | 0 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/2630769252) + [railway](https://www.openstreetmap.org/way/207866039) |
| 25 | BERTAM BARU | 77800 | 5.142897, 102.045598 | 5.142897, 102.045598 | 23.5 | 23.5 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/1003909749) |
| 26 | LIMAU KASTURI | 77400 | 5.080190, 102.069360 | 5.080190, 102.069360 | 18.7 | 18.7 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/1501338579) |
| 27 | SUNGAI SIRIAN | 77200 | 5.033700, 102.049450 | 5.033700, 102.049450 | 38.2 | 38.2 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/1501338568) |
| 28 | KG. SIRIAN | 77000 | 5.025070, 102.039040 | 5.025070, 102.039040 | 30.4 | 30.4 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/320156135) |
| 29 | PAN MALAYAN | 76600 | 4.912990, 101.977000 | 4.912990, 101.977000 | 28.9 | 28.9 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/137929646) |
| 30 | GUA MUSANG | 76000 | 4.878941, 101.966634 | 4.878941, 101.966634 | 11.8 | 11.8 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/137929646) |
| 31 | MENTARA BARU | 75000 | 4.789340, 102.011790 | 4.789340, 102.011790 | 110.6 | 110.6 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/137929648) |
| 32 | MERAPOH | 74800 | 4.693140, 102.003280 | 4.693140, 102.003280 | 2 | 2 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/1003897904) |
| 33 | TELUK GUNUNG | 74500 | 4.635260, 101.992710 | 4.635260, 101.992710 | 120.5 | 120.5 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/1503304228) |
| 34 | SUNGAI TEMAU | 73500 | 4.497780, 101.947400 | 4.497780, 101.947400 | 341.4 | 341.4 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/1377368221) |
| 35 | CHEGAR PERAH | 73100 | 4.490590, 101.943790 | 4.490590, 101.943790 | 130.2 | 130.2 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/1271601408) |
| 36 | AUR GADING | 72700 | 4.440720, 101.954890 | 4.358383, 101.921569 | 1637.9 | 0 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/12756959534) + [railway](https://www.openstreetmap.org/way/1503304230) |
| 37 | KG BERKAM | 72400 | 4.201160, 102.051870 | 4.293460, 101.922100 | 1119.7 | 0.4 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/12753679163) + [railway](https://www.openstreetmap.org/way/1503304246) |
| 38 | BUKIT BETONG | 72200 | 4.399840, 101.923680 | 4.257810, 101.925270 | 165.3 | 0.2 | VERIFIED | HIGH | [OSM station](https://www.openstreetmap.org/node/12753679164) + [railway](https://www.openstreetmap.org/way/1503304232) |
| 39 | PADANG TUNGKU | 71800 | 4.233970, 101.988830 | 4.233970, 101.988830 | 54.1 | 54.1 | APPROXIMATE | LOW | [railway](https://www.openstreetmap.org/way/1003889483) |
| 40 | KUALA LIPIS | 71300 | 4.186634, 102.053791 | 4.186634, 102.053791 | 10.5 | 10.5 | VERIFIED | HIGH | [railway](https://www.openstreetmap.org/way/207409883) |

## Unresolved gates

1. `SUSPECTED_MISMATCH` and `APPROXIMATE` stations require additional railway operator / track centerline evidence.
2. No actual Safari/WebKit Owner visual acceptance is implied by GitHub CI.
3. Physical railway geometry remains null; never interpolate or use a station-to-station polyline as a track.
4. Integration decision remains **PARTIAL**, not GO, until the remaining GIS questions and Owner UAT are resolved.

## Reproduction

Run `python3 scripts/audit_shuttle_timur_v2_alignment.py --feed-zip <official-ktmb.zip> --output review.json` from the isolated branch.
Live GTFS and OSM are separately updateable datasets; results may differ on later snapshots.
