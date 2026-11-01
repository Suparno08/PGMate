import { defineFunction } from '@aws-amplify/backend';

/** getPreferences Lambda (task 3.5). Wired to GET /api/preferences (JWT-protected). */
export const getPreferences = defineFunction({ name: 'getPreferences' });
