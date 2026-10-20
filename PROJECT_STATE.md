# Railway Portfolio — Shared Project State

Updated: 2026-10-20 (Asia/Kuala_Lumpur).
Scope: Khairul Adam Railway Portfolio / MR-S10, including integrated Asia Railway Explorer.
Owner decision: use one shared reference across Sites, GitHub, Vercel and development chats.

## Synchronization contract

This document is the shared project registry, not an automatic synchronization service.
No cross-chat message replication, Sites/GitHub source mirroring, or automatic cross-platform deployment has been configured.
The observed Sites and GitHub sources have different commit identities. Do not overwrite either source or claim equivalence without inspecting and comparing both.

Before work, read the CURRENT revision of this file from docs/project-sync-control, then query the relevant platform for current state. Treat the observations below as a dated checkpoint, never as permanently current facts.
After work, update this same document with checked timestamps, exact source commit, deployment ID, target, checks performed, and outstanding issues. Use the current blob SHA when replacing it to detect concurrent edits. Resolve conflicts by rereading; never silently overwrite another session's changes.
Each development chat must receive this document's link at least once; existing chat histories are not updated automatically.

## Verified platform registry

| Component | Identity | Verified observation |
| --- | --- | --- |
| Sites | appgprj_6abf8b4d489c8191815e22b83d48a862 | Active; latest saved version V4; owner access confirmed |
| Sites saved source | 5ed2998f5b18a6c686d194240f1f4cf2243e8efd | V4 source provenance; cross-repository equivalence not established |
| Sites live URL | https://khairul-adam-railway.cosmic-stoat-6790.chatgpt.site | Returned by get_site; no browser functional test this session |
| GitHub repository | khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio | Exists; default branch main; owner write permission confirmed |
| Application integration branch | feature/map-asia-integration-safe | Head a3445b6731d312e990cfec46669892ef8fe19929 at inspection |
| Shared registry branch | docs/project-sync-control | Documentation coordination only; application work continues on its designated branch |
| Canonical Vercel preview project | khairul-adam-portfolio-preview-safe / prj_0VhBnAaagARpXZYHHTFPquxRf7xy | Latest returned deployment dpl_Fwz9Uyeh3NvFz779VCQoV2gGHrkX; READY; target null (Preview) |
| Canonical preview source | f54e03540c3cfa4eb3d6108edd9df7c0dbf5d693 | Deployment metadata; differs from MAP integration commit |
| Canonical preview deployment URL | https://khairul-adam-portfolio-preview-safe-7g4xgg7gq.vercel.app | Returned deployment URL; stable gateway alias not revalidated |
| Isolated MAP project | mr-s10-map-stage4-isolated-preview / prj_TcEHetkWtla76OcU6HVQ6P5oHnsM | Latest returned deployment dpl_DjggVnLs7DmvPthmBPxqg73tLNqt; READY; target null (Preview) |
| Isolated MAP source | a3445b6731d312e990cfec46669892ef8fe19929 | Matches the observed integration branch head |
| Isolated MAP deployment URL | https://mr-s10-map-stage4-isolated-preview-cgv6jsrx1.vercel.app | Vercel SSO protection enabled; functional UAT not performed |
| Vercel team | 1993khairuladam-3016 / team_0JRmhxIIyLuWMPHsxwWxJfTv | Returned project account identity |

## Established project constraints

Preserve existing Sites project identity and audience. Continue existing work; do not restart the portfolio.
Preserve main and migration/full-portfolio baselines; do not merge or release to Production as a consequence of maintaining this record.
Do not change Supabase Auth, RLS or user roles as part of synchronization bookkeeping.
ECRL Swift Train Simulator Lab and ECRL Slice 1 are separate projects and are outside this registry.
Deployment READY is not evidence of passed Safari, login, Public/Member/Admin, or map functionality tests.
Previous chat claims and remembered commits must be checked against current sources.

## Outstanding implementation

1. Inspect both current Sites source and GitHub application source to determine their relationship and intended feature parity.
2. Establish a reviewed source-transfer/build adapter if actual source synchronization is wanted; do not blindly copy source between platforms.
3. Choose an explicit deployment policy and exact approved source before enabling any unattended publication.
4. Give this registry URL to every existing development chat. Those chats must read it before continuing and update it after verified work.
5. A monitoring or update automation is not configured. No always-on or real-time synchronization guarantee is made.

## Session handoff

Continue Railway Portfolio MR-S10 from its existing state. Read the current PROJECT_STATE.md on docs/project-sync-control before acting; verify live platform state, use the existing Sites ID, keep application and documentation branches distinct, and update this registry with evidence after work. Report gaps as unverified rather than assuming all platforms are synchronized.

## Change log

- 2026-10-20: Created shared registry from authenticated Sites, GitHub and Vercel observations. No application files, Sites content, access settings or deployment settings were changed by this documentation task.
