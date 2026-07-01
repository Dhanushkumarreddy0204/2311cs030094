// ============================================================
// Stage 7 – Notification Types
// ============================================================

/** Notification types supported by the system. */
export type NotificationType = "Placement" | "Result" | "Event";

/** Priority weights for the frontend priority algorithm (mirrors Stage 6). */
export const PRIORITY_WEIGHTS: Readonly<Record<string, number>> = Object.freeze({
  Placement: 3,
  Result: 2,
  Event: 1,
});

/** A single notification entity returned from the backend. */
export interface Notification {
  notification_id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Notification object emitted by Socket.IO `new_notification` event. */
export interface SocketNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/** Paginated notifications response from GET /api/v1/notifications */
export interface NotificationsResponse {
  page: number;
  limit: number;
  totalNotifications: number;
  totalPages: number;
  data: Notification[];
}

/** Response from GET /api/v1/notifications/unread-count */
export interface UnreadCountResponse {
  unreadCount: number;
}

/** Response from PATCH /api/v1/notifications/:id/read */
export interface MarkReadResponse {
  success: boolean;
  message: string;
}

/** Response from PATCH /api/v1/notifications/read-all */
export interface MarkAllReadResponse {
  updated: number;
  message: string;
}

/** Request body for POST /api/v1/notifications */
export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
}

/** Filter options for the notification list. */
export type NotificationFilter =
  | "All"
  | "Placement"
  | "Result"
  | "Event"
  | "Read"
  | "Unread";

/** Parameters for fetching notifications. */
export interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  notification_type?: string;
  isRead?: boolean;
}
