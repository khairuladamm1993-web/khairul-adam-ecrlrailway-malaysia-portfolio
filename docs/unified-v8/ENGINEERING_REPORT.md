# MR-S10 P01 Unified V8 — Singapore & Railway Geometry

Scope: additive branch from V7 c64aa0b19b68aeafbaeb03e568e5cd07e7e4790f. Singapore source 81c8ef8af2b1d2354ad1ffd56c3e54f0ee7ca697 copied unchanged. No merges to main, V7, Thailand, Borneo, ECRL, P02/P03 or Shuttle Timur.

## Architecture
- Physical network: `data/unified-v8/physical-network.json`; raw source snapshot `osm-border-raw.json`. Shared ways deduplicated by OSM way ID; split at shared source node IDs. Crossings with distinct IDs never become junctions. No distance-based joins, station anchoring or interpolation.
- Service network: `service-network.json`; explicit 41 Singapore patterns plus the 16 inherited Malaysia service sequences. Every adjacency is unresolved against physical segments until a source-backed mapping exists.
- Station registry: `station-registry.json`; service associations, not unique physical stations. Original Singapore 273 station-code points + 4 supplementary border points preserved. 281 rendered Singapore route-point associations because some codes serve multiple route identities. Sentosa (4) and Changi Skytrain (3) have ordered unlocated stops.
- Evidence registry: `evidence-registry.json`; source URLs, hashes, source revisions and confidence constraints.

## Geometry result: PARTIAL
- OFFICIAL_VERIFIED: 0.
- OSM_TOPOLOGY_MATCHED: 75 subsegments from 56 railway ways in the JB–Woodlands source bounding box. OSM is secondary cartography, not an official survey. Full way coordinates may extend beyond the query box.
- SECONDARY_APPROXIMATE: 13 inherited Singapore polylines; hidden by default and available through a clearly labelled toggle. Unproven inherited gauge fields are not promoted.
- UNRESOLVED: complete Malaysia station-to-station geometry, most Singapore route geometry, every station-to-track anchor, mapping KTM tracks to individual services, official chainage, speeds, signalling and crossing-loop/turnout metadata.
- Exact OSM `ref=RTS` tags associate those source ways with the future RTS identity; this does not assert a complete operational path or a through-track link to TEL/KTM. Other OSM ways are neutral physical infrastructure with service membership unresolved.
- Track count, gauge, electrification, bridge/tunnel fields carry only source tags or null. They must not be used as certified operating values.

## UI
One MapLibre instance, 33 route source/layer identities, Singapore category, explicit direction/branch selector, station and track popups, theme and four-language controls. Pending point rings dashed; future rings distinct. No station is labelled a crossing loop without evidence. Physical geometry is independent of station/service layers; approximation toggle remains independent of language/theme/reset. Routes with no point geometry keep their accessible ordered text list.

## Verification
Local original suite: 367/367 PASS. Focused V6/V7/V8: 18/18 PASS. GitHub workflow runs actual Chromium and Playwright WebKit for desktop, iPad and iPhone viewports; it is not an Owner Safari acceptance result. Follow linked final CI for current results. First run found popup timing during map style load and was corrected.

## Deployment exception
The first upload to the new isolated V8 Vercel project was labelled production by the API despite a preview request. Immediate cancellation was rejected because it was already READY. Existing production projects/domains were not modified. Subsequent deployment uses API `target=staging` and is verified separately. Do not call the first deployment a Preview; do not promote or reassign existing aliases.

## Owner Safari UAT: pending
1. Open the final direct Preview on iPad Safari; basemap and Malaysia markers render.
2. Select Singapore, Shuttle Tebrau, both terminals; then RTS, both terminals and future status.
3. Select EWL airport branch and BPLRT direction patterns; order remains source-defined.
4. Click an OSM segment; verify source/confidence. Enable secondary geometry and inspect its distinct status.
5. BM → EN → 中文 → ไทย; Dark → Light; category switch; Reset. No marker/geometry loss.

## Remaining scope
National railway-way/relation extraction and topology matching, official surveyed alignment, full-network route geometry, station/track anchors, loop/turnout evidence and future-corridor official updates. Full-network geometry and exact completeness of partial source patterns are not PASS.
