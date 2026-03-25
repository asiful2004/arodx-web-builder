import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, LogOut, UserCog, MessageCircle, Ticket, Users,
  Palette, Code, Briefcase, Megaphone, Clock, TrendingUp, FileText,
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
import { supabase } from "@/integrations/supabase/client";

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
  const { t } = useLanguage();
  const [isHR, setIsHR] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const commonItems = [
    { title: t("staff.overview"), url: "/staff", icon: LayoutDashboard },
    { title: t("staff.attendance"), url: "/staff/attendance", icon: Clock },
    { title: t("staff.ticketSupport"), url: "/staff/tickets", icon: Ticket },
    { title: t("staff.liveChat"), url: "/staff/chat", icon: MessageCircle },
  ];

  const hrManagementItems = [
    { title: t("staff.staffManagement"), url: "/staff/hr", icon: Users },
    { title: t("staff.jobApplications"), url: "/staff/applications", icon: FileText },
    { title: t("staff.attendanceReport"), url: "/staff/attendance-report", icon: TrendingUp },
  ];

  const subRolePanels = [
    { title: t("staff.graphicsDesigner"), url: "/staff/graphics-designer", icon: Palette, role: "graphics_designer" },
    { title: t("staff.webDeveloper"), url: "/staff/web-developer", icon: Code, role: "web_developer" },
    { title: t("staff.projectManager"), url: "/staff/project-manager", icon: Briefcase, role: "project_manager" },
    { title: t("staff.digitalMarketer"), url: "/staff/digital-marketer", icon: Megaphone, role: "digital_marketer" },
  ];

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "hr" as any }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]).then(([hrRes, adminRes, rolesRes]) => {
      setIsHR(!!hrRes.data);
      setIsAdmin(!!adminRes.data);
      setUserRoles((rolesRes.data || []).map((r: any) => r.role));
    });
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

  const canManage = isHR || isAdmin;

  const visiblePanels = canManage
    ? subRolePanels
    : subRolePanels.filter((p) => userRoles.includes(p.role));

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
                {t("staff.panel")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {canManage ? t("staff.hrManagement") : t("staff.supportSystem")}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("staff.menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonItems.map((item) => (
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

        {canManage && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("staff.hr")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hrManagementItems.map((item) => (
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

        {visiblePanels.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("staff.panels")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visiblePanels.map((item) => (
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
          {!collapsed && <span>{t("staff.logout")}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
