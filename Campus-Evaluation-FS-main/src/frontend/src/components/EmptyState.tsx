// ============================================================
// Stage 7 – EmptyState Component
// Displayed when no notifications exist.
// ============================================================
import React, { memo } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import RefreshIcon from "@mui/icons-material/Refresh";

interface EmptyStateProps {
  message?: string;
  onRefresh?: () => void;
}

export const EmptyState = memo(({ message, onRefresh }: EmptyStateProps) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    py={10}
    sx={{ textAlign: "center" }}
  >
    <Box
      sx={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 3,
        border: "2px solid rgba(99,102,241,0.2)",
      }}
    >
      <NotificationsOffIcon
        sx={{ fontSize: 48, color: "rgba(99,102,241,0.7)" }}
      />
    </Box>

    <Typography
      variant="h6"
      fontWeight={700}
      sx={{ color: "text.primary", mb: 1 }}
    >
      No Notifications Found
    </Typography>

    <Typography
      variant="body2"
      sx={{ color: "text.secondary", mb: 4, maxWidth: 320 }}
    >
      {message ??
        "You're all caught up! There are no notifications matching your current filters."}
    </Typography>

    {onRefresh && (
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          aria-label="Refresh notifications"
          sx={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Refresh
        </Button>
      </Stack>
    )}
  </Box>
));

EmptyState.displayName = "EmptyState";
