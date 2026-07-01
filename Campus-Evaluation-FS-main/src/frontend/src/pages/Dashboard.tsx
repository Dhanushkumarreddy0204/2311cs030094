// ============================================================
// Stage 7 – Dashboard Page
// Main Notification Management Dashboard.
// ============================================================
import React, { lazy, Suspense, useCallback, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { Log } from "@logger";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";
import { useNotificationContext, useNotificationDispatch } from "../context/NotificationContext";

// Lazy-loaded components for performance
const NotificationHeader          = lazy(() => import("../components/NotificationHeader").then(m => ({ default: m.NotificationHeader })));
const NotificationStats           = lazy(() => import("../components/NotificationStats").then(m => ({ default: m.NotificationStats })));
const NotificationSearch          = lazy(() => import("../components/NotificationSearch").then(m => ({ default: m.NotificationSearch })));
const NotificationFilter          = lazy(() => import("../components/NotificationFilter").then(m => ({ default: m.NotificationFilter })));
const PriorityNotificationList    = lazy(() => import("../components/PriorityNotificationList").then(m => ({ default: m.PriorityNotificationList })));
const NotificationList            = lazy(() => import("../components/NotificationList").then(m => ({ default: m.NotificationList })));
const NotificationPagination      = lazy(() => import("../components/NotificationPagination").then(m => ({ default: m.NotificationPagination })));
const LoadingSkeleton             = lazy(() => import("../components/LoadingSkeleton").then(m => ({ default: m.LoadingSkeleton })));
const EmptyState                  = lazy(() => import("../components/EmptyState").then(m => ({ default: m.EmptyState })));

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------
const SuspenseFallback = () => (
  <Box sx={{ py: 4 }}>
    <LinearProgress sx={{ borderRadius: 1, background: "rgba(99,102,241,0.15)" }} />
  </Box>
);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export function Dashboard() {
  const { state } = useNotificationContext();
  const getActions = useNotificationDispatch();

  const {
    markRead,
    markAllRead,
    deleteNotification,
    changePage,
    changeFilter,
    changeSearch,
    refresh,
  } = useNotifications();

  // Initialize socket connection
  useSocket();

  // Log dashboard load
  useEffect(() => {
    Log("frontend", "info", "page", "Dashboard loaded");
  }, []);

  // ---------------------------------------------------------------------------
  // Snackbar handlers
  // ---------------------------------------------------------------------------
  const handleSnackbarClose = useCallback(() => {
    const actions = getActions();
    actions.hideSnackbar();
  }, [getActions]);

  // ---------------------------------------------------------------------------
  // Error retry
  // ---------------------------------------------------------------------------
  const handleRetry = useCallback(() => {
    refresh();
  }, [refresh]);

  const {
    notifications,
    priorityNotifications,
    unreadCount,
    currentPage,
    totalPages,
    totalNotifications,
    filter,
    searchQuery,
    loading,
    error,
    snackbarOpen,
    snackbarMessage,
  } = state;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
        py: { xs: 2, md: 4 },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ px: { xs: 1.5, sm: 3 } }}
      >
        {/* ------------------------------------------------------------------ */}
        {/* Top linear progress for loading state                              */}
        {/* ------------------------------------------------------------------ */}
        {loading && (
          <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999 }}>
            <LinearProgress
              sx={{
                background: "rgba(99,102,241,0.15)",
                "& .MuiLinearProgress-bar": {
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
                },
              }}
            />
          </Box>
        )}

        <Suspense fallback={<SuspenseFallback />}>
          {/* ---------------------------------------------------------------- */}
          {/* Header                                                           */}
          {/* ---------------------------------------------------------------- */}
          <NotificationHeader
            unreadCount={unreadCount}
            loading={loading}
            onRefresh={refresh}
            onMarkAllRead={markAllRead}
          />

          {/* ---------------------------------------------------------------- */}
          {/* Stats row                                                        */}
          {/* ---------------------------------------------------------------- */}
          <NotificationStats
            total={totalNotifications}
            unread={unreadCount}
            priority={priorityNotifications.length}
          />

          {/* ---------------------------------------------------------------- */}
          {/* Search + Filter row                                              */}
          {/* ---------------------------------------------------------------- */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            mb={3}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Box sx={{ flex: 1 }}>
              <NotificationSearch
                value={searchQuery}
                onChange={changeSearch}
                onClear={() => changeSearch("")}
              />
            </Box>
            <NotificationFilter value={filter} onChange={changeFilter} />
          </Stack>

          {/* ---------------------------------------------------------------- */}
          {/* Error state                                                      */}
          {/* ---------------------------------------------------------------- */}
          {!loading && error && (
            <Box mb={3}>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={handleRetry} aria-label="Retry loading notifications">
                    Retry
                  </Button>
                }
                sx={{ borderRadius: 2 }}
              >
                Failed to load notifications: {error}
              </Alert>
            </Box>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Priority Inbox Section (Stage 6 algorithm)                       */}
          {/* ---------------------------------------------------------------- */}
          {!loading && priorityNotifications.length > 0 && (
            <PriorityNotificationList
              notifications={priorityNotifications}
              onMarkRead={markRead}
              onDelete={deleteNotification}
            />
          )}

          {/* ---------------------------------------------------------------- */}
          {/* All Notifications section header                                 */}
          {/* ---------------------------------------------------------------- */}
          {!loading && notifications.length > 0 && (
            <Box mb={2}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: "text.primary" }}
                >
                  All Notifications
                </Typography>
                {filter !== "All" && (
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    • Filtered by: {filter}
                  </Typography>
                )}
              </Stack>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1.5 }} />
            </Box>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Loading skeleton                                                 */}
          {/* ---------------------------------------------------------------- */}
          {loading && <LoadingSkeleton count={5} />}

          {/* ---------------------------------------------------------------- */}
          {/* Notification list                                                */}
          {/* ---------------------------------------------------------------- */}
          {!loading && !error && notifications.length > 0 && (
            <NotificationList
              notifications={notifications}
              onMarkRead={markRead}
              onDelete={deleteNotification}
            />
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Empty state                                                      */}
          {/* ---------------------------------------------------------------- */}
          {!loading && !error && notifications.length === 0 && (
            <EmptyState
              message={
                searchQuery
                  ? `No notifications match "${searchQuery}". Try a different search.`
                  : filter !== "All"
                  ? `No ${filter.toLowerCase()} notifications found.`
                  : undefined
              }
              onRefresh={refresh}
            />
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Pagination                                                       */}
          {/* ---------------------------------------------------------------- */}
          {!loading && !error && (
            <NotificationPagination
              page={currentPage}
              totalPages={totalPages}
              totalNotifications={totalNotifications}
              onChange={changePage}
            />
          )}
        </Suspense>
      </Container>

      {/* -------------------------------------------------------------------- */}
      {/* Realtime Snackbar                                                    */}
      {/* -------------------------------------------------------------------- */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        aria-live="polite"
        aria-label="Notification status"
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          variant="filled"
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
            fontWeight: 600,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
