import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, CalendarDays, CalendarPlus, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyAttendance, useLeaveRequests, LEAVE_TYPE_CONFIG, LEAVE_STATUS_CONFIG } from "@/hooks/useAttendance";
import AttendanceWidget from "./AttendanceWidget";
import LeaveRequestDialog from "./LeaveRequestDialog";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

export default function AttendancePanel() {
  const { history, loading: historyLoading } = useMyAttendance();
  const { requests, loading: leaveLoading } = useLeaveRequests(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [tab, setTab] = useState<"history" | "leaves">("history");

  const TYPE_LABELS: Record<string, string> = {
    present: "উপস্থিত",
    late: "লেট",
    half_day: "হাফ ডে",
    leave: "ছুটি",
  };

  const TYPE_COLORS: Record<string, string> = {
    present: "bg-green-500/10 text-green-600 border-green-500/20",
    late: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    half_day: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    leave: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">অ্যাটেন্ডেন্স</h1>
              <p className="text-[11px] text-muted-foreground">আপনার দৈনিক উপস্থিতি ও ছুটি</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setLeaveOpen(true)}>
            <CalendarPlus className="h-3.5 w-3.5" />
            লিভ নিন
          </Button>
        </div>
      </motion.div>

      {/* Today's Attendance Widget */}
      <AttendanceWidget />

      {/* Tabs */}
      <div className="flex gap-1.5">
        <Button
          variant={tab === "history" ? "default" : "outline"}
          size="sm"
          className="h-7 text-[10px] px-2.5 gap-1"
          onClick={() => setTab("history")}
        >
          <History className="h-3 w-3" />
          হিস্ট্রি
        </Button>
        <Button
          variant={tab === "leaves" ? "default" : "outline"}
          size="sm"
          className="h-7 text-[10px] px-2.5 gap-1"
          onClick={() => setTab("leaves")}
        >
          <CalendarDays className="h-3 w-3" />
          লিভ ({requests.length})
        </Button>
      </div>

      {/* History */}
      {tab === "history" && (
        <div className="space-y-2">
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-border bg-card">
              <Clock className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">কোনো অ্যাটেন্ডেন্স রেকর্ড নেই</p>
            </div>
          ) : (
            history.map((rec) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-border bg-card p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[40px]">
                    <p className="text-lg font-bold text-foreground">{format(new Date(rec.date), "dd")}</p>
                    <p className="text-[9px] text-muted-foreground">{format(new Date(rec.date), "MMM", { locale: bn })}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[9px] px-1.5 ${TYPE_COLORS[rec.attendance_type] || ""}`}>
                        {TYPE_LABELS[rec.attendance_type] || rec.attendance_type}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {rec.check_in ? format(new Date(rec.check_in), "hh:mm a") : "-"} → {rec.check_out ? format(new Date(rec.check_out), "hh:mm a") : "-"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{(rec.total_hours || 0).toFixed(1)}h</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Leave Requests */}
      {tab === "leaves" && (
        <div className="space-y-2">
          {leaveLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-border bg-card">
              <CalendarDays className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">কোনো লিভ রিকোয়েস্ট নেই</p>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className={`text-[9px] px-1.5 ${ltype.color}`}>{ltype.label}</Badge>
                    <Badge variant="outline" className={`text-[9px] px-1.5 ${lstatus.color}`}>{lstatus.label}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(req.start_date), "dd MMM")} - {format(new Date(req.end_date), "dd MMM, yyyy")}
                  </p>
                  {req.reason && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{req.reason}</p>}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      <LeaveRequestDialog open={leaveOpen} onOpenChange={setLeaveOpen} />
    </div>
  );
}
