# API layer — placeholder

Reserved for task **P4**: the API Gateway HTTP API with routes to the Lambda
functions and a Cognito JWT authorizer (see `spec/design.md §6`, §14).

Defined via the CDK escape hatch (`aws-cdk-lib/aws-apigatewayv2`) and wired into
`amplify/backend.ts`. Public routes: `/api/pg/*`. Protected (JWT) routes:
`/api/preferences`, `/api/assistant`.
