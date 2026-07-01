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

## 1. Analysis of the Original Query

**Original Query:**
```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY created_at ASC;
```

When executing this query against a table containing **5,000,000** records without appropriate indexes, the database engine encounters several significant performance bottlenecks:

- **Full Table Scan (Seq Scan):** Without an index on `student_id` or `is_read`, PostgreSQL is forced to read every single row from the disk into memory to evaluate the `WHERE` clause. This results in time complexity approaching $O(N)$, causing massive disk I/O and skyrocketing CPU usage.
- **Sorting Overhead:** After filtering, the database must perform an in-memory or disk-based sort (e.g., QuickSort) on the resulting dataset to satisfy the `ORDER BY created_at ASC` clause. Sorting thousands of rows dynamically adds substantial latency.
- **Inefficiency of `SELECT *`:** Retrieving all columns (including potentially large text fields like `message`) forces the database to fetch data that the application may not even need. This drastically increases memory consumption, bloats network payload size, and reduces the efficiency of cache hits.
- **Expected Execution Plan:** The query planner will likely fall back to a `Seq Scan` on the `notifications` table, followed by a costly `Sort` node. 

## 2. Query Optimization and Indexing

To resolve these bottlenecks, we must design an index that precisely matches our query's access pattern.

### Optimized SQL Query
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
*Refinement:* We replaced `SELECT *` with explicit column projections, minimizing network overhead and memory consumption.

### Composite Index Recommendation
```sql
CREATE INDEX idx_student_read_created
ON notifications (student_id, is_read, created_at ASC);
```

### Why This Index Improves Performance
This composite index perfectly satisfies all three phases of the query execution:
1. **Lookup:** The database quickly traverses the B-Tree to find rows matching `student_id = 1042`.
2. **Filtering:** Within that subset, it efficiently filters rows where `is_read = FALSE`.
3. **Ordering:** Because the index structure itself is pre-sorted by `created_at ASC`, the database retrieves the rows in the exact order requested. 

**Expected Execution Plan:** The planner will execute an `Index Scan` on `idx_student_read_created`. The explicit `Sort` operation is completely eliminated, reducing query latency from seconds to mere milliseconds.

## 3. The Pitfalls of Over-Indexing

While indexing is a powerful tool, creating an index on every column is a severe anti-pattern in database design for several reasons:

- **Storage Overhead:** Indexes are separate data structures (usually B-Trees) stored on disk. Indexing every column could cause the index footprint to exceed the actual table size, significantly increasing storage costs.
- **Write Amplification (INSERT/UPDATE/DELETE):** Every time a new notification is inserted, updated, or deleted, the database must not only write to the main table but also update *every single index* associated with it. This creates massive lock contention and severely degrades write throughput.
- **Maintenance Cost:** More indexes require more frequent `VACUUM` operations, bloat management, and statistics recalculations.
- **Query Planner Confusion:** An excessive number of overlapping indexes forces the PostgreSQL query planner to evaluate too many possible execution paths, which adds planning overhead and occasionally leads to suboptimal index choices.

**Best Practice:** Only create indexes to support high-frequency `WHERE` clauses, `JOIN` conditions, and `ORDER BY` operations.

## 4. Querying Recent Placement Notifications

To fetch all Placement notifications created within the last 7 days, we use the following optimized query:

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

## 5. Recommended Index for Placement Query

To support both the equality filter on `notification_type` and the range scan/ordering on `created_at`:

```sql
CREATE INDEX idx_notifications_type_created
ON notifications (notification_type, created_at DESC);
```
This index allows the engine to jump directly to 'Placement' records and traverse them in descending chronological order, perfectly satisfying the `ORDER BY created_at DESC` clause without an additional sort step.

## 6. Verifying Optimizations with EXPLAIN ANALYZE

In a production environment, theoretical assumptions must be verified. We use `EXPLAIN ANALYZE` to observe the actual execution plan generated by PostgreSQL:

```sql
EXPLAIN ANALYZE
SELECT notification_id, title, message, notification_type, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at ASC;
```

**What to look for in the output:**
- **Execution Nodes:** Ensure you see an `Index Scan` instead of a `Seq Scan`.
- **Sort Nodes:** Verify the absence of an explicit `Sort` node (indicating the index successfully provided the ordering).
- **Execution Time:** Look at `actual time=...` to confirm the query executes within the target latency (e.g., <50ms).
- **Rows Processed:** Ensure the number of rows scanned aligns closely with the rows returned, proving the index efficiently pruned irrelevant data.

## 7. Performance Comparison Summary

| Metric | Without Optimization | With Composite Index & Projection |
| ------ | -------------------- | --------------------------------- |
| **Scan Strategy** | Full Table Scan (Seq Scan) | Index Scan |
| **Sort Strategy** | Explicit in-memory/disk sort | Pre-sorted via B-Tree |
| **I/O & Memory** | High (`SELECT *` pulls unused data) | Low (Explicit column projection) |
| **Execution Time** | Seconds (Depends on disk speed) | Milliseconds |
| **Scalability** | Degrades linearly ($O(N)$) | Highly scalable ($O(\log N)$) |

# Stage 4 – Performance & Caching

## 1. The Bottleneck: Why Querying PostgreSQL on Every Request is Inefficient

In a high-traffic campus notification system, users frequently refresh pages, load their dashboards, and poll for unread notifications. Querying PostgreSQL directly for every single one of these read-heavy operations introduces severe architectural bottlenecks:

- **Database Bottlenecks & Disk I/O:** Relational databases are fundamentally bounded by disk I/O and CPU utilization. Fetching the same records repeatedly causes redundant disk reads (even if partially mitigated by Postgres buffer caches).
- **CPU Utilization:** Evaluating complex `WHERE` clauses, applying limits, and sorting records constantly burns CPU cycles on the primary database, starving resources needed for critical write operations.
- **Network Latency:** Direct database queries inherently carry higher latency compared to memory-based fetches.
- **Scaling Problems & Traffic Spikes:** As the platform scales to handle thousands of concurrent students—especially during traffic spikes like massive campus placement announcements—the PostgreSQL connection pool will quickly exhaust. This leads to connection queuing, request timeouts, and catastrophic system degradation.

To ensure high availability and responsiveness, we must introduce a caching layer to offload redundant reads from the primary database.

## 2. Recommended Caching Solution: Redis

For this architecture, I strongly recommend integrating **Redis** (Remote Dictionary Server).

### Why Redis?
- **Memory-Based Architecture:** Redis stores data entirely in RAM, enabling **sub-millisecond latency** for read operations, far exceeding the performance of disk-based relational databases.
- **Key-Value Storage:** Its flexible data structures (strings, hashes, sorted sets) are perfect for caching paginated lists, counts, and metadata.
- **Persistence Options:** While primarily an in-memory cache, Redis supports persistence (RDB snapshots and AOF logs) to prevent data loss across server restarts.
- **High Throughput & Horizontal Scaling:** Redis can effortlessly handle hundreds of thousands of operations per second and scales horizontally via Redis Cluster.
- **TTL Support:** Native Time-To-Live (TTL) support ensures stale data is automatically purged without requiring application-level cron jobs.
- **Pub/Sub:** Redis provides native Publish/Subscribe functionality, which perfectly complements our existing WebSocket architecture for broadcasting real-time events across multiple backend nodes.

## 3. Architecture Diagram

```text
       ┌───────────┐
       │  Client   │
       └─────┬─────┘
             │ (1) Request
             ▼
    ┌─────────────────┐
    │ Backend API     │
    │ (Node/Express)  │
    └────────┬────────┘
             │ (2) Check Cache
             ▼
      ┌─────────────┐
      │ Redis Cache │
      └──────┬──────┘
             │
   ┌─────────┴─────────┐
   │                   │
(3a) Cache Hit    (3b) Cache Miss
   │                   │
   ▼                   ▼
Return            ┌──────────────┐
Response          │  PostgreSQL  │
                  └──────┬───────┘
                         │ (4) Fetch & Store in Redis
                         ▼
                  Return Response
```

## 4. Cache Strategy: What to Cache?

Our caching strategy must strictly target read-heavy, latency-sensitive endpoints while avoiding the caching of rapidly mutating state. 

**What to Cache:**
- **Unread Notification Count:** Highly requested on every page load (e.g., the badge icon in the UI).
- **Latest/Recently Viewed Notifications:** The first page (e.g., `page=1`, `limit=10`) of a student's notifications.
- **Filtered Notification Lists:** Common filters like "Placement" or "Event".
- **Notification Metadata:** Static configuration data or overarching system announcements.

**What NOT to Cache (Avoid Caching Writes):**
Do not cache the actual `INSERT`, `UPDATE`, or `DELETE` operations (e.g., marking a notification as read). Writes should always go directly to PostgreSQL (the source of truth) to guarantee ACID compliance. Attempting to write to the cache first and asynchronously flush to the DB risks data loss, race conditions, and consistency tearing.

## 5. Cache Keys

Consistent and heavily namespaced key naming is critical to prevent key collisions, simplify debugging, and allow for targeted invalidation.

**Realistic Redis Key Examples:**
- `notifications:user:1042:page:1` (Caches the first page of notifications for student 1042)
- `notifications:user:1042:placement` (Caches placement-specific notifications for student 1042)
- `notifications:user:1042:unread` (Caches the unread integer count)
- `notification:1042:last10` (Caches a generic top 10 list)

**Why good key naming matters:** Using a structured format like `entity:scope:identifier:modifier` allows for predictable key retrieval and wildcard purging (e.g., executing `SCAN` and `DEL` on `notifications:user:1042:*` when a user clicks "Mark All as Read").

## 6. Cache Invalidation Strategy

Cache invalidation is notoriously difficult. Let's evaluate the strategies:

- **Time To Live (TTL):** Data expires automatically after a set duration. Excellent as a fallback safety net.
- **Manual Invalidation:** Application code explicitly deletes keys on state change.
- **Write-Through:** Cache and DB are updated simultaneously.
- **Cache-Aside (Lazy Loading):** Application checks cache; on miss, fetches from DB, updates cache, and returns.
- **Write-Behind:** Application writes to cache, which asynchronously writes to DB. (High risk of data loss).
- **Event-Driven / WebSocket-Triggered:** Events emitted on state change automatically flush relevant keys across distributed nodes.

**Recommended Strategy:** A hybrid approach utilizing **Cache-Aside with TTL** combined with **Manual Invalidation**.
When an admin creates a notification, or a student marks a notification as read, the service layer manually invalidates the relevant `notifications:user:{id}:*` keys. Furthermore, all cached lists receive a baseline TTL (e.g., 5 minutes) to act as a safety net preventing permanently stale data in the event of an invalidation failure.

## 7. Request Lifecycle (Cache Flow)

1. **Client Request:** The student requests their dashboard notifications (`GET /api/v1/notifications`).
2. **Redis Lookup:** The Express Controller (or Service) queries Redis for the key `notifications:user:1042:page:1`.
3. **Cache Hit:** If the data exists, it is parsed from JSON and returned immediately to the client. PostgreSQL is completely bypassed.
4. **Cache Miss:** If the key does not exist or has expired:
   - The application executes the optimized query against PostgreSQL.
   - The retrieved result is serialized to JSON and stored in Redis via `SETEX` with a defined TTL.
   - The response is returned to the client.

## 8. Data Freshness Trade-offs

In distributed systems, the **CAP Theorem** dictates trade-offs between Consistency and Availability under Partition tolerance.

- **Stale Cache vs. Fresh Cache:** By caching, we deliberately trade absolute immediate consistency for massive gains in performance and availability. 
- **Why a few seconds of stale data is acceptable:** In a university notification system, if a student sees a placement announcement 5 seconds later than another student due to a TTL lag, the business impact is zero. However, if the database crashes because 50,000 students refreshed the page simultaneously, the business impact is critical (total outage). Therefore, slight staleness is a perfectly acceptable trade-off for high availability.

## 9. Redis Integration Architecture

Integrating Redis into our existing Node.js/Express backend requires a clean separation of concerns:

- **Redis Client & Connection Pool:** Utilize `ioredis` or the official `redis` npm package to maintain a persistent connection pool to the Redis server.
- **Environment Variables:** Connection strings must be strictly managed in `.env` (e.g., `REDIS_URL=redis://user:pass@localhost:6379`).
- **Repository / Service Layer Abstraction:** The caching logic should reside in a dedicated Service Layer wrapping the Repository. Controllers should blindly request data, agnostic of whether it originated from Redis or Postgres.
- **Error Handling & Fallback (CRITICAL):** The application must never crash if Redis goes down. All Redis operations must be wrapped in `try-catch` blocks. If a Redis timeout or failure occurs, the system must log the error and degrade gracefully by falling back to querying PostgreSQL directly.

## 10. Logging Strategy

Leveraging our existing custom logging middleware, we must instrument the caching layer to ensure deep system observability:

- **`[INFO]` Redis Connected:** Logged once on application startup.
- **`[DEBUG]` Cache Hit:** `Key notifications:user:1042:page:1 found in cache.`
- **`[DEBUG]` Cache Miss:** `Key notifications:user:1042:page:1 missing. Fetching from DB.`
- **`[INFO]` Cache Invalidated:** Logged when manual invalidation occurs (e.g., after marking as read).
- **`[WARN]` Fallback to PostgreSQL:** Logged if a Redis read operation times out, forcing a direct DB query.
- **`[ERROR]` Redis Failure:** Logged if the Redis connection completely drops or authentication fails.

## 11. Scaling Discussion

As the platform scales to support millions of notifications and thousands of concurrent users, a single Redis instance will eventually reach its memory or CPU limits.

- **Horizontal Scaling & Redis Cluster:** Data can be sharded across multiple Redis nodes automatically using Redis Cluster, distributing the memory capacity and computational load.
- **High Availability & Replication:** Employ **Redis Sentinel** to monitor primary-replica setups. If the primary cache node fails, Sentinel automatically promotes a read replica to primary, ensuring zero downtime (Failover).
- **Enterprise Deployment:** In a production cloud environment, utilizing fully managed services like AWS ElastiCache, Azure Cache for Redis, or Google Cloud Memorystore abstracts away the infrastructure maintenance overhead.

## 12. Security

Redis is notoriously fast because it bypasses many traditional database security overheads. Therefore, it must be secured architecturally:
- **Network Isolation:** Redis should NEVER be exposed to the public internet. It must reside strictly in a private VPC subnet, accessible only by the Backend API instances.
- **Authentication:** Enforce strict password authentication (`AUTH`) or Access Control Lists (ACLs) to restrict commands (e.g., disabling `FLUSHALL` for application users).
- **Encryption:** Use TLS/SSL for data in transit between the Node.js backend and the Redis server.
- **Data Sensitivity:** Avoid storing highly sensitive PII in the cache unnecessarily. If required, encrypt the payload before caching.
- **Rate Limiting:** Redis itself serves as an excellent datastore to implement IP-based rate limiting to protect the backend from DDoS attacks or API abuse.

## 13. Best Practices

To maintain a resilient, production-grade caching layer, adhere to these practices:
- **Avoid Caching Everything:** Only cache high-read, expensive queries. Unread counts and Page 1 lists yield the highest ROI.
- **Choose Appropriate TTLs:** Never cache data infinitely. Always set a TTL (e.g., 300 seconds) to prevent memory leaks and permanent stale data.
- **Monitor Cache Hit Ratio:** A low hit ratio (<50%) indicates ineffective caching or poor key design; a high hit ratio (>90%) indicates excellent offloading.
- **Avoid Cache Stampede:** Implement techniques like probabilistic early expiration or distributed locks (Redlock) to prevent thousands of requests hitting the database simultaneously when a highly popular key expires.
- **Compress Large Payloads:** If caching massive arrays of notifications, use Snappy or Gzip compression before storing in Redis to save RAM and minimize network latency.
- **Invalidate Intelligently:** Use focused invalidation on specific user keys rather than blindly flushing large scopes of the database.

## 14. Performance Comparison Table

| Metric | Without Cache (PostgreSQL Only) | With Redis Cache |
| ------ | ------------------------------- | ---------------- |
| **Database Load** | Very High (Queried on every API request) | Very Low (Offloaded to Redis) |
| **Latency / Response Time** | ~50ms - 200ms+ (Disk I/O bound) | ~1ms - 5ms (RAM-based) |
| **Scalability** | Hard limits on Postgres connection pools | Massively scalable horizontally |
| **CPU Usage (DB)** | High (Constant Sorting & Filtering) | Low (Processes writes & cache misses) |
| **Disk I/O** | High | Near zero for cached read operations |
| **Network Calls** | Backend ↔ Postgres | Backend ↔ Redis |
| **User Experience** | Degrades under heavy traffic load | Instant, snappy UI at all times |

## 15. Final Recommendation

**Architecture:** `Node.js + PostgreSQL + Redis + WebSockets`

This stack represents the gold standard for modern, high-scale notification platforms. 
- **PostgreSQL** provides the iron-clad ACID guarantees and complex querying capabilities required for reliable, persistent data storage. 
- **Redis** acts as an ultra-fast buffer, shielding the relational database from redundant read traffic, granting the system sub-millisecond latency, and absorbing massive traffic spikes effortlessly. 
- **WebSockets** complete the loop by providing instant, real-time push capabilities to connected clients. 

By strategically deploying this hybrid architecture, we achieve a fault-tolerant, highly available, and massively scalable platform capable of delivering millions of campus notifications seamlessly without compromising on performance or reliability.
