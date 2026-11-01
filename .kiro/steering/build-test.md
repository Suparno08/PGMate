---
inclusion: always
---
# Build & Test

## Commands
- `npm run dev` — Vite dev server (long-running; run manually in a terminal).
- `npm run build` — production build (`vite build`).
- `npm run lint` — oxlint (fast; also run on save via the lint-on-save hook).
- `npm run amp:sandbox` — local Amplify sandbox (needs `npm install` + AWS creds).
- `npm run amp:build` — type-check/synthesize backend (needs `npm install`).
- `npm test` — Vitest single run (`vitest --run`), added in task 0.5.

## Windows note
PowerShell here blocks the `npm` `.ps1` wrapper. Use `npm.cmd run <script>`
when invoking from PowerShell, e.g. `npm.cmd run build`, `npm.cmd run lint`.

## Environment note
No npm registry access and no AWS credentials in this environment. Defer
`npm install`, `amp:sandbox`, and deploys to a networked, AWS-credentialed
environment. Verify the frontend still runs with `npm run build` + `npm run lint`
after any change that does not touch dependencies.
