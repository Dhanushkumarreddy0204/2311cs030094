// ============================================================
// Stage 7 – NotificationFilter Component
// Filter dropdown: All / Placement / Result / Event / Read / Unread
// ============================================================
import React, { memo, useCallback } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import type { NotificationFilter } from "../types/notification";

interface NotificationFilterProps {
  value: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
}

const FILTERS: { label: string; value: NotificationFilter }[] = [
  { label: "All Notifications", value: "All" },
  { label: "Placement", value: "Placement" },
  { label: "Result", value: "Result" },
  { label: "Event", value: "Event" },
  { label: "Read", value: "Read" },
  { label: "Unread", value: "Unread" },
];

export const NotificationFilter = memo(({ value, onChange }: NotificationFilterProps) => {
  const handleChange = useCallback(
    (e: SelectChangeEvent<NotificationFilter>) => {
      onChange(e.target.value as NotificationFilter);
    },
    [onChange]
  );

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel
        id="notification-filter-label"
        sx={{
          color: "text.secondary",
          "&.Mui-focused": { color: "#6366f1" },
        }}
      >
        Filter
      </InputLabel>
      <Select
        labelId="notification-filter-label"
        id="notification-filter-select"
        value={value}
        label="Filter"
        onChange={handleChange}
        aria-label="Filter notifications"
        sx={{
          borderRadius: 2,
          background: "rgba(255,255,255,0.05)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.12)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(99,102,241,0.4)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6366f1",
          },
        }}
      >
        {FILTERS.map(({ label, value: v }) => (
          <MenuItem key={v} value={v}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

NotificationFilter.displayName = "NotificationFilter";
