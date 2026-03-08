import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import NotificationsPage from "./components/dashboard/NotificationsPage";
import SettingsPage from "./components/dashboard/SettingsPage";
import HelpPage from "./components/dashboard/HelpPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./components/admin/AdminOverviewPage";
import AdminOrdersPage from "./components/admin/AdminOrdersPage";
import AdminBusinessesPage from "./components/admin/AdminBusinessesPage";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminSettingsPage from "./components/admin/AdminSettingsPage";
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {loading && <Preloader onComplete={handleComplete} />}
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="help" element={<HelpPage />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="businesses" element={<AdminBusinessesPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/renewal" element={<RenewalPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
