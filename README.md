# Campus Evaluation Notification System

This project is a full-stack notification platform for a campus environment. It combines a TypeScript backend, a React/Vite frontend, MySQL for persistence, Redis for caching, RabbitMQ for asynchronous email delivery, and WebSockets for real-time updates.

## What I built

- A notification management backend with REST APIs for:
  - fetching notifications
  - counting unread notifications
  - marking notifications as read
  - creating and deleting notifications
- A modern dashboard UI for viewing, filtering, searching, and managing notifications.
- A priority inbox section that highlights important notifications.
- Real-time updates using Socket.IO.
- Caching with Redis to improve performance.
- Asynchronous email processing with RabbitMQ and a worker service.
- Docker support for MySQL, Redis, and RabbitMQ.

## Project architecture

- Frontend: React + Vite + Material UI
- Backend: Node.js + Express + TypeScript
- Database: MySQL
- Cache: Redis
- Messaging queue: RabbitMQ
- Real-time layer: Socket.IO

## Result preview

![Notification dashboard preview](Campus-Evaluation-FS-main/img/Screenshot%202026-07-01%20131614.png)

## How to run it

### 1) Start the infrastructure services

From the project root, run:

```bash
docker compose up -d
```

This starts:
- MySQL on port 3306
- Redis on port 6379
- RabbitMQ on port 5672 and the management UI on 15672

### 2) Create the environment file

Create a file named `.env` in the project root with the following content:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASSWORD=password
DB_NAME=notification_system
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### 3) Install backend dependencies

```bash
cd src/backend
npm install
```

### 4) Start the backend server

In one terminal:

```bash
npx ts-node server.ts
```

### 5) Start the RabbitMQ worker

In a second terminal:

```bash
npm run worker
```

### 6) Install frontend dependencies

In a third terminal:

```bash
cd ../frontend
npm install
```

### 7) Start the frontend

```bash
npm run dev
```

Then open:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- RabbitMQ UI: http://localhost:15672

## Main API endpoints

- GET /api/v1/notifications
- GET /api/v1/notifications/unread-count
- PATCH /api/v1/notifications/read-all
- PATCH /api/v1/notifications/:id/read
- POST /api/v1/notifications
- DELETE /api/v1/notifications/:id

## Notes

- The backend automatically creates the required database tables on startup.
- Redis is used for caching notification reads and counts.
- RabbitMQ handles asynchronous email delivery and retry logic.
- The dashboard supports search, filtering, pagination, and real-time snackbar updates.

## Folder structure

- src/backend - Node.js/TypeScript backend
- src/frontend - React/Vite dashboard UI
- img - screenshots and result images
- docker-compose.yml - infrastructure services
