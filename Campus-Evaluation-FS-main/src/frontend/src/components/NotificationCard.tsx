// ============================================================
// Stage 7 – NotificationCard Component
// Displays a single notification with all actions.
// ============================================================
import React, { memo, useCallback } from "react";
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
import DoneIcon from "@mui/icons-material/Done";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CampaignIcon from "@mui/icons-material/Campaign";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";
import CircleIcon from "@mui/icons-material/Circle";
import type { Notification } from "../types/notification";
import { getTypeColor, formatRelativeTime } from "../utils/priority";

// ---------------------------------------------------------------------------
// Icon lookup by type
// ---------------------------------------------------------------------------
function TypeIcon({ type }: { type: string }) {
  const sx = { fontSize: 20 };
  switch (type) {
    case "Placement": return <CampaignIcon sx={{ ...sx, color: "#f59e0b" }} />;
    case "Result":    return <SchoolIcon   sx={{ ...sx, color: "#3b82f6" }} />;
    case "Event":     return <EventIcon    sx={{ ...sx, color: "#10b981" }} />;
    default:          return <CircleIcon   sx={{ ...sx, color: "#94a3b8" }} />;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
  highlighted?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const NotificationCard = memo(
  ({ notification, onMarkRead, onDelete, highlighted = false }: NotificationCardProps) => {
    const {
      notification_id,
      notification_type,
      title,
      message,
      is_read,
      created_at,
    } = notification;

    const typeColor = getTypeColor(notification_type);
    const relativeTime = formatRelativeTime(created_at);

    const handleMarkRead = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!is_read && onMarkRead) onMarkRead(notification_id);
      },
      [notification_id, is_read, onMarkRead]
    );

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(notification_id);
      },
      [notification_id, onDelete]
    );

    return (
      <Card
        aria-label={`Notification: ${title}`}
        tabIndex={0}
        sx={{
          mb: 1.5,
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          cursor: "default",
          border: highlighted
            ? `1px solid rgba(99,102,241,0.4)`
            : is_read
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(99,102,241,0.2)",
          background: is_read
            ? "rgba(255,255,255,0.03)"
            : highlighted
            ? "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)"
            : "rgba(255,255,255,0.06)",
          transition: "all 0.25s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            borderColor: "rgba(99,102,241,0.4)",
          },
          "&:focus-visible": {
            outline: "2px solid #6366f1",
            outlineOffset: 2,
          },
        }}
      >
        {/* Unread indicator stripe */}
        {!is_read && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: highlighted
                ? "linear-gradient(to bottom, #f59e0b, #8b5cf6)"
                : "linear-gradient(to bottom, #6366f1, #8b5cf6)",
              borderRadius: "3px 0 0 3px",
            }}
          />
        )}

        <CardContent sx={{ pl: !is_read ? 3 : 2, pr: 1.5, py: "14px !important" }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            {/* Type icon */}
            <Box
              sx={{
                mt: 0.25,
                flexShrink: 0,
                width: 38,
                height: 38,
                borderRadius: 2,
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TypeIcon type={notification_type} />
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Type chip + Read badge */}
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
                <Chip
                  label={notification_type}
                  size="small"
                  color={typeColor}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.68rem", height: 22, borderRadius: 1 }}
                  aria-label={`Type: ${notification_type}`}
                />
                {!is_read && (
                  <Chip
                    label="Unread"
                    size="small"
                    color="primary"
                    sx={{
                      height: 22,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      borderRadius: 1,
                      background: "rgba(99,102,241,0.25)",
                      color: "#a5b4fc",
                    }}
                    aria-label="Unread notification"
                  />
                )}
              </Stack>

              {/* Title */}
              <Typography
                variant="subtitle2"
                fontWeight={is_read ? 500 : 700}
                sx={{
                  color: is_read ? "text.secondary" : "text.primary",
                  lineHeight: 1.3,
                  mb: 0.25,
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
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                  fontSize: "0.8rem",
                }}
                title={message}
              >
                {message}
              </Typography>
            </Box>

            {/* Right side: timestamp + actions */}
            <Stack alignItems="flex-end" flexShrink={0} spacing={0.5}>
              <Typography
                variant="caption"
                sx={{ color: "text.disabled", fontSize: "0.7rem", whiteSpace: "nowrap" }}
              >
                {relativeTime}
              </Typography>

              <Stack direction="row" spacing={0.5} mt={0.5}>
                {!is_read && onMarkRead && (
                  <Tooltip title="Mark as read" arrow>
                    <IconButton
                      size="small"
                      onClick={handleMarkRead}
                      aria-label={`Mark notification ${notification_id} as read`}
                      sx={{
                        color: "#a5b4fc",
                        p: 0.6,
                        "&:hover": {
                          color: "#6366f1",
                          background: "rgba(99,102,241,0.15)",
                        },
                      }}
                    >
                      <DoneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {onDelete && (
                  <Tooltip title="Delete" arrow>
                    <IconButton
                      size="small"
                      onClick={handleDelete}
                      aria-label={`Delete notification ${notification_id}`}
                      sx={{
                        color: "#94a3b8",
                        p: 0.6,
                        "&:hover": {
                          color: "#ef4444",
                          background: "rgba(239,68,68,0.12)",
                        },
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
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

NotificationCard.displayName = "NotificationCard";
