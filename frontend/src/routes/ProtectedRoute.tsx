import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";
import { useAuth } from "../lib/auth";

export function ProtectedRoute() {
  const {
    isAuthenticated,
    token,
    user,
  } = useAuth();

  const location = useLocation();

  if (!token || !isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background" />
    );
  }

  return <Outlet />;
}