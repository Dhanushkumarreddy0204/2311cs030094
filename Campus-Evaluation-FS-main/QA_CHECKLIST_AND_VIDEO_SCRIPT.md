# Full Stack Notification System - Finalization & QA

Congratulations on completing the AffordMed Campus Evaluation! This document provides a final QA checklist and a step-by-step storyboard for recording your demo video.

## 1. QA Checklist

### Infrastructure & Services
- [x] Docker `docker-compose.yml` runs successfully with MySQL (3307), Redis, and RabbitMQ.
- [x] `.env` is configured correctly (DB_PORT=3307).
- [x] `.gitignore` correctly ignores `.env`, `node_modules`, `dist`, and logs.
- [x] Postman collection generated (`Campus_Evaluation_Postman_Collection.json`).

### Backend (Node/Express/TypeScript)
- [x] `npm run seed` populates 100+ realistic notifications.
- [x] `npm run dev` starts the Express + Socket.IO server.
- [x] APIs respond correctly and integrate with Cache-Aside pattern (Redis).
- [x] Global Exception Handler intercepts and formats errors.
- [x] Logger intercepts all requests and logs to `logs/app.log`.

### RabbitMQ Worker
- [x] `npm run worker` starts the background worker.
- [x] Worker processes messages from `email_queue`.
- [x] Worker retry logic (Max 5 retries) and exponential backoff simulate failures correctly.
- [x] Dead Letter Queue (DLQ) configured correctly for failed messages.

### Frontend (React/Vite/TypeScript/MUI)
- [x] `npm run dev` starts the Vite server on `http://localhost:5173`.
- [x] Dashboard loads with a polished, modern, dynamic UI.
- [x] Notifications are populated from the seed script (No more blank screens!).
- [x] Filtering (Placement, Result, Event) and Search update the UI instantly.
- [x] Priority Inbox displays only the most important items based on algorithm logic.
- [x] Context + `useReducer` handles global state without prop-drilling.

---

## 2. Demo Video Storyboard (5-7 Minutes)

When recording your screen, follow this sequence to clearly demonstrate that all stages are integrated and production-ready.

### Segment 1: Infrastructure & Database (1 min)
1. **Show Docker:** Open the terminal and run `docker compose up -d`. Show that MySQL, Redis, and RabbitMQ containers are running. Point out that MySQL is mapped to 3307 to avoid local conflicts.
2. **Show Database Seeding:** Run `npm run seed` in the `src/backend` folder. Explain that this script populates 100+ dynamic notifications into the database.

### Segment 2: Backend Architecture & APIs (1.5 mins)
1. **Start the API Server:** Run `npm run dev` in `src/backend`.
2. **Postman API Test:** Open Postman, import the `Campus_Evaluation_Postman_Collection.json`.
3. **Show Cache-Aside:** Hit the `GET /api/v1/notifications` endpoint. Point to the terminal logs showing "Cache Miss - Fetching from DB". Hit the endpoint again and show "Cache Hit" indicating Redis is actively working.

### Segment 3: RabbitMQ Asynchronous Processing (1 min)
1. **Start the Worker:** Open a new terminal and run `npm run worker` in `src/backend`.
2. **Create a Notification:** Use the Postman `POST` endpoint to create a notification.
3. **Show Worker Logs:** Show the worker terminal instantly receiving the message, processing the email, and acknowledging it. Mention the built-in retry and DLQ logic.

### Segment 4: Real-Time Frontend (2 mins)
1. **Start the Frontend:** Run `npm run dev` in `src/frontend` and open the browser.
2. **Show Dashboard:** Demonstrate the sleek, dynamic Material UI design. Scroll through the populated notifications.
3. **Filtering & Searching:** Type in the search bar and click the filter buttons (Placement, Result) to show instant client-side filtering.
4. **Real-Time WebSockets:** While the dashboard is open, go back to Postman and POST a new notification. Watch the frontend instantly update with a Snackbar and prepend the new notification via Socket.IO.
5. **Priority Inbox:** Point out the top section showing high-priority alerts processed by the Stage 6 algorithm.

### Segment 5: Code Quality & Docs (0.5 mins)
1. Briefly show `useNotifications.ts` to highlight the custom hook and Context API structure.
2. Briefly show `notification-system-design.md` to prove all Stages 1-7 are thoroughly documented.
3. Conclude the video by stating all 7 stages are fully integrated and production-ready.
