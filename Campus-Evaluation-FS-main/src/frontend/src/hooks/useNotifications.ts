// ============================================================
// Stage 7 – useNotifications Hook
// Handles fetching, pagination, filtering, searching,
// mark-read, delete, and unread count.
// ============================================================
import { useCallback, useEffect, useRef } from "react";
import { Log } from "@logger";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as apiDeleteNotification,
} from "../services/notificationApi";
import {
  useNotificationContext,
  useNotificationDispatch,
} from "../context/NotificationContext";
import { getTopKNotifications } from "../utils/priority";
import type { NotificationFilter } from "../types/notification";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotifications() {
  const { state } = useNotificationContext();
  const getActions = useNotificationDispatch();

  // Stable ref to avoid stale-closure issues inside fetch
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---------------------------------------------------------------------------
  // Fetch notifications (with current page, filter, search)
  // ---------------------------------------------------------------------------
  const loadNotifications = useCallback(
    async (overrides?: { page?: number; filter?: NotificationFilter; search?: string }) => {
      const actions = getActions();
      const { currentPage, filter, searchQuery } = stateRef.current;

      const page   = overrides?.page   ?? currentPage;
      const f      = overrides?.filter ?? filter;
      const search = overrides?.search ?? searchQuery;

      actions.setLoading(true);
      await Log("frontend", "info", "hook", `Loading notifications page=${page} filter=${f} search="${search}"`);

      try {
        // Build filter params
        const params: Parameters<typeof fetchNotifications>[0] = { page, limit: 10 };

        if (f === "Read")   params.isRead = true;
        if (f === "Unread") params.isRead = false;
        if (f === "Placement" || f === "Result" || f === "Event") {
          params.notification_type = f;
        }

        const data = await fetchNotifications(params);

        // Client-side search filter (case-insensitive, by message or type)
        let filtered = data.data;
        if (search.trim()) {
          const q = search.toLowerCase();
          filtered = data.data.filter(
            (n) =>
              n.message.toLowerCase().includes(q) ||
              n.notification_type.toLowerCase().includes(q) ||
              n.title.toLowerCase().includes(q)
          );
        }

        actions.setNotifications(filtered, data.totalPages, data.totalNotifications);

        // Compute priority notifications from the current page
        const top10 = getTopKNotifications(filtered, 10);
        actions.setPriorityNotifications(top10);

        await Log("frontend", "info", "hook", `Loaded ${filtered.length} notifications, priority=${top10.length}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await Log("frontend", "error", "hook", `Failed to load notifications: ${msg}`);
        actions.setError(msg);
      }
    },
    [getActions]
  );

  // ---------------------------------------------------------------------------
  // Fetch unread count
  // ---------------------------------------------------------------------------
  const loadUnreadCount = useCallback(async () => {
    const actions = getActions();
    try {
      const data = await fetchUnreadCount();
      actions.setUnreadCount(data.unreadCount);
      await Log("frontend", "debug", "hook", `Unread count: ${data.unreadCount}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await Log("frontend", "warn", "hook", `Failed to load unread count: ${msg}`);
    }
  }, [getActions]);

  // ---------------------------------------------------------------------------
  // Mark single notification as read
  // ---------------------------------------------------------------------------
  const markRead = useCallback(
    async (id: number) => {
      const actions = getActions();
      await Log("frontend", "info", "hook", `Marking notification ${id} as read`);
      try {
        await markNotificationAsRead(id);
        actions.markRead(id);
        await loadUnreadCount();
        actions.showSnackbar("Notification marked as read");
        await Log("frontend", "info", "hook", `Notification ${id} marked as read`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await Log("frontend", "error", "hook", `Failed to mark notification ${id} as read: ${msg}`);
        actions.showSnackbar("Failed to mark as read");
      }
    },
    [getActions, loadUnreadCount]
  );

  // ---------------------------------------------------------------------------
  // Mark all notifications as read
  // ---------------------------------------------------------------------------
  const markAllRead = useCallback(async () => {
    const actions = getActions();
    await Log("frontend", "info", "hook", "Marking all notifications as read");
    try {
      await markAllNotificationsAsRead();
      actions.markAllRead();
      actions.setUnreadCount(0);
      actions.showSnackbar("All notifications marked as read");
      await Log("frontend", "info", "hook", "All notifications marked as read");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await Log("frontend", "error", "hook", `Failed to mark all as read: ${msg}`);
      actions.showSnackbar("Failed to mark all as read");
    }
  }, [getActions]);

  // ---------------------------------------------------------------------------
  // Delete a notification
  // ---------------------------------------------------------------------------
  const deleteNotification = useCallback(
    async (id: number) => {
      const actions = getActions();
      await Log("frontend", "info", "hook", `Deleting notification ${id}`);
      try {
        await apiDeleteNotification(id);
        actions.deleteNotification(id);
        await loadUnreadCount();
        actions.showSnackbar("Notification deleted");
        await Log("frontend", "info", "hook", `Notification ${id} deleted`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await Log("frontend", "error", "hook", `Failed to delete notification ${id}: ${msg}`);
        actions.showSnackbar("Failed to delete notification");
      }
    },
    [getActions, loadUnreadCount]
  );

  // ---------------------------------------------------------------------------
  // Pagination change
  // ---------------------------------------------------------------------------
  const changePage = useCallback(
    async (page: number) => {
      const actions = getActions();
      actions.setPage(page);
      await Log("frontend", "debug", "hook", `Pagination changed to page ${page}`);
      await loadNotifications({ page });
    },
    [getActions, loadNotifications]
  );

  // ---------------------------------------------------------------------------
  // Filter change
  // ---------------------------------------------------------------------------
  const changeFilter = useCallback(
    async (filter: NotificationFilter) => {
      const actions = getActions();
      actions.setFilter(filter);
      await Log("frontend", "debug", "hook", `Filter changed to: ${filter}`);
      await loadNotifications({ page: 1, filter });
    },
    [getActions, loadNotifications]
  );

  // ---------------------------------------------------------------------------
  // Search change
  // ---------------------------------------------------------------------------
  const changeSearch = useCallback(
    async (search: string) => {
      const actions = getActions();
      actions.setSearch(search);
      await Log("frontend", "debug", "hook", `Search changed: "${search}"`);
      await loadNotifications({ page: 1, search });
    },
    [getActions, loadNotifications]
  );

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    await Log("frontend", "info", "hook", "Manual refresh triggered");
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    loadNotifications,
    loadUnreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    changePage,
    changeFilter,
    changeSearch,
    refresh,
  };
}
