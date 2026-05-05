import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><p>Chargement…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
