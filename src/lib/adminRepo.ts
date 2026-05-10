import { supabase } from "../integrations/supabase/client";

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: "admin" | "conseiller";
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  // Option 3 : Puisque vous utilisez Lovable, on peut récupérer directement depuis 
  // les tables publiques "profiles" et "user_roles" sans avoir besoin d'Edge Function ni RPC !
  
  const [profilesResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("user_roles").select("*")
  ]);

  if (profilesResult.error) {
    throw new Error(`Erreur lors de la récupération des profils: ${profilesResult.error.message}`);
  }
  
  if (rolesResult.error) {
    throw new Error(`Erreur lors de la récupération des rôles: ${rolesResult.error.message}`);
  }

  const profiles = profilesResult.data || [];
  const roles = rolesResult.data || [];

  return profiles.map(profile => {
    const userRole = roles.find(r => r.user_id === profile.id);
    return {
      id: profile.id,
      email: profile.email,
      created_at: profile.created_at,
      last_sign_in_at: profile.updated_at, // Approximation via updated_at
      role: userRole?.role || "conseiller"
    };
  });
}
