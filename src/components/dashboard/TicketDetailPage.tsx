import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft, Send, Clock, CheckCircle2, AlertTriangle, XCircle,
  Loader2, User, Shield, ImagePlus, X, Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface TicketData {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface ReplyData {
  id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  user_id: string;
  image_url: string | null;
  reply_to_id: string | null;
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

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<DashboardContext>();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    if (!ticketId) return;
    const [tRes, rRes] = await Promise.all([
      supabase.from("tickets").select("*").eq("id", ticketId).eq("user_id", user.id).single(),
      supabase.from("ticket_replies").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
    ]);
    setTicket(tRes.data as TicketData | null);
    setReplies((rRes.data as ReplyData[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_replies", filter: `ticket_id=eq.${ticketId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `id=eq.${ticketId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "ফাইল সাইজ ৫MB এর বেশি হতে পারবে না", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!message.trim() && !imageFile) || !ticketId) return;
    setSending(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${ticketId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("ticket-attachments").upload(path, imageFile);
      if (upErr) {
        toast({ title: "ইমেজ আপলোড ব্যর্থ", variant: "destructive" });
        setSending(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("ticket-attachments").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticketId,
      user_id: user.id,
      message: message.trim() || (imageUrl ? "📷 ইমেজ পাঠানো হয়েছে" : ""),
      is_admin_reply: false,
      image_url: imageUrl,
      reply_to_id: replyTo?.id || null,
    } as any);

    if (error) {
      toast({ title: "মেসেজ পাঠাতে সমস্যা হয়েছে", variant: "destructive" });
    } else {
      setMessage("");
      removeImage();
      setReplyTo(null);
      if (ticket?.status === "waiting" || ticket?.status === "resolved") {
        await supabase.from("tickets").update({ status: "open" }).eq("id", ticketId);
      }
    }
    setSending(false);
  };

  const getReplyPreview = (replyId: string | null) => {
    if (!replyId) return null;
    return replies.find(r => r.id === replyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/tickets")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </Button>
        <div className="text-center py-20 text-muted-foreground">টিকেট পাওয়া যায়নি</div>
      </div>
    );
  }

  const st = statusMap[ticket.status] || statusMap.open;
  const pr = priorityMap[ticket.priority] || priorityMap.medium;
  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard/tickets")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
            <Badge variant="outline" className="text-[10px] border-0 bg-muted">
              {categoryMap[ticket.category] || ticket.category}
            </Badge>
            <span className={`text-[10px] font-medium ${pr.color}`}>{pr.label}</span>
          </div>
          <h1 className="text-lg font-bold font-display text-foreground truncate">{ticket.subject}</h1>
        </div>
        <Badge variant="outline" className={`${st.bg} ${st.color} border-0 shrink-0`}>
          <st.icon className="w-3 h-3 mr-1" />
          {st.label}
        </Badge>
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
          {replies.map((reply, i) => {
            const quotedReply = getReplyPreview(reply.reply_to_id);
            return (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl p-3 sm:p-4 group relative ${
                  reply.is_admin_reply
                    ? "bg-primary/5 border border-primary/20 ml-0 mr-2 sm:mr-8"
                    : "bg-muted/50 border border-border ml-2 sm:ml-8 mr-0"
                }`}
              >
                {/* Quoted reply */}
                {quotedReply && (
                  <div className="mb-2 rounded-lg bg-muted/70 border-l-2 border-primary/40 px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">{quotedReply.is_admin_reply ? "সাপোর্ট টিম" : "আপনি"}: </span>
                    {quotedReply.message.length > 80 ? quotedReply.message.slice(0, 80) + "..." : quotedReply.message}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  {reply.is_admin_reply ? (
                    <Shield className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-foreground">
                    {reply.is_admin_reply ? "সাপোর্ট টিম" : "আপনি"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(reply.created_at).toLocaleDateString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{reply.message}</p>
                {reply.image_url && (
                  <a href={reply.image_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                    <img src={reply.image_url} alt="attachment" className="rounded-lg max-h-60 max-w-full object-contain border border-border" />
                  </a>
                )}
                {/* Reply button */}
                {!isClosed && (
                  <button
                    onClick={() => setReplyTo(reply)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                    title="রিপ্লাই"
                  >
                    <Reply className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Reply box */}
      {!isClosed ? (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {/* Reply-to indicator */}
          {replyTo && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 border-l-2 border-primary/40 px-3 py-2 text-xs">
              <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{replyTo.is_admin_reply ? "সাপোর্ট টিম" : "আপনি"}: </span>
                <span className="text-muted-foreground">
                  {replyTo.message.length > 60 ? replyTo.message.slice(0, 60) + "..." : replyTo.message}
                </span>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-0.5 hover:bg-muted rounded">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="rounded-lg max-h-32 border border-border" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="আপনার রিপ্লাই লিখুন..."
            rows={3}
          />
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Button onClick={handleSend} disabled={sending || (!message.trim() && !imageFile)} className="gap-2">
              <Send className="w-4 h-4" />
              {sending ? "পাঠানো হচ্ছে..." : "রিপ্লাই পাঠান"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          এই টিকেটটি {ticket.status === "resolved" ? "সমাধান" : "বন্ধ"} করা হয়েছে
        </div>
      )}
    </div>
  );
}
