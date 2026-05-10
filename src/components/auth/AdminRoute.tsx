import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import type { ReactNode } from "react";

type AdminRouteProps = {
  children: ReactNode;
};

/**
 * Composant de garde de route pour les pages réservées aux administrateurs.
 * Redirige vers le dashboard si l'utilisateur n'est pas admin.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useAuth();

  // Pendant le chargement de la session, ne pas rediriger prématurément
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
