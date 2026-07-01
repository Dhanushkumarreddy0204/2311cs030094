// ============================================================
// Stage 7 – NotificationSearch Component
// 300ms debounced search bar.
// ============================================================
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  OutlinedInput,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface NotificationSearchProps {
  value: string;
  onChange: (query: string) => void;
  onClear?: () => void;
}

const DEBOUNCE_MS = 300;

export const NotificationSearch = memo(
  ({ value, onChange, onClear }: NotificationSearchProps) => {
    // Local state for immediate UI feedback
    const [localValue, setLocalValue] = useState(value);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync external value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setLocalValue(q);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          onChange(q);
        }, DEBOUNCE_MS);
      },
      [onChange]
    );

    const handleClear = useCallback(() => {
      setLocalValue("");
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      onChange("");
      if (onClear) onClear();
    }, [onChange, onClear]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    return (
      <Box>
        <OutlinedInput
          fullWidth
          id="notification-search-input"
          value={localValue}
          onChange={handleChange}
          placeholder="Search notifications by message, title or type…"
          inputProps={{
            "aria-label": "Search notifications",
          }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "text.disabled", fontSize: 20 }} />
            </InputAdornment>
          }
          endAdornment={
            localValue ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  aria-label="Clear search"
                  edge="end"
                  sx={{ color: "text.disabled" }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }
          sx={{
            borderRadius: 2.5,
            background: "rgba(255,255,255,0.05)",
            fontSize: "0.875rem",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.12)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(99,102,241,0.4)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#6366f1",
              borderWidth: 1.5,
            },
          }}
        />
      </Box>
    );
  }
);

NotificationSearch.displayName = "NotificationSearch";
