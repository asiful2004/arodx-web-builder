import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StaffSidebar } from "./StaffSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/shared/NotificationBell";
import SendNotificationDialog from "@/components/shared/SendNotificationDialog";
import OnlineMembersPanel, { OnlineMembersTrigger } from "@/components/shared/OnlineMembersPanel";
import { OnlinePresenceContext, useOnlinePresenceProvider } from "@/hooks/useOnlinePresence";

const STAFF_ROLES = ["admin", "hr", "graphics_designer", "web_developer", "project_manager", "digital_marketer"];
const SEND_NOTIF_ROLES = ["admin", "hr", "project_manager"];

export default function StaffLayout() {
  const { user, loading: authLoading, profile, userRoles } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const presenceValue = useOnlinePresenceProvider();

  const canSendNotif = userRoles.some(r => SEND_NOTIF_ROLES.includes(r));

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  // Check staff authorization using cached roles
  useEffect(() => {
    if (!user || authLoading) return;
    if (userRoles.length === 0) return; // Roles not loaded yet

    const hasStaffAccess = userRoles.some(r => STAFF_ROLES.includes(r));
    if (!hasStaffAccess) {
      navigate("/dashboard");
      toast({ title: "অ্যাক্সেস নেই", description: "আপনার স্টাফ প্যানেলে অ্যাক্সেস নেই।", variant: "destructive" });
      return;
    }
    setAuthorized(true);
  }, [user, authLoading, userRoles, navigate, toast]);

  if (authLoading || !user || authorized === null) {
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
        <StaffSidebar profile={profile} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                ড্যাশবোর্ড
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <OnlineMembersTrigger />
              {canSendNotif && <SendNotificationDialog />}
              <NotificationBell userId={user.id} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <Outlet context={{ user, profile }} />
          </main>
        </div>

        <OnlineMembersPanel />
      </div>
    </SidebarProvider>
    </OnlinePresenceContext.Provider>
  );
}
