import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, ShoppingBag, Building2, Users, Settings, LogOut, Shield, Ticket, MessageCircle, UserCog, BarChart3, ScrollText,
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
import { useLanguage } from "@/contexts/LanguageContext";

import { Globe, Mail, Search } from "lucide-react";

const getMainItems = (t: (k: string) => string) => [
  { title: t("admin.overview"), url: "/admin", icon: LayoutDashboard },
  { title: t("admin.orderManagement"), url: "/admin/orders", icon: ShoppingBag },
  { title: t("admin.businesses"), url: "/admin/businesses", icon: Building2 },
  { title: t("admin.userManagement"), url: "/admin/users", icon: Users },
  { title: t("admin.ticketManagement"), url: "/admin/tickets", icon: Ticket },
  { title: t("admin.liveChat"), url: "/admin/chat", icon: MessageCircle },
  { title: t("admin.contactSubmissions"), url: "/admin/contacts", icon: Mail },
  { title: t("admin.analytics"), url: "/admin/analytics", icon: BarChart3 },
  { title: t("admin.logs"), url: "/admin/logs", icon: ScrollText },
];

const getStaffItems = (t: (k: string) => string) => [
  { title: t("admin.staffPanel"), url: "/staff", icon: UserCog },
];

const getWebsiteItems = (t: (k: string) => string) => [
  { title: t("admin.websiteContent"), url: "/admin/website", icon: Globe },
  { title: "SEO", url: "/admin/seo", icon: Search },
];

const getSettingsItems = (t: (k: string) => string) => [
  { title: t("admin.settings"), url: "/admin/settings", icon: Settings },
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
  const { t } = useLanguage();

  const mainItems = getMainItems(t);
  const staffItems = getStaffItems(t);
  const websiteItems = getWebsiteItems(t);
  const settingsItems = getSettingsItems(t);

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
                {t("admin.panel")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("admin.managementSystem")}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("admin.management")}</SidebarGroupLabel>
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("admin.team")}</SidebarGroupLabel>
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
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("admin.website")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {websiteItems.map((item) => (
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
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("admin.system")}</SidebarGroupLabel>
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
        )}
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
          {!collapsed && <span>{t("admin.logout")}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
