// ============================================================
// Stage 7 – PriorityNotificationList Component
// Top-10 priority section using Stage 6 algorithm results.
// ============================================================
import React, { memo } from "react";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { PriorityNotificationCard } from "./PriorityNotificationCard";
import type { Notification } from "../types/notification";

interface PriorityNotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export const PriorityNotificationList = memo(
  ({ notifications, onMarkRead, onDelete }: PriorityNotificationListProps) => {
    if (notifications.length === 0) return null;

    return (
      <Box mb={4}>
        {/* Section header */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          mb={2}
          sx={{
            pb: 1.5,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              background: "linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(139,92,246,0.3) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 18, color: "#fbbf24" }} />
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" fontWeight={800} sx={{ color: "text.primary", lineHeight: 1.2 }}>
                Priority Inbox
              </Typography>
              <Chip
                label={`Top ${notifications.length}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  background: "rgba(245,158,11,0.2)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 1,
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.72rem" }}>
              O(N log K) · Min Heap · Stage 6 Algorithm
            </Typography>
          </Box>
        </Stack>

        {/* Algorithm legend */}
        <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap">
          {[
            { label: "Placement", color: "#fbbf24", bg: "rgba(245,158,11,0.15)" },
            { label: "Result", color: "#60a5fa", bg: "rgba(59,130,246,0.15)" },
            { label: "Event", color: "#34d399", bg: "rgba(16,185,129,0.15)" },
          ].map(({ label, color, bg }) => (
            <Chip
              key={label}
              label={`${label} (Priority ${label === "Placement" ? 3 : label === "Result" ? 2 : 1})`}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.65rem",
                fontWeight: 600,
                background: bg,
                color,
                border: `1px solid ${color}33`,
                borderRadius: 1,
              }}
            />
          ))}
        </Stack>

        {/* Priority cards grid */}
        <Grid container spacing={1.5} role="list" aria-label="Priority notifications">
          {notifications.map((n, idx) => (
            <Grid key={n.notification_id} item xs={12} sm={6} lg={4} role="listitem">
              <PriorityNotificationCard
                notification={n}
                rank={idx + 1}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ mt: 3, borderColor: "rgba(255,255,255,0.06)" }} />
      </Box>
    );
  }
);

PriorityNotificationList.displayName = "PriorityNotificationList";
