import { defineFunction } from '@aws-amplify/backend';

/** getPG Lambda (task 3.3). Wired to GET /api/pg/{id}; read grant on PGMatePGs in P4. */
export const getPG = defineFunction({ name: 'getPG' });
