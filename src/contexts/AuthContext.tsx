import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Auto-register device on sign in
        if (_event === "SIGNED_IN" && session?.user) {
          registerDeviceIfNeeded(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Update last active for existing sessions
      if (session?.user) {
        updateDeviceLastActive(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
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
      // Check count first
      const { count } = await supabase
        .from("user_devices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true);
      
      if ((count || 0) === 0) {
        // First device, auto-register
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
