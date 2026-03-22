import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const playNotifSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://cdn.pixabay.com/audio/2022/12/12/audio_e6a8ede5b1.mp3");
      audioRef.current.volume = 0.5;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as Notification[]);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel(`notif-bell-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const notif = payload.new as Notification;
          setNotifications((prev) => [notif, ...prev]);
          playNotifSound();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, playNotifSound]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readNotifications = notifications.filter((n) => n.is_read);

  const clearRead = async () => {
    const readIds = readNotifications.map((n) => n.id);
    if (readIds.length === 0) return;
    await supabase.from("notifications").delete().in("id", readIds);
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    toast({ title: "পঠিত নোটিফিকেশন মুছে ফেলা হয়েছে" });
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;
    const allIds = notifications.map((n) => n.id);
    await supabase.from("notifications").delete().in("id", allIds);
    setNotifications([]);
    toast({ title: "সব নোটিফিকেশন মুছে ফেলা হয়েছে" });
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotifClick = (notif: Notification) => {
    if (!notif.is_read) {
      supabase.from("notifications").update({ is_read: true }).eq("id", notif.id).then(() => {
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
      });
    }
    if (notif.link) {
      setNotifOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-96 flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-base font-semibold">নোটিফিকেশন</SheetTitle>
          <div className="flex items-center gap-1.5 pt-1">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5 gap-1" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3" />
                সব পঠিত
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={clearAll}>
                <Trash2 className="h-3 w-3" />
                সব মুছুন
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
              <p className="text-xs text-muted-foreground/60 mt-1">নতুন আপডেট আসলে এখানে দেখা যাবে</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`px-4 py-3 transition-colors cursor-pointer hover:bg-accent/50 ${
                    n.is_read ? "bg-transparent" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {new Date(n.created_at).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
