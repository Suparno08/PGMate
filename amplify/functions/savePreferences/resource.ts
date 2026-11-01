import { defineFunction } from '@aws-amplify/backend';

/** savePreferences Lambda (task 3.6). Wired to PUT /api/preferences (JWT-protected). */
export const savePreferences = defineFunction({ name: 'savePreferences' });
