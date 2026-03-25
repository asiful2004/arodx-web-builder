import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Automatically logs dashboard/admin/staff page navigations as activity logs.
 * Only tracks authenticated users on non-public routes.
 */
export function useDashboardActivityTracker() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    // Only track dashboard, admin, staff routes
    const isDashboard = path.startsWith("/dashboard");
    const isAdmin = path.startsWith("/admin");
    const isStaff = path.startsWith("/staff");
    if (!isDashboard && !isAdmin && !isStaff) return;
    if (!user) return;

    const getActionType = () => {
      if (isAdmin) return "admin";
      if (isStaff) return "staff";
      return "navigation";
    };

    const getPageName = () => {
      const segments = path.split("/").filter(Boolean);
      if (segments.length <= 1) return "Overview";
      return segments.slice(1).join(" / ");
    };

    const timer = setTimeout(async () => {
      await supabase.from("activity_logs" as any).insert({
        user_id: user.id,
        user_email: user.email || null,
        user_name: profile?.full_name || null,
        action: `পেজ ভিজিট: ${getPageName()}`,
        action_type: getActionType(),
        description: `${path} পেজে গিয়েছে`,
        metadata: {},
        page_path: path,
      } as any);
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname, user, profile]);
}
