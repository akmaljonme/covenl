import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, qk, type AppRole, type Profile } from "@/lib/api";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  isDirector: boolean;
  isDeveloper: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  const profileQuery = useQuery({
    queryKey: qk.profile(userId ?? "anonymous"),
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  });

  const value = useMemo<AuthContextValue>(() => {
    const profile = profileQuery.data ?? null;
    return {
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      isDirector: profile?.role === "director",
      isDeveloper: profile?.role === "developer",
      loading: loading || (Boolean(userId) && profileQuery.isLoading),
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    };
  }, [session, profileQuery.data, profileQuery.isLoading, loading, userId, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
