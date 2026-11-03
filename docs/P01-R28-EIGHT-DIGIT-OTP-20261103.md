# P01 R2.8 — eight-digit email OTP, 3 November 2026

Owner reports the newly configured hosted email sends eight digits. The previous gateway validator accepted only six digits (`/^\d{6}$/`), then interpreted other values as URLs and rejected them before Supabase verification. This is a confirmed application input mismatch; no Owner OTP was requested or inspected.

Gateway now accepts exactly six OR eight ASCII digits as strings and sends all digits unchanged to Supabase verifyOtp, including leading zero. Invalid lengths and mixed characters remain rejected. UI and sanitized validation guidance now say 6 or 8 digits. Original strict Supabase-link recovery remains supported. Supabase still enforces expiry, one-time use and account ownership; role/profile/RLS checks are unchanged.

For consistency the separate R2 email OTP validator and input accept the same lengths. MFA authenticator validation remains exactly six digits; R2 private-room activation is not enabled by this patch.

CI's local Docker GoTrue email OTP length changes from six to eight. Email capture patterns and wrong-code mutation preserve the complete eight-digit value. This exercises actual backend validation plus Chromium/WebKit iPhone/iPad gateway and private-form scenarios. Mock unit cases retain six-digit coverage and add unchanged eight-digit forwarding with a leading zero and rejection of malformed lengths.

No hosted Auth/template/SMTP/expiry/RLS settings, accounts, Production, main, P02/P03/P04 or paid infrastructure were changed. SMTP/template changes previously saved by Owner are separate reported configuration; saving those does not establish live Owner login PASS.

Source: 3f6592c78dcb6f34442e3cb3d9f7654d3673feba.
Branch: fix/mrs10-p01-eight-digit-otp-r28-20261103.
Local: 380/380 regression + 19/19 artifact/mocked-provider checks PASS (399 total).
Final real eight-digit CI: https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/41607131027 — SUCCESS, job 125819646938; decoded logs confirm 399 unit/package plus 28 real backend/browser cases PASS with local GoTrue eight-digit OTP.
Deployment: dpl_2ehKzGgyuwhHWVEVo5HkBrjtuyKh, existing preview-safe project, staging exact code SHA — READY confirmed on exact source. Canonical alias assigned after CI SUCCESS from dpl_69MeoJC8MQETyTL7v4RWE4PQYjfX. Project SSO remains enabled for all deployments. Protected hosted Owner smoke is NOT RUN; no access bypass generated.

Canonical handoff after CI PASS: https://khairul-adam-portfolio-preview-safe.vercel.app/gateway.html . Normal Safari is intended; Private Mode is not required. Request one fresh code only after the patched Preview is ready; previously issued code may already be expired. Never cut an eight-digit code to six.

Hosted actual Owner OTP login and physical iPhone/iPad Safari acceptance: NOT RUN. Release remains NO-GO until applicable acceptance. Keep Vercel Authentication enabled for all deployments.
Rollback: Preview alias only to dpl_69MeoJC8MQETyTL7v4RWE4PQYjfX; no database rollback.
