# MRL’S10 Owner Command Center R2.2 — Progress → Issue → Evidence → ChatGPT

**Checkpoint date:** 25 October 2026 (MYT). **Branch:** `feature/owner-command-center-r22-chatgpt-actions`.

## Approved flow
1. Open dashboard and refresh source status where live APIs are supported.
2. Review **Ringkasan terbaru** for P01 (Portfolio), P02 (ECRL Web Simulator), P03 (Swift Simulator).
3. Expand **Perlu tindakan** and the exact issue. Seven unresolved checkpoint issues are inherited from R2.1.
4. Read its status and linked evidence. If evidence is unavailable, display a clear notice and the dated registry record — never invent a PASS.
5. Press **Selesaikan dengan ChatGPT**. The button opens the canonical chatgpt.com site with a contextual, public-safe issue prompt using an optional query-string prefill. Browser support is not officially guaranteed. The same prompt is also attempted on the clipboard; a collapsed manual copyable field is available if this fails.
6. ChatGPT validates current connected source state before any safe continuation; no automatic code changes, Production deploy, Supabase Auth changes, unpause, database mutation, or merge is authorized by pressing this button.

## Safety
- The URL includes **only public-safe facts** from the versioned registry. URLs can be copied, cached or saved in browser history. No OTP, verification link, admin credentials, private email, Supabase JWT, Vercel token or screenshot-secret is included.
- GitHub source `LIVE COMMIT` is not CI PASS; NO RUN is explicitly reported as not tested.
- The ChatGPT handoff may start a new chat. It cannot force ChatGPT to recover the full history of unrelated chat threads automatically, nor can it guarantee iOS opens the native ChatGPT app.
- A new chat can consult linked GitHub/Vercel tools if they are authorized, but must still verify live status, not trust historical registry wording.
- Dashboard uses Owner role check on real MR-S10. Public Visual Demo simulates a viewer with a known **public-only** registry; it is NOT evidence of working Owner authentication.

## Existing sync contracts
- Public GitHub commits + Actions: live-on-open when API responds.
- Vercel: server-side readonly adapter coded; **NOT CONNECTED** until isolated backend secrets and Owner Safari UAT.
- Swift: checkpoint-based; no local iPad auto-sync.
- ChatGPT history: no universal direct feed to this external website. Verified task results require publishing updates to the registry.

## Release gates
- Isolated Node test suite, reading catalogue, local static build, and sandbox smoke.
- Safari iPhone UAT: expand P02 Slice 1 issue; verify evidence; open ChatGPT; check correct project and safety constraints appear; confirm fallback if prefill absent; no auth credentials exposed.
- Owner/Admin access real UAT still separate from Visual Demo.
- No merge to main or Production before explicit review.
