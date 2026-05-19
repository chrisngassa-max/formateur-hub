import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import type { ReactNode } from "react";

export function InscritRoute({ children }: { children: ReactNode }) {
  const { roles, loading } = useAuth();
  const isInscrit = roles.includes("inscrit") || roles.includes("admin");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!isInscrit) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
