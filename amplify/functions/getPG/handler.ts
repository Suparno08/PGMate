/**
 * getPG — GET /api/pg/{id} (task 3.3, design §7, §14).
 * GetItem PK=PG#{id}; 404 if missing or status≠ACTIVE. `contact` is returned
 * only when the request is authenticated (a Cognito JWT sub is present).
 */
import { GetCommand } from '@aws-sdk/lib-dynamodb';
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
  ValidationError,
} from '../../shared/util';

export const handler = async (event: HttpEvent): Promise<HttpResponse> => {
  const requestId = requestIdFromEvent(event);
  try {
    const id = event.pathParameters?.id;
    if (!id) throw new ValidationError('id is required');

    const result = await doc().send(
      new GetCommand({ TableName: PGS_TABLE(), Key: pgKey(id) })
    );
    const item = result.Item as Record<string, unknown> | undefined;

    if (!item || item.status !== 'ACTIVE') {
      log(requestId, 'info', 'pg not found', { id });
      return respond(404, err('NOT_FOUND', 'PG not found'));
    }

    const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
    const authenticated = Boolean(sub);

    log(requestId, 'info', 'getPG', { id, authenticated });
    return respond(200, ok(pgFull(item, authenticated), requestId));
  } catch (e) {
    if (e instanceof ValidationError) {
      return respond(400, err('VALIDATION_ERROR', e.message));
    }
    log(requestId, 'error', 'getPG failed', { error: String(e) });
    return respond(500, err('INTERNAL_ERROR', 'getPG failed'));
  }
};
