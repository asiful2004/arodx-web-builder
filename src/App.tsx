import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import Preloader from "@/components/Preloader";
import Index from "./pages/Index";
const LiveChat = lazy(() => import("./components/LiveChat"));
import { usePageTracker } from "@/hooks/usePageTracker";

// Lazy load non-critical routes for performance
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
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
const AdminWebsiteContentPage = lazy(() => import("./components/admin/AdminWebsiteContentPage"));
const AdminChatPage = lazy(() => import("./components/admin/AdminChatPage"));
const AdminContactSubmissionsPage = lazy(() => import("./components/admin/AdminContactSubmissionsPage"));
const AdminAnalyticsPage = lazy(() => import("./components/admin/AdminAnalyticsPage"));
const AdminLogsPage = lazy(() => import("./components/admin/AdminLogsPage"));
const AdminSEOPage = lazy(() => import("./components/admin/AdminSEOPage"));
const AdminLegalPagesEditor = lazy(() => import("./components/admin/AdminLegalPagesEditor"));
const StaffPanelPage = lazy(() => import("./components/admin/StaffPanelPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
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
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const PageTracker = () => { usePageTracker(); return null; };

const usePreloaderCheck = () => {
  const [showPreloader, setShowPreloader] = useState(true);
  const [checked, setChecked] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user IP
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(d => setUserIp(d.ip))
      .catch(() => setUserIp(null));
  }, []);

  useEffect(() => {
    // Check branding settings from supabase
    const checkSettings = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.from("site_settings").select("key, value").eq("key", "branding").single();
        if (data) {
          const branding = data.value as any;
          const globalEnabled = branding?.preloader_enabled !== false;
          const ipRules: { ip: string; enabled: boolean }[] = branding?.preloader_ip_rules || [];

          // Check if user IP matches any rule
          if (userIp && ipRules.length > 0) {
            const matchedRule = ipRules.find(r => r.ip === userIp);
            if (matchedRule) {
              setShowPreloader(matchedRule.enabled);
              setChecked(true);
              return;
            }
          }

          setShowPreloader(globalEnabled);
        }
      } catch {
        // Default: show preloader
      }
      setChecked(true);
    };

    // Wait a bit for IP to load, then check
    if (userIp !== null) {
      checkSettings();
    } else {
      // If IP fetch takes too long, proceed after 1s
      const timeout = setTimeout(() => { checkSettings(); }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [userIp]);

  return { showPreloader, checked };
};

const App = () => {
  const { showPreloader, checked } = usePreloaderCheck();
  const [loading, setLoading] = useState(true);
  const handleComplete = useCallback(() => {
    setLoading(false);
  }, []);

  // If preloader disabled, skip it
  useEffect(() => {
    if (checked && !showPreloader) {
      setLoading(false);
    }
  }, [checked, showPreloader]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="app-theme">
      <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
        <Sonner />
        {loading && showPreloader && <Preloader onComplete={handleComplete} />}
        <BrowserRouter>
          <AuthProvider>
            <PageTracker />
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/" element={<><Index /><Suspense fallback={null}><LiveChat /></Suspense></>} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
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
                  <Route path="website" element={<AdminWebsiteContentPage />} />
                  <Route path="chat" element={<AdminChatPage />} />
                  <Route path="contacts" element={<AdminContactSubmissionsPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="logs" element={<AdminLogsPage />} />
                  <Route path="seo" element={<AdminSEOPage />} />
                  <Route path="legal" element={<AdminLegalPagesEditor />} />
                  <Route path="staff" element={<StaffPanelPage />} />
                </Route>
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
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
                <Route path="/auth/google/callback" element={<GoogleCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
  );
};

export default App;