import { defineBackend } from '@aws-amplify/backend';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { HttpApi, HttpRoute, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations-alpha';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers-alpha';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { searchPG } from './functions/searchPG/resource';
import { getPG } from './functions/getPG/resource';
import { batchPG } from './functions/batchPG/resource';
import { getPreferences } from './functions/getPreferences/resource';
import { savePreferences } from './functions/savePreferences/resource';
import { assistant } from './functions/assistant/resource';

/**
 * PGMate backend (AWS Amplify Gen 2).
 *
 * Auth: Cognito User Pool (email). Data: DynamoDB + API Gateway HTTP API, all
 * via the CDK escape hatch (spec/design.md §4.1, §6, §8) — not defineData/AppSync.
 *
 * NOTE: Authored offline (no npm install / AWS here) and NOT yet type-checked or
 * deployed. Extra devDependencies required at install time: the CDK alpha
 * modules `@aws-cdk/aws-apigatewayv2-integrations-alpha` and
 * `@aws-cdk/aws-apigatewayv2-authorizers-alpha` (versioned to match
 * `aws-cdk-lib`), plus `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`,
 * `@aws-sdk/client-bedrock-runtime` for local type-checking (the Lambda Node.js
 * 20 runtime provides @aws-sdk/* at runtime; Amplify externalises them).
 */
export const backend = defineBackend({
  auth,
});

// ===========================================================================
// P1 — Data: DynamoDB tables (spec/design.md §8). DynamoDB is schemaless;
// only KEY attributes are declared here; other item attributes are written per
// item (see .kiro/steering/data-model.md).
// ===========================================================================
const dataStack = backend.createStack('pgmate-data');

// PGMatePGs — PK = "PG#{id}". (req §5)
export const pgsTable = new dynamodb.Table(dataStack, 'PGMatePGs', {
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // on-demand capacity
  pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});

// GSI1 LocationRentIndex — "PGs in <location> under <budget>" (task 1.2)
pgsTable.addGlobalSecondaryIndex({
  indexName: 'LocationRentIndex',
  partitionKey: { name: 'locationKey', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'rent', type: dynamodb.AttributeType.NUMBER },
  projectionType: dynamodb.ProjectionType.ALL,
});

// GSI2 BudgetIndex — "any PG under budget" (status=ACTIVE, rent<=budget). (1.2)
pgsTable.addGlobalSecondaryIndex({
  indexName: 'BudgetIndex',
  partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'rent', type: dynamodb.AttributeType.NUMBER },
  projectionType: dynamodb.ProjectionType.ALL,
});

// PGMatePreferences — PK = "USER#{cognitoSub}", no sort key. (req §4.8)
export const preferencesTable = new dynamodb.Table(dataStack, 'PGMatePreferences', {
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});

// ===========================================================================
// P4 — API: HTTP API + JWT authorizer + least-privilege grants (§6, §7, §14).
// ===========================================================================
const apiStack = backend.createStack('pgmate-api');

const api = new HttpApi(apiStack, 'PGMateApi', {
  // TODO(prod): restrict allowOrigins to the deployed SPA origin per env.
  corsPreflight: {
    allowOrigins: ['*'],
    allowMethods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.OPTIONS],
    allowHeaders: ['Authorization', 'Content-Type'],
  },
});

// Cognito JWT authorizer — validates issuer/audience/expiry at the gateway
// before the protected Lambdas run. (§5, §14)
const issuerUrl = auth.resources.userPool.userPoolProviderUrl;
const audience = auth.resources.userPoolClient.userPoolClientId;
const jwtAuthorizer = new HttpJwtAuthorizer('CognitoJwt', issuerUrl, {
  jwtAudience: [audience],
});

// Public routes (/api/pg/*).
new HttpRoute(apiStack, 'SearchRoute', {
  httpApi: api,
  path: '/api/pg/search',
  methods: [HttpMethod.GET],
  integration: new HttpLambdaIntegration('SearchInt', searchPG.resources.lambda as never),
});
new HttpRoute(apiStack, 'GetPGRoute', {
  httpApi: api,
  path: '/api/pg/{id}',
  methods: [HttpMethod.GET],
  integration: new HttpLambdaIntegration('GetPGInt', getPG.resources.lambda as never),
});
new HttpRoute(apiStack, 'BatchRoute', {
  httpApi: api,
  path: '/api/pg/batch',
  methods: [HttpMethod.POST],
  integration: new HttpLambdaIntegration('BatchInt', batchPG.resources.lambda as never),
});

// Protected routes (JWT authorizer): /api/preferences + /api/assistant.
new HttpRoute(apiStack, 'GetPrefsRoute', {
  httpApi: api,
  path: '/api/preferences',
  methods: [HttpMethod.GET],
  integration: new HttpLambdaIntegration('GetPrefsInt', getPreferences.resources.lambda as never),
  authorizer: jwtAuthorizer,
});
new HttpRoute(apiStack, 'SavePrefsRoute', {
  httpApi: api,
  path: '/api/preferences',
  methods: [HttpMethod.PUT],
  integration: new HttpLambdaIntegration('SavePrefsInt', savePreferences.resources.lambda as never),
  authorizer: jwtAuthorizer,
});
new HttpRoute(apiStack, 'AssistantRoute', {
  httpApi: api,
  path: '/api/assistant',
  methods: [HttpMethod.POST],
  integration: new HttpLambdaIntegration('AssistantInt', assistant.resources.lambda as never),
  authorizer: jwtAuthorizer,
});

// --- Least-privilege IAM grants + env vars (§7, §14) -------------------------
// Table-name env vars injected so handlers read process.env at runtime.
for (const fn of [searchPG, getPG, batchPG, assistant]) {
  fn.resources.lambda.addEnvironment('PGS_TABLE_NAME', pgsTable.tableName);
}
for (const fn of [getPreferences, savePreferences, assistant]) {
  fn.resources.lambda.addEnvironment('PREF_TABLE_NAME', preferencesTable.tableName);
}

// Read on PGMatePGs (incl. GSIs) for the data + assistant functions.
for (const fn of [searchPG, getPG, batchPG, assistant]) {
  pgsTable.grantReadData(fn.resources.lambda as never);
}
// Preferences: read for getPreferences + assistant; read/write for savePreferences.
preferencesTable.grantReadData(getPreferences.resources.lambda as never);
preferencesTable.grantReadData(assistant.resources.lambda as never);
preferencesTable.grantReadWriteData(savePreferences.resources.lambda as never);

// Bedrock: InvokeModel on the specific model ARN only (no wildcard). (§14)
const BEDROCK_MODEL_ID = 'anthropic.claude-3-5-haiku-20241022-v1:0';
const bedrockModelArn = `arn:aws:bedrock:${dataStack.region}:::foundation-model/${BEDROCK_MODEL_ID}`;
assistant.resources.lambda.addEnvironment('BEDROCK_MODEL_ID', BEDROCK_MODEL_ID);
assistant.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [bedrockModelArn],
  })
);
