# Privacy

The GitHub Pages welcome page uses privacy-friendly aggregate analytics collected by a Cloudflare Worker and stored in Cloudflare D1.

Only separate daily counters are stored: document visits, estimated daily browsers and new/returning status, welcome views, entry/exit stage, button interactions, engagement/duration totals, and broad device, screen, browser and operating-system categories. Coarse country is included only when Cloudflare's network metadata supplies it. There are no joined visitor profiles or individual session records.

The existing analytics also supports portfolio section views, the ordered gateway funnel, learning modes, BM/EN/中文 and Pinyin choices. These counters require those actual controls/sections to be present and integrated. The current portfolio.html handoff to the separate Sites portfolio does not transfer this analytics script to that site; do not interpret absent events as zero interest.

No GPS, precise location, browser geolocation permission, visitor name, email, phone number or login identity is requested or stored. No raw IP address, raw user-agent string, URL, referrer, query string, or free text is stored by the analytics collector. Cloudflare and GitHub may process network information separately to operate and secure their hosting services.

A localStorage date flag estimates daily browser uniqueness and new/returning visits without assigning a unique identifier. It is never sent to the server. Counts are estimates: reloads, blocked storage, cleared storage, multiple devices, blockers and network failures affect results. Do Not Track or Global Privacy Control disables the analytics script.

Only allowlisted numeric counters are sent, without cookies or authorization credentials. Failed batches are not retried. Exit reports are best effort. Rows older than 90 days are removed upon the next accepted collection request; no scheduled deletion runs when traffic stops.

Analytics records are accessible only through authenticated owner Cloudflare database access. There is no public analytics read API or public dashboard. Origin restrictions are not an anti-fraud guarantee against a deliberate non-browser client.

The frontend remains on GitHub Pages. Collection endpoint:
https://khairul-adam-railway-analytics.khairuladamm1993-web.workers.dev/api/anonymous-counts
