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
