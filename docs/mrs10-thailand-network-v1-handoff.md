# MR-S10 P01 Thailand Railway Network V1

Isolated additive branch: feature/mrs10-p01-thailand-network-v1. Four-line integrated reference: 6ee8a4a14ffbe5567c54ec575cbb812bde6d8e4c. Do not touch current KTM integration, Production, Supabase, registry or shared map code.

Scope: 23 representative passenger railway corridor / urban service entries including Padang Besar. NOT all Thai stations, survey-accurate geometry, real-time train movements, track assets, signalling or timetable. Camera presets are NOT station coordinates.

Two border identities: th-my-padang is active interface to KTMB; trains usually require transfer. th-my-kolok has NO ACTIVE CROSS-BORDER RAIL service to Rantau Panjang. Planned reinstatement is not operating. Thai southern double tracking and MRT Orange/Purple southern extension not open; distinguish proposed/under construction.

Primary sources: SRT timetable https://ttsview.railway.co.th/timetable_modern.php ; Thai Department of Rail Transport https://www.drt.go.th/ ; MRTA route status https://www.mrta.co.th/en/bangkok-and-vicinities ; Malaysia RAC rail-reopening report https://rac.gov.my/ms/media/berita/thailand-cadang-buka-semula-laluan-rel-sungai-golok-rantau-panjang . Geography: OpenRailwayMap tiles and OSM Overpass dynamic visible-area POIs, NOT embedded synthetic track geometry.

Integration handoff contract: Import or link standalone thailand-railway-v1.html after mobile Safari verification and preview-only UAT, use country context Thailand, preserve ECRL and KTM namespaces and existing central integrated branch. Require operator verified full-station catalogue, geometry licensing, API tile and Overpass policy, fit/zoom usability, no data leakage and security test before any central merge. Zero direct central changes in this candidate.
