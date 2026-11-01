import { defineFunction } from '@aws-amplify/backend';

/**
 * searchPG Lambda (task 3.2). defineFunction defaults entry to ./handler.ts
 * in this directory. Wired to GET /api/pg/search + granted DynamoDB read access
 * on PGMatePGs (and its GSIs) in amplify/backend.ts (task P4).
 */
export const searchPG = defineFunction({
  name: 'searchPG',
});
