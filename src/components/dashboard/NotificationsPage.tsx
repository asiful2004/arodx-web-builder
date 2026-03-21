import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Bell, Check, Ticket, ShoppingBag, ExternalLink, Inbox, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  ticket_reply: Ticket,
  ticket_status: Ticket,
  new_ticket: Ticket,
  order: ShoppingBag,
  general: Bell,
};

const typeColors: Record<string, { color: string; bg: string }> = {
  ticket_reply: { color: "text-blue-500", bg: "bg-blue-500/10" },
  ticket_status: { color: "text-orange-500", bg: "bg-orange-500/10" },
  new_ticket: { color: "text-blue-500", bg: "bg-blue-500/10" },
  order: { color: "text-green-500", bg: "bg-green-500/10" },
  general: { color: "text-primary", bg: "bg-primary/10" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ঘন্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} দিন আগে`;
  return new Date(dateStr).toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { user } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setNotifications((data as Notification[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user.id]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: { label: string; items: Notification[] }[] = [];
  const todayItems = notifications.filter(n => new Date(n.created_at).toDateString() === today);
  const yesterdayItems = notifications.filter(n => new Date(n.created_at).toDateString() === yesterday);
  const olderItems = notifications.filter(n => {
    const d = new Date(n.created_at).toDateString();
    return d !== today && d !== yesterday;
  });
  if (todayItems.length > 0) groups.push({ label: "আজ", items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: "গতকাল", items: yesterdayItems });
  if (olderItems.length > 0) groups.push({ label: "আগের", items: olderItems });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">নোটিফিকেশন</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount}টি অপঠিত বিজ্ঞপ্তি` : "আপনার সকল বিজ্ঞপ্তি"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={markAllRead}>
            <Check className="w-3.5 h-3.5" />
            সব পঠিত করুন
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">কোনো নোটিফিকেশন নেই</p>
          <p className="text-xs text-muted-foreground">নতুন আপডেট আসলে এখানে দেখা যাবে</p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">{group.label}</p>
              <div className="space-y-2">
                {group.items.map((n, i) => {
                  const Icon = typeIcons[n.type] || Bell;
                  const colors = typeColors[n.type] || typeColors.general;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => handleClick(n)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm ${
                        n.is_read ? "bg-card border-border" : "bg-primary/[0.03] border-primary/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${n.is_read ? "bg-muted" : colors.bg}`}>
                          <Icon className={`w-4 h-4 ${n.is_read ? "text-muted-foreground" : colors.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${n.is_read ? "text-foreground" : "text-foreground"}`}>{n.title}</p>
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1.5">{timeAgo(n.created_at)}</p>
                        </div>
                        {n.link && (
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
