// ============================================================
// Stage 7 – NotificationStats Component
// Shows summary cards: Total, Unread, Read, Priority counts.
// ============================================================
import React, { memo } from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
  iconBg: string;
}

const StatCard = memo(({ icon, label, value, gradient, iconBg }: StatCardProps) => (
  <Card
    sx={{
      borderRadius: 3,
      background: gradient,
      border: "1px solid rgba(255,255,255,0.08)",
      height: "100%",
    }}
  >
    <CardContent sx={{ py: "14px !important", px: "16px !important" }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: "text.primary", lineHeight: 1.1 }}
          >
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
));

StatCard.displayName = "StatCard";

// ---------------------------------------------------------------------------

interface NotificationStatsProps {
  total: number;
  unread: number;
  priority: number;
}

export const NotificationStats = memo(({ total, unread, priority }: NotificationStatsProps) => {
  const read = Math.max(0, total - unread);

  const stats: StatCardProps[] = [
    {
      label: "Total",
      value: total,
      icon: <NotificationsIcon sx={{ fontSize: 22, color: "#a5b4fc" }} />,
      gradient: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(0,0,0,0) 100%)",
      iconBg: "rgba(99,102,241,0.2)",
    },
    {
      label: "Unread",
      value: unread,
      icon: <MarkEmailUnreadIcon sx={{ fontSize: 22, color: "#fbbf24" }} />,
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(0,0,0,0) 100%)",
      iconBg: "rgba(245,158,11,0.2)",
    },
    {
      label: "Read",
      value: read,
      icon: <MarkEmailReadIcon sx={{ fontSize: 22, color: "#34d399" }} />,
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0) 100%)",
      iconBg: "rgba(16,185,129,0.2)",
    },
    {
      label: "Priority",
      value: priority,
      icon: <EmojiEventsIcon sx={{ fontSize: 22, color: "#f472b6" }} />,
      gradient: "linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(0,0,0,0) 100%)",
      iconBg: "rgba(244,114,182,0.2)",
    },
  ];

  return (
    <Grid container spacing={1.5} mb={3}>
      {stats.map((s) => (
        <Grid key={s.label} item xs={6} sm={3}>
          <StatCard {...s} />
        </Grid>
      ))}
    </Grid>
  );
});

NotificationStats.displayName = "NotificationStats";
