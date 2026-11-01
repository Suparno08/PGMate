import { defineFunction } from '@aws-amplify/backend';

/** batchPG Lambda (task 3.4). Wired to POST /api/pg/batch; read grant on PGMatePGs in P4. */
export const batchPG = defineFunction({ name: 'batchPG' });
