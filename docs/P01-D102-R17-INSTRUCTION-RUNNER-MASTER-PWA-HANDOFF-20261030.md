# MR-S10 P01 — D102 R1.7 Instruction Runner + One-File Master Archive
Date: 30 October 2026 · isolated Preview only · Production protected

## Why this exists
The Owner requires a station/PL image/layout and ChatGPT Adam instruction import that acts **during** an existing D102 CH simulation and creates **one complete reusable project file** after an instruction assignment completes. The output is usable for downstream architecture work in P01 Unified Map, P02 browser simulator, P03 Swift simulator and any future PWA. It does **not** authorize public publication or claim physical rail geometry.

## R1.7 instruction input: JSON only
- Accepted extensions: `.json`, `.txt`, `.md` containing a valid JSON object (Markdown fenced JSON accepted).
- Hard maximum file size: 128 KiB; maximum 30 commands; one distinct ID per command.
- Required envelope `schema: "mrs10-d102-instruction-bundle-v1"`, `bundleId`, `issuedBy: "ChatGPT-Adam"` (self-declared string, **not authenticated proof of origin**), `purpose`, `commands`.
- Allowed command actions: `FOCUS_ASSET`, `QUEUE_CH_TARGET`, `REGISTER_INFRASTRUCTURE`, `IMPORT_TRACK_LAYOUT`, `FLAG_GEOMETRY_GAP`, `ADD_CH_OBSERVATION`, `SET_CAMERA_VIEW`.
- Each action is schema-validated and is **inert until the Owner explicitly approves the bundle and separately clicks its execution button**. A queued D102 CH move must still pass pre-departure/next/arrival/bridge/tunnel/QZ confirmation. There is no `eval`, code shell, remote fetch of executable instructions, automatic GitHub/Production deploy, or bypass of provenance checks.
- A `QUEUE_CH_TARGET` only accepts an accepted station/PL code and *matching accepted CH*. An observation applies only when D102's current CH equals the record's CH.
- Instruction audit, gaps and statuses persist to localStorage on the current Preview domain. Files/images/PDFs remain in IndexedDB locally.

## Deterministic ECRL engineering assistant
- This is a source/gap audit and task queue **not an online AI backend, survey team, or real train telemetry**.
- Scans exactly 23 accepted CH assets: 16 STN, 7 PL; source layout presence, Owner WGS84 model review candidates, imported media, infrastructure reference count and outstanding rail topology.
- Logs `UNKNOWN` for unverified track IDs, rail centreline, source geometry, CH equation and geodetic measurement rather than inventing data.
- No automatic validation of physical track geometry is claimed, even when all commands execute successfully.

## One-file master handoff
Once **all commands in the current approved bundle are marked COMPLETED**, the panel unlocks:
**Eksport 1 fail induk ECRL untuk PWA**.

On click it creates an in-memory standalone JSON and presents an **explicit second download link** suitable for iPhone Safari:
`MR-S10-ECRL-D102-MASTER-CH-STN-PL-TRACK-HANDOFF-v1.json`.

Schema `mrs10-ecrl-d102-master-handoff-v1`. Required top-level keys:
- `corridor`: STN01 CH000+670 → STN17 CH524+160, project gauge 1435mm, project electrification 25 kV AC, source provenance and datum limitations.
- `assetRegistry`: all **23** CH-ordered records including 16 stations and PL01–PL07; delta from previous/next CH; station intelligence; source layout structures; reference-only coordinate evidence; unknown physical track attributes.
- `importedRailGeometry`: any explicitly imported GeoJSON, tagged `NOT_VERIFIED`. No rail-line interpolation from OSM tiles or images.
- `trackLayoutMedia`: original imported PNG/JPEG/WEBP/PDF source attachments embedded as data URLs where present and within total raw limit **22 MiB**. This is a private Owner export, no public content redistribution without license review.
- `infrastructureReferences`: source-tagged bridge/tunnel/QZ/turnout records and CH, but no synthetic structures.
- `ownerCoordinateAudit`, `d102Session`, `d102JourneyLedger`, `engineeringObservationLog`, `instructionBundle`, `assistantGeometryAudit`, `missingEvidence`.
- `acceptance`: separate binary gates for **instruction completion** and **source-backed physical geometry acceptance**. All real-geography/production gating remains FALSE unless independently verified in a future version.
- `fileIntegrity`: schema, encoding and source limits. Includes no secrets or API keys.

The archive never claims a complete surveyed railway merely because it has all 23 CH records. Missing spatial/track data stays `null` with explicit gaps; that distinction is essential for safe re-use in native apps/PWAs.

## Limits & next integration work
- Browser-only private storage; Preview domain changes break local data continuity, so export to Files/own private backup. No authenticated cross-device sync yet.
- A master file is a *project handoff/backup*, not authoritative GIS, railway operations, or a safety certificate.
- Source PDFs/photos are retained as originals; the code does not OCR, infer tracks from drawings, survey, georeference satellite imagery, or derive unknown 1435mm rail links.
- A very large collection of media above 22 MiB fails closed; no misleading partial "complete" export.
- A future PWA importer must reject unsupported schema version, honor licensing, validate each asset's source and topology, enforce authentication, and never auto-approve physical CH/geolocation from these models.
- Original R1.5/R1.6 UI, station/PL source import, camera 2D/2.5D, purple port/amber yard and local CH logs remain intact. Production untouched.

## Test requirements
- Node unit: schema whitelist, no executable payload, strict accepted CH, Owner click gates, master 23 points plus optional original media and unknown physical geography.
- Browser: Chrome + Safari/WebKit on desktop/iPad/iPhone; accept JSON, execute per-click, preserve CH & source gap, export a single JSON and reload.
- Owner visual Safari UAT required before merge, and no Production deploy.
