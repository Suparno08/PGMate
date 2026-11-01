---
inclusion: always
---
# Frontend Conventions

## Structure
- `src/App.jsx` is currently a single-file SPA. Task P5.6 decomposes it into
  components (Navbar, Hero, SearchCard, ResultsSection, PGCard, PGDetails,
  CompareView, Features, AssistantChat, Footer) while preserving the existing
  `App.css` and visual layout.
- Do **not** redesign or replace the existing UI unless a task explicitly
  requires it.

## State
- Server state via `@tanstack/react-query` (search, details, compare,
  preferences, assistant). No ad-hoc `useState` fetch state.
- Auth state in an `AuthContext` (`useAuth`): `user`, `signIn`, `signUp`,
  `signOut`, `isLoading`.
- Routing via `react-router-dom`; protected routes redirect to `/login` with a
  return-to URL.

## Amplify integration
- Configure from generated `amplify_outputs.json` — no hardcoded endpoints/IDs.
- Use `aws-amplify/auth` and `aws-amplify/api` REST client (auto-attaches the
  Cognito JWT for protected calls).

## Accessibility
- Semantic HTML, labeled inputs, keyboard-operable controls, visible focus.
- Render untrusted/model output as text (never raw HTML).

## Code style
- Keep business logic out of `App.jsx` once decomposed; colocate with components
  or small hooks. oxlint governs formatting/rules.
