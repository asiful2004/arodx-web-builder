import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SendNotificationDialog from "@/components/shared/SendNotificationDialog";
import OnlineMembersPanel, { OnlineMembersTrigger } from "@/components/shared/OnlineMembersPanel";
import { OnlinePresenceContext, useOnlinePresenceProvider } from "@/hooks/useOnlinePresence";
import { useDashboardActivityTracker } from "@/hooks/useDashboardActivityTracker";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function AdminLayout() {
  const { user, loading: authLoading, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const presenceValue = useOnlinePresenceProvider();
  useDashboardActivityTracker();

  // Persistent chat notification state
  const [unansweredSessions, setUnansweredSessions] = useState<Set<string>>(new Set());
  const persistentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatNotifAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  // Redirect non-admin once roles are loaded
  useEffect(() => {
    if (!authLoading && user && isAdmin === false) {
      navigate("/dashboard");
      toast({ title: "অ্যাক্সেস নেই", description: "আপনার এই প্যানেলে অ্যাক্সেস নেই।", variant: "destructive" });
    }
  }, [authLoading, user, isAdmin, navigate, toast]);

  const playNotifSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://cdn.pixabay.com/audio/2022/12/12/audio_e6a8ede5b1.mp3");
      audioRef.current.volume = 0.5;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const playChatNotifSound = useCallback(() => {
    if (!chatNotifAudioRef.current) {
      chatNotifAudioRef.current = new Audio("https://cdn.pixabay.com/audio/2022/12/12/audio_e6a8ede5b1.mp3");
      chatNotifAudioRef.current.volume = 0.7;
    }
    chatNotifAudioRef.current.currentTime = 0;
    chatNotifAudioRef.current.play().catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as Notification[]);
  }, [user]);

  useEffect(() => {
    if (isAdmin) fetchNotifications();
  }, [isAdmin, fetchNotifications]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const notif = payload.new as Notification;
          setNotifications((prev) => [notif, ...prev]);
          playNotifSound();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, playNotifSound]);

  // === Persistent Chat Notification System ===
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel("admin-chat-persistent-notif")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as { id: string; session_id: string; sender_type: string; sender_id: string | null };
          
          if (msg.sender_type === "client") {
            setUnansweredSessions(prev => {
              const next = new Set(prev);
              next.add(msg.session_id);
              return next;
            });
            playChatNotifSound();
            toast({
              title: "💬 নতুন চ্যাট মেসেজ!",
              description: "একজন ক্লায়েন্ট সাপোর্ট চ্যাটে মেসেজ পাঠিয়েছে",
              action: (
                <Button 
                  size="sm" 
                  variant="default"
                  className="gap-1 text-xs"
                  onClick={() => navigate("/admin/chat")}
                >
                  <MessageCircle className="h-3 w-3" />
                  চ্যাটে যান
                </Button>
              ),
            });
          }
          
          if (msg.sender_type === "admin" && msg.sender_id) {
            setUnansweredSessions(prev => {
              const next = new Set(prev);
              next.delete(msg.session_id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, playChatNotifSound, navigate, toast]);

  // Repeating sound every 15s while there are unanswered sessions
  useEffect(() => {
    if (unansweredSessions.size > 0) {
      const isOnChatPage = location.pathname.includes("/admin/chat");
      if (persistentTimerRef.current) clearInterval(persistentTimerRef.current);
      if (!isOnChatPage) {
        persistentTimerRef.current = setInterval(() => {
          playChatNotifSound();
        }, 15000);
      }
    } else {
      if (persistentTimerRef.current) {
        clearInterval(persistentTimerRef.current);
        persistentTimerRef.current = null;
      }
    }
    return () => {
      if (persistentTimerRef.current) {
        clearInterval(persistentTimerRef.current);
        persistentTimerRef.current = null;
      }
    };
  }, [unansweredSessions, location.pathname, playChatNotifSound]);

  useEffect(() => {
    if (location.pathname.includes("/admin/chat") && persistentTimerRef.current) {
      clearInterval(persistentTimerRef.current);
      persistentTimerRef.current = null;
    }
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
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

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <OnlinePresenceContext.Provider value={presenceValue}>
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar profile={profile} isAdmin={isAdmin} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                ড্যাশবোর্ড
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <OnlineMembersTrigger />
              <SendNotificationDialog />
              {unansweredSessions.size > 0 && !location.pathname.includes("/admin/chat") && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-xs animate-pulse"
                  onClick={() => navigate("/admin/chat")}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {unansweredSessions.size} চ্যাট অপেক্ষমাণ
                </Button>
              )}

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
              <SheetContent side="right" className="w-80 sm:w-96 flex flex-col">
                <SheetHeader className="border-b border-border pb-3">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-base">নোটিফিকেশন</SheetTitle>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                        সব পঠিত
                      </Button>
                    )}
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-2">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">নতুন আপডেট আসলে এখানে দেখা যাবে</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`px-3 py-3 rounded-lg transition-colors cursor-pointer hover:bg-accent/50 ${
                            n.is_read ? "bg-transparent" : "bg-primary/5"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
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
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <Outlet context={{ user, profile }} />
          </main>
        </div>

        <OnlineMembersPanel />
      </div>
    </SidebarProvider>
    </OnlinePresenceContext.Provider>
  );
}
