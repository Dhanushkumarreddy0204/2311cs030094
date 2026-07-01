# Campus Evaluation FS

This project contains a full-stack setup with a reusable logging middleware integrated across the frontend and backend.

## Structure
- `src/logger` - Reusable logging package
- `src/backend` - Express backend with mock DB and routes logging
- `src/frontend` - React frontend with hooks, components, and state logging

## Setup
1. Fill in the `.env` with `CLIENT_ID`, `CLIENT_SECRET`, and `ACCESS_TOKEN`.
2. Run backend: `cd src/backend && npx ts-node server.ts`
3. Run frontend: `cd src/frontend && npm install && npm run dev`

## Logging Checklist Implemented
- [x] Backend integration
- [x] Frontend integration
- [x] Cross-environment logger setup
