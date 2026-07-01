// ============================================================
// Stage 7 – LoadingSkeleton Component
// Displays MUI Skeleton placeholders while data is fetching.
// ============================================================
import React, { memo } from "react";
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
} from "@mui/material";

interface LoadingSkeletonProps {
  count?: number;
}

const SingleSkeleton = memo(() => (
  <Card
    sx={{
      borderRadius: 3,
      mb: 1.5,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="90%" height={16} />
          <Skeleton variant="text" width="70%" height={16} sx={{ mt: 0.5 }} />
          <Stack direction="row" spacing={1} mt={1.5}>
            <Skeleton variant="rounded" width={70} height={24} />
            <Skeleton variant="rounded" width={60} height={24} />
          </Stack>
        </Box>
        <Stack spacing={1} alignItems="flex-end" flexShrink={0}>
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="rounded" width={80} height={30} />
        </Stack>
      </Stack>
    </CardContent>
  </Card>
));

SingleSkeleton.displayName = "SingleSkeleton";

export const LoadingSkeleton = memo(({ count = 5 }: LoadingSkeletonProps) => (
  <Box>
    {Array.from({ length: count }).map((_, i) => (
      <SingleSkeleton key={i} />
    ))}
  </Box>
));

LoadingSkeleton.displayName = "LoadingSkeleton";
