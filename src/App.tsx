import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useState, useCallback, lazy, Suspense } from "react";
import Preloader from "@/components/Preloader";
import Index from "./pages/Index";
import LiveChat from "./components/LiveChat";
import { usePageTracker } from "@/hooks/usePageTracker";

// Lazy load non-critical routes for performance
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const OverviewPage = lazy(() => import("./components/dashboard/OverviewPage"));
const ProfilePage = lazy(() => import("./components/dashboard/ProfilePage"));
const PublicProfilePage = lazy(() => import("./components/dashboard/PublicProfilePage"));
const OrdersPage = lazy(() => import("./components/dashboard/OrdersPage"));
const BusinessDetailPage = lazy(() => import("./components/dashboard/BusinessDetailPage"));
const BusinessConfigPage = lazy(() => import("./components/dashboard/BusinessConfigPage"));
const NotificationsPage = lazy(() => import("./components/dashboard/NotificationsPage"));
const SettingsPage = lazy(() => import("./components/dashboard/SettingsPage"));
const HelpPage = lazy(() => import("./components/dashboard/HelpPage"));
const TicketsPage = lazy(() => import("./components/dashboard/TicketsPage"));
const CreateTicketPage = lazy(() => import("./components/dashboard/CreateTicketPage"));
const TicketDetailPage = lazy(() => import("./components/dashboard/TicketDetailPage"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminOverviewPage = lazy(() => import("./components/admin/AdminOverviewPage"));
const AdminOrdersPage = lazy(() => import("./components/admin/AdminOrdersPage"));
const AdminBusinessesPage = lazy(() => import("./components/admin/AdminBusinessesPage"));
const AdminUsersPage = lazy(() => import("./components/admin/AdminUsersPage"));
const AdminTicketsPage = lazy(() => import("./components/admin/AdminTicketsPage"));
const AdminTicketDetailPage = lazy(() => import("./components/admin/AdminTicketDetailPage"));
const AdminSettingsPage = lazy(() => import("./components/admin/AdminSettingsPage"));
const AdminChatPage = lazy(() => import("./components/admin/AdminChatPage"));
const AdminAnalyticsPage = lazy(() => import("./components/admin/AdminAnalyticsPage"));
const StaffPanelPage = lazy(() => import("./components/admin/StaffPanelPage"));
const StaffLayout = lazy(() => import("./components/staff/StaffLayout"));
const StaffOverviewPage = lazy(() => import("./components/staff/StaffOverviewPage"));
const StaffHRPage = lazy(() => import("./components/staff/StaffHRPage"));
const AttendancePanel = lazy(() => import("./components/staff/AttendancePanel"));
const StaffAttendanceReportPage = lazy(() => import("./components/staff/StaffAttendanceReportPage"));
const GraphicsDesignerPanel = lazy(() => import("./components/staff/panels/GraphicsDesignerPanel"));
const WebDeveloperPanel = lazy(() => import("./components/staff/panels/WebDeveloperPanel"));
const ProjectManagerPanel = lazy(() => import("./components/staff/panels/ProjectManagerPanel"));
const DigitalMarketerPanel = lazy(() => import("./components/staff/panels/DigitalMarketerPanel"));
const HRApplicationsPage = lazy(() => import("./components/staff/HRApplicationsPage"));
const JoinTeam = lazy(() => import("./pages/JoinTeam"));
const Checkout = lazy(() => import("./pages/Checkout"));
const RenewalPage = lazy(() => import("./pages/Renewal"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const PageTracker = () => { usePageTracker(); return null; };

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
            <PageTracker />
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/" element={<><Index /><LiveChat /></>} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="profile/:userId" element={<PublicProfilePage />} />
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
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
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
                  <Route path="applications" element={<HRApplicationsPage />} />
                  <Route path="graphics-designer" element={<GraphicsDesignerPanel />} />
                  <Route path="web-developer" element={<WebDeveloperPanel />} />
                  <Route path="project-manager" element={<ProjectManagerPanel />} />
                  <Route path="digital-marketer" element={<DigitalMarketerPanel />} />
                </Route>
                <Route path="/join-team" element={<JoinTeam />} />
                <Route path="/join" element={<JoinTeam />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/renewal" element={<RenewalPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  );
};

export default App;