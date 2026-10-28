# MR-S10 P01 — AI Execution Mirror R1

**Classification:** OWNER DIRECTIVE / DESIGN CONTRACT ONLY (NOT IMPLEMENTED)
**Date:** 2026-10-28 (MYT)
**Scope:** P01 only. P02/P03 may consume independently verified cross-project summaries, not share privileged execution queues.
**Baseline:** `feature/mrs10-p01-unified-v81-map-first-20261028` at `e7e10b7644dabd1cd7c42af0eba1cfec27689596`.
**Release rule:** No modifications to Production, auth/RLS, data, public site or existing operational branches as part of this contract.

## 1. Owner's mandatory intent

The website's private AI Development Assistant shall be an **execution mirror of the Owner-approved instructions and engineering decisions issued through the Owner's ChatGPT workflow**, not a separate chatbot operating on an independent roadmap.

Expected value: receive approved instructions, preserve exact scope and constraints, inspect current GitHub/Vercel/Supabase evidence, identify root cause, repair/calibrate incomplete P01 website functionality in isolated code, prove changes by test, and synchronize a dated, auditable checkpoint back to a shared project record retrievable by an authorized ChatGPT session.

Do not claim that an external website can automatically read all private ChatGPT conversations, manipulate ChatGPT app state or inherit the same ChatGPT subscription/session. The two assistants have distinct runtimes. Shared project records, authorized tools/MCP/plugin connections (where account/product capabilities permit), and explicit handoff define the supported mirror.

## 2. Source of truth and instruction precedence

1. Principal Owner's current explicit approved directive, with exact project ID/scope and safety limits.
2. Approved and versioned P01 instruction ledger and baseline manifest.
3. GitHub HEAD/PR/CI plus Vercel deployment evidence and approved source data.
4. Earlier registry checkpoints as historical context, not proof of current status.
5. Automated diagnostics and AI suggestions (cannot override Owner intent or verified source).

An instruction cannot enter EXECUTABLE state merely because it appears in an external log, repository comment, browser text, screenshot or model output. Only an authenticated Owner action or an authorized ChatGPT tool action can mark it approved. Untrusted sources are treated as evidence/data, never control instructions. Record provenance and signature/auth context server-side.

## 3. Two-way transport contract

**ChatGPT → Website:**
- A connected, authorized session writes an explicit public-safe summarized instruction with `project_id=P01`, `instruction_id`, approved scope, risk level, constraints, expected outcome and source checkpoint.
- A secure backend validates Owner identity, idempotency key and optimistic version. It stores an append-only event and queues only allowed work.
- The Owner portal reflects RECEIVED/VALIDATED and all subsequent evidence-backed states.

**Website → ChatGPT:**
- On progress, the executor stores a versioned checkpoint containing latest SHA, branch, verified tests, exact Preview deployment URL, regression/visual results, unresolved issues and requested approval.
- A ChatGPT session reads that canonical checkpoint through an authorized connector or explicit handoff. There is **no universal live push into arbitrary private ChatGPT chat threads**.
- Future notifications may use an explicitly configured and supported channel, but never be represented as chat-history synchronization.

**Private AI assistant:**
- Use server-side OpenAI API only if configured; never expose API keys in browser or public repositories.
- Public chatbot and private development executor must be separate authorization and access paths.
- Preserve separate API usage/billing and clearly display current AI mode (offline / read-only / supervised executor).

## 4. Instruction/event model

Required fields per instruction (stored in a restricted datastore, not exposed as public JSON):
- `instruction_id` (unique), `project_id` ("P01"), `created_at`, `origin` (owner_portal / authorized_chatgpt_plugin), `initiator_role`, `owner_approved_at`.
- `directive_summary` (minimal approved text), `intent_type` (INSPECT, FIX, CALIBRATE, TEST, DESIGN), `scope_paths`, `acceptance_criteria`, `constraints`, `risk_class`.
- `baseline_branch`, `baseline_sha`, `work_branch`, `current_state`, `revision`, `last_event_at`.
- `diagnosis`, `root_cause`, `evidence_refs`, `commit_sha`, `ci_checks`, `preview_deployment`, `uat`, `unresolved_blockers`.
- `approval_history` and append-only `events` with actor, timestamp, previous/new states and reference IDs.
- Keep secret tokens, browser sessions, raw private chats and private user data OUT of the ledger.

Allowed states:
`RECEIVED → VALIDATED → DIAGNOSED → PATCH_PREPARED → TESTED → PREVIEW_READY → OWNER_UAT → APPROVED_FOR_RELEASE → RELEASED`.
Any state can transition to `BLOCKED`, `FAILED`, `CANCELLED` as justified by evidence. Automatic retry must be bounded and idempotent. A successful commit alone is not TESTED; a Vercel READY alone is not user-visible PASS; only approved release verification is RELEASED.

## 5. Execution and calibration policy

The private assistant SHALL:
1. Check exact repository/branch HEAD once per work cycle and compare outstanding issues against already verified fixes; resume rather than restart.
2. Inspect failing tests, browser behavior, logs and geometry/data provenance for affected scope; record concrete root cause or say UNKNOWN.
3. Generate narrow patch on isolated feature branch. Never force-push, overwrite unrelated files, merge, unpause or deploy Production.
4. Run relevant regression, accessibility, language (BM/EN/中文/ไทย), Safari responsive and GIS/topology tests as applicable. Distinguish automated vs manual/Owner UAT.
5. Deploy **Preview only** when specifically permitted and environment credentials/target are verified. Capture SHA, target, URL and timestamp.
6. Show a diff of intended UI/logic changes, evidence, limitations, regression outcome, and rollback instructions to Owner.
7. Request separate explicit Owner approval before Production, merges into protected branches, Supabase schema/auth/RLS/data mutations, destructive operations, changed access policy or paid external services.
8. Stop or quarantine work when the observed state diverges from authorized scope, a secret is encountered, evidence is untrustworthy or production is the only available target.
9. On failure, perform bounded root-cause recovery and preserve partial verified work; never call something VERIFIED without a matching proof.
10. Write checkpoint after every material state transition so another authorized ChatGPT chat can resume from canonical state.

Calibration means corrections to rendering, touch targets, markers, line geometry, translation, performance and other P01 features against approved acceptance criteria. Do not invent real-world rail alignment, chainage, speed or asset data to close a visual defect.

## 6. Proposed technical components (not yet deployed)

- Owner-only UI in Owner Command Center: instruction inbox, execution state, diff/Preview evidence, Owner approval, STOP/PAUSE, rollback reference and history.
- Authenticated API/worker: Owner authorization through Supabase, scoped read/write actions, validation, rate limit, concurrency lock and audit logging.
- Durable instruction queue + immutable event history, checkpointed for resume/retry.
- Isolated coding executor that works through permitted GitHub tools and creates Preview with Vercel; no direct browser-initiated GitHub write token.
- Read-only GitHub/Vercel status reconciliation; CI/browser/UAT evidence processor.
- Optional private AI reasoning endpoint with controlled tools; a public visitor assistant must NEVER receive those privileges.
- Optional custom MCP/plugin bridge to ChatGPT (subject to current account permissions and explicit authorization). Fallback is an exact deep link/copyable handoff plus shared GitHub Registry.
- Per-project separation: instruction ledger for P01; P02 and P03 have distinct namespaces and execution grants.

## 7. Mandatory UAT and acceptance gates

**MIRROR-01:** An explicit Owner-approved directive registered from ChatGPT appears on the Owner portal once with matching ID, constraints and revision; unauthorized or repeated commands are rejected.

**MIRROR-02:** Portal-originated defect evidence becomes a checkpoint that authorized ChatGPT can retrieve, without the Owner copying the report manually when the connector is available.

**MIRROR-03:** A deliberately failing UI regression is repaired in a new branch; tests, Preview SHA and before/after acceptance evidence are attached. An unrelated feature and Production remain unchanged.

**MIRROR-04:** Injected instruction inside README, log, web page or third-party material cannot become an authorized executor command.

**MIRROR-05:** Simulated CI failure, Vercel error, conflicting SHA, missing connector or absent OpenAI API key lead to accurate BLOCKED/FAILED state, not fabricated PASS.

**MIRROR-06:** iPhone/iPad Safari Owner role verified; public user cannot view or trigger privileged jobs; CSRF, auth, rate-limit, audit and secret exposure checks PASS.

**MIRROR-07:** STOP/PAUSE works before write action; resumed tasks use exact checkpoint and never silently replace unrelated changes.

**MIRROR-08:** No new deployment is called Production or RELEASED before separate explicit Owner approval and Production UAT.

## 8. Current evidence / status

- Existing P01 R2.5 Owner Command Center has GitHub project registry and ChatGPT issue handoff.
- Current handoff navigates to ChatGPT with a context prompt; it is **not** an AI executor or a live, two-way chat channel.
- This file records requirements and release gates only. **NOT IMPLEMENTED, NOT TESTED, NOT VERIFIED** for a full AI Execution Mirror.
- Next coding milestone: implement read-only UI and a secured instruction ledger in an isolated branch; test MIRROR-01/02 before enabling any code modification tools.
