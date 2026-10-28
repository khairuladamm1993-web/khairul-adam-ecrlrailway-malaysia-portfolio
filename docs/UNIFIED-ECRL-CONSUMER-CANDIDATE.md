# Unified V8.1 + ECRL infrastructure candidate

Baseline: e7e10b7644dabd1cd7c42af0eba1cfec27689596. Read-only ECRL source: 900705e2b109ba281c5be2a04812c7e401f03cf3.

The Owner authorizes this isolated candidate; the original direct-merge prohibition remains. Only the data and i18n modules and manifest are pinned verbatim under assets/unified-ecrl/source. source-lock.json records SHA-256 evidence. The standalone app and global stylesheet are not imported. Source module version 1.1.0 and manifest version 1.2.0 are retained as supplied, not silently reconciled.

## Implemented
- One shared MapLibre map, existing 33 passenger route identities unchanged. ECRL is a separate infrastructure registry and namespaced point source/layers.
- 33 metadata assets: 20 station identities, 7 historical PL records, 6 facilities. Reference overlays are independently opt-in: 16 locality, 4 historical EIA-2017 proposals, 2 maritime port-area references. These 22 points are not verified station or track coordinates.
- No ECRL LineString, verified station point, crossing-loop pin, freight-yard pin, turnout or physical connection is created. C2 current station locations, chainage and station-level track counts remain UNKNOWN. Puncak Alam and Jalan Kastam service conflicts remain SOURCE_CONFLICT.
- Map-native reference selection, combined search, metadata-only sheet for assets without enabled reference GIS, focus transaction, language/theme recovery and existing detail chevron.
- Pure journey engine and reusable view, typed origin/destination, source-ordered simulation lineup, current/next station and manual progress. Kota SAS to Kota Bharu is a simulation over registry order, not an operational stopping pattern.

## Capability evidence levels
| Capability | Implementation | Test gate | Verification boundary |
|---|---|---|---|
| Infrastructure integration | IMPLEMENTED | node + actual canvas Chromium/WebKit | VERIFIED only for integration behavior after CI PASS |
| Source reference coordinates | READ-ONLY | exact source/hash and type gate | No current station/track survey verification |
| Journey simulation | IMPLEMENTED | pure model + UI progress | Simulation only; no train position |
| Offline handling | IMPLEMENTED in domain and already-loaded UI | network state/progress unit test | No service worker or offline cold-start cache |
| GPS permission/provider contract | IMPLEMENTED contract | startup makes zero permission calls | Production GPS PENDING |
| Map matching / timetable / ETA | UNKNOWN / UNAVAILABLE contracts | fail-closed model tests | Operational sources PENDING |
| Installable PWA / native apps / tickets | PENDING | outside this candidate | No launch or Production approval |
| Safari iPad hardware | PENDING Owner UAT | WebKit emulation is separate evidence | Standalone previous UAT does not apply |

## Consumer PWA V1 next gate
Validate this integrated Preview on Owner Safari. Then approve PWA scope: manifest/icons, versioned offline metadata cache and update recovery. Add explicit user-gesture location permission only after privacy design and verified track matching sources exist. A timetable adapter must carry operator provenance, effective date and freshness before ETA can be enabled. Do not infer live data or sell tickets from this simulation.

Production merge and launch require Principal Owner approval. Baseline and ECRL source branches remain untouched.
