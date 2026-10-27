# MR-S10 P01 V7 Live Source Gate — read-only public GTFS-RT pilot

Created from immutable V7 HEAD `c64aa0b19b68aeafbaeb03e568e5cd07e7e4790f`, on separate branch `feature/mrs10-p01-live-speed-source-gate-isolated`. No changes to `main`, Production, V6/V7 source, Supabase, Authentication/RLS, or Shuttle Timuran calibration.

## Verified source availability

Official documented API: https://api.data.gov.my/gtfs-realtime/vehicle-position/ktmb ; public documentation: https://developer.data.gov.my/realtime-api/gtfs-realtime.en ; schedule feed: https://api.data.gov.my/gtfs-static/ktmb. Provider documents approximately 30-second update and 4 requests/min rate-limit (https://developer.data.gov.my/rate-limit). The feed is **GTFS-Realtime protobuf**. Official field `Position.speed` is **optional** and is in metres/second, NOT a speed limit: https://gtfs.org/documentation/realtime/reference/.

The public API as documented currently offers vehicle positions, *not* a TSR feed, signal aspects, route speed tables, actual authority to proceed, or infrastructure approach/through speeds. ECRL also has no verified public live rail speed/TSR feed. This pilot never derives speed limits from observed vehicle speed or guessed geometry.

## Implementation

- `api/ktmb-public-telemetry.mjs`: zero-dependency, bounded and source-locked GTFS-RT decoder; returns **counts only**, not individual vehicle locations/IDs/track details. Cache 90 seconds to respect the API quota; feed older than 180 seconds is STALE. Unsupported/upstream errors return UNAVAILABLE without fallback. Zero secrets.
- `assets/rail-live-source-gate.js`: adds a compact detail section **inside a tapped station's existing MapLibre popup** (no buttons outside map). Separate static speed fields `NOT_PUBLISHED` / null; checks backend health only and explicitly states it is network-level, not at the tapped station.
- `unified-map-v7-live-lab.html` and `assets/unified-v7-live-map.js` are isolated V7 copies. Existing `unified-map-v7.html` remains unchanged, preserves 16 layers, with no Shuttle Timur import.
- `scripts/build-unified-v7-live.cjs`: public-only preview staging from V7 baseline.
- `tests/rail-live-source-gate.test.mjs`: synthetic protobuf contract + fail-closed tests.

## Release gates

`npm ci --ignore-scripts && npm test && node --test tests/unified-v7-regression.test.cjs tests/rail-live-source-gate.test.mjs && node scripts/build-unified-v7-live.cjs` then isolated Preview. HTTP 200/Node QA does not prove upstream GTFS-RT is currently reachable. The live source should only be called CONNECTED after the deployed serverless function reads a fresh valid protobuf feed. Owner iPad Safari UAT separate. No display of specific station approach, through speeds or TSR until operator-approved authoritative, timely, correctly scoped data is available.
