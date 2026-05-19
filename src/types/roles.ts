export type UserRole = "admin" | "gestionnaire" | "partenaire" | "inscrit" | "conseiller";

export interface UserWithRole {
  id: string;
  email?: string;
  role: UserRole;
}

// Permissions par rôle
export const PERMISSIONS = {
  admin: {
    leads: ["read", "write", "export", "assign", "archive"],
    dossiers: ["read", "write", "assign"],
    partenaires: ["read", "write", "activate"],
    utilisateurs: ["read", "write"],
    exports: ["read", "write"],
  },
  gestionnaire: {
    leads: ["read", "write", "export"],
    dossiers: ["read", "write"],
    partenaires: [],
    utilisateurs: [],
    exports: ["read"],
  },
  conseiller: {
    leads: ["read", "write"],
    dossiers: ["read", "write"],
    partenaires: [],
    utilisateurs: [],
    exports: [],
  },
  partenaire: {
    leads: [],
    dossiers: ["read", "write_status"],
    partenaires: [],
    utilisateurs: [],
    exports: [],
  },
  inscrit: {
    leads: [],
    dossiers: ["read_own"],
    partenaires: [],
    utilisateurs: [],
    exports: [],
  }
};

// Middleware ou utilitaire de protection des rôles
export function hasPermission(role: UserRole, resource: keyof typeof PERMISSIONS.admin, action: string): boolean {
  const rolePermissions = PERMISSIONS[role] as any;
  if (!rolePermissions) return false;
  return rolePermissions[resource]?.includes(action) ?? false;
}
