// ============================================================
// Stage 7 – App Root
// Wires ErrorBoundary, NotificationProvider, and Dashboard.
// ============================================================
import React from "react";
import {
  createTheme,
  CssBaseline,
  ThemeProvider,
} from "@mui/material";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotificationProvider } from "./context/NotificationContext";
import { Dashboard } from "./pages/Dashboard";

// ---------------------------------------------------------------------------
// MUI dark theme with indigo / violet accent
// ---------------------------------------------------------------------------
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366f1",
      light: "#818cf8",
      dark: "#4f46e5",
    },
    secondary: {
      main: "#8b5cf6",
    },
    error: {
      main: "#ef4444",
    },
    warning: {
      main: "#f59e0b",
    },
    info: {
      main: "#3b82f6",
    },
    success: {
      main: "#10b981",
    },
    background: {
      default: "#0f0f1a",
      paper: "#1e1e2e",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
      disabled: "#475569",
    },
    divider: "rgba(255,255,255,0.08)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: "0.75rem",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <Dashboard />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
