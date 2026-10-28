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

## Integration QA checkpoint
Application commit: 79e59ed014f60700c88c244fe3c57d20222b081d. [CI 40743395836](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40743395836): 15/15 data/focus tests, 367/367 repository tests, 18/18 Unified data regression, 6/6 ECRL browser cases and 8/8 V8.1 map-first cases PASS. Legacy browser 5/6 PASS; WebKit iPad process closed during element screenshot after track assertions. That overall workflow remains FAILURE; it is not relabeled as successful. The one capture case is rechecked in a fresh WebKit session with viewport capture after tile readiness. Remote ECRL browser and 35-asset SHA-256 checks run on the same immutable staging application, without repeating passed baseline suites.

## Deployment safety record
The first deployment in the newly created `mrs10-p01-v81-ecrl-candidate` project was automatically labeled `production` despite the submitted `target: staging`. It was not promoted or connected to an existing Production domain. That new project (`prj_FcqK0H8ufkqfD48FqAg6gHSKOsie`) is now PAUSED: first deployment `dpl_3qgX33bq5Y2ekqKTwmcU4wzKvWhp` returns HTTP 503 `DEPLOYMENT_PAUSED`. It remains retired; no existing Production project was paused or modified. Pausing also blocks new builds in that new project, so the accepted candidate uses a unique staging deployment in the already-authorized Unified Preview project. Avoid first-deployment auto-promotion through this connector on fresh projects.

Candidate staging: `dpl_E98eRTi47DqZvdnh1amwXMq8TTdQ`, target `staging`, application SHA `79e59ed014f60700c88c244fe3c57d20222b081d`. Direct path: https://mrs10-p01-unified-v8-sg-geometry-2xx50vmky-1993khairuladam-3016.vercel.app/unified-map-v8.html . Original V8.1 Owner Preview remains pinned at its previous immutable URL. No branch merge, force push, Production promotion, Supabase write, P02 or P03 change is performed.
