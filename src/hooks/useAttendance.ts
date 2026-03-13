import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number;
  attendance_type: "present" | "leave" | "half_day" | "late";
  note: string | null;
  created_at: string;
  // joined
  user_name?: string;
  avatar_url?: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: "sick" | "casual" | "annual" | "emergency" | "other";
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // joined
  user_name?: string;
  avatar_url?: string;
  reviewer_name?: string;
}

export const LEAVE_TYPE_CONFIG = {
  sick: { label: "অসুস্থতা", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  casual: { label: "ক্যাজুয়াল", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  annual: { label: "বার্ষিক", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  emergency: { label: "জরুরি", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  other: { label: "অন্যান্য", color: "bg-muted text-muted-foreground border-border" },
} as const;

export const LEAVE_STATUS_CONFIG = {
  pending: { label: "পেন্ডিং", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  approved: { label: "অনুমোদিত", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  rejected: { label: "প্রত্যাখ্যাত", color: "bg-red-500/10 text-red-600 border-red-500/20" },
} as const;

// Office hours config (Asia/Dhaka)
const OFFICE_HOURS = {
  // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  0: { start: 8, end: 24, label: "রবিবার" },   // Sun
  1: { start: 8, end: 24, label: "সোমবার" },    // Mon
  2: { start: 8, end: 24, label: "মঙ্গলবার" },   // Tue
  3: { start: 8, end: 24, label: "বুধবার" },     // Wed
  4: { start: 8, end: 17, label: "বৃহস্পতিবার" },// Thu
  5: null, // Friday - closed
  6: { start: 8, end: 24, label: "শনিবার" },     // Sat
} as const;

export function isOfficeOpen(): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  const day = now.getDay();
  const hours = OFFICE_HOURS[day as keyof typeof OFFICE_HOURS];
  if (!hours) return false;
  const h = now.getHours();
  return h >= hours.start && h < hours.end;
}

export function useMyAttendance() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [activeLeave, setActiveLeave] = useState<LeaveRequest | null>(null);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

  const fetchActiveLeave = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("staff_leave_requests" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today)
      .maybeSingle();
    setActiveLeave(data as any);
  }, [user, today]);

  const fetchToday = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("staff_attendance" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();
    setTodayRecord(data as any);
    setLoading(false);
  }, [user, today]);

  const fetchHistory = useCallback(async (days = 30) => {
    if (!user) return;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const { data } = await supabase
      .from("staff_attendance" as any)
      .select("*")
      .eq("user_id", user.id)
      .gte("date", fromDate.toISOString().split("T")[0])
      .order("date", { ascending: false });
    setHistory((data || []) as any);
  }, [user]);

  const checkIn = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const dhakaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const isLate = dhakaTime.getHours() > 8 || (dhakaTime.getHours() === 8 && dhakaTime.getMinutes() > 30);

    const { error } = await supabase
      .from("staff_attendance" as any)
      .upsert({
        user_id: user.id,
        date: today,
        check_in: now,
        attendance_type: isLate ? "late" : "present",
      } as any, { onConflict: "user_id,date" });

    if (error) {
      toast.error("চেক-ইন ব্যর্থ হয়েছে");
      console.error(error);
    } else {
      toast.success(isLate ? "চেক-ইন হয়েছে (লেট)" : "চেক-ইন সফল!");
      fetchToday();
    }
  }, [user, today, fetchToday]);

  const checkOut = useCallback(async () => {
    if (!user || !todayRecord?.check_in) return;
    const now = new Date();
    const checkInTime = new Date(todayRecord.check_in);
    const hours = Math.round(((now.getTime() - checkInTime.getTime()) / 3600000) * 100) / 100;

    const { error } = await supabase
      .from("staff_attendance" as any)
      .update({
        check_out: now.toISOString(),
        total_hours: hours,
        attendance_type: hours < 4 ? "half_day" : todayRecord.attendance_type,
      } as any)
      .eq("id", todayRecord.id);

    if (error) {
      toast.error("চেক-আউট ব্যর্থ হয়েছে");
    } else {
      toast.success(`চেক-আউট সফল! (${hours.toFixed(1)} ঘণ্টা)`);
      fetchToday();
    }
  }, [user, todayRecord, fetchToday]);

  useEffect(() => { fetchToday(); fetchHistory(); fetchActiveLeave(); }, [fetchToday, fetchHistory, fetchActiveLeave]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("my-attendance")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_attendance" }, () => {
        fetchToday();
        fetchHistory();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchToday, fetchHistory]);

  // Listen for leave request changes too
  useEffect(() => {
    const channel = supabase
      .channel("my-leave-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_leave_requests" }, () => {
        fetchActiveLeave();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchActiveLeave]);

  const onApprovedLeave = !!activeLeave;

  return { todayRecord, loading, history, checkIn, checkOut, refetch: fetchToday, onApprovedLeave, activeLeave };
}

export function useLeaveRequests(allUsers = false) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("staff_leave_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!allUsers) {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      const userIds = new Set<string>();
      (data as any[]).forEach((r) => { userIds.add(r.user_id); if (r.reviewed_by) userIds.add(r.reviewed_by); });
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(userIds));
      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setRequests((data as any[]).map((r) => ({
        ...r,
        user_name: nameMap.get(r.user_id)?.full_name || "অজানা",
        avatar_url: nameMap.get(r.user_id)?.avatar_url || null,
        reviewer_name: r.reviewed_by ? nameMap.get(r.reviewed_by)?.full_name || "অজানা" : null,
      })));
    } else {
      setRequests([]);
    }
    setLoading(false);
  }, [user, allUsers]);

  const submitLeave = useCallback(async (leaveType: string, startDate: string, endDate: string, reason: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("staff_leave_requests" as any)
      .insert({
        user_id: user.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      } as any);
    if (error) {
      toast.error("লিভ রিকোয়েস্ট ব্যর্থ");
      console.error(error);
    } else {
      toast.success("লিভ রিকোয়েস্ট পাঠানো হয়েছে");
      fetchRequests();
    }
  }, [user, fetchRequests]);

  const reviewLeave = useCallback(async (id: string, status: "approved" | "rejected") => {
    if (!user) return;
    const { error } = await supabase
      .from("staff_leave_requests" as any)
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    if (error) {
      toast.error("আপডেট ব্যর্থ");
    } else {
      toast.success(status === "approved" ? "লিভ অনুমোদিত" : "লিভ প্রত্যাখ্যাত");
      fetchRequests();
    }
  }, [user, fetchRequests]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    const channel = supabase
      .channel("leave-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_leave_requests" }, () => {
        fetchRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  return { requests, loading, submitLeave, reviewLeave, refetch: fetchRequests };
}

export function useAllAttendance(dateRange?: { from: string; to: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    const from = dateRange?.from || today;
    const to = dateRange?.to || today;

    let query = supabase
      .from("staff_attendance" as any)
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });

    const { data } = await query;
    if (data && data.length > 0) {
      const userIds = new Set<string>();
      (data as any[]).forEach((r) => userIds.add(r.user_id));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(userIds));
      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setRecords((data as any[]).map((r) => ({
        ...r,
        user_name: nameMap.get(r.user_id)?.full_name || "অজানা",
        avatar_url: nameMap.get(r.user_id)?.avatar_url || null,
      })));
    } else {
      setRecords([]);
    }
    setLoading(false);
  }, [dateRange?.from, dateRange?.to]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel("all-attendance")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_attendance" }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { records, loading, refetch: fetchAll };
}
