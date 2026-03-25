import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, User, ShoppingBag, Settings, LogOut, Shield,
  HelpCircle, BadgeCheck, Ticket, Briefcase, Bell,
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

const STAFF_ROLES = ["hr", "graphics_designer", "web_developer", "project_manager", "digital_marketer"];

interface DashboardSidebarProps {
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
  userRole?: string;
  userRoles?: string[];
}

export function DashboardSidebar({ profile, isAdmin, userRole, userRoles = [] }: DashboardSidebarProps) {
  const isStaff = userRoles.some((r) => STAFF_ROLES.includes(r));
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const dashboardItems = [
    { title: t("dashboard.overview"), url: "/dashboard", icon: LayoutDashboard },
  ];

  const serviceItems = [
    { title: t("dashboard.orders"), url: "/dashboard/orders", icon: ShoppingBag },
    { title: t("dashboard.supportTickets"), url: "/dashboard/tickets", icon: Ticket },
  ];

  const accountItems = [
    { title: t("dashboard.profile"), url: "/dashboard/profile", icon: User },
    { title: t("dashboard.notifications"), url: "/dashboard/notifications", icon: Bell },
    { title: t("dashboard.settings"), url: "/dashboard/settings", icon: Settings },
  ];

  const supportItems = [
    { title: t("dashboard.help"), url: "/dashboard/help", icon: HelpCircle },
  ];

  const closeMobileMenu = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const initials = (profile.full_name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const roleLabel = userRole === 'admin' ? t("dashboard.admin") : userRole === 'client' ? t("dashboard.client") : userRole === 'moderator' ? t("dashboard.moderator") : t("dashboard.user");

  const renderMenuItems = (items: typeof dashboardItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <NavLink
            to={item.url}
            end={item.url === "/dashboard"}
            className="hover:bg-sidebar-accent/50"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
            onClick={closeMobileMenu}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate flex items-center gap-1">
                {profile.full_name || t("dashboard.setName")}
                {isAdmin && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email}
              </p>
              {userRole && (
                <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary capitalize">
                  {roleLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard.dashboardLabel")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(dashboardItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard.servicesAndOrders")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(serviceItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard.account")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(accountItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard.support")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(supportItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isStaff) && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("dashboard.quickAccess")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/admin"}>
                      <NavLink
                        to="/admin"
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        onClick={closeMobileMenu}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{t("dashboard.adminPanel")}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isStaff && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/staff")}>
                      <NavLink
                        to="/staff"
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        onClick={closeMobileMenu}
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{t("dashboard.staffPanel")}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t("dashboard.logout")}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
