import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, ShoppingBag, Building2, Users, Settings, LogOut, Shield, Ticket, MessageCircle, UserCog,
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

const mainItems = [
  { title: "ওভারভিউ", url: "/admin", icon: LayoutDashboard },
  { title: "অর্ডার ম্যানেজমেন্ট", url: "/admin/orders", icon: ShoppingBag },
  { title: "ব্যবসা সমূহ", url: "/admin/businesses", icon: Building2 },
  { title: "ইউজার ম্যানেজমেন্ট", url: "/admin/users", icon: Users },
  { title: "টিকেট ম্যানেজমেন্ট", url: "/admin/tickets", icon: Ticket },
  { title: "লাইভ চ্যাট", url: "/admin/chat", icon: MessageCircle },
];

const staffItems = [
  { title: "স্টাফ প্যানেল", url: "/admin/staff", icon: UserCog },
];

const settingsItems = [
  { title: "সেটিংস", url: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin?: boolean;
}

export function AdminSidebar({ profile, isAdmin = true }: AdminSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const closeMobileMenu = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  const initials = (profile.full_name || user?.email || "A")
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
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold font-display text-sidebar-foreground">
                অ্যাডমিন প্যানেল
              </p>
              <p className="text-[11px] text-muted-foreground">
                ম্যানেজমেন্ট সিস্টেম
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>ম্যানেজমেন্ট</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
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
        )}

        <SidebarGroup>
          <SidebarGroupLabel>টিম</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staffItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
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

        <SidebarGroup>
          <SidebarGroupLabel>সিস্টেম</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
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
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile.full_name || "Admin"}
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
