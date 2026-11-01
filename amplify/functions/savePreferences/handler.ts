/**
 * savePreferences — PUT /api/preferences (task 3.6, design §7, §12, §14).
 * Upsert the caller's preferences keyed by USER#{sub} (sub from the JWT, never
 * the request body). Validates preferredLocation, maxBudget (clamped), and
 * requiredFacilities (enum subset).
 */
import { PutCommand } from '@aws-sdk/lib-dynamodb';
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
  parseLocation,
  parseFacilities,
  ValidationError,
} from '../../shared/util';

function clampBudget(v: unknown): number | null {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new ValidationError('maxBudget must be a number');
  return Math.min(Math.max(Math.trunc(n), 1000), 100000);
}

export const handler = async (event: HttpEvent): Promise<HttpResponse> => {
  const requestId = requestIdFromEvent(event);
  try {
    const sub = requireSub(event);
    const body = event.body ? JSON.parse(event.body) : {};

    const preferredLocation = parseLocation(body.preferredLocation) ?? null;
    const maxBudget = clampBudget(body.maxBudget);
    const requiredFacilities =
      parseFacilities(
        Array.isArray(body.requiredFacilities)
          ? body.requiredFacilities.join(',')
          : body.requiredFacilities
      ) ?? [];

    await doc().send(
      new PutCommand({
        TableName: PREF_TABLE(),
        Item: {
          ...userKey(sub),
          userId: sub,
          preferredLocation,
          maxBudget,
          requiredFacilities,
          updatedAt: new Date().toISOString(),
        },
      })
    );

    log(requestId, 'info', 'savePreferences', { hasBudget: maxBudget !== null });
    return respond(200, ok({ preferredLocation, maxBudget, requiredFacilities }, requestId));
  } catch (e) {
    if (e instanceof ValidationError && e.message === 'unauthorized') {
      return respond(401, err('UNAUTHORIZED', 'authentication required'));
    }
    if (e instanceof ValidationError) {
      return respond(400, err('VALIDATION_ERROR', e.message));
    }
    if (e instanceof SyntaxError) {
      return respond(400, err('VALIDATION_ERROR', 'body must be valid JSON'));
    }
    log(requestId, 'error', 'savePreferences failed', { error: String(e) });
    return respond(500, err('INTERNAL_ERROR', 'savePreferences failed'));
  }
};
