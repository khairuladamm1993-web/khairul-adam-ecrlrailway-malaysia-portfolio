# KTM V3 · GTFS Focus Race Fix (isolated)

## User-visible failure evidence
- 27 October 2026 iPad Safari test on Vercel Preview dpl_4qa7mCaDpogWuyzcw3TEGEm5gEgP: "Tiada" north/south markers.
- Server-side HTTP inspection confirmed that index.html, service JS, catalogue JSON and official GTFS bundled JSON all return HTTP 200.
- Official GTFS provides 13/13, 13/13, 7/7 and 2/2 station membership records. Deployment cannot therefore claim visual PASS from source/file tests.

## Confirmed UI race defect
- Selecting a category while GIS loads records focus but invokes map.fitBounds only when decoded is available.
- Once decoded finishes there was no focusSelectedRoute() call, leaving map centered on KL and pins at other latitudes off-screen.

## Fix
- focusSelectedRoute() relies exclusively on available source-backed points and handles one-point/multi-point bounds.
- Invoke after selecting route, after official data, after secondary GIS, and when MapLibre style loads.
- CI decodes the *actual* downloaded public KTMB GTFS data using the browser's production codec and asserts all 35 North/South route memberships (13+13+7+2), with geographic bounds.
- Never draw or invent physical track geometry, do not add unverified stop codes.

## Release gate
- New isolated branch, CI and protected Preview artifact only. Owner Safari UAT remains required.
- Original KTM Preview, integrated shell, GitHub main, Vercel Production and Supabase remain untouched.
