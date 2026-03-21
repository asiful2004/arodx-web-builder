import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Plus, Ticket, Clock, CheckCircle2, AlertTriangle, XCircle,
  Loader2, MessageSquare, ArrowRight, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusMap: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  open: { label: "ওপেন", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  in_progress: { label: "প্রগ্রেসে", icon: Loader2, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  waiting: { label: "অপেক্ষায়", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
  resolved: { label: "সমাধান", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  closed: { label: "বন্ধ", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/50" },
};

const categoryMap: Record<string, string> = {
  billing: "বিলিং",
  technical: "টেকনিক্যাল",
  domain: "ডোমেইন",
  general: "সাধারণ",
  feature_request: "ফিচার রিকোয়েস্ট",
  bug_report: "বাগ রিপোর্ট",
};

const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "কম", color: "text-muted-foreground", bg: "bg-muted" },
  medium: { label: "মাঝারি", color: "text-blue-500", bg: "bg-blue-500/10" },
  high: { label: "উচ্চ", color: "text-orange-500", bg: "bg-orange-500/10" },
  urgent: { label: "জরুরি", color: "text-destructive", bg: "bg-destructive/10" },
};

const statusFilters = [
  { value: "all", label: "সব" },
  { value: "open", label: "ওপেন" },
  { value: "in_progress", label: "প্রগ্রেসে" },
  { value: "waiting", label: "অপেক্ষায়" },
  { value: "resolved", label: "সমাধান" },
  { value: "closed", label: "বন্ধ" },
];

export default function TicketsPage() {
  const { user } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      let query = supabase
        .from("tickets")
        .select("id, ticket_number, subject, category, priority, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data } = await query;
      setTickets((data as TicketRow[]) || []);
      setLoading(false);
    };
    fetchTickets();

    const channel = supabase
      .channel("user-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `user_id=eq.${user.id}` }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, statusFilter]);

  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress" || t.status === "waiting").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">সাপোর্ট টিকেট</h1>
            <p className="text-sm text-muted-foreground">
              {openCount > 0 ? `${openCount}টি ওপেন টিকেট` : "আপনার সব সাপোর্ট টিকেট"}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/dashboard/tickets/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          নতুন টিকেট
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 flex-wrap">
        {statusFilters.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            className="h-7 text-[11px] px-3 rounded-full"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">কোনো টিকেট পাওয়া যায়নি</p>
          <p className="text-xs text-muted-foreground mb-4">সমস্যা থাকলে নতুন টিকেট তৈরি করুন</p>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/tickets/new")}>
            <Plus className="w-4 h-4" />
            প্রথম টিকেট তৈরি করুন
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((ticket, i) => {
            const st = statusMap[ticket.status] || statusMap.open;
            const pr = priorityMap[ticket.priority] || priorityMap.medium;
            const StatusIcon = st.icon;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{ticket.ticket_number}</span>
                      <Badge variant="outline" className="text-[10px] border-0 bg-muted h-5">
                        {categoryMap[ticket.category] || ticket.category}
                      </Badge>
                      {(ticket.priority === "high" || ticket.priority === "urgent") && (
                        <Badge variant="outline" className={`text-[10px] border-0 ${pr.bg} ${pr.color} h-5`}>
                          {pr.label}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{ticket.subject}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(ticket.created_at).toLocaleDateString("bn-BD", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`${st.bg} ${st.color} border-0 text-[10px] gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {st.label}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
