// ============================================================
// Stage 7 – ErrorBoundary Component (TypeScript upgrade)
// Wraps the entire app to gracefully catch React render errors.
// ============================================================
import React, { type ReactNode, type ErrorInfo } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import BugReportIcon from "@mui/icons-material/BugReport";
import { Log } from "@logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Log("frontend", "fatal", "component", `ErrorBoundary caught: ${error.message}`);
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Container maxWidth="sm" sx={{ py: 10 }}>
          <Box
            sx={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
            }}
          >
            <Stack alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BugReportIcon sx={{ fontSize: 40, color: "#ef4444" }} />
              </Box>

              <Typography variant="h5" fontWeight={700} color="error">
                Something went wrong
              </Typography>

              <Alert
                severity="error"
                sx={{ width: "100%", textAlign: "left", borderRadius: 2 }}
              >
                {this.state.error?.message ?? "An unexpected error occurred."}
              </Alert>

              <Button
                variant="contained"
                color="error"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
                aria-label="Retry loading the application"
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Try Again
              </Button>
            </Stack>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
