import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock, Users, CalendarDays, CheckCircle2, AlertTriangle, Coffee,
  Loader2, CalendarPlus, Check, X, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAllAttendance, useLeaveRequests, LEAVE_TYPE_CONFIG, LEAVE_STATUS_CONFIG } from "@/hooks/useAttendance";
import { useTeamMembers } from "@/hooks/useStaffTasks";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  present: { label: "উপস্থিত", color: "text-green-600", icon: CheckCircle2 },
  late: { label: "লেট", color: "text-orange-600", icon: AlertTriangle },
  half_day: { label: "হাফ ডে", color: "text-blue-600", icon: Coffee },
  leave: { label: "ছুটি", color: "text-red-600", icon: CalendarDays },
};

export default function StaffAttendanceReportPage() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toLocaleDateString("en-CA");

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [tab, setTab] = useState("daily");

  const { records, loading: attLoading } = useAllAttendance({ from: dateFrom, to: dateTo });
  const { requests, loading: leaveLoading, reviewLeave } = useLeaveRequests(true);
  const { members } = useTeamMembers();

  const getInitials = (name: string | null) =>
    (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Stats
  const todayRecords = records.filter((r) => r.date === today);
  const presentToday = todayRecords.filter((r) => r.attendance_type === "present" || r.attendance_type === "late").length;
  const lateToday = todayRecords.filter((r) => r.attendance_type === "late").length;
  const totalMembers = members.length;
  const absentToday = totalMembers - todayRecords.length;
  const pendingLeaves = requests.filter((r) => r.status === "pending").length;

  // Per-member summary
  const memberSummary = useMemo(() => {
    return members.map((m) => {
      const memberRecs = records.filter((r) => r.user_id === m.user_id);
      const totalDays = memberRecs.length;
      const totalHours = memberRecs.reduce((sum, r) => sum + (r.total_hours || 0), 0);
      const lateDays = memberRecs.filter((r) => r.attendance_type === "late").length;
      const presentDays = memberRecs.filter((r) => r.attendance_type === "present").length;
      const todayRec = memberRecs.find((r) => r.date === today);
      return { ...m, totalDays, totalHours, lateDays, presentDays, todayRec };
    });
  }, [members, records, today]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">অ্যাটেন্ডেন্স রিপোর্ট</h1>
            <p className="text-[11px] text-muted-foreground">সকল স্টাফের উপস্থিতি ট্র্যাকিং</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "আজ উপস্থিত", value: presentToday, icon: CheckCircle2, color: "text-green-600" },
          { label: "আজ অনুপস্থিত", value: absentToday, icon: X, color: "text-red-600" },
          { label: "আজ লেট", value: lateToday, icon: AlertTriangle, color: "text-orange-600" },
          { label: "পেন্ডিং লিভ", value: pendingLeaves, icon: CalendarPlus, color: "text-purple-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-3.5"
          >
            <s.icon className={`h-4 w-4 ${s.color} mb-1`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="text-[10px] text-muted-foreground">শুরু</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">শেষ</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="daily" className="text-xs px-3">দৈনিক রেকর্ড</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs px-3">মেম্বার সামারি</TabsTrigger>
          <TabsTrigger value="leaves" className="text-xs px-3">লিভ রিকোয়েস্ট ({pendingLeaves})</TabsTrigger>
        </TabsList>

        {/* Daily Records */}
        <TabsContent value="daily" className="mt-4 space-y-2">
          {attLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-border bg-card">
              <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো রেকর্ড নেই</p>
            </div>
          ) : (
            records.map((rec) => {
              const tCfg = TYPE_CONFIG[rec.attendance_type] || TYPE_CONFIG.present;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={rec.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                        {getInitials(rec.user_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{rec.user_name || "অজানা"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(rec.date), "dd MMM", { locale: bn })} • {rec.check_in ? format(new Date(rec.check_in), "hh:mm a") : "-"} - {rec.check_out ? format(new Date(rec.check_out), "hh:mm a") : "চলমান"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[9px] px-1.5 ${tCfg.color}`}>
                      {tCfg.label}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">{(rec.total_hours || 0).toFixed(1)}h</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        {/* Member Summary */}
        <TabsContent value="summary" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memberSummary.map((m, i) => (
              <motion.div
                key={m.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {getInitials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{m.full_name || "নাম নেই"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {m.todayRec ? (
                        <Badge variant="outline" className={`text-[8px] px-1 ${TYPE_CONFIG[m.todayRec.attendance_type]?.color || ""}`}>
                          আজ: {TYPE_CONFIG[m.todayRec.attendance_type]?.label || "—"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] px-1 text-muted-foreground">আজ: অনুপস্থিত</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-1.5 rounded-lg bg-muted/50">
                    <p className="text-sm font-bold text-foreground">{m.totalDays}</p>
                    <p className="text-[8px] text-muted-foreground">দিন</p>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-green-500/5">
                    <p className="text-sm font-bold text-green-600">{m.presentDays}</p>
                    <p className="text-[8px] text-muted-foreground">উপস্থিত</p>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-orange-500/5">
                    <p className="text-sm font-bold text-orange-600">{m.lateDays}</p>
                    <p className="text-[8px] text-muted-foreground">লেট</p>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-blue-500/5">
                    <p className="text-sm font-bold text-blue-600">{m.totalHours.toFixed(0)}</p>
                    <p className="text-[8px] text-muted-foreground">ঘণ্টা</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Leave Requests */}
        <TabsContent value="leaves" className="mt-4 space-y-2">
          {leaveLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-border bg-card">
              <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো লিভ রিকোয়েস্ট নেই</p>
            </div>
          ) : (
            requests.map((req) => {
              const ltype = LEAVE_TYPE_CONFIG[req.leave_type] || LEAVE_TYPE_CONFIG.other;
              const lstatus = LEAVE_STATUS_CONFIG[req.status] || LEAVE_STATUS_CONFIG.pending;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={req.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                          {getInitials(req.user_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold text-foreground">{req.user_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[9px] px-1.5 ${ltype.color}`}>{ltype.label}</Badge>
                      <Badge variant="outline" className={`text-[9px] px-1.5 ${lstatus.color}`}>{lstatus.label}</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(req.start_date), "dd MMM")} - {format(new Date(req.end_date), "dd MMM, yyyy")}
                  </p>
                  {req.reason && <p className="text-[10px] text-muted-foreground mt-1">{req.reason}</p>}
                  {req.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="h-7 text-[10px] gap-1 flex-1" onClick={() => reviewLeave(req.id, "approved")}>
                        <Check className="h-3 w-3" />
                        অনুমোদন
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-[10px] gap-1 flex-1" onClick={() => reviewLeave(req.id, "rejected")}>
                        <X className="h-3 w-3" />
                        প্রত্যাখ্যান
                      </Button>
                    </div>
                  )}
                  {req.reviewer_name && (
                    <p className="text-[9px] text-muted-foreground mt-1.5">
                      রিভিউ: {req.reviewer_name} • {req.reviewed_at ? format(new Date(req.reviewed_at), "dd MMM, hh:mm a") : ""}
                    </p>
                  )}
                </motion.div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
