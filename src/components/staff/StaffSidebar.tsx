import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, LogOut, UserCog, MessageCircle, Ticket, Users,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const staffItems = [
  { title: "ওভারভিউ", url: "/staff", icon: LayoutDashboard },
  { title: "টিকেট সাপোর্ট", url: "/staff/tickets", icon: Ticket },
  { title: "লাইভ চ্যাট", url: "/staff/chat", icon: MessageCircle },
];

const hrItems = [
  { title: "স্টাফ ম্যানেজমেন্ট", url: "/staff/hr", icon: Users },
];

interface StaffSidebarProps {
  profile: { full_name: string | null; avatar_url: string | null };
}

export function StaffSidebar({ profile }: StaffSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isHR, setIsHR] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "hr" as any })
      .then(({ data }) => setIsHR(!!data));
  }, [user]);

  const closeMobileMenu = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) =>
    path === "/staff"
      ? location.pathname === "/staff"
      : location.pathname.startsWith(path);

  const initials = (profile.full_name || user?.email || "S")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <UserCog className="w-5 h-5 text-blue-600" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold font-display text-sidebar-foreground">
                স্টাফ প্যানেল
              </p>
              <p className="text-[11px] text-muted-foreground">
                সাপোর্ট সিস্টেম
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>মেনু</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staffItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/staff"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      onClick={closeMobileMenu}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 px-1">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile.full_name || "Staff"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>লগ আউট</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
