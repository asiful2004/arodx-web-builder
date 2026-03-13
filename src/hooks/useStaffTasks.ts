import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TaskStatus = "pending" | "in_progress" | "review" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface StaffTask {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  target_role: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  assignee_name?: string;
  assigner_name?: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: "পেন্ডিং", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  in_progress: { label: "চলমান", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  review: { label: "রিভিউ", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  completed: { label: "সম্পন্ন", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  cancelled: { label: "বাতিল", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "কম", color: "bg-muted text-muted-foreground border-border" },
  medium: { label: "মাঝারি", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  high: { label: "বেশি", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  urgent: { label: "জরুরি", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const ROLE_CONFIG = {
  graphics_designer: { label: "গ্রাফিক্স ডিজাইনার", short: "ডিজাইনার", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  web_developer: { label: "ওয়েব ডেভেলপার", short: "ডেভেলপার", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  project_manager: { label: "প্রজেক্ট ম্যানেজার", short: "PM", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  digital_marketer: { label: "ডিজিটাল মার্কেটার", short: "মার্কেটার", color: "bg-green-500/10 text-green-600 border-green-500/20" },
} as const;

export type SubRoleKey = keyof typeof ROLE_CONFIG;
export const SUB_ROLE_KEYS = Object.keys(ROLE_CONFIG) as SubRoleKey[];

export function useStaffTasks(filterRole?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("staff_tasks" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (filterRole) {
      query = query.eq("target_role", filterRole);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    } else {
      // Fetch profile names
      const userIds = new Set<string>();
      (data || []).forEach((t: any) => {
        userIds.add(t.assigned_to);
        userIds.add(t.assigned_by);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));

      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      setTasks(
        (data || []).map((t: any) => ({
          ...t,
          assignee_name: nameMap.get(t.assigned_to) || "অজানা",
          assigner_name: nameMap.get(t.assigned_by) || "অজানা",
        }))
      );
    }
    setLoading(false);
  }, [user, filterRole]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("staff-tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  return { tasks, loading, refetch: fetchTasks };
}

export function useTeamMembers() {
  const [members, setMembers] = useState<{ user_id: string; full_name: string | null; avatar_url: string | null; roles: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
    if (!allRoles) { setMembers([]); setLoading(false); return; }

    const subRoleUserIds = new Set(
      allRoles.filter((r) => SUB_ROLE_KEYS.includes(r.role as SubRoleKey)).map((r) => r.user_id)
    );

    if (subRoleUserIds.size === 0) { setMembers([]); setLoading(false); return; }

    const ids = Array.from(subRoleUserIds);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setMembers(
      ids.map((uid) => {
        const prof = profileMap.get(uid);
        const userRoles = allRoles.filter((r) => r.user_id === uid).map((r) => r.role);
        return { user_id: uid, full_name: prof?.full_name || null, avatar_url: prof?.avatar_url || null, roles: userRoles };
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { members, loading, refetch: fetchMembers };
}
