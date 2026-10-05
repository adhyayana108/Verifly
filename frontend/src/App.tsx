import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import { AuthProvider } from "./lib/auth";

import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AdminRoute } from "./routes/AdminRoute";

import { AppShell } from "./components/layout/AppShell";

import { LandingPage } from "./pages/Landing";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { OverviewPage } from "./pages/Overview";
import { VerifyPage } from "./pages/Verify";
import { BulkPage } from "./pages/Bulk";
import { HistoryPage } from "./pages/History";
import { AnalyticsPage } from "./pages/Analytics";
import { AdminPage } from "./pages/Admin";
import { NotFoundPage } from "./pages/Notfound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          {/* Protected application */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/app"
              element={<AppShell />}
            >
              <Route
                index
                element={<OverviewPage />}
              />

              <Route
                path="verify"
                element={<VerifyPage />}
              />

              <Route
                path="bulk"
                element={<BulkPage />}
              />

              <Route
                path="history"
                element={<HistoryPage />}
              />

              <Route
                path="analytics"
                element={<AnalyticsPage />}
              />

              {/* Admin */}
              <Route element={<AdminRoute />}>
                <Route
                  path="admin"
                  element={<AdminPage />}
                />
              </Route>
            </Route>
          </Route>

          {/* Backwards-compatible dashboard URL */}
          <Route
            path="/dashboard"
            element={
              <Navigate
                to="/app"
                replace
              />
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}