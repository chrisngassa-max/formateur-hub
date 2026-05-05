import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configError } = useAuth();
  if (loading) return <div className="page"><p>Chargement...</p></div>;
  if (configError) return <div className="page narrow"><p className="ai-error">{configError}</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
