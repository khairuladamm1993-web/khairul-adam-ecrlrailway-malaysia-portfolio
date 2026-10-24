# MRL’S10 Owner Project Command Center — R1 checkpoint
**Date:** 25 Oct 2026 (MYT)  
**Branch:** `feature/owner-command-center-r1` (isolated development)  
**Production MR-S10 / canonical Preview:** unchanged.

## Approved project hierarchy
- **MRL (Owner)** decides scope, approves releases and receives transparent evidence.
- **ChatGPT (development coordinator)** can inspect supported connected sources, help implement approved changes and write verified checkpoints into the project registry; it is **not** a continuously running independent agent and cannot read arbitrary past chat threads from a website.
- Current product tracks: Portfolio Website, Independent ECRL Web Simulator, Swift Playgrounds Simulator App (3).
- Future output: Malaysia Railway Link Section 10 **website** (with ECRL Web Simulator as a tested module), and standalone **simulation app** (2). Do not merge early.
- Domain string `mrls10.my` is an unregistered proposal and must be checked separately. DNS hostnames cannot contain the curly apostrophe from the stylized brand `MRL’S10`.

## R1 implemented
- `owner-command-center.html`: Owner-only page, denied by default without a server-validated Supabase Admin session.
- `assets/owner-command-center.js` + `assets/owner-command-center.css`: responsive mobile dashboard; role gating; live-on-open public GitHub commit checks; dated project snapshot; no changes/deploy controls.
- `data/owner-project-registry.json`: versioned evidence for all 3 tracks, exact statuses, sources, date and next steps. **Public-safe content only** because the repository and static JSON are public. Never add personal correspondence, secrets, GPS traces, private test files, tokens or unpublished restricted track data.
- `assets/member-gateway.js`: adds an Admin-only link, preserving existing Admin controls.
- `scripts/build-production.py`: packages dashboard and public-safe registry into a **local build artifact** on this branch. Does not deploy.
- `scripts/build-preview.py`: public-only Preview intentionally excludes Owner dashboard scripts.
- `tests/owner-command-center.test.cjs`: authorization and registry regressions; included in `npm test`.

## Tests
- Exact branch QA checkpoint `d47e2425a7d39a21239967a2e3bb0782010f5bcb`:
  - `npm test`: **166 / 166 PASS**
  - Reading library: **14 / 14 PASS**
  - Python compilation: PASS
  - Production-shaped local build: PASS, including `owner-command-center.html` and `data/owner-project-registry.json`
- Visual Safari/iPhone UAT and Chrome responsive smoke: **not yet confirmed**.

## Separate demonstration
A public-safe, disposable **visual demo** is available at:
https://mrls10-command-center-r1-demo.vercel.app
This demo uses a deliberate **non-authenticated mock viewer**, contains **no private Admin data**, and must never be used as proof of real Owner authentication. It uses the same frontend and public registry, and supports live public GitHub commit checks.

The **real Owner module** remains in the GitHub development branch. It cannot become a usable authenticated screen until Owner login and session restore pass UAT.

## Trust model / sync contract
| Source | Current R1 behavior |
| --- | --- |
| Public GitHub commits | Live-on-open read-only fetch (if API responds) |
| Vercel project/deploy status | Timestamped read-only snapshots only |
| Supabase | Actual site uses backend role checks; no new database writes |
| Swift app | Verified checkpoint required; no background access to local iPad files |
| ChatGPT conversations | No direct automatic conversation-history feed. A verified project checkpoint must be recorded via connected GitHub workflow |

## Before any release
1. Owner/Admin email OTP and browser session stabilized.
2. Use an isolated, authenticated Preview; keep the **public visual demo** distinct.
3. Implement authorized read-only Vercel status proxy or scheduled sync, with API tokens stored server-side, never in browser or repository.
4. Add an approved checkpoint-publication workflow for all development chats and Swift app archives; show missing evidence as STALE/UNVERIFIED.
5. Run Mobile Safari UAT, secure auth, full regression and Chromium.
6. Owner decides merge and Production promotion separately. No automated deployments.
