import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Plus, Ticket, Clock, CheckCircle2, AlertTriangle, XCircle,
  Loader2, Filter, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: "কম", color: "text-muted-foreground" },
  medium: { label: "মাঝারি", color: "text-blue-500" },
  high: { label: "উচ্চ", color: "text-orange-500" },
  urgent: { label: "জরুরি", color: "text-destructive" },
};

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
        query = query.eq("status", statusFilter);
      }

      const { data } = await query;
      setTickets((data as TicketRow[]) || []);
      setLoading(false);
    };
    fetchTickets();

    // Realtime
    const channel = supabase
      .channel("user-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `user_id=eq.${user.id}` }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">সাপোর্ট টিকেট</h1>
          <p className="text-sm text-muted-foreground">আপনার সব সাপোর্ট টিকেট এখানে দেখুন</p>
        </div>
        <Button onClick={() => navigate("/dashboard/tickets/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          নতুন টিকেট
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব টিকেট</SelectItem>
            <SelectItem value="open">ওপেন</SelectItem>
            <SelectItem value="in_progress">প্রগ্রেসে</SelectItem>
            <SelectItem value="waiting">অপেক্ষায়</SelectItem>
            <SelectItem value="resolved">সমাধান</SelectItem>
            <SelectItem value="closed">বন্ধ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">কোনো টিকেট পাওয়া যায়নি</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/dashboard/tickets/new")}>
            <Plus className="w-4 h-4" />
            প্রথম টিকেট তৈরি করুন
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket, i) => {
            const st = statusMap[ticket.status] || statusMap.open;
            const pr = priorityMap[ticket.priority] || priorityMap.medium;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                      <Badge variant="outline" className="text-[10px] border-0 bg-muted">
                        {categoryMap[ticket.category] || ticket.category}
                      </Badge>
                      <span className={`text-[10px] font-medium ${pr.color}`}>
                        {pr.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate">{ticket.subject}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(ticket.created_at).toLocaleDateString("bn-BD", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${st.bg} ${st.color} border-0 shrink-0`}>
                    <st.icon className="w-3 h-3 mr-1" />
                    {st.label}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
