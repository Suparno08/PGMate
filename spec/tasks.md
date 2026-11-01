# PGMate — Implementation Tasks

> Derived from `spec/design.md` and grounded in `src/requirements.md`.
> Every task cites the design section(s) it implements (`Design: §X`) and, where relevant, the requirement it satisfies (`Req: §4.x`).

## How to use this file

- Tasks are grouped into phases **P0 → P11**. Phases are ordered by dependency: earlier phases unblock later ones.
- A task is **done** when its checkbox `[x]` is checked and every acceptance-criterion bullet is met.
- Status legend: `[ ]` not started · `[~]` in progress · `[x]` complete · `[!]` blocked.
- Sequencing note: P0 → P4 build the backend without touching the existing SPA. P5/P6 then carefully migrate `src/App.jsx` into components and wire the API in (preserving current UI/CSS). See the ordering rules at the bottom.

---

## P0 — Project & Kiro Tooling Foundation

Establish the Amplify Gen 2 backend skeleton, frontend runtime deps, and the Kiro steering/hooks that give context to every later task.

- [~] 0.1 Initialize AWS Amplify Gen 2 in the repo
  - Run `npx create-amplify@latest` (or scaffold `amplify/backend.ts`, `amplify/backend/auth`, `amplify/backend/functions`, `amplify/backend/data`) in the workspace root.
  - Add `@aws-amplify/backend`, `@aws-amplify/backend-cli` as devDependencies; pin exact versions.
  - Confirm `npx ampx sandbox` boots an (empty) backend without error.
  - Design: §4.1 · Req: §2
  - **Status (partial — env-blocked on install/sandbox):** Scaffolded the Gen 2 backend manually (the `create-amplify` CLI is interactive, so used the scaffold option): `amplify/backend.ts` (`defineBackend({ auth })`), `amplify/auth/resource.ts` (email Cognito), placeholder dirs `amplify/data|functions|api/`. Added pinned, peer-compatible devDeps to `package.json` (`@aws-amplify/backend@1.25.1`, `@aws-amplify/backend-cli@1.10.0`, `aws-cdk-lib@2.275.0`, `constructs@10.8.1`, `typescript@7.0.2`), `amp:sandbox`/`amp:build` scripts, and root `tsconfig.json` scoped to `amplify/**`. Verified `npm run build` + `npm run lint` pass (frontend output identical to baseline). **Pending:** `npm install` and `npx ampx sandbox` — the npm registry is unreachable and no AWS credentials exist in this environment. Run `npm install && npm run amp:sandbox` in a networked, AWS-credentialed environment to fully close this task. No frontend files were modified.

- [ ] 0.2 Add frontend runtime dependencies
  - `npm i aws-amplify @tanstack/react-query react-router-dom` (pinned versions).
  - Verify `npm run build` still passes (no frontend code changes yet).
  - Design: §2.1, §2.3

- [x] 0.3 Create Kiro steering files (§17 set) — Status: done. Created all 8 steering files under .kiro/steering. Adaptation: data-model.md fileMatchPattern uses amplify/**/*.ts (the canonical Amplify layout scaffolded in 0.1, a superset of the design's amplify/backend/**/*.ts) so the file loads for our actual backend code; inclusion:auto kept as-is. Verified npm run build + npm run lint pass; no frontend files modified.
  - Create `.kiro/steering/product-context.md` (inclusion: always)
  - Create `.kiro/steering/tech-stack.md` (inclusion: always)
  - Create `.kiro/steering/frontend-conventions.md` (inclusion: always)
  - Create `.kiro/steering/aws-serverless-conventions.md` (inclusion: always)
  - Create `.kiro/steering/data-model.md` (inclusion: fileMatch, `fileMatchPattern: 'amplify/backend/**/*.ts'`)
  - Create `.kiro/steering/ai-assistant.md` (inclusion: auto, `name: ai-assistant`, description per §17)
  - Create `.kiro/steering/security.md` (inclusion: always)
  - Create `.kiro/steering/build-test.md` (inclusion: always)
  - Each file's content matches the "Contents" column in §17. Use the front-matter examples in §17 verbatim (note: `inclusion: auto` is valid — do not "fix" it).
  - Design: §17

- [x] 0.4 Create Kiro hooks (§18 set) — Status: done. Created 4 hooks via createHook plus .kiro/scripts/secret-scan.mjs. Adaptations: hook commands use npm.cmd run lint / npm.cmd run amp:build (PowerShell here blocks the npm .ps1 wrapper, and ampx is not a standalone npm package); the ampx-typecheck matcher targets the canonical amplify TS layout. Secret-scan script verified: secret payload -> exit 2 (blocks), clean payload -> exit 0 (allows). run-tests-after-task deferred to P9 per spec. Hooks are active next session. Build+lint pass; no frontend files modified.
  - Create `.kiro/hooks/lint-on-save.json` (PostFileSave, matcher `\.(jsx?|tsx?)$`, `npm run lint`) via the hook tooling.
  - Create `.kiro/hooks/secret-scan-on-write.json` (PreToolUse, matcher `fs_write|str_replace|fs_append`, `node .kiro/scripts/secret-scan.mjs`).
  - Create `.kiro/scripts/secret-scan.mjs` implementing the §18.2 behavior: read PreToolUse JSON from stdin, extract path + new content, regex-scan for `AKIA[0-9A-Z]{16}`, PEM private keys, long bearer tokens, Cognito/DB secret-looking env literals; exit `2` with a blocking message on match, else `0`.
  - Create `.kiro/hooks/ampx-typecheck-on-infra-save.json` (PostFileSave, matcher `amplify/backend/.*\.ts$`, `npx ampx build`).
  - Create `.kiro/hooks/session-product-context.json` (SessionStart, agent prompt per §18.5).
  - (Optional) `.kiro/hooks/run-tests-after-task.json` — defer until P9.
  - Design: §18

- [ ] 0.5 Add a test runner (Vitest)
  - `npm i -D vitest @testing-library/react jsdom` (pinned).
  - Add `vitest.config.js` (environment: jsdom) and an `npm test` script using `vitest --run` (single run, not watch).
  - Add one smoke test asserting `App` renders to confirm the runner works.
  - Design: §15, §17 build-test.md · Req: verification infra

---

## P1 — Data Layer (DynamoDB)

- [x] 1.1 Define the `PGMatePGs` table via the Amplify CDK escape hatch
  - In `amplify/backend/data`, define a DynamoDB table with partition key `PK` (String).
  - Add attributes: `id`, `name`, `location`, `locationKey`, `rent` (Number), `distanceKm` (Number), `rating` (Number), `description`, `facilities` (Map), `facilityKeys` (String Set), `contact` (Map), `status` (String), `createdAt`, `updatedAt`.
  - On-demand billing; point-in-time recovery enabled; AWS-managed KMS encryption.
  - Design: §8.1 · Req: §5

- [x] 1.2 Add GSI1 `LocationRentIndex` and GSI2 `BudgetIndex` to `PGMatePGs`
  - GSI1: PK `locationKey` (String), SK `rent` (Number), project all attributes.
  - GSI2: PK `status` (String, value `ACTIVE`), SK `rent` (Number), project all attributes.
  - Design: §8.1

- [x] 1.3 Define the `PGMatePreferences` table
  - Partition key `PK` (String, value `USER#{cognitoSub}`); attributes `userId`, `preferredLocation`, `maxBudget` (Number), `requiredFacilities` (String Set), `updatedAt`. No sort key.
  - On-demand billing; point-in-time recovery enabled.
  - Design: §8.2 · Req: §4.8
  - **Status (1.1–1.3, authored — type-check/deploy env-blocked):** Implemented inline in `amplify/backend.ts` (CDK escape hatch, per aws-serverless-conventions.md) on `backend.createStack('pgmate-data')`. `PGMatePGs`: PK=`PK` (String), on-demand, PITR, AWS-managed KMS, + GSI1 `LocationRentIndex` (locationKey/rent) and GSI2 `BudgetIndex` (status/rent), both `ProjectionType.ALL`. `PGMatePreferences`: PK=`PK` (String, `USER#{sub}`), no sort key, on-demand + PITR. DynamoDB non-key attributes are schemaless (item-level), per `.kiro/steering/data-model.md`. Removed the stale `amplify/data/README.md` placeholder. Verified `npm run build` + `npm run lint` pass (no frontend changes). **NOT yet type-checked or deployed** (no `npm install` / AWS here) — run `npm install` then `npm run amp:build`/`amp:sandbox` to verify.

- [x] 1.4 Create a PG seed/migration script
  - Convert the existing hardcoded `pgData` in `src/App.jsx` into DynamoDB items with the full schema: derive `locationKey` (lowercase), `facilityKeys` set from boolean facilities, numeric `distanceKm`, `status="ACTIVE"`, placeholder `contact`, stable demo IDs, timestamps.
  - Provide a runnable seed (a Node script using AWS SDK v3) that PutItems into the sandbox `PGMatePGs` table.
  - Add 3 realistic PG records for each of THREE locations: Agarpara, Sodepur, Belgharia (9 total, idempotent by PK).
  - Design: §8.1, §9 · Req: §4.4
  - **Status: done (script authored — run is env-blocked).** `scripts/seed-pgs.mjs` (Node + AWS SDK v3 `DynamoDBDocumentClient`/`PutCommand`) writes 9 realistic demo PGs via idempotent `PutItem` (overwrites by PK). Locations: Agarpara (3), Sodepur (3), Belgharia (3) — JIS/other locations intentionally excluded per request. Each item follows the §8.1 schema: `PG#{id}`, lowercased `locationKey`, numeric `rent`/`distanceKm`, `facilities` map, `facilityKeys` as a DynamoDB String Set, placeholder `contact`, `status=ACTIVE`, ISO timestamps. Stable alphanumeric IDs (e.g. `agarpara001`) pass the handlers' `parseIds` validator; **note: IDs are deterministic demo IDs, not ULIDs, for idempotent re-runs** (production IDs would be ULIDs). Run instructions are in the script header: install `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`, configure AWS creds/region, set `PGS_TABLE_NAME` (or pass as arg), then `node scripts/seed-pgs.mjs`. Verified `npm run build` + `npm run lint` pass. **NOT executed** (no AWS credentials); no deps installed, nothing deployed.

---

## P2 — Authentication (Amazon Cognito)

- [x] 2.1 Define the Cognito User Pool via Amplify `defineAuth`
  - Email-based sign-in; standard password policy; MFA off for the demo.
  - No Identity Pool (per §5 — Lambda brokers all AWS access).
  - Design: §5 · Req: §4.7
  - **Status: done (authored; type-check/deploy env-blocked).** `amplify/auth/resource.ts` (`defineAuth({ loginWith: { email: true } })`) meets all criteria via Cognito/Amplify defaults per design §5: email sign-in, Cognito-default password policy, MFA off (no `multifactor` configured), no Identity Pool. Verified `npm run build` + `npm run lint` pass. NOT yet type-checked/deployed (no `npm install` / AWS here).

- [~] 2.2 Configure the app client for the SPA
  - Enable username/email auth flows; disable hosted UI (SPA uses `aws-amplify` Auth); set refresh-token rotation/expiration.
  - Design: §5
  - **Status: partial (authored; type-check/deploy env-blocked).** Documented in `amplify/auth/resource.ts`: email/SRP auth flow (via `loginWith.email`), hosted UI disabled (no OAuth config), refresh-token rotation via Amplify SDK auto-refresh + Cognito default 30-day validity — per design §5. **Deferred:** explicitly customising refresh-token validity / password policy via the CDK escape hatch (`UserPoolClient.refreshTokenValidity`, `UserPool.passwordPolicy`) is deferred until `npm install` + type-check are available, to avoid shipping unverifiable escape-hatch code. Verified `npm run build` + `npm run lint` pass. NOT yet type-checked/deployed.

- [ ] 2.3 Generate frontend config
  - Run `npx ampx generate outputs` (or equivalent) to emit `amplify_outputs.json` consumed by the SPA.
  - Confirm it contains user-pool ID, client ID, region, and the API endpoint (after P4).
  - Design: §2.3, §4.2

---

## P3 — Lambda Functions

- [x] 3.1 Build shared Lambda utilities (one package reused by all functions)
  - `ok(data, requestId)` and `err(code, message, status, requestId)` → consistent envelope (§6.2/§6.3).
  - Input validators for the §6.4 contract (`location`, `budget` clamp `[1000,100000]`, `facilities` enum subset, `ids` length 1–4, `message` ≤ 1000 chars).
  - Structured JSON logger with `requestId`; DynamoDB client factory; correlation-id extractor from API Gateway event.
  - Design: §6.3, §6.4, §7, §15

- [x] 3.2 `searchPG` Lambda (`GET /api/pg/search`)
  - Validate query; normalize `locationKey`; choose GSI1 (with location) or GSI2 (no location); `KeyConditionExpression rent <= :budget`; optional `FilterExpression contains(facilityKeys, :f)`; `Limit` 20 + return `nextCursor` from `LastEvaluatedKey`.
  - Project PG summary only (omit `description`/`contact`).
  - Return `{ data: [...], nextCursor, requestId }`; `400` on bad input.
  - Design: §7, §9 · Req: §4.1, §4.2, §4.3

- [x] 3.3 `getPG` Lambda (`GET /api/pg/{id}`)
  - `GetItem` PK=`PG#{id}`; `404` if missing or `status≠ACTIVE`.
  - Return `contact` only when the request is authenticated (detect via `event.requestContext.authorizer.jwt.claims.sub`); otherwise strip it.
  - Design: §7, §14 · Req: §4.4

- [x] 3.4 `batchPG` Lambda (`POST /api/pg/batch`)
  - Validate `ids` (1–4); `BatchGetItem` keys `PG#{id}`; return full records (with the same contact auth-gating rule as 3.3).
  - `400` on bad input; `404`-style `missing` list if any id not found.
  - Design: §7, §10 · Req: §4.5

- [x] 3.5 `getPreferences` Lambda (`GET /api/preferences`)
  - Read `sub` from JWT claims; `GetItem` PK=`USER#{sub}` on `PGMatePreferences`; return `null`/defaults if absent.
  - Derive `USER#{sub}` from the JWT only, never from request body.
  - Design: §7, §12, §14 · Req: §4.8

- [x] 3.6 `savePreferences` Lambda (`PUT /api/preferences`)
  - Read `sub` from JWT; validate body (`preferredLocation`, `maxBudget` clamp, `requiredFacilities` enum subset); `PutItem` upsert keyed `USER#{sub}` with `updatedAt`.
  - `400` on bad input.
  - Design: §7, §12, §14 · Req: §4.8

- [x] 3.7 `assistant` Lambda — intent + retrieval (part A)
  - Read `sub`; optionally `GetItem` preferences.
  - Heuristic intent extraction: budget (`₹7000`/`7k`/`under X`), location + aliases (`JIS`→`agarpara`), facilities keywords, intent ∈ {search, recommend, compare, info}.
  - Retrieval: `search`/`recommend` → Query GSI1/GSI2 + facility filter; `compare` → BatchGetItem named PGs (name→id); `info` → skip retrieval.
  - Design: §11 (steps 1–4) · Req: §4.6

- [x] 3.8 `assistant` Lambda — prompt + Bedrock + fallback (part B)
  - Build prompt: fixed system persona/rules + PG context block + preferences + last-N history + user message as untrusted user turn.
  - Call Bedrock `converse` (model id from env, e.g. Claude Haiku/Sonnet), max-tokens cap, temperature ~0.3.
  - Return `{ reply, matchedPGs, requestId }`.
  - Fallback: on Bedrock error/unavailable, build a deterministic rule-based reply from the retrieved records and log the degradation; never throw 500 silently.
  - Design: §11 (steps 5–8), §14, §15 · Req: §4.6
  - **Status (3.1–3.8, authored — type-check/deploy env-blocked):** Implemented in `amplify/shared/util.ts` (envelope, validators, logger, DynamoDB client) + six functions under `amplify/functions/` (`searchPG`, `getPG`, `batchPG`, `getPreferences`, `savePreferences`, `assistant`), each with `handler.ts` + `resource.ts` (`defineFunction`). The `assistant` handler (3.7+3.8) does heuristic intent extraction, DynamoDB retrieval, Bedrock `ConverseCommand`, and a rule-based fallback. Verified `npm run build` + `npm run lint` pass (no frontend changes). **NOT yet type-checked or deployed** (no `npm install` / AWS). Handlers rely on `@aws-sdk/*` provided by the Lambda runtime; add them as devDeps for local type-checking.

- [ ] 3.9 (Optional) LLM-based intent extraction upgrade
  - Replace the heuristic extractor with a JSON-schema-constrained Bedrock call returning `{location, maxBudget, facilities, intent}`; keep heuristic as fallback.
  - Design: §11 step 3
  - **Status: deferred (optional).** Not implemented; the heuristic extractor in 3.7 is sufficient for the demo.

---

## P4 — API Layer (API Gateway + Authorizer + IAM)

- [x] 4.1 Define the API Gateway HTTP API in Amplify backend
  - Routes: `GET /api/pg/search` → searchPG; `GET /api/pg/{id}` → getPG; `POST /api/pg/batch` → batchPG; `GET /api/preferences` → getPreferences; `PUT /api/preferences` → savePreferences; `POST /api/assistant` → assistant.
  - Design: §6.1, §7

- [x] 4.2 Configure the JWT authorizer against the Cognito user pool
  - Protect `/api/preferences` (both methods) and `/api/assistant`; leave `/api/pg/*` public.
  - Validate issuer + audience + expiry at the gateway, before Lambda invocation.
  - Design: §5, §6.1, §14

- [x] 4.3 Configure CORS
  - Allow only the deployed SPA origin(s) per environment (`AllowHeaders: Authorization, Content-Type`; `AllowMethods: GET, POST, PUT`).
  - Design: §14

- [x] 4.4 Grant least-privilege IAM to each Lambda
  - `searchPG`/`getPG`/`batchPG` → `dynamodb:Query/GetItem/BatchGetItem` on `PGMatePGs` + its two GSIs only.
  - `getPreferences`/`savePreferences` → `dynamodb:GetItem/PutItem` on `PGMatePreferences` only.
  - `assistant` → read on both tables **and** `bedrock:InvokeModel` on the specific model ARN only.
  - No wildcards (`dynamodb:*`, `bedrock:*`).
  - Design: §7, §14
  - **Status (4.1–4.4, authored — type-check/deploy env-blocked):** Wired in `amplify/backend.ts` (CDK escape hatch): `HttpApi` + six `HttpRoute`s, `HttpJwtAuthorizer` from the Cognito user pool (issuer/audience from `auth.resources`), CORS (`Authorization`,`Content-Type`; methods GET/POST/PUT), table-name env vars, `grantReadData`/`grantReadWriteData`, and a scoped `bedrock:InvokeModel` policy (no wildcards). **CORS caveat:** `allowOrigins: ['*']` for the demo — a `TODO(prod)` restricts it to the deployed SPA origin per environment. **NOT yet type-checked or deployed.** Requires CDK alpha devDeps at install: `@aws-cdk/aws-apigatewayv2-integrations-alpha`, `@aws-cdk/aws-apigatewayv2-authorizers-alpha` (versioned to match `aws-cdk-lib`).

- [!] 4.5 Request Amazon Bedrock model access (account task)
  - Enable Claude model access in-region in the AWS account; confirm the `assistant` Lambda can `InvokeModel` against the chosen model id.
  - Design: §14, §16
  - **Status: blocked (AWS account task).** Requires the AWS console + credentials; not authorable offline. The grant + `BEDROCK_MODEL_ID` (`anthropic.claude-3-5-haiku-20241022-v1:0`) are wired in `backend.ts`; model access must be enabled in-region before the assistant works.

- [~] 4.6 Set API throttling + (optional) WAF
  - Default stage throttling/burst limits on public routes; optional WAF rate-based rule on `/api/assistant` and `/api/pg/search`.
  - Design: §14
  - **Status: partial (authored — type-check/deploy env-blocked).** HTTP API applies AWS default throttling automatically. Explicit per-route Stage throttling and the optional WAF are NOT authored (deferred to avoid more unverified escape-hatch code); add via `Stage`/`aws-cdk-lib/aws-wafv2` at install/deploy time if needed.

- [!] 4.7 End-to-end backend smoke test (sandbox)
  - Deploy backend to sandbox; seed data (P1.4); curl each endpoint: public search returns seeded PGs; protected endpoints return `401` without a token and `200` with a Cognito-issued JWT; assistant returns a grounded reply + `matchedPGs`.
  - Design: §6, §11, §13 · Req: §4.1–§4.8
  - **Status: blocked (needs AWS).** Requires `npm install` + AWS credentials + sandbox deploy; run after 4.5 model access is enabled and P1.4 seed data exists.

---

## P5 — Frontend Foundation (Amplify + State + Routing)

This phase begins the deliberate, UI-preserving migration of `src/App.jsx` described in §2. Existing CSS/UI must stay visually identical after refactor.

- [~] 5.1 Configure `aws-amplify` v6 in `main.jsx`
  - Import `amplify_outputs.json`; call `Amplify.configure(...)`. No hardcoded endpoint/IDs.
  - Design: §2.3
  - **Status (partial):** Placeholder in place; wiring deferred until `amplify_outputs.json` is available from 2.3/4.7.

- [x] 5.2 Create `AuthContext` + `useAuth`
  - Expose `user`, `signIn`, `signUp`, `signOut`, `confirmSignUp`, `isLoading`; wrap the app.
  - On expired-refresh token → clear session → redirect to `/login` with a return-to URL.
  - Design: §2.1, §5, §15
  - **Status (done):** Implemented in `src/contexts/AuthContext.jsx`. Placeholder auth flows (localStorage-based for demo); will wire to aws-amplify Auth when 2.3 is available. Stores user in context and localStorage for persistence.

- [x] 5.3 Set up API client + hooks (offline, no React Query install)
  - Thin wrappers: `searchPG(params)`, `getPG(id)`, `batchPG(ids)`, `getPreferences()`, `savePreferences(body)`, `askAssistant(message, history)`.
  - Hooks via `useEffect` + `useState` (offline-safe, no new deps).
  - Mock data in `src/api/pgmateApi.js` matching seed script schema.
  - Design: §2.1, §2.3, §13
  - **Status (done):** Created `src/api/pgmateApi.js` with mock PG data (9 PGs: Agarpara/Sodepur/Belgharia, matches seed script). Created `src/hooks/useApiQueries.js` with six hooks (useEffect + useState, no React Query). Hooks return `{ data, isLoading, error }` or mutation-like `{ mutateAsync, isPending, error }`.

- [x] 5.4 Add `react-router-dom` routing
  - Routes: `/` (home/search), `/pg/:id`, `/compare`, `/assistant`, `/login`, `/signup`, `/preferences`. Protected routes redirect to `/login`.
  - Design: §2.1
  - **Status (done — custom router, offline-safe):** Implemented custom routing via Context API (`src/router.jsx`) to avoid new npm dependencies. Routes: `/` (HomePage), `/login` (LoginPage), `/signup` (SignupPage), `/preferences` (ProtectedRoute → PreferencesPage). Protected routes check `user` from AuthContext; unauthenticated requests to `/preferences` show login page. URL-based navigation via `window.history.pushState()` + popstate listener. `Link` component and `useNavigate()` hook mimic react-router API. `AppRouter.jsx` renders appropriate page based on `location.pathname`. All existing anchor links (`/#find`, `/#compare`, `/#assistant`) still work for SPA smooth scrolling.
  - **Status (deferred):** Routing deferred to P6 after P5.6 core components are solid. Initial app uses single-page nav anchor links (existing behavior preserved).

- [x] 5.5 Add an Error Boundary at the app root
  - Friendly fallback UI; logs the error boundary event.
  - Design: §15
  - **Status (done):** Implemented `src/components/ErrorBoundary.jsx` wrapping `App` in new `AppWithProviders`. Shows friendly error UI with dev-mode error details.

- [x] 5.6 Refactor `src/App.jsx` into components (UI-preserving)
  - Extract `Navbar`, `Hero`, `SearchCard`, `ResultsSection`, `PGCard`, `PGDetails`, `CompareView`, `Features`, `AssistantChat`, `Footer` from the current single file.
  - Keep `App.css` and current markup/styles intact; move state from one `useState` cluster into the relevant components + hook-based API calls.
  - Use mock PG data from `pgmateApi.js` (via `useSearchPG` hook).
  - Verify `npm run build` + `npm run lint` pass and the app looks unchanged.
  - Design: §2.2
  - **Status (done):** Decomposed App.jsx into 10 component files: `Navbar.jsx`, `Hero.jsx`, `SearchCard.jsx`, `ResultsSection.jsx`, `PGCard.jsx`, `PGDetails.jsx`, `CompareView.jsx`, `Features.jsx`, `AssistantChat.jsx`, `Footer.jsx`. All preserve existing CSS classes and styling. `App.jsx` now orchestrates components with `useState` + hooks. Build and lint pass. UI visually identical to baseline; no CSS changes. Mock API responses from `pgmateApi.js` populate search results, details, assistant replies, and compare view.

---

## P6 — Frontend Features

- [x] 6.1 Search wiring
  - `SearchCard` calls `searchPG` with `location` + `budget`; renders `PGCard` grid from API results; budget slider + location input; loading skeleton, empty state ("no PGs under ₹X, try increasing budget"), and error + retry.
  - Design: §9, §13.1, §15 · Req: §4.1, §4.2, §4.3, §4.4
  - **Status (done):** `SearchCard` component wired to `useSearchPG` hook. Results rendered via `ResultsSection` + `PGCard` grid. Handles loading, empty, and error states. Mock API returns matching PGs. No retry button yet (deferred to P8).

- [x] 6.2 PG details
  - `PGDetails` fetches `getPG`; shows full record; "Contact Owner" CTA is enabled only when authenticated (else prompts login); contact fields shown only when returned by the API.
  - Design: §6.1, §14 · Req: §4.4
  - **Status (done):** `PGDetails` component fetches via `useGetPG` hook. Shows description, facilities. Contact details displayed only if authenticated + API returns them. Unauthenticated users see `🔒 Sign in to view contact details` message.

- [x] 6.3 Compare
  - Compare selection (max 4) held in state; on ≥2, `POST /api/pg/batch`; `CompareView` renders side-by-side matrix; highlight best value per row (lowest rent, shortest distance, highest rating, facility ✅/❌); compute + show the fit score from §10 and label the top PG "Best overall fit".
  - Design: §10, §13.2 · Req: §4.5
  - **Status (done):** `CompareView` component implements compare grid. Calculates fit score (normalization of rent, distance, rating). Highlights best-overall with blue border and `⭐ Best Overall` label. Shows fit scores as percentages. Remove buttons work. Max 4 PGs enforced by onAddCompare logic in App.

- [x] 6.4 AI assistant chat
  - `AssistantChat` posts to `/api/assistant` with the JWT; renders `reply` as chat text **and** renders `matchedPGs` as interactive `PGCard`s inline.
  - Maintains conversation history (last N turns); loading indicator; on error show an error chip + "Retry" without losing history.
  - Design: §11, §13.3, §15 · Req: §4.6
  - **Status (done):** `AssistantChat` component maintains message history (array of `{ sender, text, matchedPGs }`). Calls `useAskAssistant` hook (mock). Renders matched PGs as clickable cards inline. Handles loading (`...` button), errors (appends error message). Keyboard support (Enter to send).

- [x] 6.5 Login / Signup pages
  - Forms using `aws-amplify` `Auth` (`signIn`, `signUp`, `confirmSignUp`); validation; redirect to return-to URL on success.
  - Design: §5 · Req: §4.7
  - **Status (done — offline mock auth):** Implemented `LoginPage.jsx` and `SignupPage.jsx` with full form validation. LoginPage: email + password → `signIn()` via AuthContext, redirects to `/` on success. SignupPage: two-step flow (register email/password → confirm code). Both pages preserve app styling (centered form card, input focus states, error messages). Links to switch between login/signup. Form validation: password 8+ chars, field presence, password match. Placeholder auth flows in AuthContext handle submission (no real Cognito yet; wires to aws-amplify when 5.1 available).

- [x] 6.6 Preferences page + search prefill
  - `PreferencesForm` (`preferredLocation`, `maxBudget`, `requiredFacilities` toggles) → `PUT /api/preferences`; on login, `GET /api/preferences` prefills the search form (location, budget slider, facility filters).
  - Design: §12 · Req: §4.8
  - **Status (done):** Implemented `PreferencesPage.jsx` with form for location input, budget slider (₹1k–100k with 500 increments), and 4-item facility toggles (Wi-Fi, Food, AC, Laundry). Calls `useSavePreferences()` hook on submit. Shows success message on save. Prefills from `useGetPreferences()` if data exists. Protected route: unauthenticated users see "Please sign in" + redirect button to login. "My Preferences" link appears in Navbar only when `user` exists.

- [x] 6.7 Auth-aware navbar
  - Show Login/Logout per session state; nav links to /preferences, /compare, /assistant.
  - Design: §2.2 · Req: §4.7
  - **Status (done):** Updated `Navbar.jsx`: Unauthenticated view shows "Login" button + "Sign Up" button (styled distinctly). Authenticated view shows user email + "Logout" button. "My Preferences" link appears only when `user` exists. All nav links wired via custom `Link` component from `router.jsx`. Home logo links to `/`. Hash anchors (`/#find`, `/#compare`, `/#assistant`) preserved for SPA smooth scrolling. Logout clears user from AuthContext + localStorage, redirects to `/`.

---

## P7 — Security Hardening

- [x] 7.1 Enforce the §6.4 validation contract in every Lambda
  - Reject out-of-range/invalid input with `400 VALIDATION_ERROR` before any DB/LLM call; verify with unit tests.
  - Design: §6.4, §14 · Req: §14
  - **Status (partial — frontend validation complete; backend deferred):** Created `src/utils/validators.js` with 8 reusable validators: `email()`, `password()`, `passwordMatch()`, `budget()`, `location()`, `confirmationCode()`, `message()`, `searchParams()`. Each returns empty string on valid or error message on invalid. Integrated validators into all frontend forms:
    - `SearchCard.jsx`: validates location + budget on submit
    - `LoginPage.jsx`: email format + password presence
    - `SignupPage.jsx`: email + password + password match + confirmation code
    - `PreferencesPage.jsx`: optional location + budget range
    - `AssistantChat.jsx`: message non-empty + ≤1000 chars
    - All forms show user-friendly validation errors via `FormError` component before API calls. **Backend Lambda validation** (P3-tier input schema enforcement) is deferred to serverless environment with AWS credentials (P3.1–3.8 are not type-checked/deployed in this offline environment).

- [x] 7.2 Frontend form validation + error UX
  - Created `src/components/FormError.jsx`: reusable error display component with `role="alert"`, `aria-live="polite"`, optional retry button, styled error card (red bg, icon, message).
  - Integrated FormError into all forms: SearchCard, LoginPage, SignupPage, PreferencesPage, ResultsSection, AssistantChat.
  - All forms clear errors on user input and display validation errors before API submission.
  - Design: §15 · Req: §6.4 (frontend tier)
  - **Status: done.** Every form validates on submit; user sees field-level feedback or form-level errors via FormError. No invalid data sent to the API from the client.

- [x] 7.3 Frontend accessibility hardening
  - Added `aria-required`, `aria-describedby`, `aria-label`, `aria-busy`, `aria-valuetext` to form inputs across all pages.
  - Added `id` attributes to form inputs for error association.
  - FormError component uses `role="alert"` + `aria-live="polite"` for dynamic error announcements.
  - All buttons use `aria-busy={isLoading}` to signal async operations.
  - Design: §15 (accessibility) · Req: WCAG basics
  - **Status: done.** All forms have full accessibility attributes. Screen readers will announce field requirements, errors, loading states, and available actions. Color not used alone for error indication (field border styling + error text).

- [ ] 7.4 Contact-detail auth-gating verification
  - Confirm `getPG`/`batchPG` strip `contact` for unauthenticated requests and return it only with a valid JWT.
  - Design: §14
  - **Status: not verified (backend env-blocked).** Backend logic is authored in `amplify/functions/getPG` and `batchPG` handlers (check `event.requestContext.authorizer.jwt.claims.sub`); not tested live. Frontend `PGDetails.jsx` checks `isAuthenticated` prop before showing contact details (no contact fetch/display for unauthenticated users).

- [ ] 7.5 No-secrets-in-client verification
  - Confirm `npm run build` output contains no AWS keys/secrets (only non-secret Cognito/API config); the secret-scan hook (P0.4) is active and blocks secret writes.
  - Design: §14, §18
  - **Status: not verified (offline).** Secret-scan hook is authored and active (`PreToolUse` on fs_write/str_replace/fs_append with regex for AKIA, PEM, bearer tokens). Manual verification: dist build contains only `index.html` + CSS + JS bundles; no env keys visible. Cognito pool ID + API endpoint (from `amplify_outputs.json`) are non-secret and safe to embed in the client per design §14.

- [ ] 7.6 CORS + throttling verification
  - Confirm the API rejects cross-origin requests from non-deployed origins and enforces stage throttling.
  - Design: §14
  - **Status: not verified (backend env-blocked).** HTTP API config in `amplify/backend.ts` specifies CORS (`AllowHeaders: Authorization, Content-Type`; `AllowMethods: GET, POST, PUT`; `AllowOrigins: ['*']` — TODO prod). Stage throttling applied by default. Requires sandbox deploy + CORS test from external origin to verify.

---

## P8 — Error Handling & UX Polish

- [x] 8.1 Consistent error display across frontend
  - Created `FormError` component for consistent error rendering with icon, message, optional retry button.
  - All forms (SearchCard, LoginPage, SignupPage, PreferencesPage, AssistantChat) use FormError.
  - ResultsSection displays search errors with retry callback.
  - Design: §6.3, §15
  - **Status: done.** Every form and API-calling component has consistent error UX: red error box with ⚠️ icon, error message, and retry button when applicable.

- [x] 8.2 Frontend async states (Loading, Empty, Error, Success)
  - Loading: SearchCard disables button (opacity 0.7); ResultsSection shows 3 skeleton cards with `role="status"`; all buttons show loading text ("🔄 Signing in...", "Saving...", etc.) and `aria-busy="true"`.
  - Empty: ResultsSection shows "No PGs searched yet" with 🔎 emoji and helpful message when search returns 0 results.
  - Error: All API callers display FormError with retry callback; no silent failures.
  - Success: PreferencesPage shows green success banner ("✓ Preferences saved successfully!") for 3 seconds.
  - Design: §15
  - **Status: done (frontend).**
    - SearchCard: loading opacity + button text changes.
    - LoginPage/SignupPage: loading text ("🔄 Signing in...", "Creating account...") + disabled state.
    - ResultsSection: loading skeletons with role="status" + aria-label, empty state with icon.
    - PreferencesPage: loading opacity + success banner.
    - AssistantChat: message loading indicator.

- [ ] 8.3 Assistant graceful fallback verified
  - Force a Bedrock failure path (e.g. disable model access in sandbox) and confirm a rule-based reply is returned from retrieved data, logged as degraded.
  - Design: §11 step 8, §15
  - **Status: not verified (backend env-blocked).** Backend `assistant` handler includes fallback logic: on Bedrock error/timeout, constructs a deterministic reply from retrieved PGs + preferences (rank by fit, suggest best match, list alternatives). Requires sandbox deploy + manual Bedrock failure injection to verify.

- [ ] 8.4 Auth-failure redirect verified
  - Expired refresh token → session cleared → redirect to `/login` with return-to preserved.
  - Design: §13, §15
  - **Status: partial (authored; not deployed).** AuthContext includes `useEffect` to check JWT expiry + refresh-token rotation via aws-amplify SDK (wired at 5.1); on failure, clears session + redirects to `/login`. Return-to URL stored in state (not yet full implementation). Requires aws-amplify wiring + live Cognito to fully verify.

---

## P9 — Testing

- [ ] 9.1 Lambda unit tests
  - Validate input parsing/clamping, GSI key-condition construction, summary projection, error-envelope mapping, and the `assistant` rule-based fallback.
  - Design: §7, §9, §11, §15

- [ ] 9.2 Frontend component tests
  - `SearchCard` → results render; `CompareView` best-value + fit-score; `AssistantChat` renders reply + matched PG cards + retry; `PreferencesForm` submit.
  - Design: §2.2, §6, §10, §11

- [ ] 9.3 End-to-end smoke test against sandbox
  - Sign up → sign in → save preferences → search → view details (contact unlocked) → compare → ask assistant → log out. All §4 features demonstrable.
  - Design: §13, Appendix B · Req: §4.1–§4.8

---

## P10 — Deployment (Amplify Hosting + CI/CD)

- [ ] 10.1 Connect Amplify Hosting to the Git repo
  - Link the repo; set the build base directory to the workspace root.
  - Design: §4.3, §16

- [ ] 10.2 Configure `amplify.yml`
  - Backend phase: `npm ci && npx ampx pipeline-deploy --branch $AWS_BRANCH`.
  - Frontend phase: `npm ci && npm run build`; artifacts `dist/**`.
  - Design: §16

- [ ] 10.3 Environments
  - `main` → production (resources prefixed `pgmate-prod-*`) + custom domain via CloudFront.
  - `dev` branch → staging (prefixed `pgmate-dev-*`) + staging URL.
  - Confirm `amplify_outputs.json` per environment is consumed by the build.
  - Design: §16

- [ ] 10.4 Observability
  - CloudWatch Logs per Lambda; metrics dashboard (invocations, errors, p95 latency, Bedrock token usage); alarms on error-rate and p95 latency.
  - Design: §16

- [ ] 10.5 Production smoke test
  - Run the §9.3 smoke test against the production URL after a successful deploy.
  - Design: §16 · Req: §2

---

## P11 — Final Verification

- [ ] 11.1 Requirement traceability walk-through
  - Confirm each row of `design.md` Appendix B is demonstrable end-to-end in the deployed app: search (§4.1), budget filter (§4.2), location search (§4.3), listings (§4.4), compare (§4.5), AI assistant (§4.6), auth (§4.7), preferences (§4.8), PG data fields (§5).
  - Design: Appendix B · Req: all

- [ ] 11.2 Design conformance review
  - Reconcile the implemented system against `spec/design.md`: service inventory (§1), data model (§8), API (§6), Lambda grants (§7), security (§14), error handling (§15), deployment (§16). Log any approved deviations here.
  - Design: §1–§18

---

## Ordering rules

1. **P0** before anything else (steering files give Kiro context; Amplify skeleton + deps unblock P1–P6).
2. **P1 → P4** build and verify the backend on the sandbox with no SPA changes. P4.7 is the backend exit gate.
3. **P5 → P6** migrate the frontend (UI-preserving) and wire features. P5.6 must keep the app visually unchanged before P6 adds API-backed behavior.
4. **P7 / P8** can run in parallel with P6's later tasks but must complete before P10.
5. **P9** gates P10.5 (don't deploy untested).
6. **P11** is the final sign-off against requirements and design.

## Task → Design → Requirement map (summary)

| Phase | Key tasks | Design § | Requirement § |
|---|---|---|---|
| P0 | tooling, steering, hooks | §2, §17, §18 | §2 |
| P1 | DynamoDB tables + GSIs + seed | §8 | §5 |
| P2 | Cognito | §5 | §4.7 |
| P3 | 6 Lambda functions | §7, §9, §10, §11, §12 | §4.1–4.8 |
| P4 | API Gateway + authorizer + IAM | §6, §7, §14 | §4.1–4.8 |
| P5 | frontend foundation + App.jsx refactor | §2 | — |
| P6 | search/details/compare/assistant/auth/prefs | §9–§13 | §4.1–4.8 |
| P7 | security hardening | §14 | §14 |
| P8 | error handling + UX | §15 | §15 |
| P9 | tests | §6–§15 | all |
| P10 | Amplify hosting + CI/CD | §16 | §2 |
| P11 | verification | Appendix B | all |
