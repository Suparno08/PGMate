#!/usr/bin/env node
/**
 * PGMate — DynamoDB seed script (task 1.4, spec/design.md §8.1, §9).
 *
 * Inserts realistic demo PG records into the PGMatePGs table for THREE locations
 * only: Agarpara, Sodepur, Belgharia. Idempotent: PutItem overwrites by PK, so
 * it is safe to re-run.
 *
 * Schema per .kiro/steering/data-model.md + amplify/shared/util.ts:
 *   PK = "PG#{id}", locationKey = lowercased location, rent/distanceKm = numbers,
 *   facilities = {wifi,food,ac,laundry} booleans, facilityKeys = String Set of
 *   the available facilities (for `contains()` FilterExpressions), status = ACTIVE,
 *   contact = {name, phone, email} placeholders, createdAt/updatedAt ISO-8601.
 *
 * IDs are stable alphanumeric demo IDs (not ULIDs) so re-runs are idempotent and
 * the values pass the handlers' parseIds validator (`^[A-Za-z0-9]{10,30}$`).
 *
 * ---------------------------------------------------------------------------
 * HOW TO RUN (later, when AWS credentials are available — do NOT run now):
 * ---------------------------------------------------------------------------
 *   1. Install the SDK locally (the Lambda runtime provides these for handlers,
 *      but a local script needs them in node_modules):
 *        npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *
 *   2. Configure AWS credentials + region (pick one):
 *        aws configure            # writes ~/.aws/credentials + region
 *      OR set env vars:
 *        AWS_ACCESS_KEY_ID=...  AWS_SECRET_ACCESS_KEY=...  AWS_REGION=ap-south-1
 *
 *   3. Get the sandbox PGMatePGs table name. After `npm install && npm run
 *      amp:sandbox` (or from the AWS console), copy the physical table name, e.g.
 *      `pgmate-<sandbox-id>-PGMatePGs-<hash>`.
 *
 *   4. Run (PowerShell):
 *        $env:PGS_TABLE_NAME="<table-name>"; node scripts/seed-pgs.mjs
 *      OR pass it as an argument:
 *        node scripts/seed-pgs.mjs "<table-name>"
 *      (bash): PGS_TABLE_NAME="<table-name>" node scripts/seed-pgs.mjs
 *
 *   Exit code 0 = all records written; non-zero = at least one failure
 *   (UnprocessedItems/throttle — just re-run).
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.PGS_TABLE_NAME || process.argv[2];
if (!TABLE) {
  console.error(
    'Error: set PGS_TABLE_NAME env var or pass the table name as the first argument.'
  );
  process.exit(2);
}

const NOW = new Date().toISOString();

/** Build a full PGMatePGs item from concise demo fields. */
function pg({
  id,
  name,
  location,
  rent,
  distanceKm,
  rating,
  description,
  facilities,
  contact,
}) {
  const facilityKeys = Object.keys(facilities).filter((k) => facilities[k]);
  return {
    PK: `PG#${id}`,
    id,
    name,
    location,
    locationKey: location.toLowerCase(), // GSI1 partition key
    rent, // GSI sort key (Number)
    distanceKm, // Number
    rating, // Number
    description,
    facilities, // Map of booleans
    facilityKeys: new Set(facilityKeys), // String Set for `contains()` filters
    contact, // { name, phone, email } placeholders
    status: 'ACTIVE', // GSI2 partition key constant
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const PGS = [
  // --- Agarpara -------------------------------------------------------------
  pg({
    id: 'agarpara001',
    name: 'Green Nest PG',
    location: 'Agarpara',
    rent: 6500,
    distanceKm: 0.8,
    rating: 4.6,
    description: 'Homely PG near Agarpara station, walking distance to local colleges.',
    facilities: { wifi: true, food: true, ac: false, laundry: true },
    contact: { name: 'Owner — Green Nest', phone: '+91-90000-00011', email: 'owner1@pgmate.example' },
  }),
  pg({
    id: 'agarpara002',
    name: 'Student Stay',
    location: 'Agarpara',
    rent: 5500,
    distanceKm: 1.2,
    rating: 4.4,
    description: 'Budget-friendly stay popular with students.',
    facilities: { wifi: true, food: true, ac: false, laundry: false },
    contact: { name: 'Owner — Student Stay', phone: '+91-90000-00012', email: 'owner2@pgmate.example' },
  }),
  pg({
    id: 'agarpara003',
    name: 'Campus Residency',
    location: 'Agarpara',
    rent: 7500,
    distanceKm: 0.5,
    rating: 4.8,
    description: 'Premium AC rooms closest to campus with all facilities.',
    facilities: { wifi: true, food: true, ac: true, laundry: true },
    contact: { name: 'Owner — Campus Residency', phone: '+91-90000-00013', email: 'owner3@pgmate.example' },
  }),

  // --- Sodepur --------------------------------------------------------------
  pg({
    id: 'sodepur001',
    name: 'Comfort Homes',
    location: 'Sodepur',
    rent: 9000,
    distanceKm: 2.4,
    rating: 4.7,
    description: 'Spacious AC rooms with all facilities in Sodepur.',
    facilities: { wifi: true, food: true, ac: true, laundry: true },
    contact: { name: 'Owner — Comfort Homes', phone: '+91-90000-00021', email: 'owner4@pgmate.example' },
  }),
  pg({
    id: 'sodepur002',
    name: 'Sodepur Boys Hostel',
    location: 'Sodepur',
    rent: 4800,
    distanceKm: 2.9,
    rating: 4.1,
    description: 'Affordable hostel for male students.',
    facilities: { wifi: true, food: true, ac: false, laundry: false },
    contact: { name: 'Owner — Boys Hostel', phone: '+91-90000-00022', email: 'owner5@pgmate.example' },
  }),
  pg({
    id: 'sodepur003',
    name: 'Riverside PG',
    location: 'Sodepur',
    rent: 7000,
    distanceKm: 2.0,
    rating: 4.5,
    description: 'Quiet PG near the river with good food.',
    facilities: { wifi: true, food: true, ac: false, laundry: true },
    contact: { name: 'Owner — Riverside PG', phone: '+91-90000-00023', email: 'owner6@pgmate.example' },
  }),

  // --- Belgharia ------------------------------------------------------------
  pg({
    id: 'belgharia001',
    name: 'Belgharia Comforts',
    location: 'Belgharia',
    rent: 6200,
    distanceKm: 1.5,
    rating: 4.3,
    description: 'Comfortable PG close to Belgharia station.',
    facilities: { wifi: true, food: true, ac: false, laundry: true },
    contact: { name: 'Owner — Belgharia Comforts', phone: '+91-90000-00031', email: 'owner7@pgmate.example' },
  }),
  pg({
    id: 'belgharia002',
    name: 'Northside Residency',
    location: 'Belgharia',
    rent: 8500,
    distanceKm: 1.1,
    rating: 4.6,
    description: 'Modern AC PG with laundry facilities.',
    facilities: { wifi: true, food: true, ac: true, laundry: true },
    contact: { name: 'Owner — Northside', phone: '+91-90000-00032', email: 'owner8@pgmate.example' },
  }),
  pg({
    id: 'belgharia003',
    name: 'Station View PG',
    location: 'Belgharia',
    rent: 5800,
    distanceKm: 0.9,
    rating: 4.2,
    description: 'Convenient budget PG with a station view.',
    facilities: { wifi: true, food: true, ac: false, laundry: false },
    contact: { name: 'Owner — Station View', phone: '+91-90000-00033', email: 'owner9@pgmate.example' },
  }),
];

async function main() {
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });

  let ok = 0;
  let fail = 0;
  for (const item of PGS) {
    try {
      await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
      console.log(`OK   ${item.id}  ${item.location}  ${item.name}  ₹${item.rent}/mo  ${item.rating}*`);
      ok++;
    } catch (e) {
      console.error(`FAIL ${item.id}: ${e.name} — ${e.message}`);
      fail++;
    }
  }

  console.log(`\nSeeded ${ok}/${PGS.length} PGs into "${TABLE}" (${fail} failed).`);
  if (fail > 0) {
    console.error('Some records failed (e.g. throttle/credentials). Re-run after fixing.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Seed script error:', e);
  process.exit(1);
});
