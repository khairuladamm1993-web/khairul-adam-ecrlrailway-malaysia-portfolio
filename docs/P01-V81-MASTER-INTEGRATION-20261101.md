# P01 V8.1 master integration RC — 1 November 2026

Integration branch: `integration/mrs10-p01-v81-rc-20261101`.
Baseline: Auth recovery `c62d257`, preserving R2/R2.3 authentication, private runtime and D102 R16/R17 calibration/import work.
Selected map lineage: `6070131` through `672b41e` from the three-railways branch, applied as individual commits. The build conflict preserved both the existing `examples` directory and new `data/unified-v81-integration` assets. No branch/history deletion or Production merge.

## Proven historical causes and limits

Read `P01-OWNER-AUTH-UAT-RECOVERY-20261101.md` for the original log evidence, captured before this session. iPad retries returned consumed/unavailable one-time-token errors; natural expiry is not established. iPhone verification occurred in a different device context from the initiating request, with no token exchange captured; missing same-context PKCE verifier is supported, not directly inspected. These are different failures. Existing recovery serializes SDK initialization/exchange, guards duplicate requests across tabs/reloads, checks storage and origin, and retains server-backed role/profile validation. This session preserves these fixes; it does not claim a new physical Owner sign-in.

## Integrated functionality

- Gateway existing-account PKCE login/session/logout recovery; Owner Command Center.
- Unified Map V8.1 Malaysia/Singapore, existing networks and map focus/theme/language controls.
- Sourced Sentosa/Changi additions, popup disclosure/touch fixes, Railway Intelligence.
- ECRL seven PL records, depot identities, three freight-path identities and five explicitly schematic accepted layouts.
- D102 calibration, source documents/imports and R16/R17 work remain in source; R2 private lab remains fail-closed until its dedicated backend exists.
- New `owner-location-review.html` reads existing versions via the existing Admin-authorized RPC. It renders latest stored versions, retains original confidence/source, and exports an explicit Owner-review receipt with asset/version IDs only. This is not survey verification and does not publish/update database records. Public/Member cannot initiate RPC through this UI. Late responses after logout are discarded; hidden/page-exit clears the DOM. No localStorage/IndexedDB, coordinate export or embedded private data.

## Data recovery and classification

Read-only hosted metadata confirmed 29 saved location versions in `app_private.map_location_versions`; no private coordinates/Owner identities were exported. All nine public and two app_private tables retain RLS. Existing `admin_location_history` wrapper delegates to the private Admin-checked function.

The accepted station manifest is STN01–09 and STN11–17 (16 stations); STN10 is deliberately absent in the accepted adapter. Do not invent a seventeenth coordinate or rename a depot to satisfy the range. This is an explicit open registry question. Kuantan and GNU-EMU depot identities are retained; their unsurveyed points stay null. PL/depot and spur endpoint geometry gaps remain UNKNOWN/PENDING_VALIDATION. Code/source QA and Owner-reviewed layouts do not establish geospatial verification. Schematic/historical layouts remain labelled SCHEMATIC.

## Configuration/access boundaries

Owner approved adding exactly this Supabase Redirect URL in this session:
`https://mrs10-p01-unified-v8-sg-geometr-git-6f80d2-1993khairuladam-3016.vercel.app/gateway.html`

Approval is received; execution is BLOCKED: available Supabase MCP tools do not expose Auth configuration and environment has no Management API identity. No configuration was changed. Apply by appending this exact URL to the existing Auth Redirect URLs in project `kfudisbzdgsefdjoopzu`; preserve Site URL and every existing entry. The build accepts only canonical origin or this explicitly listed RC origin. Actual RC login remains blocked until configuration is applied and redirect read-back verified. Do not request an Owner email from an agent context.

Existing hosted project has no R2 private-room RPCs per recovery checkpoint. No schema or production data write was made to bypass that boundary. New review UI reuses existing gateway Admin authorization and history RPC, not an invented Owner role or user_metadata claim.

Protected staging project: `prj_lCXBrXOHCNYABx8TLx2FhCEAIYus`, team `team_0JRmhxIIyLuWMPHsxwWxJfTv`. RC uses its branch-specific alias. Canonical `khairul-adam-portfolio-preview-safe.vercel.app` is unchanged. SSO protection remains enabled. Authenticated connector fetch failed with deployment-access/not-found; unauthenticated HTTPS returns SSO HTTP302, not application HTTP200. No bypass token generated or protection weakened. No Vercel CLI credential is present.

## QA evidence

Latest code candidate: `2795d94f3b68ed8932db7541ba0c1bf9afc1e28a`.
Local main regression exited zero; broad integration run initially failed two test files and a child-process Git EPERM during build. After build ordering and explicit build SHA, targeted reruns exited zero. These local results are file-level runner results, not claimed nested assertion counts. The decisive complete real-backend/browser runs are CI below.

Final-head map CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41258730606
Final-head real Auth/RLS CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41258730603

At document creation these are queued/running; no final PASS claim. Previous-head regression job `124706570458` succeeded, but is not final-head evidence. Check final CI conclusions and logs before UAT.

Deployment `dpl_CoTpMoFRz6siL5wcNwgUHzBzcZgM` is built from the exact candidate above:
https://mrs10-p01-unified-v8-sg-geometry-75hmilgxp-1993khairuladam-3016.vercel.app/unified-map-v8.html
Use the approved branch alias `/gateway.html` for future login verification once allowlisted; immutable host is not the callback origin.

Release remains NO-GO pending final CI, authenticated staging HTTP/browser smoke, exact callback allowlist verification, live Owner/Admin session/access verification, private-room backend decision and STN10 registry resolution. Physical Safari UAT is not requested while automated/access gates remain open.

## Preserved, not selected into this RC

The remote branch inventory is preserved. KTM V3 Safari/GTFS (`3ecb3f2`), Shuttle Timur V2 (`d6e9a59`), Thailand V3 (`dae5460`) and brand/locale proposal (`c41f2fd`) remain separate. Their latest commit subjects were inspected, but their complete source/QA lineage was not re-certified in this recovery. They are not silently treated as accepted or merged wholesale. This RC retains the baseline Malaysia/Singapore scope and its explicit Eastern Shuttle exclusion. Any broader acceptance requirement remains open rather than overriding the tested map baseline.

Read-only hosted recheck in this session also confirmed zero anon table SELECT grants and absence of `public.owner_private_context_r2()`. Final-head map regression logs independently confirm 371/371 baseline and 116/116 map/source tests PASS. Three-railways browser job `124707475586` completed SUCCESS; remaining suites and real-backend job were still running at this update.

## Final technical QA receipt — 01:07 UTC

Final tested/deployed code SHA: `6cbc4390e0e47ea00188535d4dc22d4d05d1cd53`. Later commits containing this receipt are documentation only.

- Map CI https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41259386082 — all five jobs SUCCESS. Logs confirm 371 baseline + 116 map/source assertions PASS, zero failures. Browser scenario records: V8 6, V8.1 8, ECRL 6, three-railways 6; Chromium and WebKit.
- Auth CI https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41259386239 — SUCCESS including cleanup. Logs confirm 371 baseline, six artifact/review security assertions and 16 mocked-provider unit assertions PASS. Separately, 10 REAL local Supabase backend/RLS/isolation checks, six REAL browser OTP/MFA/privacy/session/logout scenarios and four REAL SDK PKCE callbacks PASS (Chromium/WebKit, iPad/iPhone). Synthetic local identities only; not hosted Owner-login evidence.
- Intermediate V8 iPad failure on `ce7aaa9`: positive target readiness check followed by a separate empty target read, with styleLoaded=false at failure. Sampling was made atomic after style/tile readiness. Pointer-click/popup assertions remain unchanged. Final V8 job `124709356118` passes all six scenarios. Earlier failures remain in GitHub history and are not relabelled PASS.
- Final deployment `dpl_2K9j4vqkJaWGeaFFsbJcYYFnAARS`: READY, target staging, exact SHA confirmed from Vercel metadata.
  Immutable map: https://mrs10-p01-unified-v8-sg-geometry-cbaoqx93u-1993khairuladam-3016.vercel.app/unified-map-v8.html
  Branch gateway: https://mrs10-p01-unified-v8-sg-geometr-git-6f80d2-1993khairuladam-3016.vercel.app/gateway.html
- Callback recheck after Owner supplied the URL: deliberately invalid/no-user token probe still redirected to the old GitHub Pages Site URL, not the RC callback. No email sent. Exact RC allowlist is therefore NOT VERIFIED ACTIVE. Approval alone is not application of configuration.

Local synthetic and CI QA are PASS as specified above. Hosted authenticated application smoke and existing Owner/Admin login remain BLOCKED by unavailable protected-page authentication and inactive/unverified RC redirect. R2 private backend remains absent. Registry STN10 and broader unselected branch acceptance remain open. No physical Safari UAT is requested and no official release/Production action is authorized by these results.
