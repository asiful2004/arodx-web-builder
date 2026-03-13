import { motion } from "framer-motion";
import { Clock, LogIn, LogOut, CalendarDays, Timer, AlertTriangle, Coffee, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyAttendance, isOfficeOpen, LEAVE_TYPE_CONFIG } from "@/hooks/useAttendance";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

const TYPE_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  present: { label: "উপস্থিত", color: "text-green-600 bg-green-500/10 border-green-500/20", icon: Clock },
  late: { label: "লেট", color: "text-orange-600 bg-orange-500/10 border-orange-500/20", icon: AlertTriangle },
  half_day: { label: "হাফ ডে", color: "text-blue-600 bg-blue-500/10 border-blue-500/20", icon: Coffee },
  leave: { label: "ছুটি", color: "text-red-600 bg-red-500/10 border-red-500/20", icon: CalendarDays },
};

export default function AttendanceWidget() {
  const { todayRecord, loading, checkIn, checkOut, onApprovedLeave, activeLeave } = useMyAttendance();
  const officeOpen = isOfficeOpen();

  const isCheckedIn = !!todayRecord?.check_in;
  const isCheckedOut = !!todayRecord?.check_out;

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    return format(new Date(iso), "hh:mm a", { locale: bn });
  };

  const getLiveHours = () => {
    if (!todayRecord?.check_in) return "০:০০";
    const start = new Date(todayRecord.check_in);
    const end = todayRecord.check_out ? new Date(todayRecord.check_out) : new Date();
    const diff = (end.getTime() - start.getTime()) / 3600000;
    const h = Math.floor(diff);
    const m = Math.floor((diff - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const typeInfo = todayRecord ? TYPE_LABELS[todayRecord.attendance_type] || TYPE_LABELS.present : null;
  const leaveTypeCfg = activeLeave ? LEAVE_TYPE_CONFIG[activeLeave.leave_type as keyof typeof LEAVE_TYPE_CONFIG] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">আজকের অ্যাটেন্ডেন্স</p>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(), "dd MMMM, yyyy", { locale: bn })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onApprovedLeave ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-600 font-medium">আপনি ছুটিতে</span>
            </>
          ) : (
            <>
              <span className={`h-2 w-2 rounded-full ${officeOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-[10px] text-muted-foreground">
                {officeOpen ? "অফিস চালু" : "অফিস বন্ধ"}
              </span>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-20 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : onApprovedLeave && activeLeave ? (
        /* On approved leave - show leave info, block attendance */
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
            <Palmtree className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-amber-700">আপনি ছুটিতে আছেন</p>
            <p className="text-[11px] text-amber-600/80 mt-1">অ্যাটেন্ডেন্স নিষ্ক্রিয়</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">ছুটির ধরন</span>
              {leaveTypeCfg && (
                <Badge variant="outline" className={`text-[10px] ${leaveTypeCfg.color}`}>
                  {leaveTypeCfg.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">শুরু</span>
              <span className="text-[10px] font-medium text-foreground">
                {format(new Date(activeLeave.start_date), "dd MMM yyyy", { locale: bn })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">শেষ</span>
              <span className="text-[10px] font-medium text-foreground">
                {format(new Date(activeLeave.end_date), "dd MMM yyyy", { locale: bn })}
              </span>
            </div>
            {activeLeave.reason && (
              <div className="pt-1 border-t border-border">
                <p className="text-[10px] text-muted-foreground">{activeLeave.reason}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Status & Time Info */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <LogIn className="h-3.5 w-3.5 text-green-600 mx-auto mb-0.5" />
              <p className="text-xs font-semibold text-foreground">{formatTime(todayRecord?.check_in || null)}</p>
              <p className="text-[9px] text-muted-foreground">চেক-ইন</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <LogOut className="h-3.5 w-3.5 text-red-600 mx-auto mb-0.5" />
              <p className="text-xs font-semibold text-foreground">{formatTime(todayRecord?.check_out || null)}</p>
              <p className="text-[9px] text-muted-foreground">চেক-আউট</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <Timer className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
              <p className="text-xs font-semibold text-foreground">{getLiveHours()}</p>
              <p className="text-[9px] text-muted-foreground">ঘণ্টা</p>
            </div>
          </div>

          {/* Type badge */}
          {typeInfo && (
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`text-[10px] ${typeInfo.color}`}>
                {typeInfo.label}
              </Badge>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!isCheckedIn ? (
              <Button
                onClick={checkIn}
                size="sm"
                className="flex-1 gap-1.5 h-9 text-xs"
                disabled={!officeOpen}
              >
                <LogIn className="h-3.5 w-3.5" />
                চেক-ইন
              </Button>
            ) : !isCheckedOut ? (
              <Button
                onClick={checkOut}
                size="sm"
                variant="destructive"
                className="flex-1 gap-1.5 h-9 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                চেক-আউট
              </Button>
            ) : (
              <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-2 text-center">
                <p className="text-xs font-medium text-green-600">✓ আজকের শিফট সম্পন্ন</p>
                <p className="text-[10px] text-muted-foreground">{todayRecord?.total_hours?.toFixed(1)} ঘণ্টা কাজ করেছেন</p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
