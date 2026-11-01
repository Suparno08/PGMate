# PGMate Local Development Setup

## Quick Start

### Terminal 1: Start the Backend Server
```bash
npm run server
```

Expected output:
```
✅ PGMate local backend server running on http://localhost:5000
```

The server will stay running. Don't close this terminal.

### Terminal 2: Start the Frontend Dev Server
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Architecture

```
Frontend (React + Vite)          Backend (Express.js)
        ↓                               ↓
  src/api/pgmateApi.js      →    server/server.js
        ↓                               ↓
Fetch http://localhost:5000    6 REST API endpoints
        ↓                               ↓
                              JSON file: server/pgmate.json
                              (9 PGs + user preferences)
```

---

## Available Endpoints

### Public (No Auth Required)
- `GET /api/pgs/search?location=...&maxBudget=...` — Search PGs
- `GET /api/pgs/:id` — Get single PG by ID
- `POST /api/pgs/batch` — Get multiple PGs

### Protected (Auth Required)
Send: `Authorization: Bearer user_<userId>`

- `GET /api/preferences` — Get user preferences
- `PUT /api/preferences` — Update preferences
- `POST /api/assistant` — Chat with AI assistant

---

## Development

### Modify Backend
Edit `server/db.js` or `server/server.js` and restart the server (`npm run server`).

### Modify Frontend API Client
Edit `src/api/pgmateApi.js`. Changes hot-reload in dev mode.

### Reset Database
Delete `server/pgmate.json`. The server will recreate it on next start with 9 seed PGs.

### Check API Response
```bash
# Test search endpoint
curl "http://localhost:5000/api/pgs/search?location=Bangalore"

# Test single PG
curl "http://localhost:5000/api/pgs/pg-1"
```

---

## Important Notes

- ✅ **No AWS Credentials Required** — All development is local
- ✅ **₹0 Budget** — Using free tools only (Express, dotenv)
- ✅ **No Native Modules** — Pure JavaScript (no better-sqlite3 needed)
- ✅ **9 Seed PGs** — Pre-loaded in `server/pgmate.json`
- 📝 **Mock Auth** — Local JWT format for testing (no signature validation)
- 🤖 **Local assistant** — Recommends matching PGs from the local database; it does not call a generative AI model
- ☁️ **Bedrock assistant** — The separate Amplify backend calls Amazon Bedrock and requires AWS deployment/configuration

---

## Troubleshooting

**Q: The assistant gives generic replies or no PG matches**  
A: Restart the backend with `npm run server` after pulling the latest changes. The local assistant now filters the seeded PG listings by location, budget, and facilities. It is rule-based and does not generate free-form AI responses.

**Q: I want actual generative AI responses**  
A: Deploy the Amplify backend and configure AWS/Cognito, Bedrock model access, and the frontend API/auth settings. The local mock-auth server cannot authenticate with the deployed Bedrock API.

**Q: Port 5000 already in use**  
A: Kill the process or change port in `server/.env.local` (then update `.env.local` frontend config too)

**Q: Frontend can't reach backend**  
A: Check `.env.local` has `VITE_API_URL=http://localhost:5000`

**Q: Database is missing**  
A: Delete `server/pgmate.json` and restart server—it will auto-recreate

---

## Files

- **Backend**: `server/server.js` (Express app)
- **Database**: `server/db.js` (in-memory) + `server/pgmate.json` (persistence)
- **Frontend API Client**: `src/api/pgmateApi.js` (wired to local backend)
- **Config**: `.env.local` (frontend) + `server/.env.local` (backend)

---

**Status**: Local PG recommendations are available; the Bedrock assistant is implemented separately in the Amplify backend and must be deployed to use it.
