import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import type { ReactNode } from "react";

type PartenaireRouteProps = {
  children: ReactNode;
};

/**
 * Route guard component for pages reserved for administrative partners.
 * Redirects to dashboard if the user does not have the required rights.
 */
export function PartenaireRoute({ children }: PartenaireRouteProps) {
  const { roles, loading } = useAuth();
  
  const isPartenaire = roles.includes("partenaire") || roles.includes("admin");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!isPartenaire) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
