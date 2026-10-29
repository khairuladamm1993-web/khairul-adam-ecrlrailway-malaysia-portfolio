# D102 R1.7 private command center

Candidate only. No Production, public geometry publication, Supabase or runtime external connector is configured by this module.

## Owner workflow

Import `examples/mrs10-d102-assignment-r17.json` at STN01 CH670. Validate the displayed plan. Check Owner consent and Start. Confirm the STN01 review, then use existing R1.6 departure / next / arrival dialogs. Confirm STN02. Download execution and Geometry QA reports.

A refresh preserves the existing journey CH and pending dialog. Active assignments recover PAUSED and require explicit Owner Resume. Completed command receipts are retained. Do not rebuild the simulation to resume an assignment. Keep the same browser tab: a per-tab authority token prevents another tab from taking over an active assignment. If authority is unavailable, export existing local history; do not clear browser storage.

JSON is strict data. Unknown keys, commands, project/train mismatch, unsafe URLs, duplicate command IDs and out-of-scope CH fail validation. Markdown/text is shown literally. Conversion creates only a current-checkpoint REVIEW command after Owner confirmation; prose is never parsed into executable actions. Source links are metadata, never fetched automatically.

Commands: REVIEW_CHECKPOINT, MOVE_CH, REQUIRE_IMPORT, REGISTER_INFRASTRUCTURE, OPEN_LAYOUT, REVIEW_GEOMETRY, EXPORT_REPORT. CONNECTOR_TASK is recognized but BLOCKED because runtime GitHub/Supabase/research connectors are not configured. ChatGPT's engineering connectors are not exposed to imported files.

States: QUEUED → VALIDATING → READY/BLOCKED → RUNNING → PAUSED → COMPLETED. Unexpected host-action failures record FAILED. Validation/consent mistakes remain recoverable without pretending a task completed. Assignment completion means command-sequence completion, not acceptance criteria, as-built or external-task verification.

## Storage and revisions

IndexedDB `mrs10-p01-d102-command-center-r17`, version 1: immutable definitions by assignment ID + revision; executions with optimistic compare-and-swap; audit committed atomically with execution; settings; recovery archives; geometry candidates; Owner reviewed geometry; consumer approved geometry. The consumer store rejects writes from this module. Existing R1.6.1 attachment IndexedDB and R1.5/R1.6 history are unchanged. One-time migration archives a private snapshot; it does not replace old records. There is no cloud synchronization or cross-origin Preview transfer. Export backups before changing Preview origin.

Changing assignment content requires a new revision. Command intent is persisted before movement; infrastructure retries reuse the stable event ID and reject CH conflicts. Observed CH residual and corrections are audit entries and never rewrite the reference manifest.

## Geometry boundary

Inventory: 16 STN + seven PL; 22 adjacent CH intervals. These intervals assert no physical connection. Project gauge is 1,435 mm; segment gauge remains UNKNOWN without segment evidence. Missing coordinates, turnout connectivity, track count, speed, gradient, cant, signal and civil asset metadata remain null/UNKNOWN. Imported lines are private candidates with original properties/provenance. Satellite and OpenRailwayMap rasters cannot unlock D102 movement.

R1.7 keeps geographic train placement locked pending a licensed vector, source-node topology, documented CH anchors and a separate reviewed geometry authority. Existing CH-only simulation remains available. Geometry model approval/publishing is deliberately not implemented. No full-corridor alignment is claimed.

Needed next: licensed alignment with CRS/datum and feature IDs; source-node junction topology; surveyed/referenced CH anchors and residual tolerances; segment attributes and licence/publication rights; independent model QA. Owner UAT is not as-built verification.

## QA interpretation

Automated Chromium/WebKit viewport tests are browser-engine emulation, not physical iPhone/iPad or installed Safari certification. Native Files/PDF viewer handoff and Safari hardware UAT remain Owner checks. Screenshots and JSON reports are GitHub Actions artifacts. An unsuccessful CI run must remain FAIL until fixed and re-run.
