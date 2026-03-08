import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, Calendar, Activity, TrendingUp, Clock,
  Package, CreditCard, CalendarClock, CheckCircle2, AlertTriangle, XCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface ActiveOrder {
  id: string;
  package_name: string;
  amount: string;
  billing_period: string;
  renewal_date: string | null;
  is_active: boolean;
  status: string;
  refund_status: string | null;
  business_name?: string;
}

const StatCard = ({ icon: Icon, label, value, color = "text-primary" }: {
  icon: any; label: string; value: string; color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-2 p-5 rounded-xl bg-card border border-border"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <span className="text-xl font-bold text-foreground">{value}</span>
  </motion.div>
);

const getStatusInfo = (order: ActiveOrder) => {
  // Match OrdersPage logic: if active & confirmed, show as active regardless of refund
  if (order.status === 'confirmed' && order.is_active) {
    if (order.renewal_date) {
      const daysLeft = Math.ceil((new Date(order.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) return { label: "মেয়াদ শেষ", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
      if (daysLeft <= 7) return { label: `${daysLeft} দিন বাকি`, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    }
    return { label: "সক্রিয়", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" };
  }
  if (order.refund_status === 'approved') return { label: "রিফান্ডেড", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
  if (order.refund_status === 'pending') return { label: "রিফান্ড পেন্ডিং", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (!order.is_active || order.status === 'cancelled') return { label: "নিষ্ক্রিয়", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
  return { label: "পেন্ডিং", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
};

export default function OverviewPage() {
  const { user, profile, isAdmin } = useOutletContext<DashboardContext>();
  const [orderCount, setOrderCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [countRes, ordersRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("orders").select("id, package_name, amount, billing_period, renewal_date, is_active, status, refund_status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);
      setOrderCount(countRes.count || 0);
      setActiveOrders((ordersRes.data as ActiveOrder[]) || []);
    };
    fetchData();
  }, [user.id]);

  const initials = (profile.full_name || user.email || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const joinedDate = new Date(user.created_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
      >
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
        <div className="relative flex items-center gap-5">
          <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-glow">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-display text-foreground">
              স্বাগতম, {profile.full_name || "ব্যবহারকারী"}! 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              আপনার ড্যাশবোর্ড থেকে সব কিছু ম্যানেজ করুন
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <Activity className="w-3 h-3 text-green-500" />
            <span>{isAdmin ? "অ্যাডমিন" : "অ্যাক্টিভ"}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label="যোগদান" value={joinedDate} />
        <StatCard icon={Activity} label="সদস্যপদ" value={`${daysSinceJoin} দিন`} color="text-accent" />
        <StatCard icon={ShoppingBag} label="মোট অর্ডার" value={`${orderCount}`} />
      </div>

      {/* Subscription Quick Stats */}
      {activeOrders.length > 0 && (() => {
        const order = activeOrders[0];
        const statusInfo = getStatusInfo(order);
        const expiryDate = order.renewal_date
          ? new Date(order.renewal_date).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
          : "—";
        return (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard icon={Package} label="প্যাকেজ" value={order.package_name} />
            <StatCard icon={statusInfo.icon} label="স্ট্যাটাস" value={statusInfo.label} color={statusInfo.color} />
            <StatCard icon={CreditCard} label="মূল্য" value={`${order.amount}/${order.billing_period === "yearly" ? "বছর" : "মাস"}`} />
            <StatCard icon={CalendarClock} label="মেয়াদ শেষ" value={expiryDate} color="text-accent" />
          </div>
        );
      })()}

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          সাম্প্রতিক কার্যকলাপ
        </h2>
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">এখনো কোনো কার্যকলাপ নেই</p>
          <p className="text-xs mt-1">আপনার অর্ডার ও আপডেট এখানে দেখা যাবে</p>
        </div>
      </motion.div>
    </div>
  );
}