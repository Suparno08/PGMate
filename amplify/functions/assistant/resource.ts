import { defineFunction } from '@aws-amplify/backend';

/**
 * assistant Lambda (tasks 3.7 + 3.8). Wired to POST /api/assistant (JWT-protected);
 * granted read on PGMatePGs + PGMatePreferences and bedrock:InvokeModel in P4.
 * The Bedrock model id is injected as BEDROCK_MODEL_ID in amplify/backend.ts.
 */
export const assistant = defineFunction({ name: 'assistant' });
