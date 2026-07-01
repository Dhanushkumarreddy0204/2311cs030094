// ============================================================
// Stage 7 – NotificationList Component
// Renders the full paginated notification list.
// ============================================================
import React, { memo } from "react";
import { Stack } from "@mui/material";
import { NotificationCard } from "./NotificationCard";
import type { Notification } from "../types/notification";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export const NotificationList = memo(
  ({ notifications, onMarkRead, onDelete }: NotificationListProps) => (
    <Stack spacing={0} role="list" aria-label="Notifications">
      {notifications.map((n) => (
        <NotificationCard
          key={n.notification_id}
          notification={n}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </Stack>
  )
);

NotificationList.displayName = "NotificationList";
