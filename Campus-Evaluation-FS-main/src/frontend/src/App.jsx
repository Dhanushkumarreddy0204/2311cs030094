import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./state/AuthContext";
import { useAuth } from "./hooks/useAuth";

function AppContent() {
  useAuth();
  return (
    <div>
      <Navbar />
      <Dashboard />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}