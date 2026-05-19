import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";

export type Role = "admin" | "gestionnaire" | "partenaire" | "inscrit" | "conseiller";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
  configError: string | null;
  isAdmin: boolean;
  isGestionnaire: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => loadRoles(newSession.user.id), 0);
        } else {
          setRoles([]);
        }
      });
      subscription = sub.subscription;

      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) loadRoles(data.session.user.id);
        setLoading(false);
      }).catch((error) => {
        setConfigError(error instanceof Error ? error.message : "Configuration Supabase indisponible.");
        setLoading(false);
      });
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Configuration Supabase indisponible.");
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  async function loadRoles(userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setRoles((data ?? []).map((r) => r.role as Role));
  }

  async function signIn(email: string, password: string) {
    if (configError) return { error: configError };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, firstName?: string, lastName?: string) {
    if (configError) return { error: configError };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName, last_name: lastName },
      },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        loading,
        configError,
        isAdmin: roles.includes("admin"),
        isGestionnaire: roles.includes("gestionnaire") || roles.includes("admin"),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
