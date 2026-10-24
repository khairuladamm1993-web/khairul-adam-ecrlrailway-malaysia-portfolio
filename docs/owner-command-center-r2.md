# MRL’S10 Owner Command Center R2 — Evidence & Sync Recovery

**25 October 2026, Malaysia**. R2 continues the approved R1 implementation. No MR-S10 main/Production modification and no Supabase database/Email Auth change.

## UI improvements
- Shorter iPhone heading and compact demo ribbon (demo deployment only).
- Collapsible older evidence on each project; first two checkpoints visible.
- Readable LIVE / SNAPSHOT / UNVERIFIED distinctions.
- Per-open GitHub latest commit checks and per-commit GitHub Actions workflow checks using public API.
- Read-only refresh button and throttled refresh when Safari becomes active after 2 minutes.
- Vercel verification panel, refuses to mislabel dated snapshots as live.

## Vercel Owner backend adapter (coded, **not yet connected**)
`api/owner-project-status.mjs` accepts only GET and only after Supabase authenticated JWT and `account_role() == 'admin'`. It selects exactly three preapproved Vercel project IDs: MR-S10 canonical Preview, ECRL Slice 1 and PL03–PL04 baseline. It has no mutation endpoints. The Vercel API token lives **only server-side** in `VERCEL_API_TOKEN`; Supabase public/publishable key in `SUPABASE_PUBLISHABLE_KEY`. Both environment variables must be explicitly configured for an isolated deployment; they do **not exist in this checkpoint**. Never paste secret tokens in a chat, frontend file, public GitHub repo or screenshots. Use provider environment settings. No user token is logged.

The backend validates the Owner token independently of the frontend's `canAdmin` flag, and safe errors return NOT CONNECTED. A READY deployment does not mean it is publicly available; `live` is returned separately if present. Rate limits, network errors and absent secret settings are shown as unverified rather than treated as success.

**Deployment caveat:** the existing static `build-production.py` packages the dashboard/registry but not the `api/` serverless function. Before making Vercel live, deploy via an appropriate *isolated Vercel project* with serverless functions; verify route packaging and authentication in that environment. Do not deploy all repo sources wholesale to Production.

## Sync truth table
| Source | R2 | Limit |
|---|---|---|
| Public GitHub latest commits | LIVE when API succeeds on browser | Indicates source, not deployment |
| GitHub Actions workflow run matching commit SHA | LIVE when endpoint succeeds | NO RUN is not PASS; API rate-limits possible |
| Vercel | Backend coded, NOT CONNECTED | Requires Vercel API read token in isolated backend environment and Owner UAT |
| Supabase | Used to verify Admin login | Owner Safari OTP session remains incomplete |
| Swift Playgrounds | dated checkpoint | No automatic access to local iPad app without an approved publishing/export mechanism |
| ChatGPT conversations | verified milestones committed to versioned registry by connected GitHub actions | No automatic transcript sync from every ChatGPT chat |

## R2 regression
Checkpoint code `c7654d0cfdc5d124e021326e05ecee9bbb00ea33`:
- 171/171 full Node PASS, 14/14 reading catalogue PASS
- Python syntax PASS, local Production-shaped builder PASS
- Frontend role boundary and sanitized read-only Owner API tests PASS
R2 browser/UAT after the final touch-up needs rechecking, and Chromium smoke remains pending.

## Visual demonstration
https://mrls10-command-center-r1-demo.vercel.app
*Public-safe simulated viewer; not a real Owner login or evidence of successful Supabase authentication*. This demonstration is isolated from production MR-S10.

## Final 2-product strategy
Currently 3 tracks: MR-S10 portfolio site, ECRL Web Simulator, Swift app.
Future 2: MRL’S10 website (after independent web simulator QA and merge approval), MRL’S10 Simulation App.
Domain `mrls10.my` proposed, availability unverified.

## Go / No-Go
- R2 development and testing: GO.
- Automatic GitHub public status: browser UAT pending.
- Vercel automatic status and Swift sync: NO-GO until linked and tested.
- Merge into Production / switch Auth / unpause Slice 1: NO-GO pending separate approvals and UAT.
