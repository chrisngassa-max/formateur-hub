import { supabase } from "../integrations/supabase/client";

export type UserProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export async function fetchProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from("profiles").select("id, email, first_name, last_name");
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
  
  return data.map(d => ({
    id: d.id,
    email: d.email,
    firstName: d.first_name,
    lastName: d.last_name
  }));
}
