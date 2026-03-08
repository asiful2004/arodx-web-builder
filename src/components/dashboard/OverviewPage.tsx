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
  if (order.refund_status === 'approved') return { label: "রিফান্ডেড", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
  if (order.refund_status === 'pending') return { label: "রিফান্ড পেন্ডিং", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (!order.is_active || order.status === 'cancelled') return { label: "নিষ্ক্রিয়", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
  
  if (order.renewal_date) {
    const daysLeft = Math.ceil((new Date(order.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { label: "মেয়াদ শেষ", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
    if (daysLeft <= 7) return { label: `${daysLeft} দিন বাকি`, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
  }
  return { label: "সক্রিয়", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" };
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
        supabase.from("orders").select("id, package_name, amount, billing_period, renewal_date, is_active, status, refund_status").eq("user_id", user.id).eq("status", "confirmed").order("created_at", { ascending: false }),
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

      {/* Active Subscription Summary */}
      {activeOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              আমার সাবস্ক্রিপশন
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/dashboard/orders")}>
              বিস্তারিত →
            </Button>
          </div>
          <div className="space-y-3">
            {activeOrders.map((order) => {
              const statusInfo = getStatusInfo(order);
              const StatusIcon = statusInfo.icon;
              const expiryDate = order.renewal_date
                ? new Date(order.renewal_date).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
                : "—";

              return (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
                  {/* Package & Status */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg ${statusInfo.bg} flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`w-4.5 h-4.5 ${statusInfo.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{order.package_name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          {order.billing_period === "yearly" ? "বার্ষিক" : "মাসিক"}
                        </Badge>
                      </div>
                      <p className={`text-xs mt-0.5 ${statusInfo.color}`}>{statusInfo.label}</p>
                    </div>
                  </div>

                  {/* Price & Expiry */}
                  <div className="flex items-center gap-4 sm:gap-6 text-xs pl-12 sm:pl-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>৳{order.amount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>{expiryDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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