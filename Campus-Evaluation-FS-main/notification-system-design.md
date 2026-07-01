# API & Real-Time System Design

## 1. Functional and Non-Functional Requirements

### Functional Requirements
- Fetch notifications.
- Fetch only unread notifications.
- Fetch notifications by type.
- Pagination support.
- Mark notification as read.
- Mark all notifications as read.
- Receive new notifications instantly.
- Count unread notifications.

### Non-Functional Requirements
- Low latency (<200 ms API response)
- Highly scalable
- Secure
- Fault tolerant
- Easily extensible
- Real-time delivery

## 2. Resource Identification

In REST APIs, every API revolves around a resource. Our main resource is: **Notification**

**Example Notification Object:**
```json
{
    "id": 101,
    "studentId": 2311,
    "type": "Placement",
    "title": "Amazon Hiring",
    "message": "Amazon has opened SDE applications.",
    "isRead": false,
    "createdAt": "2026-07-01T09:00:00Z"
}
```

## 3. REST API Endpoints

### API 1 – Fetch Notifications
- **Endpoint:** `GET /api/v1/notifications`
- **Purpose:** Retrieve notifications for the logged-in student.
- **Headers:**
  - `Authorization: Bearer <JWT>`
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Query Parameters:**
  - `page` (Integer) - Current page
  - `limit` (Integer) - Notifications per page
  - `notification_type` (String) - Placement/Event/Result
  - `isRead` (Boolean) - Read filter
- **Example:** `GET /api/v1/notifications?page=1&limit=10&notification_type=Placement&isRead=false`
- **Success Response:**
```json
{
    "page": 1,
    "limit": 10,
    "totalNotifications": 125,
    "totalPages": 13,
    "data": [
        {
            "id": 1,
            "type": "Placement",
            "title": "Amazon Hiring",
            "message": "Amazon opened applications.",
            "isRead": false,
            "createdAt": "2026-07-01T10:00:00Z"
        }
    ]
}
```

### API 2 – Fetch Unread Count
- **Endpoint:** `GET /api/v1/notifications/unread-count`
- **Response:**
```json
{
    "unreadCount": 8
}
```

### API 3 – Mark Notification as Read
- **Endpoint:** `PATCH /api/v1/notifications/{notificationId}/read`
- **Example:** `PATCH /api/v1/notifications/42/read`
- **Response:**
```json
{
    "success": true,
    "message": "Notification marked as read"
}
```

### API 4 – Mark All Notifications as Read
- **Endpoint:** `PATCH /api/v1/notifications/read-all`
- **Response:**
```json
{
    "updated": 12,
    "message": "All notifications marked as read"
}
```

### API 5 – Create Notification (Admin)
- **Endpoint:** `POST /api/v1/notifications`
- **Request:**
```json
{
    "title": "Microsoft Hiring",
    "message": "Microsoft is hiring Software Engineers.",
    "type": "Placement"
}
```
- **Response:**
```json
{
    "notificationId": 102,
    "message": "Notification created successfully"
}
```

### API 6 – Delete Notification (Optional)
- **Endpoint:** `DELETE /api/v1/notifications/{id}`

## 4. HTTP Status Codes
- **200** Successful GET/PATCH
- **201** Resource Created
- **204** Deleted Successfully (No Content)
- **400** Invalid Request
- **401** Unauthorized
- **403** Forbidden
- **404** Not Found
- **409** Conflict
- **500** Internal Server Error

## 5. Filtering and Pagination Strategy

### Filtering
The API supports server-side filtering via query parameters:
- By type: `GET /notifications?notification_type=Placement`
- Unread only: `GET /notifications?isRead=false`
- Combined: `GET /notifications?notification_type=Placement&isRead=false`

### Pagination
Using `page` and `limit` query parameters ensures we only fetch a specific subset of records per request (e.g., 10 or 20). This drastically reduces memory usage, bandwidth, and response times instead of loading all notifications at once.

## 6. Real-Time Architecture

To achieve real-time delivery, there are two primary options:
1. **Server-Sent Events (SSE):** One-way communication (Server → Client). Lightweight but unidirectional.
2. **WebSockets:** Full-duplex communication (Client ↔ Server). Very low latency, bidirectional.

**Recommended Choice: WebSockets**
WebSockets are the preferred solution for this notification platform. Even though notifications are primarily one-way right now, WebSockets provide greater flexibility for future enhancements like real-time acknowledgements, live unread-count syncing, user presence, or in-app messaging.

### High-Level Flow
```text
 Admin Creates Notification
            │
            ▼
      Notification API
            │
            ▼
        Database Save
            │
            ▼
     WebSocket Gateway
            │
            ▼
 Connected Student Clients
            │
            ▼
 UI Updates Instantly (No Refresh)
```

# Stage 2 – Database Architecture

## 1. Choose the Database

**Recommended Choice: PostgreSQL**

### Why PostgreSQL?
- ACID-compliant transactions ensure reliable updates.
- Excellent indexing capabilities (B-Tree, Hash, GIN, BRIN).
- Supports millions of records efficiently.
- Powerful SQL for filtering, sorting, and pagination.
- Mature replication and partitioning support.
- Widely used in enterprise notification systems.

Although a NoSQL database like MongoDB could work, the notification data is structured and requires frequent filtering, sorting, and joins, making PostgreSQL a stronger fit.

## 2. Database Schema

### Student Table
```sql
CREATE TABLE students (
    student_id BIGINT PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    department VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Stores registered student information.

### Notifications Table
```sql
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
);
```

**Explanation**
| Column | Purpose |
| ------ | ------- |
| `notification_id` | Unique notification ID |
| `student_id` | Notification recipient |
| `notification_type` | Placement, Event, Result |
| `title` | Notification title |
| `message` | Notification body |
| `is_read` | Read status |
| `created_at` | Creation timestamp |

## 3. Entity Relationship

```text
Students
---------
student_id (PK)
name
email
department

        │
        │ 1
        │
        ▼

Notifications
--------------
notification_id (PK)
student_id (FK)
notification_type
title
message
is_read
created_at
```
**Relationship:** One student can have many notifications. (1 : N)

## 4. Indexing Strategy

Without indexes, every query scans the entire table. For millions of notifications, that is unacceptable.

### Primary Key Index
Automatically created: `notification_id`

### Composite Index
Most common query:
```sql
SELECT *
FROM notifications
WHERE student_id = ?
AND is_read = FALSE
ORDER BY created_at DESC;
```
**Create:**
```sql
CREATE INDEX idx_student_read_created
ON notifications
(student_id, is_read, created_at DESC);
```
**Why?** This index supports:
- Student lookup
- Read/unread filtering
- Ordered results (without extra sorting)

### Type Filter Index
```sql
CREATE INDEX idx_notification_type
ON notifications(notification_type);
```
Supports: `WHERE notification_type='Placement'`

## 5. Scaling Strategy

Assume:
- 500,000 students
- 5 million notifications
- 100,000 new notifications/day

A single database will eventually become a bottleneck.

### Read Replicas
**Architecture:**
```text
           Primary DB
               │
      ┌────────┴────────┐
      ▼                 ▼
 Read Replica 1    Read Replica 2
```
- **Writes:** All writes go to the primary database.
- **Reads:** Notification fetches go to replicas.
- **Benefits:** Lower load on the primary, improved read scalability, higher availability.

### Table Partitioning
Partition the notifications table by time.
- **Example:** `notifications_2026_jan`, `notifications_2026_feb`, `notifications_2026_mar`
- **Benefits:** Faster searches, smaller indexes, easier archival, improved maintenance.

### Sharding
If one database is insufficient, shard by `student_id`.
- **Example:**
  - Shard 1: student_id 1–100000
  - Shard 2: 100001–200000
  - Shard 3: 200001–300000
- **Benefits:** Distributes storage, parallel query execution, higher throughput.

## 6. Data Volume Considerations

**Potential bottlenecks:**
- Mass placement notifications.
- Campus-wide event announcements.
- Result publication spikes.

**Solutions:**
- Batch inserts.
- Connection pooling.
- Read replicas.
- Table partitioning.
- Background workers for bulk notification creation.

## 7. SQL Queries for Stage 1 APIs

### Fetch Notifications
```sql
SELECT notification_id,
       notification_type,
       title,
       message,
       is_read,
       created_at
FROM notifications
WHERE student_id = 2311
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

### Filter by Type
```sql
SELECT *
FROM notifications
WHERE student_id = 2311
AND notification_type = 'Placement'
ORDER BY created_at DESC;
```

### Unread Notifications
```sql
SELECT *
FROM notifications
WHERE student_id = 2311
AND is_read = FALSE
ORDER BY created_at DESC;
```

### Unread Count
```sql
SELECT COUNT(*)
FROM notifications
WHERE student_id = 2311
AND is_read = FALSE;
```

### Mark Notification as Read
```sql
UPDATE notifications
SET is_read = TRUE
WHERE notification_id = 101;
```

### Mark All as Read
```sql
UPDATE notifications
SET is_read = TRUE
WHERE student_id = 2311
AND is_read = FALSE;
```

### Create Notification
```sql
INSERT INTO notifications
(
    student_id,
    notification_type,
    title,
    message
)
VALUES
(
    2311,
    'Placement',
    'Amazon Hiring',
    'Amazon has opened applications.'
);
```

## 8. Why PostgreSQL Over MongoDB?

| PostgreSQL | MongoDB |
| ---------- | ------- |
| Strong ACID compliance | Eventual consistency in many deployments |
| Excellent SQL filtering | Flexible document model |
| Powerful indexing | Flexible indexing |
| Mature partitioning and replication | Good horizontal scaling |
| Ideal for structured notification records | Better suited for rapidly changing schemas |

Given the evaluation requirements—filtering, pagination, sorting, indexing, and SQL optimization—PostgreSQL is the stronger choice.

## High-Level Database Architecture
```text
                Client
                   │
                   ▼
            Notification API
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
     Redis Cache       PostgreSQL Primary
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              Read Replica 1    Read Replica 2
```

# Stage 3 – Query Optimization

## 1. Why the Original Query Is Slow

**Original query:**
```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY created_at ASC;
```

### Possible Problems
1. **Full Table Scan:** If there is no suitable index, the database must read all 5,000,000 rows, and check the `student_id` and `is_read` filters for every single one. Time complexity approaches O(N).
2. **Expensive Sorting:** Even if rows are filtered correctly, the database still needs to sort thousands of remaining rows by `created_at`.
3. **Returning All Columns:** Using `SELECT *` retrieves every column, including those the application may not need. This increases disk I/O, memory usage, and network bandwidth. It is preferred to select only the required columns.

## 2. Optimize the Query

### Composite Index
**Create:**
```sql
CREATE INDEX idx_student_read_created
ON notifications(student_id, is_read, created_at);
```
**Why This Works:**
The database can locate the student's records, filter unread notifications, and return them already ordered by `created_at`. No additional sort operation is needed.

### Optimized Query
```sql
SELECT
    notification_id,
    title,
    message,
    notification_type,
    created_at
FROM notifications
WHERE student_id = 1042
  AND is_read = FALSE
ORDER BY created_at ASC;
```
This reduces unnecessary data transfer.

## 3. Why Not Index Every Column?

At first glance, indexing every column sounds beneficial, but it causes several problems:
- **Increased Storage:** Every index consumes additional disk space. With millions of records, storage requirements can become significant.
- **Slower Writes:** Every `INSERT`, `UPDATE`, or `DELETE` must update every affected index. More indexes mean slower write performance.
- **Higher Maintenance Cost:** Indexes require maintenance, statistics updates, and periodic reorganization. Too many indexes increase database overhead.
- **Optimizer Confusion:** When many indexes exist, the query planner has more choices to evaluate, which can occasionally lead to less efficient execution plans.

**Best Practice:** Create indexes only on:
- Frequently filtered columns
- Join columns
- Sorting columns
- Foreign keys
- High-frequency search fields

## 4. Query Placement Notifications From the Last 7 Days

```sql
SELECT
    notification_id,
    title,
    message,
    created_at
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## 5. Recommended Index for This Query

```sql
CREATE INDEX idx_type_created
ON notifications(notification_type, created_at DESC);
```
This supports both filtering and ordering efficiently.

## 6. Performance Comparison

| Without Index | With Composite Index |
| ------------- | -------------------- |
| Full table scan | Index scan |
| Extra sort required | Rows already ordered |
| High disk I/O | Reduced disk I/O |
| Slower response | Faster response |
| Poor scalability | Suitable for millions of rows |

## 7. Explain the Execution Plan

To verify performance rather than relying on assumptions, you can inspect queries using `EXPLAIN ANALYZE`:
```sql
EXPLAIN ANALYZE
SELECT ...
```
This tool allows you to inspect:
- Sequential scans
- Index scans
- Sort operations
- Actual execution time
- Rows processed
