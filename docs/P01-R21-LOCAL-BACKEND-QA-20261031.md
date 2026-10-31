# P01 R2.1 local backend QA — actual execution receipt

Base R2 checkpoint: 2d00e603359eb5b11527aff454f282b72fabe6ae. No application code, Production, cloud project, billing or P02/P03/P04 changed.

## Attempt

Supabase CLI 2.122.0, native Linux amd64, glibc 2.39. Docker/Podman unavailable. Started a single named local stack `mrs10-p01-r21-local` with native PostgreSQL assigned to the existing non-root vscode account. Local data was isolated under `/tmp/mrs10-r21-native`. Only database, Auth, REST and test mail capabilities were requested. No real Owner data or accounts were copied.

Command: `SUPABASE_EXPERIMENTAL_STACK=1 SUPABASE_NATIVE_POSTGRES_USER=vscode supabase start --stack mrs10-p01-r21-local --runtime native --exclude studio,functions,analytics,pooler,realtime,storage --eager` (task-specific SUPABASE_HOME also set).

## Observed failure

CLI exited 1 with `ExperimentalStackStartError`: unable to prepare PostgreSQL 17.11.0.006-r0 artifact. Its downloader returned `getaddrinfo ETIMEOUT` for both github.com and supabase-cli-artifacts.s3.us-east-1.amazonaws.com while requesting the PostgreSQL manifest. PostgreSQL readiness was never reached.

A second attempt retaining inherited proxy settings and adding `NODE_USE_ENV_PROXY=1` also exited 1 with the same download error. A control request to the exact GitHub manifest using Python urllib through the existing configured proxy returned HTTP 200, valid JSON, 2127 bytes. Thus blanket host unavailability is NOT established; the observed fault is specific to the CLI download path in this environment. No proxy bypass, TLS disablement or network-policy change was used. Filesystem chown to vscode also returned Invalid argument; non-root data ownership readiness remains unverified after the earlier artifact download blocker.

## Real backend acceptance results

- Native stack startup: FAIL before database readiness.
- Actual PostgreSQL RLS and Owner/Member records: NOT RUN.
- Real Supabase OTP, MFA, recovery and account switching: NOT RUN.
- Six real-database Owner isolation scenarios: NOT RUN.
- Browser tests against actual backend: NOT RUN.
- HTTPS integrated Preview and physical Safari UAT: NOT RUN.

Existing R2 mock PASS evidence remains mock evidence and does not satisfy any of the above gates. No fresh mock regression was used as a substitute.

## Free alternatives and exact next gates

1. Resolve the CLI's support for the configured proxy, or prepare official checksum-verified native artifacts through an approved compatible download path. Then verify non-root PostgreSQL startup before attempting Auth/RLS.
2. Use an existing Docker-enabled development machine or a standard runner under the existing repository for a completely local Supabase stack, subject to available free runner quota. Do not create cloud projects or activate paid runner capacity.
3. Apply synthetic-only baseline role/schema plus the reviewed R2 SQL proposal in that local database; test active-session and AAL2 RLS, OTP expiry/replay, MFA and account switching.
4. Run the six browser/database privacy cases and legacy recovery checks with real services; require zero public/member Owner-data reads and no persistent private browser payloads.
5. Only after backend integration passes, provide a reviewed HTTPS endpoint reachable by the iPad, exact callback allowlist and no-store/session controls, then perform physical Safari Owner UAT.

Release remains NO-GO. A free hosted project is not created or treated as authorized by this receipt.
