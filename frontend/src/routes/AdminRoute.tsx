import { Navigate, Outlet } from "react-router";
import { useAuth } from "../lib/auth";


export function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}