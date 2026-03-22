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
  const { user, profile, userRoles } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Realtime Presence — uses cached profile+roles from AuthContext
  useEffect(() => {
    if (!user || !profile.full_name && !profile.avatar_url) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<OnlineMember>();
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
          const deviceInfo = detectDeviceType();
          await channel.track({
            user_id: user.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            roles: userRoles,
            online_at: new Date().toISOString(),
            ...deviceInfo,
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, profile, userRoles]);

  return { onlineMembers };
}

// Consumer hook — reads from context
export function useOnlinePresence() {
  return useContext(OnlinePresenceContext);
}
