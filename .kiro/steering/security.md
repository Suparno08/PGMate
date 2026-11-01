---
inclusion: always
---
# Security (see design §14)

## AuthN / AuthZ
- Cognito User Pool issues JWTs; the API Gateway JWT authorizer validates
  issuer/audience/expiry before Lambda runs.
- Lambda trusts only `event.requestContext.authorizer.jwt.claims.sub`.
- Preferences derive `USER#{sub}` from the JWT — users read/write only their own.
- PG `contact` details returned only to authenticated callers.

## Input validation
- Every Lambda validates input against a schema (types, ranges, enums, length)
  before any DB/LLM call. Reject with `400 VALIDATION_ERROR`.

## Least-privilege IAM
- Per-function roles scoped to exact ARNs; no wildcards.

## Secrets
- No secrets in the client. Cognito config + API endpoint are non-secret in
  `amplify_outputs.json`. Bedrock uses IAM, not API keys.

## Prompt injection (assistant)
- User message in the user turn only; system prompt forbids overriding rules;
  PG data injected as context, not instructions; render model output as text.

## Transport & abuse
- HTTPS end-to-end; CORS limited to deployed SPA origins; API Gateway throttling
  (+ optional WAF); Bedrock max-tokens cap.

## PII
- Contact details and user preferences are PII; not logged; access-controlled.
