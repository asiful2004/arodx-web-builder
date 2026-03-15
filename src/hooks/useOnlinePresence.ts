import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface OnlineMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
  online_at: string;
  device_type: DeviceType;
  browser: string;
  os: string;
}

function detectDeviceType(): { device_type: DeviceType; browser: string; os: string } {
  const ua = navigator.userAgent;
  let device_type: DeviceType = "desktop";
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) device_type = "tablet";
  else if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry/i.test(ua)) device_type = "mobile";

  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return { device_type, browser, os };
}

interface OnlinePresenceContextType {
  onlineMembers: OnlineMember[];
}

export const OnlinePresenceContext = createContext<OnlinePresenceContextType>({
  onlineMembers: [],
});

export function useOnlinePresenceProvider() {
  const { user } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [myProfile, setMyProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [myRoles, setMyRoles] = useState<string[] | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch own profile & roles
  useEffect(() => {
    if (!user) {
      setMyProfile(null);
      setMyRoles(null);
      return;
    }

    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setMyProfile(data ?? { full_name: null, avatar_url: null });
      });

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setMyRoles(data ? data.map((r: any) => r.role) : []);
      });
  }, [user]);

  // Realtime Presence — only start after profile+roles are loaded
  useEffect(() => {
    if (!user || myProfile === null || myRoles === null) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          roles: string[];
          online_at: string;
        }>();

        const members: OnlineMember[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            members.push(presences[0]);
          }
        }
        setOnlineMembers(members);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            full_name: myProfile.full_name,
            avatar_url: myProfile.avatar_url,
            roles: myRoles,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, myProfile, myRoles]);

  return { onlineMembers };
}

// Consumer hook — reads from context
export function useOnlinePresence() {
  return useContext(OnlinePresenceContext);
}
