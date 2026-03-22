import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: UserProfile;
  userRoles: string[];
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  setProfile: (p: UserProfile) => void;
  signOut: () => Promise<void>;
}

const defaultProfile: UserProfile = { full_name: null, avatar_url: null };

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  profile: defaultProfile,
  userRoles: [],
  isAdmin: false,
  refreshProfile: async () => {},
  setProfile: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserData = useCallback(async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    const roles = (rolesRes.data || []).map((r: any) => r.role);
    setUserRoles(roles);
    setIsAdmin(roles.includes("admin"));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .single();
    if (data) setProfile(data);
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (_event === "SIGNED_IN" && session?.user) {
          // Defer to avoid Supabase deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
            registerDeviceIfNeeded(session.user.id);
          }, 0);
        }
        if (_event === "SIGNED_OUT") {
          setProfile(defaultProfile);
          setUserRoles([]);
          setIsAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchUserData(session.user.id);
        updateDeviceLastActive(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, profile, userRoles, isAdmin, refreshProfile, setProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper to register device if not already registered
async function registerDeviceIfNeeded(userId: string) {
  try {
    const fp = getSimpleFingerprint();
    const { data } = await supabase
      .from("user_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("device_fingerprint", fp)
      .eq("is_active", true)
      .maybeSingle();
    
    if (!data) {
      const { count } = await supabase
        .from("user_devices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true);
      
      if ((count || 0) === 0) {
        const info = getSimpleDeviceInfo();
        await supabase.from("user_devices").insert({
          user_id: userId,
          device_name: info.deviceName,
          browser: info.browser,
          os: info.os,
          device_fingerprint: fp,
        });
      }
    }
  } catch {}
}

async function updateDeviceLastActive(userId: string) {
  try {
    const fp = getSimpleFingerprint();
    await supabase
      .from("user_devices")
      .update({ last_active: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("device_fingerprint", fp);
  } catch {}
}

function getSimpleFingerprint(): string {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency,
  ].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getSimpleDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown", os = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";
  return { browser, os, deviceName: `${browser} on ${os}` };
}
