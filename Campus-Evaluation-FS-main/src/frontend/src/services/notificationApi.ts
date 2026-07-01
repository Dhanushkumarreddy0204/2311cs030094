// ============================================================
// Stage 7 – Notification API Service
// Centralized Axios layer for all notification REST endpoints.
// ============================================================
import axios, { AxiosError } from "axios";
import { Log } from "@logger";
import type {
  NotificationsResponse,
  UnreadCountResponse,
  MarkReadResponse,
  MarkAllReadResponse,
  CreateNotificationRequest,
  FetchNotificationsParams,
} from "../types/notification";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ---------------------------------------------------------------------------
// Request interceptor – log every outgoing call
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  async (config) => {
    await Log("frontend", "debug", "api", `API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  async (error: AxiosError) => {
    await Log("frontend", "error", "api", `Request Error: ${error.message}`);
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Response interceptor – log success / failure
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  async (response) => {
    await Log(
      "frontend",
      "info",
      "api",
      `API Success: ${response.config.method?.toUpperCase()} ${response.config.url} [${response.status}]`
    );
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status ?? "N/A";
    const url = error.config?.url ?? "unknown";
    await Log(
      "frontend",
      "error",
      "api",
      `API Failure: ${url} [${status}] – ${error.message}`
    );
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/notifications
 * Supports pagination, type filter and isRead filter.
 */
export async function fetchNotifications(
  params: FetchNotificationsParams = {}
): Promise<NotificationsResponse> {
  const { page = 1, limit = 10, notification_type, isRead } = params;

  const queryParams: Record<string, string | number | boolean> = { page, limit };
  if (notification_type && notification_type !== "All") {
    queryParams.notification_type = notification_type;
  }
  if (isRead !== undefined) {
    queryParams.isRead = isRead;
  }

  const response = await api.get<NotificationsResponse>("/v1/notifications", {
    params: queryParams,
  });
  return response.data;
}

/**
 * GET /api/v1/notifications/unread-count
 */
export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const response = await api.get<UnreadCountResponse>("/v1/notifications/unread-count");
  return response.data;
}

/**
 * PATCH /api/v1/notifications/:id/read
 */
export async function markNotificationAsRead(id: number): Promise<MarkReadResponse> {
  const response = await api.patch<MarkReadResponse>(`/v1/notifications/${id}/read`);
  return response.data;
}

/**
 * PATCH /api/v1/notifications/read-all
 */
export async function markAllNotificationsAsRead(): Promise<MarkAllReadResponse> {
  const response = await api.patch<MarkAllReadResponse>("/v1/notifications/read-all");
  return response.data;
}

/**
 * POST /api/v1/notifications
 */
export async function createNotification(
  payload: CreateNotificationRequest
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>("/v1/notifications", payload);
  return response.data;
}

/**
 * DELETE /api/v1/notifications/:id
 */
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/v1/notifications/${id}`);
}
