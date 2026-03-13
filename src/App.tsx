import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import OverviewPage from "./components/dashboard/OverviewPage";
import ProfilePage from "./components/dashboard/ProfilePage";
import OrdersPage from "./components/dashboard/OrdersPage";
import BusinessDetailPage from "./components/dashboard/BusinessDetailPage";
import BusinessConfigPage from "./components/dashboard/BusinessConfigPage";
import NotificationsPage from "./components/dashboard/NotificationsPage";
import SettingsPage from "./components/dashboard/SettingsPage";
import HelpPage from "./components/dashboard/HelpPage";
import TicketsPage from "./components/dashboard/TicketsPage";
import CreateTicketPage from "./components/dashboard/CreateTicketPage";
import TicketDetailPage from "./components/dashboard/TicketDetailPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./components/admin/AdminOverviewPage";
import AdminOrdersPage from "./components/admin/AdminOrdersPage";
import AdminBusinessesPage from "./components/admin/AdminBusinessesPage";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminTicketsPage from "./components/admin/AdminTicketsPage";
import AdminTicketDetailPage from "./components/admin/AdminTicketDetailPage";
import AdminSettingsPage from "./components/admin/AdminSettingsPage";
import AdminChatPage from "./components/admin/AdminChatPage";
import StaffPanelPage from "./components/admin/StaffPanelPage";
import StaffLayout from "./components/staff/StaffLayout";
import StaffOverviewPage from "./components/staff/StaffOverviewPage";
import StaffHRPage from "./components/staff/StaffHRPage";
import AttendancePanel from "./components/staff/AttendancePanel";
import StaffAttendanceReportPage from "./components/staff/StaffAttendanceReportPage";
import GraphicsDesignerPanel from "./components/staff/panels/GraphicsDesignerPanel";
import WebDeveloperPanel from "./components/staff/panels/WebDeveloperPanel";
import ProjectManagerPanel from "./components/staff/panels/ProjectManagerPanel";
import DigitalMarketerPanel from "./components/staff/panels/DigitalMarketerPanel";
import LiveChat from "./components/LiveChat";
import Checkout from "./pages/Checkout";
import RenewalPage from "./pages/Renewal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(() => {
    if (sessionStorage.getItem("preloaded")) return false;
    return true;
  });
  const handleComplete = useCallback(() => {
    sessionStorage.setItem("preloaded", "1");
    setLoading(false);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="app-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
        <Sonner />
        {loading && <Preloader onComplete={handleComplete} />}
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<><Index /><LiveChat /></>} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="business/:orderId" element={<BusinessDetailPage />} />
                <Route path="business/:orderId/config" element={<BusinessConfigPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/new" element={<CreateTicketPage />} />
                <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="help" element={<HelpPage />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="businesses" element={<AdminBusinessesPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="tickets" element={<AdminTicketsPage />} />
                <Route path="tickets/:ticketId" element={<AdminTicketDetailPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="chat" element={<AdminChatPage />} />
                <Route path="staff" element={<StaffPanelPage />} />
              </Route>
              <Route path="/staff" element={<StaffLayout />}>
                <Route index element={<StaffOverviewPage />} />
                <Route path="tickets" element={<AdminTicketsPage />} />
                <Route path="tickets/:ticketId" element={<AdminTicketDetailPage />} />
                <Route path="chat" element={<AdminChatPage />} />
                <Route path="hr" element={<StaffHRPage />} />
                <Route path="attendance" element={<AttendancePanel />} />
                <Route path="attendance-report" element={<StaffAttendanceReportPage />} />
                <Route path="graphics-designer" element={<GraphicsDesignerPanel />} />
                <Route path="web-developer" element={<WebDeveloperPanel />} />
                <Route path="project-manager" element={<ProjectManagerPanel />} />
                <Route path="digital-marketer" element={<DigitalMarketerPanel />} />
              </Route>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/renewal" element={<RenewalPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  );
};

export default App;
