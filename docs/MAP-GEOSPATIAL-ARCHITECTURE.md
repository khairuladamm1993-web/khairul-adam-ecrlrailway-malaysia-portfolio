# MAP Geospatial Architecture

This document describes the personal-site MAP architecture only. It is not an official ECRL operational or survey system.

## Progression

Reference Map → Chainage-Aware Map → Owner-Reviewed Coordinates → Detailed Station/Depot Topology → Survey-Validated Data Layer.

The canonical Corridor asset remains the single identity source. MAP, chainage intelligence, Owner relocation, future topology and future survey metadata extend that same asset rather than creating competing Corridor databases.

## Location states

- Canonical: current published geographic coordinate.
- Chainage Guide / Calculated Corridor Reference: temporary reference state. Never canonical and never survey-grade.
- Proposed: Owner draft geographic coordinate. Never published by drag or Save Draft.
- Survey Validated: future coordinate/geometry backed by explicit engineering or survey evidence.

Canonical chainage is independent of geographic coordinate. A coordinate relocation never changes chainage.

## Optional metadata envelope

Approved authenticated Corridor content may later attach optional metadata to the same asset ID:

- geospatial/location metadata: reviewedAt, reviewedBy, coordinateOrigin, chainageSource, topologySource
- surveySource / geospatialSource
- estimatedChainageReference / chainageGuide
- topology / stationTopology / depotTopology
- approved evidence metadata

Absence of any optional metadata is valid and must not be filled by inference.

## Estimated chainage references

A mapped ESTIMATED CH REFERENCE is accepted only when an explicit supported coordinate and method are present. Supported architecture methods are:

- survey-georeferenced
- approved-engineering-alignment
- supported-reference-geometry

Without a supported coordinate, the UI remains bracket/context-only and does not invent latitude/longitude. OpenRailwayMap raster tiles are visual context, not queryable ECRL survey geometry.

## Confidence

Pending Validation, Calculated Corridor Reference, Public Reference Location, Personal Field-Validated Location and Engineering/Survey Validated Location remain distinct concepts. Existing legacy Validated Location records remain compatible.

Engineering/Survey Validated must only be used with explicit high-confidence evidence such as surveyed coordinates, authoritative engineering GIS, georeferenced as-built information or equivalent control data. Visual alignment, Owner drag, chainage arithmetic and OpenRailwayMap alone are insufficient.

## Future topology

Optional topology fields may include track/platform counts and IDs, siding, depot access, freight/passenger line function, turnout sequence, connection direction, usable length, consist notes, layout source and topology confidence. Missing fields remain absent.

MAP detail cards are designed as:
1. Basic
2. Operational Detail, only when supported data exists
3. Schematic / Topology, only when supported data exists

## Logical layers

- BASE MAP
- RAILWAY REFERENCE
- CANONICAL ASSETS
- CHAINAGE GUIDE
- PROPOSED EDIT
- FUTURE SURVEY LAYER
- FUTURE TOPOLOGY LAYER

Survey and topology panes are architecture placeholders only. No survey or topology geometry is bundled automatically.

## Access

Public: read-only simplified map; no proposed/admin data.

Member: read-only approved learning/reference data.

Admin/Owner: evidence/confidence review, chainage guide, proposed marker, history/rollback and future survey-source tools.

Backend authorization remains authoritative for publish and restore actions.
