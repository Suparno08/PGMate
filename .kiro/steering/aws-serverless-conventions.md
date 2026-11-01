---
inclusion: always
---
# AWS Serverless Conventions

## Lambda
- One function per API route, Node.js 20.x, AWS SDK v3, stateless, idempotent
  where possible.
- Small handlers: validate → call data/AI → shape response. No sprawl.
- Configuration via environment variables injected by Amplify (table names,
  Bedrock model id, region). No secrets in code.
- Structured JSON logs with a `requestId` correlation id.

## IAM (least privilege)
- Scope each role to the exact table/index/Bedrock-model ARN it needs.
- No `dynamodb:*` or `bedrock:*` wildcards.

## DynamoDB
- Single-purpose tables (`PGMatePGs`, `PGMatePreferences`), on-demand capacity,
  point-in-time recovery.
- Design for access patterns with GSIs (key conditions, not scan filters)
  where possible; use `FilterExpression` only for low-cardinality optional
  filters.

## API
- Consistent JSON envelope for success and error (design §6.2/§6.3).
- Validate input first (return `400 VALIDATION_ERROR`) before any DB/LLM call.

## Backend definition
- Define resources in Amplify Gen 2 (`amplify/backend.ts`) via the CDK escape
  hatch (raw `aws-cdk-lib` constructs) — not `defineData`/AppSync.
