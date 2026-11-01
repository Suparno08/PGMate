/**
 * searchPG — GET /api/pg/search (task 3.2, design §7, §9).
 * Query GSI1 (location + budget) or GSI2 (status=ACTIVE + budget), with an
 * optional facility FilterExpression and keyset pagination (Limit 20).
 * Returns PG summaries (no description/contact).
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
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
  parseLocation,
  parseBudget,
  parseFacilities,
  pgSummary,
  ValidationError,
} from '../../shared/util';

const LIMIT = 20;

function decodeCursor(v: string | undefined): Record<string, unknown> | undefined {
  if (!v) return undefined;
  try {
    return JSON.parse(Buffer.from(v, 'base64').toString('utf8'));
  } catch {
    throw new ValidationError('invalid cursor');
  }
}

export const handler = async (event: HttpEvent): Promise<HttpResponse> => {
  const requestId = requestIdFromEvent(event);
  try {
    const q = event.queryStringParameters || {};
    const locationKey = parseLocation(q.location);
    const budget = parseBudget(q.budget);
    const facilities = parseFacilities(q.facilities);
    const exclusiveStartKey = decodeCursor(q.cursor);

    const ean: Record<string, string> = {};
    const eav: Record<string, unknown> = { ':budget': budget };
    let indexName: string;
    let keyCondition: string;

    if (locationKey) {
      indexName = 'LocationRentIndex';
      keyCondition = 'locationKey = :loc AND rent <= :budget';
      eav[':loc'] = locationKey;
    } else {
      // 'status' is a DynamoDB reserved word — alias it.
      indexName = 'BudgetIndex';
      ean['#status'] = 'status';
      keyCondition = '#status = :status AND rent <= :budget';
      eav[':status'] = 'ACTIVE';
    }

    let filter: string | undefined;
    if (facilities && facilities.length) {
      filter = facilities.map((_, i) => `contains(facilityKeys, :f${i})`).join(' AND ');
      facilities.forEach((f, i) => (eav[`:f${i}`] = f));
    }

    const result = await doc().send(
      new QueryCommand({
        TableName: PGS_TABLE(),
        IndexName: indexName,
        KeyConditionExpression: keyCondition,
        FilterExpression: filter,
        ExpressionAttributeNames: Object.keys(ean).length ? ean : undefined,
        ExpressionAttributeValues: eav,
        Limit: LIMIT,
        ExclusiveStartKey: exclusiveStartKey,
      })
    );

    const items = (result.Items || []) as Record<string, unknown>[];
    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined;

    log(requestId, 'info', 'search', { locationKey, budget, facilities, count: items.length });
    return respond(200, { ...ok(items.map(pgSummary), requestId), nextCursor });
  } catch (e) {
    if (e instanceof ValidationError) {
      return respond(400, err('VALIDATION_ERROR', e.message));
    }
    log(requestId, 'error', 'search failed', { error: String(e) });
    return respond(500, err('INTERNAL_ERROR', 'search failed'));
  }
};
