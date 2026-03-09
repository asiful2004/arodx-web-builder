import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, Send, Clock, CheckCircle2, AlertTriangle, XCircle,
  Loader2, User, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface TicketData {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

interface ReplyData {
  id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
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

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: "কম", color: "text-muted-foreground" },
  medium: { label: "মাঝারি", color: "text-blue-500" },
  high: { label: "উচ্চ", color: "text-orange-500" },
  urgent: { label: "জরুরি", color: "text-destructive" },
};

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [customerProfile, setCustomerProfile] = useState<{ full_name: string | null } | null>(null);

  const fetchData = async () => {
    if (!ticketId) return;
    const [tRes, rRes] = await Promise.all([
      supabase.from("tickets").select("*").eq("id", ticketId).single(),
      supabase.from("ticket_replies").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
    ]);
    const ticketData = tRes.data as TicketData | null;
    setTicket(ticketData);
    setReplies((rRes.data as ReplyData[]) || []);

    if (ticketData) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", ticketData.user_id)
        .single();
      setCustomerProfile(prof);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`admin-ticket-${ticketId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_replies", filter: `ticket_id=eq.${ticketId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `id=eq.${ticketId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleSend = async () => {
    if (!message.trim() || !ticketId || !user) return;
    setSending(true);
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticketId,
      user_id: user.id,
      message: message.trim(),
      is_admin_reply: true,
    });
    if (error) {
      toast({ title: "মেসেজ পাঠাতে সমস্যা", description: error.message, variant: "destructive" });
    } else {
      setMessage("");
      // Set status to waiting (waiting for user response)
      await supabase.from("tickets").update({ status: "waiting" }).eq("id", ticketId);
    }
    setSending(false);
  };

  const updateStatus = async (status: string) => {
    if (!ticketId) return;
    const updates: any = { status };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    if (status === "closed") updates.closed_at = new Date().toISOString();

    await supabase.from("tickets").update(updates).eq("id", ticketId);
    toast({ title: `স্ট্যাটাস "${statusMap[status]?.label}" এ পরিবর্তন হয়েছে` });
  };

  const updatePriority = async (priority: string) => {
    if (!ticketId) return;
    await supabase.from("tickets").update({ priority }).eq("id", ticketId);
    toast({ title: `প্রায়োরিটি "${priorityMap[priority]?.label}" এ পরিবর্তন হয়েছে` });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tickets")} className="gap-2"><ArrowLeft className="w-4 h-4" /> ফিরে যান</Button>
        <div className="text-center py-20 text-muted-foreground">টিকেট পাওয়া যায়নি</div>
      </div>
    );
  }

  const st = statusMap[ticket.status] || statusMap.open;
  const pr = priorityMap[ticket.priority] || priorityMap.medium;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin/tickets")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
            <Badge variant="outline" className="text-[10px] border-0 bg-muted">
              {categoryMap[ticket.category] || ticket.category}
            </Badge>
          </div>
          <h1 className="text-lg font-bold font-display text-foreground truncate">{ticket.subject}</h1>
          <p className="text-xs text-muted-foreground">
            ক্লায়েন্ট: {customerProfile?.full_name || "অজানা"}
          </p>
        </div>
        <Badge variant="outline" className={`${st.bg} ${st.color} border-0 shrink-0`}>
          <st.icon className="w-3 h-3 mr-1" />
          {st.label}
        </Badge>
      </div>

      {/* Admin controls */}
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">স্ট্যাটাস পরিবর্তন</p>
          <Select value={ticket.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">ওপেন</SelectItem>
              <SelectItem value="in_progress">প্রগ্রেসে</SelectItem>
              <SelectItem value="waiting">অপেক্ষায়</SelectItem>
              <SelectItem value="resolved">সমাধান</SelectItem>
              <SelectItem value="closed">বন্ধ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">প্রায়োরিটি পরিবর্তন</p>
          <Select value={ticket.priority} onValueChange={updatePriority}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">কম</SelectItem>
              <SelectItem value="medium">মাঝারি</SelectItem>
              <SelectItem value="high">উচ্চ</SelectItem>
              <SelectItem value="urgent">জরুরি</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground mb-2">
          {new Date(ticket.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h2 className="text-sm font-semibold text-foreground">কথোপকথন</h2>
          {replies.map((reply, i) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-xl p-4 ${
                reply.is_admin_reply
                  ? "bg-primary/5 border border-primary/20 ml-0 mr-8"
                  : "bg-muted/50 border border-border ml-8 mr-0"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {reply.is_admin_reply ? (
                  <Shield className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-foreground">
                  {reply.is_admin_reply ? "আপনি (অ্যাডমিন)" : customerProfile?.full_name || "ক্লায়েন্ট"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(reply.created_at).toLocaleDateString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{reply.message}</p>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Reply box */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="অ্যাডমিন রিপ্লাই লিখুন..."
          rows={3}
          className="mb-3"
        />
        <Button onClick={handleSend} disabled={sending || !message.trim()} className="gap-2">
          <Send className="w-4 h-4" />
          {sending ? "পাঠানো হচ্ছে..." : "রিপ্লাই পাঠান"}
        </Button>
      </div>
    </div>
  );
}
