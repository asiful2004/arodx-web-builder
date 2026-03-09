import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Ticket, Clock, CheckCircle2, AlertTriangle, XCircle, Loader2, Filter, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const statusMap: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  open: { label: "ওপেন", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  in_progress: { label: "প্রগ্রেসে", icon: Loader2, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  waiting: { label: "অপেক্ষায়", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
  resolved: { label: "সমাধান", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  closed: { label: "বন্ধ", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/50" },
};

const categoryMap: Record<string, string> = {
  billing: "বিলিং", technical: "টেকনিক্যাল", domain: "ডোমেইন",
  general: "সাধারণ", feature_request: "ফিচার রিকোয়েস্ট", bug_report: "বাগ রিপোর্ট",
};

const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "কম", color: "text-muted-foreground", bg: "bg-muted/50" },
  medium: { label: "মাঝারি", color: "text-blue-500", bg: "bg-blue-500/10" },
  high: { label: "উচ্চ", color: "text-orange-500", bg: "bg-orange-500/10" },
  urgent: { label: "জরুরি", color: "text-destructive", bg: "bg-destructive/10" },
};

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    let query = supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
    if (categoryFilter !== "all") query = query.eq("category", categoryFilter as any);

    const { data } = await query;
    setTickets((data as TicketRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
    const channel = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter, categoryFilter]);

  const filtered = tickets.filter((t) =>
    !searchQuery || t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const counts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    urgent: tickets.filter((t) => t.priority === "urgent" && t.status !== "closed" && t.status !== "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">টিকেট ম্যানেজমেন্ট</h1>
        <p className="text-sm text-muted-foreground">সব সাপোর্ট টিকেট ম্যানেজ করুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "ওপেন টিকেট", count: counts.open, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "প্রগ্রেসে", count: counts.in_progress, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { label: "জরুরি", count: counts.urgent, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="টিকেট খুঁজুন..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
            <SelectItem value="open">ওপেন</SelectItem>
            <SelectItem value="in_progress">প্রগ্রেসে</SelectItem>
            <SelectItem value="waiting">অপেক্ষায়</SelectItem>
            <SelectItem value="resolved">সমাধান</SelectItem>
            <SelectItem value="closed">বন্ধ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="ক্যাটাগরি" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
            <SelectItem value="general">সাধারণ</SelectItem>
            <SelectItem value="billing">বিলিং</SelectItem>
            <SelectItem value="technical">টেকনিক্যাল</SelectItem>
            <SelectItem value="domain">ডোমেইন</SelectItem>
            <SelectItem value="feature_request">ফিচার রিকোয়েস্ট</SelectItem>
            <SelectItem value="bug_report">বাগ রিপোর্ট</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">কোনো টিকেট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => {
            const st = statusMap[ticket.status] || statusMap.open;
            const pr = priorityMap[ticket.priority] || priorityMap.medium;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                      <Badge variant="outline" className="text-[10px] border-0 bg-muted">
                        {categoryMap[ticket.category] || ticket.category}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] border-0 ${pr.bg} ${pr.color}`}>
                        {pr.label}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate">{ticket.subject}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(ticket.created_at).toLocaleDateString("bn-BD", {
                        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
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
