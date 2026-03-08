import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, BellOff, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export default function DashboardLayout() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: null, avatar_url: null });
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("notif_sound");
    return stored !== "false";
  });
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; time: string; read: boolean }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });

      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
        setIsAdmin(!!data);
      });

      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setUserRole(data.role);
        });
    }
  }, [user]);

  const playNotifSound = useCallback(() => {
    if (!soundEnabled) return;
    if (!audioRef.current) {
      audioRef.current = new Audio("https://cdn.pixabay.com/audio/2022/12/12/audio_e6a8ede5b1.mp3");
      audioRef.current.volume = 0.5;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("notif_sound", String(next));
  };

  // Listen for realtime order status changes as notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const order = payload.new as any;
          const notif = {
            id: crypto.randomUUID(),
            title: order.status === 'confirmed' ? 'অর্ডার কনফার্ম হয়েছে!' : `অর্ডার আপডেট: ${order.status}`,
            body: `${order.package_name} - ${order.customer_name}`,
            time: new Date().toISOString(),
            read: false,
          };
          setNotifications(prev => [notif, ...prev]);
          playNotifSound();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, playNotifSound]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar profile={profile} isAdmin={isAdmin} userRole={userRole} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4">
            <SidebarTrigger />
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              হোম
            </Link>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <Outlet context={{ user, profile, setProfile, isAdmin }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
