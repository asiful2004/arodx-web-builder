import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OnlineMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
  online_at: string;
}

export function useOnlinePresence() {
  const { user } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [myProfile, setMyProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({
    full_name: null,
    avatar_url: null,
  });
  const [myRoles, setMyRoles] = useState<string[]>([]);

  // Fetch own profile & roles
  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setMyProfile(data);
      });

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setMyRoles(data.map((r: any) => r.role));
      });
  }, [user]);

  // Realtime Presence
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

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
    };
  }, [user, myProfile.full_name, myProfile.avatar_url, myRoles]);

  return { onlineMembers };
}
