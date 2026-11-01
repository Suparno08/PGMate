/**
 * batchPG — POST /api/pg/batch (task 3.4, design §7, §10).
 * BatchGetItem for up to 4 PGs (compare cap). Returns full records with the same
 * contact auth-gating as getPG, plus a `missing` list of any ids not found.
 */
import { BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import {
  type HttpEvent,
  type HttpResponse,
  PGS_TABLE,
  doc,
  ok,
  err,
  respond,
  log,
  requestIdFromEvent,
  pgKey,
  pgFull,
  parseIds,
  ValidationError,
} from '../../shared/util';

export const handler = async (event: HttpEvent): Promise<HttpResponse> => {
  const requestId = requestIdFromEvent(event);
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const ids = parseIds(body);

    const result = await doc().send(
      new BatchGetCommand({
        RequestItems: { [PGS_TABLE()]: { Keys: ids.map(pgKey) } },
      })
    );

    const found = (result.Responses?.[PGS_TABLE()] || []) as Record<string, unknown>[];
    const byId = new Map(found.map((it) => [String(it.id), it]));
    const missing = ids.filter((id) => !byId.has(id));

    const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
    const authenticated = Boolean(sub);
    const pgs = ids
      .map((id) => byId.get(id))
      .filter((it): it is Record<string, unknown> => Boolean(it && it.status === 'ACTIVE'))
      .map((it) => pgFull(it, authenticated));

    log(requestId, 'info', 'batchPG', { requested: ids.length, found: pgs.length, missing: missing.length });
    return respond(200, { ...ok(pgs, requestId), missing });
  } catch (e) {
    if (e instanceof ValidationError) {
      return respond(400, err('VALIDATION_ERROR', e.message));
    }
    if (e instanceof SyntaxError) {
      return respond(400, err('VALIDATION_ERROR', 'body must be valid JSON'));
    }
    log(requestId, 'error', 'batchPG failed', { error: String(e) });
    return respond(500, err('INTERNAL_ERROR', 'batchPG failed'));
  }
};
