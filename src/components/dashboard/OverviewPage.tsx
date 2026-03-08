import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, Calendar, Activity, TrendingUp, Clock,
  Package, CreditCard, CalendarClock, CheckCircle2, AlertTriangle, XCircle,
  ExternalLink, Globe, Phone, MapPin, Building2, Hash, Layers
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface BusinessDetail {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
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
  business?: BusinessDetail;
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

  const [selectedOrder, setSelectedOrder] = useState<ActiveOrder | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [countRes, ordersRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("orders").select("id, package_name, amount, billing_period, renewal_date, is_active, status, refund_status").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setOrderCount(countRes.count || 0);

      const orders = (ordersRes.data || []) as ActiveOrder[];

      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data: businesses } = await supabase
          .from("businesses")
          .select("order_id, business_name, business_category, business_phone, business_address, domain_type, domain_name, id")
          .in("order_id", orderIds);

        const bizMap = new Map((businesses || []).map(b => [b.order_id, b]));
        orders.forEach(o => {
          const biz = bizMap.get(o.id);
          if (biz) {
            o.business_name = biz.business_name;
            o.business = biz as BusinessDetail;
          }
        });
      }

      setActiveOrders(orders);
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

      {/* Subscription Quick Stats - All Orders */}
      {activeOrders.map((order) => {
        const statusInfo = getStatusInfo(order);
        const expiryDate = order.renewal_date
          ? new Date(order.renewal_date).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
          : "—";
        return (
          <div key={order.id} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-foreground font-display">
                {order.business_name || order.package_name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80 gap-1 h-7"
                onClick={() => setSelectedOrder(order)}
              >
                বিস্তারিত দেখুন
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard icon={Package} label="প্যাকেজ" value={order.package_name} />
              <StatCard icon={statusInfo.icon} label="স্ট্যাটাস" value={statusInfo.label} color={statusInfo.color} />
              <StatCard icon={CreditCard} label="মূল্য" value={`${order.amount}/${order.billing_period === "yearly" ? "বছর" : "মাস"}`} />
              <StatCard icon={CalendarClock} label="মেয়াদ শেষ" value={expiryDate} color="text-accent" />
            </div>
          </div>
        );
      })}

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

      {/* Business Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {selectedOrder?.business?.business_name || selectedOrder?.package_name || "বিস্তারিত"}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (() => {
            const statusInfo = getStatusInfo(selectedOrder);
            const biz = selectedOrder.business;
            return (
              <div className="space-y-5">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>

                {/* Business Info */}
                {biz && (
                  <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ব্যবসার তথ্য</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-foreground">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{biz.business_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span>{biz.business_category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{biz.business_phone}</span>
                      </div>
                      {biz.business_address && (
                        <div className="flex items-center gap-2 text-foreground">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{biz.business_address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-foreground">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>{biz.domain_name || (biz.domain_type === "own" ? "নিজস্ব ডোমেইন" : "প্যাকেজ ডোমেইন")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order/Package Info */}
                <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">প্যাকেজ তথ্য</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.package_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.amount}/{selectedOrder.billing_period === "yearly" ? "বছর" : "মাস"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <CalendarClock className="w-4 h-4 text-muted-foreground" />
                      <span>মেয়াদ: {selectedOrder.renewal_date
                        ? new Date(selectedOrder.renewal_date).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
                        : "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate text-xs">ID: {selectedOrder.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedOrder(null);
                    navigate("/dashboard/orders");
                  }}
                >
                  অর্ডার পেজে যান
                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}