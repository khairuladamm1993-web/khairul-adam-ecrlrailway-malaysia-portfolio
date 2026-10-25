# P01 R2.17.2 — MRT Kajang KG station POI green matching audit (2026-10-26)

## Verified current user observation

Owner Safari screenshot at 05:21 MYT shows source-derived POI:
- title: `Pusat Bandar Damansara`
- category: `subway`, original name: `KG13 Pusat Bandar Damansara`
- general POI dot remains blue while selected MRT Kajang Registry is green

This is a **source label observation**, not an exact surveyed station coordinate or a physical alignment verification.

## Implementation decision

- Existing Owner-observed source label matches: `KG16 Pasar Seni`, `KG35 Kajang`.
- New Owner-observed source label: `KG13 Pusat Bandar Damansara`.
- Kajang station order and names: operator-confirmed [MRT Corp](https://www.mymrt.com.my/ms/ruang-acara/kajang/) and [MRT Corp project overview](https://www.mymrt.com.my/projects/kajang-line/).
- Station-code references (secondary; check on-map labels before describing any map marker as actually present):
  [KLIA2 station code directory](https://www.klia2.info/rail/mrt-sbk/) and [MRTKL code directory, unofficial](https://mrtkl.com/mrt-kajang-line).
- The 29 station IDs each have a reviewed candidate `KG*` prefix. `KG18A` is an intentional alphanumeric code; skipped codes such as KG11, KG19, KG32 are **not** assumed to be current Kajang stops.
- Only actual, live MapLibre `poi` source features matching exact `class:railway`, `subclass:station|subway` and a code+name allowlist get green overlay if `MRT Kajang Line` is selected in Malaysia.
- English names must not contradict the matched station. Aliases are narrowly allowed for `KG20 Tun Razak Exchange` and `KG30 Batu 11 Cheras`; do not expand aliases based on physical proximity.
- A source POI becoming green means **candidate per-service identity**; not that all 29 POIs exist in the source, that the POI position has been surveyed, or that a source rail line geometry is verified.
- `physicalSegments=[]`, `osmRelationAudit.acceptedWayIds=[]`, `verifiedPhysicalTracks=0`, and the unrelated teal source railway strokes remain unchanged.

## QA gates

- 29 operator-ordered stations, 29 unique candidate codes; crosswalk maps `KG13` to service stop 9/29.
- Confirm all old green overlays and station popup click paths.
- Negative checks for generic `Kajang`, wrong KG code-name pairs, wrong mode, wrong transport category, KTM and tram labels, mismatched English names.
- Verify route-selection and country switch hide the green overlay; dark-mode station marker legibility retained.
- Owner Safari UAT: at KG13, select `MRT Kajang Line` and verify green point with `9/29` popup. Check any other station only if actual source POI shows correct KG code and name.
- Separate track alignment audit from R2.17.1 remains OPEN. Do not paint all rails green or treat third-party route relation/way candidates as APPROVED.

No GitHub main, Production, Supabase, P02/P03 or parallel R2.18/R2.19 branch changes are authorized.
