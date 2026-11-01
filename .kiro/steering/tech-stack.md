---
inclusion: always
---
# Tech Stack

## Frontend
- React 19, Vite 8, oxlint (existing; `"type": "module"`).
- `aws-amplify` v6 (auth + REST client) — added in task 0.2.
- `@tanstack/react-query`, `react-router-dom` — added in task 0.2.

## Backend (serverless on AWS)
- Amazon Cognito (User Pool) — auth, JWTs.
- API Gateway HTTP API — REST + Cognito JWT authorizer.
- AWS Lambda (Node.js 20.x, AWS SDK v3) — business logic.
- Amazon DynamoDB (on-demand) — `PGMatePGs` + `PGMatePreferences`.
- Amazon Bedrock (Claude) — AI assistant.
- AWS Amplify Gen 2 (TypeScript) — backend definition + hosting. DynamoDB and
  the API are defined via the **CDK escape hatch** (raw `aws-cdk-lib` constructs),
  not Amplify's `defineData`/AppSync.

## Commands
- `npm run dev` — Vite dev server (long-running; run manually in a terminal).
- `npm run build` — production build (`vite build`).
- `npm run lint` — oxlint.
- `npm run amp:sandbox` — local Amplify sandbox (needs `npm install` + AWS creds).
- `npm run amp:build` — type-check/synthesize backend (needs `npm install`).
- `npm test` — Vitest single run (added in task 0.5).

## Pinned backend devDependencies (see `package.json`)
`@aws-amplify/backend@1.25.1`, `@aws-amplify/backend-cli@1.10.0`,
`aws-cdk-lib@2.275.0`, `constructs@10.8.1`, `typescript@7.0.2` (peer-compatible).

## Environment note
This dev environment has no npm registry access and no AWS credentials. Defer
`npm install`, `amp:sandbox`, and deploys to a networked, AWS-credentialed
environment; verify the frontend with `npm run build` + `npm run lint`.
