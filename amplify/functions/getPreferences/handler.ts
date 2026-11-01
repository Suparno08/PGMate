/**
 * getPreferences — GET /api/preferences (task 3.5, design §7, §12, §14).
 * Read the caller's preferences (sub from the JWT, never the request body);
 * returns null when no record exists.
 */
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  type HttpEvent,
  type HttpResponse,
  PREF_TABLE,
  doc,
  ok,
  err,
  respond,
  log,
  requestIdFromEvent,
  requireSub,
  userKey,
  ValidationError,
} from '../../shared/util';

export const handler = async (event: HttpEvent): Promise<HttpResponse> => {
  const requestId = requestIdFromEvent(event);
  try {
    const sub = requireSub(event); // P4 authorizer gates this; defensive 401 if missing
    const result = await doc().send(
      new GetCommand({ TableName: PREF_TABLE(), Key: userKey(sub) })
    );
    const item = result.Item as Record<string, unknown> | undefined;
    const prefs = item
      ? {
          preferredLocation: item.preferredLocation ?? null,
          maxBudget: item.maxBudget ?? null,
          requiredFacilities: item.requiredFacilities ?? [],
        }
      : null;
    log(requestId, 'info', 'getPreferences', { found: Boolean(item) });
    return respond(200, ok(prefs, requestId));
  } catch (e) {
    if (e instanceof ValidationError && e.message === 'unauthorized') {
      return respond(401, err('UNAUTHORIZED', 'authentication required'));
    }
    log(requestId, 'error', 'getPreferences failed', { error: String(e) });
    return respond(500, err('INTERNAL_ERROR', 'getPreferences failed'));
  }
};
