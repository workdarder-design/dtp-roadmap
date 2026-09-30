import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";
import { fetchProfile, type UserProfile } from "@/lib/services/profiles";

export interface AdminSession {
  email: string;
  name: string;
  userId: string;
  loggedInAt: string;
}

interface AuthContextValue {
  session: AdminSession | null;
  user: User | null;
  profile: UserProfile | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const globalAuth = globalThis as typeof globalThis & {
  __dcaaAuthContext?: React.Context<AuthContextValue | null>;
};

const AuthContext =
  globalAuth.__dcaaAuthContext ??
  (globalAuth.__dcaaAuthContext = createContext<AuthContextValue | null>(null));

function adminSessionFromUser(user: User | null, profile: UserProfile | null): AdminSession | null {
  if (!user?.email) return null;
  const name =
    profile?.displayName?.trim() ||
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email.split("@")[0] ||
    "Admin";
  return {
    email: user.email,
    name,
    userId: user.id,
    loggedInAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    try {
      const p = await fetchProfile(uid);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = async (session: Session | null): Promise<void> => {
      setUser(session?.user ?? null);
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }
      try {
        const p = await fetchProfile(session.user.id);
        if (mounted) setProfile(p);
      } catch {
        if (mounted) setProfile(null);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      void applySession(data.session).finally(() => {
        if (mounted) setHydrated(true);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) {
      return { ok: false as const, error: supabaseErrorMessage(error) };
    }
    await refreshProfile();
    return { ok: true as const };
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const session = useMemo(() => adminSessionFromUser(user, profile), [user, profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      hydrated,
      isAuthenticated: !!user,
      login,
      logout,
      refreshProfile,
    }),
    [session, user, profile, hydrated, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
