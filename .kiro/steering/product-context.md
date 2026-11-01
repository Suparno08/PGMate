---
inclusion: always
---
# PGMate — Product Context

PGMate is a student-focused accommodation discovery platform that helps students
find, compare, and choose suitable PGs and hostels based on location, monthly
budget, rating, and available facilities.

## Target users
- College and university students
- Students moving to a new city
- Students seeking affordable accommodation near their college

## Core features (from `src/requirements.md` §4)
- PG search by location and monthly budget (§4.1, §4.2, §4.3)
- PG listings: name, location, rent, distance, rating, facilities, description (§4.4)
- PG comparison: rent, distance, rating, facilities (§4.5)
- AI assistant for recommendations grounded in PG data (§4.6)
- User authentication via Amazon Cognito: sign up / log in / log out (§4.7)
- User preferences: preferred location, max budget, required facilities (§4.8)

## Out of scope (future enhancements)
Payments, booking/availability calendars, owner-side dashboards, multi-image
upload, reviews/threads, advanced geospatial search.

## Source of truth
- Requirements: `src/requirements.md`
- Design: `spec/design.md`
- Tasks: `spec/tasks.md`

## Frontend constraint
The existing `src/App.jsx` SPA (React 19) must keep its current UI and
functionality unless a task explicitly requires a change.
