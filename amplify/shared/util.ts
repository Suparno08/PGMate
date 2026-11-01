/**
 * Shared utilities for PGMate Lambda handlers (task 3.1, spec/design.md §6.3,
 * §6.4, §7, §15). Imported by every function under amplify/functions/.
 *
 * NOTE: Authored offline (no npm install / AWS here). AWS SDK v3 modules
 * (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb) are resolved at runtime by
 * the Lambda Node.js 20 runtime (Amplify externalises them in function
 * bundles). Not yet type-checked or deployed here.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  type PutCommandInput,
  type GetCommandInput,
  type QueryCommandInput,
  type BatchGetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// API Gateway HTTP API (v2) event shape (the fields PGMate handlers use).
// ---------------------------------------------------------------------------
export interface HttpEvent {
  httpMethod?: string;
  requestContext?: {
    http?: { method?: string };
    authorizer?: { jwt?: { claims?: Record<string, string> } };
  };
  queryStringParameters?: Record<string, string | undefined>;
  pathParameters?: Record<string, string | undefined>;
  body?: string;
  headers?: Record<string, string>;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// ---------------------------------------------------------------------------
// Response envelope (design §6.2 / §6.3)
//   success: { data, requestId }            (data is array for list endpoints)
//   error:   { error: { code, message }, requestId }
// ---------------------------------------------------------------------------
export function ok<T>(data: T, requestId: string): { data: T; requestId: string } {
  return { data, requestId };
}

export function err(code: string, message: string): {
  error: { code: string; message: string };
} {
  return { error: { code, message } };
}

export function respond(statusCode: number, body: unknown): HttpResponse {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// Correlation id + structured JSON logger (design §15)
// ---------------------------------------------------------------------------
export function requestIdFromEvent(event: HttpEvent): string {
  const h = event.headers || {};
  return (h['x-request-id'] || h['X-Request-Id'] || randomUUID()).slice(0, 64);
}

export function log(
  requestId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  meta: Record<string, unknown> = {}
): void {
  // Single-line JSON to stdout; CloudWatch parses it as one log event.
  console.log(
    JSON.stringify({ level, message, requestId, ...meta, ts: new Date().toISOString() })
  );
}

// ---------------------------------------------------------------------------
// Input validation (design §6.4) — throws ValidationError on bad input.
// ---------------------------------------------------------------------------
export class ValidationError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const FACILITIES = ['wifi', 'food', 'ac', 'laundry'] as const;
export type Facility = (typeof FACILITIES)[number];

export function parseLocation(v: string | undefined): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (s === '') return undefined;
  if (s.length > 100) throw new ValidationError('location must be <= 100 chars');
  return s;
}

export function parseBudget(v: string | undefined): number {
  if (v === undefined || v === null || String(v).trim() === '') return 100000;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new ValidationError('budget must be a number');
  return Math.min(Math.max(Math.trunc(n), 1000), 100000);
}

export function parseFacilities(v: string | undefined): string[] | undefined {
  if (v === undefined || v === null || String(v).trim() === '') return undefined;
  const list = String(v)
    .split(',')
    .map((f) => f.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return undefined;
  const bad = list.filter((f) => !FACILITIES.includes(f as Facility));
  if (bad.length) throw new ValidationError(`unknown facilities: ${bad.join(',')}`);
  return list;
}

// ids must be ULID-shaped (basic sanity) and length 1–4 (design §10 compare cap).
const ID_RE = /^[A-Za-z0-9]{10,30}$/;
export function parseIds(body: unknown): string[] {
  if (typeof body !== 'object' || body === null)
    throw new ValidationError('body must be an object');
  const raw = (body as { ids?: unknown }).ids;
  if (!Array.isArray(raw)) throw new ValidationError('ids must be an array');
  if (raw.length < 1 || raw.length > 4)
    throw new ValidationError('ids must contain 1–4 items');
  const ids = raw.map(String);
  const bad = ids.filter((id) => !ID_RE.test(id));
  if (bad.length) throw new ValidationError(`invalid ids: ${bad.join(',')}`);
  return ids;
}

export function parseMessage(v: string | undefined): string {
  if (v === undefined || v === null || String(v).trim() === '')
    throw new ValidationError('message is required');
  const s = String(v).trim();
  if (s.length > 1000) throw new ValidationError('message must be <= 1000 chars');
  return s;
}

// AuthN: extract Cognito sub from the JWT authorizer claims (design §5, §14).
export function requireSub(event: HttpEvent): string {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  const sub = claims?.sub;
  if (!sub) throw new ValidationError('unauthorized'); // mapped to 401 by caller
  return sub;
}

// ---------------------------------------------------------------------------
// DynamoDB client factory (singleton per cold start) + helpers (design §8, §9)
// ---------------------------------------------------------------------------
let docClient: DynamoDBDocumentClient | null = null;
export function doc(): DynamoDBDocumentClient {
  if (docClient) return docClient;
  const base = new DynamoDBClient({});
  docClient = DynamoDBDocumentClient.from(base, {
    marshallOptions: { removeUndefinedValues: true },
  });
  return docClient;
}

export const PGS_TABLE = () => process.env.PGS_TABLE_NAME ?? '';
export const PREF_TABLE = () => process.env.PREF_TABLE_NAME ?? '';
export const PK_PREFIX_PG = 'PG#';
export const PK_PREFIX_USER = 'USER#';

export function pgKey(id: string): Record<string, string> {
  return { PK: PK_PREFIX_PG + id };
}
export function userKey(sub: string): Record<string, string> {
  return { PK: PK_PREFIX_USER + sub };
}

// Project a full PG item to the public summary (omit description/contact).
export function pgSummary(item: Record<string, unknown>): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    location: item.location,
    rent: item.rent,
    distanceKm: item.distanceKm,
    rating: item.rating,
    facilities: item.facilities,
  };
}

// Full PG record; include `contact` only when the caller is authenticated.
export function pgFull(item: Record<string, unknown>, authenticated: boolean): Record<string, unknown> {
  const { contact, ...rest } = item as { contact?: unknown } & Record<string, unknown>;
  return authenticated ? { ...rest, contact } : rest;
}

// Generic command input type aliases (re-exported for handler convenience).
export type { PutCommandInput, GetCommandInput, QueryCommandInput, BatchGetCommandInput };
