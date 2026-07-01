// ============================================================
// Stage 7 – useSocket Hook
// Socket.IO client management: connect, reconnect, event handling.
// ============================================================
import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { Log } from "@logger";
import { useNotificationDispatch } from "../context/NotificationContext";
import type { Notification, SocketNotification } from "../types/notification";

const SOCKET_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SOCKET_URL) ||
  "http://localhost:5000";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const getActions = useNotificationDispatch();

  // ---------------------------------------------------------------------------
  // Handle incoming new_notification event
  // ---------------------------------------------------------------------------
  const handleNewNotification = useCallback(
    async (payload: SocketNotification) => {
      await Log("frontend", "info", "hook", `Socket: new_notification received id=${payload.id}`);

      // Convert SocketNotification → Notification shape
      const notification: Notification = {
        notification_id: payload.id,
        notification_type: payload.type,
        title: payload.title,
        message: payload.message,
        is_read: payload.isRead ?? false,
        created_at: payload.createdAt ?? new Date().toISOString(),
      };

      const actions = getActions();
      actions.prependNotification(notification);
      actions.showSnackbar(`📬 New ${payload.type} notification received`);
    },
    [getActions]
  );

  // ---------------------------------------------------------------------------
  // Connect / reconnect
  // ---------------------------------------------------------------------------
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    await Log("frontend", "info", "hook", `Connecting Socket.IO to ${SOCKET_URL}`);

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      timeout: 10_000,
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      await Log("frontend", "info", "hook", `Socket connected: ${socket.id}`);
    });

    socket.on("disconnect", async (reason: string) => {
      await Log("frontend", "warn", "hook", `Socket disconnected: ${reason}`);
    });

    socket.on("connect_error", async (err: Error) => {
      await Log("frontend", "error", "hook", `Socket connection error: ${err.message}`);
    });

    socket.on("reconnect", async (attempt: number) => {
      await Log("frontend", "info", "hook", `Socket reconnected after ${attempt} attempts`);
    });

    socket.on("reconnect_attempt", async (attempt: number) => {
      await Log("frontend", "debug", "hook", `Socket reconnect attempt #${attempt}`);
    });

    socket.on("new_notification", handleNewNotification);
  }, [handleNewNotification]);

  // ---------------------------------------------------------------------------
  // Disconnect
  // ---------------------------------------------------------------------------
  const disconnect = useCallback(async () => {
    if (socketRef.current) {
      await Log("frontend", "info", "hook", "Disconnecting socket");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Lifecycle – connect on mount, disconnect on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connect, disconnect, socket: socketRef };
}
