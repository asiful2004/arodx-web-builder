import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ActionType = 
  | "auth" | "profile" | "settings" | "order" | "business" 
  | "ticket" | "admin" | "staff" | "navigation" | "general";

interface LogOptions {
  action: string;
  actionType: ActionType;
  description?: string;
  metadata?: Record<string, any>;
}

export function useActivityLog() {
  const { user, profile } = useAuth();

  const logActivity = useCallback(async (options: LogOptions) => {
    if (!user) return;
    
    try {
      await supabase.from("activity_logs" as any).insert({
        user_id: user.id,
        user_email: user.email || null,
        user_name: profile?.full_name || null,
        action: options.action,
        action_type: options.actionType,
        description: options.description || null,
        metadata: options.metadata || {},
        page_path: window.location.pathname,
      } as any);
    } catch (err) {
      // Silent fail — logging should never break the app
      console.error("Activity log failed:", err);
    }
  }, [user, profile]);

  return { logActivity };
}

// Standalone function for use outside React components
export async function logActivityDirect(options: LogOptions & { userId: string; userEmail?: string; userName?: string }) {
  try {
    await supabase.from("activity_logs" as any).insert({
      user_id: options.userId,
      user_email: options.userEmail || null,
      user_name: options.userName || null,
      action: options.action,
      action_type: options.actionType,
      description: options.description || null,
      metadata: options.metadata || {},
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
    } as any);
  } catch (err) {
    console.error("Activity log failed:", err);
  }
}
