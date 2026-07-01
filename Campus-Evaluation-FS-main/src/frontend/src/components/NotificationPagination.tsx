// ============================================================
// Stage 7 – NotificationPagination Component
// MUI Pagination with page info.
// ============================================================
import React, { memo, useCallback } from "react";
import { Box, Pagination, Stack, Typography } from "@mui/material";

interface NotificationPaginationProps {
  page: number;
  totalPages: number;
  totalNotifications: number;
  limit?: number;
  onChange: (page: number) => void;
}

export const NotificationPagination = memo(
  ({
    page,
    totalPages,
    totalNotifications,
    limit = 10,
    onChange,
  }: NotificationPaginationProps) => {
    const handleChange = useCallback(
      (_: React.ChangeEvent<unknown>, newPage: number) => {
        onChange(newPage);
      },
      [onChange]
    );

    if (totalPages <= 1) return null;

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, totalNotifications);

    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        mt={3}
        pt={2}
        sx={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.75rem" }}>
          Showing {from}–{to} of {totalNotifications} notifications
        </Typography>

        <Box>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handleChange}
            color="primary"
            shape="rounded"
            size="medium"
            showFirstButton
            showLastButton
            aria-label="Notification page navigation"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "text.secondary",
                borderColor: "rgba(255,255,255,0.12)",
                borderRadius: 1.5,
                transition: "all 0.2s",
                "&:hover": {
                  background: "rgba(99,102,241,0.15)",
                  borderColor: "rgba(99,102,241,0.4)",
                },
                "&.Mui-selected": {
                  background: "rgba(99,102,241,0.25)",
                  borderColor: "#6366f1",
                  color: "#a5b4fc",
                  fontWeight: 700,
                },
              },
            }}
          />
        </Box>
      </Stack>
    );
  }
);

NotificationPagination.displayName = "NotificationPagination";
