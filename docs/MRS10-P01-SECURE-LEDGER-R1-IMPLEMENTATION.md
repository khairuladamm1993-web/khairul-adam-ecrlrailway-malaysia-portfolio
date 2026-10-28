# MR-S10 P01 — Secure Instruction Ledger R1: Implementation & Release Gate

Date: 2026-10-28 (MYT). Scope: P01 only.
Implementation branch: `feature/mrs10-p01-secure-ledger-r1-20261028`.
Inherited engineering contract: `docs/MRS10-P01-AI-EXECUTION-MIRROR-R1.md`.

## Implemented in source (not activated on Production)

1. Append-only, Owner-scoped instruction/event tables in `app_private`, schema migration **SOURCE ONLY / NOT APPLIED**.
2. Idempotent instruction creation with UUID nonce, canonical P01 scope, summary/acceptance validation, and explicit Owner/Admin check via `app_private.account_role()`.
3. Optimistic-concurrency checkpoint updates with revision match, Owner note, diagnosis, and blocked statuses. No simulated TESTED, VERIFIED or RELEASED state.
4. Restricted RPC facades `admin_instruction_submit/list/checkpoint/history`, with deny-by-default table grants and no public/private browsing bypass.
5. Owner Command Center interface for entering an Owner-approved P01 instruction, displaying the private ledger, adding checkpoints and reading event history.
6. Auth-gated client methods in `assets/access.js`, rechecking session and dropping stale session results. Existing public registry remains separate.
7. Dedicated GitHub Actions job for static security tests, syntax and production-shaped artifact containment. It does not deploy or run SQL.

## Deliberately not implemented / not claimed

- No ChatGPT personal-history access, background message delivery to private chats, or automatic Owner→ChatGPT app pushes.
- No AI agent autonomous code repair, Vercel deployment, GitHub merge or infrastructure mutation.
- No direct ChatGPT plugin/MCP ledger write bridge yet. Until integrated and authorized, Owner-approved instructions are entered through the dashboard form; existing GitHub checkpoint handoff remains separate.
- No applied database migration, active live ledger endpoint or Safari Owner UAT. UI must fail closed when RPC schema is absent.
- P02/P03 are deliberately not affected.

## Security checks before enabling

- Apply SQL **only to an approved isolated Supabase development/staging project**, after a manual review of privileges and `app_private.account_role()`. SQL here is a proposal, not a command to mutate Production.
- Execute `SELECT` checks for app_private ledger tables with RLS enabled and no anon/authenticated direct grants, and verify RPC grant surface.
- Run non-admin / expired JWT RPC tests: submit, list, checkpoint, history must deny.
- Run approved Owner session tests: create with nonce N; retry N with same payload returns created=false, no duplicated event; reuse N with changed payload returns conflict.
- Run concurrency check: two same-revision checkpoint requests; exactly one succeeds; other fails. Event history remains append-only.
- Verify public visitor sees neither the panel nor private data; existing gateway and language/map controls remain unchanged.
- Run iPhone/iPad Safari UAT after isolated deployment and Owner login.
- Keep Production locked, review any rollout separately.

## Mirror synchronization boundary

The private ledger synchronizes the Owner Command Center against the authenticated Supabase RPC when enabled; refresh and browser-return trigger a fresh read. It does not synchronize ChatGPT private chat history. A future explicit custom integration may read/write only approved ledger entries, with separate authentication and audit. Public GitHub Registry status is not to be conflated with private instruction ledger status.

## Acceptance

- SOURCE COMMITTED: inspect GitHub commit/branch.
- TESTED: GitHub Actions ledger-security suite success.
- DB VERIFIED: after approved isolated migration + live Owner/non-Owner authorization tests.
- SAFARI VERIFIED: separate Owner UAT on iPad and iPhone.
- PRODUCTION RELEASED: separate Owner release approval and successful production verification.

Any unverified gate retains NOT CONNECTED/NOT VERIFIED and cannot be represented as PASS.
