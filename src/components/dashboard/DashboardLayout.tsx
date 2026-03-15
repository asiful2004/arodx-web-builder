import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/shared/NotificationBell";
import OnlineMembersPanel, { OnlineMembersTrigger } from "@/components/shared/OnlineMembersPanel";
import { OnlinePresenceContext, useOnlinePresenceProvider } from "@/hooks/useOnlinePresence";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export default function DashboardLayout() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: null, avatar_url: null });
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const presenceValue = useOnlinePresenceProvider();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });

      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
        setIsAdmin(!!data);
      });

      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setUserRole(data[0].role);
            setUserRoles(data.map((r: any) => r.role));
          }
        });
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <OnlinePresenceContext.Provider value={presenceValue}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar profile={profile} isAdmin={isAdmin} userRole={userRole} userRoles={userRoles} />

          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <Link
                  to="/"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  হোম
                </Link>
              </div>

              <div className="flex items-center gap-1">
                <OnlineMembersTrigger />
                <NotificationBell userId={user.id} />
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
              <Outlet context={{ user, profile, setProfile, isAdmin }} />
            </main>
          </div>

          <OnlineMembersPanel />
        </div>
      </SidebarProvider>
    </OnlinePresenceContext.Provider>
  );
}
