// ============================================================
// Stage 7 – PriorityNotificationCard
// Highlighted card for Priority Inbox section (Stage 6 result).
// ============================================================
import React, { memo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import DoneIcon from "@mui/icons-material/Done";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import type { Notification } from "../types/notification";
import { PRIORITY_WEIGHTS } from "../types/notification";
import { formatRelativeTime } from "../utils/priority";

// ---------------------------------------------------------------------------
// Priority rank badge colors
// ---------------------------------------------------------------------------
const RANK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Placement: {
    bg: "rgba(245,158,11,0.15)",
    text: "#fbbf24",
    border: "rgba(245,158,11,0.4)",
  },
  Result: {
    bg: "rgba(59,130,246,0.15)",
    text: "#60a5fa",
    border: "rgba(59,130,246,0.4)",
  },
  Event: {
    bg: "rgba(16,185,129,0.15)",
    text: "#34d399",
    border: "rgba(16,185,129,0.4)",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PriorityNotificationCardProps {
  notification: Notification;
  rank: number;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const PriorityNotificationCard = memo(
  ({ notification, rank, onMarkRead, onDelete }: PriorityNotificationCardProps) => {
    const {
      notification_id,
      notification_type,
      title,
      message,
      is_read,
      created_at,
    } = notification;

    const weight = PRIORITY_WEIGHTS[notification_type] ?? 0;
    const colors = RANK_COLORS[notification_type] ?? {
      bg: "rgba(148,163,184,0.1)",
      text: "#94a3b8",
      border: "rgba(148,163,184,0.3)",
    };
    const relativeTime = formatRelativeTime(created_at);

    return (
      <Card
        aria-label={`Priority notification rank ${rank}: ${title}`}
        tabIndex={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${colors.border}`,
          background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(0,0,0,0) 100%)`,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.25s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
          },
          "&:focus-visible": {
            outline: `2px solid ${colors.text}`,
            outlineOffset: 2,
          },
        }}
      >
        {/* Rank badge */}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 12,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 1.5,
            px: 0.8,
            py: 0.2,
            display: "flex",
            alignItems: "center",
            gap: 0.4,
          }}
          aria-label={`Rank ${rank}`}
        >
          <StarIcon sx={{ fontSize: 11, color: colors.text }} />
          <Typography
            variant="caption"
            sx={{ fontSize: "0.65rem", fontWeight: 800, color: colors.text, lineHeight: 1 }}
          >
            #{rank}
          </Typography>
        </Box>

        <CardContent sx={{ pr: 6, py: "12px !important" }}>
          <Stack spacing={0.75}>
            {/* Type + priority weight */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={notification_type}
                size="small"
                sx={{
                  height: 22,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  borderRadius: 1,
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: colors.text, fontSize: "0.65rem", fontWeight: 600 }}
              >
                Priority {weight}
              </Typography>
            </Stack>

            {/* Title */}
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{
                color: "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={title}
            >
              {title}
            </Typography>

            {/* Message */}
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                fontSize: "0.75rem",
              }}
              title={message}
            >
              {message}
            </Typography>

            {/* Footer */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
              <Typography
                variant="caption"
                sx={{ color: "text.disabled", fontSize: "0.68rem" }}
              >
                {relativeTime}
              </Typography>

              <Stack direction="row" spacing={0.5}>
                {!is_read && onMarkRead && (
                  <Tooltip title="Mark as read" arrow>
                    <IconButton
                      size="small"
                      onClick={() => onMarkRead(notification_id)}
                      aria-label={`Mark priority notification ${notification_id} as read`}
                      sx={{
                        p: 0.5,
                        color: colors.text,
                        "&:hover": { background: colors.bg },
                      }}
                    >
                      <DoneIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Delete" arrow>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(notification_id)}
                      aria-label={`Delete priority notification ${notification_id}`}
                      sx={{
                        p: 0.5,
                        color: "#64748b",
                        "&:hover": { color: "#ef4444", background: "rgba(239,68,68,0.1)" },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }
);

PriorityNotificationCard.displayName = "PriorityNotificationCard";
