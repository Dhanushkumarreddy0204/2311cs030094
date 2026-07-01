// ============================================================
// Stage 7 – NotificationHeader Component
// Top bar: title, unread badge, refresh, mark-all-read.
// ============================================================
import React, { memo } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RefreshIcon from "@mui/icons-material/Refresh";
import DoneAllIcon from "@mui/icons-material/DoneAll";

interface NotificationHeaderProps {
  unreadCount: number;
  loading: boolean;
  onRefresh: () => void;
  onMarkAllRead: () => void;
}

export const NotificationHeader = memo(
  ({ unreadCount, loading, onRefresh, onMarkAllRead }: NotificationHeaderProps) => (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      spacing={2}
      mb={3}
    >
      {/* Left: Title + Badge */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            overlap="circular"
            aria-label={`${unreadCount} unread notifications`}
          >
            <NotificationsIcon sx={{ color: "white", fontSize: 26 }} />
          </Badge>
        </Box>

        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.2,
            }}
          >
            Notifications
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.2 }}>
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
              : "All caught up!"}
          </Typography>
        </Box>
      </Stack>

      {/* Right: Actions */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {/* Refresh button */}
        <Tooltip title="Refresh notifications" arrow>
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh notifications"
            sx={{
              color: "text.secondary",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 2,
              "&:hover": {
                borderColor: "rgba(99,102,241,0.5)",
                color: "#a5b4fc",
                background: "rgba(99,102,241,0.1)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} thickness={4} sx={{ color: "#a5b4fc" }} />
            ) : (
              <RefreshIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={onMarkAllRead}
            disabled={loading}
            aria-label="Mark all notifications as read"
            sx={{
              borderColor: "rgba(99,102,241,0.4)",
              color: "#a5b4fc",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              "&:hover": {
                borderColor: "#6366f1",
                background: "rgba(99,102,241,0.1)",
              },
            }}
          >
            Mark all read
          </Button>
        )}
      </Stack>
    </Stack>
  )
);

NotificationHeader.displayName = "NotificationHeader";
