---
inclusion: fileMatch
fileMatchPattern: 'amplify/**/*.ts'
---
# DynamoDB Data Model (see design §8)

## Table `PGMatePGs` — partition key `PG#{id}`
Fields: `id`, `name`, `location`, `locationKey` (lowercased), `rent` (Number),
`distanceKm` (Number), `rating` (Number), `description`, `facilities` (Map),
`facilityKeys` (String Set), `contact` (Map), `status` (`ACTIVE`/`INACTIVE`),
`createdAt`, `updatedAt`.
- **GSI1 `LocationRentIndex`** — PK `locationKey`, SK `rent`: "PGs in
  `<location>` under `<budget>`" via `locationKey = :loc AND rent <= :budget`.
- **GSI2 `BudgetIndex`** — PK `status` (= `ACTIVE`), SK `rent`: "any PG under
  budget" when no location is given.

## Table `PGMatePreferences` — partition key `USER#{cognitoSub}`
Fields: `userId`, `preferredLocation`, `maxBudget`, `requiredFacilities` (String
Set), `updatedAt`. One item per user; `GetItem`/`PutItem` (upsert).

## Naming
- Partition keys: `PG#{ulid}`, `USER#{cognitoSub}`.
- Always store a lowercased `locationKey` for case-insensitive location search.
- `rent` and `distanceKm` are numbers (UI formats `0.8 km`).

## Access patterns
- location + budget → Query GSI1; budget only → Query GSI2.
- one PG → `GetItem`; compare → `BatchGetItem` (cap 4).
- preferences → `GetItem`/`PutItem` by user sub (taken from the JWT, never the
  request body).
- facility filtering → `FilterExpression: contains(facilityKeys, :f)` after the
  GSI query (acceptable for the current dataset).
