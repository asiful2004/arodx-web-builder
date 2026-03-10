import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, Calendar, Activity, TrendingUp, Clock,
  Package, CreditCard, CalendarClock, CheckCircle2, AlertTriangle, XCircle,
  ExternalLink, Building2, Phone, MapPin, Globe,
  Shirt, ShoppingCart, UtensilsCrossed, Stethoscope, GraduationCap, Briefcase,
  Palette, Cpu, Car, Plane, Landmark, Dumbbell, Music, Camera, Wrench, Heart,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categoryIconMap: Record<string, LucideIcon> = {
  "Fashion & Clothing": Shirt,
  "E-commerce": ShoppingCart,
  "Food & Restaurant": UtensilsCrossed,
  "Health & Medical": Stethoscope,
  "Education": GraduationCap,
  "Business & Corporate": Briefcase,
  "Creative & Design": Palette,
  "Technology": Cpu,
  "Automotive": Car,
  "Travel & Tourism": Plane,
  "Finance & Banking": Landmark,
  "Fitness & Sports": Dumbbell,
  "Entertainment & Media": Music,
  "Photography": Camera,
  "Services & Maintenance": Wrench,
  "Beauty & Wellness": Heart,
};

const getCategoryIcon = (category?: string): LucideIcon => {
  if (!category) return Building2;
  return categoryIconMap[category] || Building2;
};

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface BusinessInfo {
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
  logo_url: string | null;
  created_at: string;
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
  business?: BusinessInfo;
}

const StatCard = ({ icon: Icon, label, value, color = "text-primary" }: {
  icon: any; label: string; value: string; color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-1.5 p-3 sm:p-5 rounded-xl bg-card border border-border"
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
    </div>
    <span className="text-sm sm:text-xl font-bold text-foreground truncate">{value}</span>
  </motion.div>
);

const getStatusInfo = (order: ActiveOrder) => {
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
        supabase.from("orders").select("id, package_name, amount, billing_period, renewal_date, is_active, status, refund_status").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setOrderCount(countRes.count || 0);

      const orders = (ordersRes.data || []) as ActiveOrder[];

      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data: businesses } = await supabase
          .from("businesses")
          .select("order_id, business_name, business_category, business_phone, business_address, domain_type, domain_name, logo_url, created_at")
          .in("order_id", orderIds);

        const bizMap = new Map((businesses || []).map(b => [b.order_id, b]));
        orders.forEach(o => {
          const biz = bizMap.get(o.id);
          if (biz) {
            o.business = {
              business_name: biz.business_name,
              business_category: biz.business_category,
              business_phone: biz.business_phone,
              business_address: biz.business_address,
              domain_type: biz.domain_type,
              domain_name: biz.domain_name,
              logo_url: biz.logo_url,
              created_at: biz.created_at,
            };
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
        <div className="relative flex items-center gap-3 sm:gap-5">
          <Avatar className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-primary/20 shadow-glow shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-xs sm:text-base font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg font-bold font-display text-foreground truncate">
              স্বাগতম, {profile.full_name || "ব্যবহারকারী"}! 👋
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard icon={Calendar} label="যোগদান" value={joinedDate} />
        <StatCard icon={Activity} label="সদস্যপদ" value={`${daysSinceJoin} দিন`} color="text-accent" />
        <StatCard icon={ShoppingBag} label="মোট অর্ডার" value={`${orderCount}`} />
        <StatCard icon={Package} label="সক্রিয় প্যাকেজ" value={`${activeOrders.filter(o => o.is_active).length}`} color="text-green-500" />
      </div>

      {/* Business Cards */}
      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2 px-1">
            <Building2 className="w-4 h-4 text-primary" />
            আমার ব্যবসা সমূহ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeOrders.map((order, i) => {
              const statusInfo = getStatusInfo(order);
              const biz = order.business;
              const expiryDate = order.renewal_date
                ? new Date(order.renewal_date).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
                : "—";

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-3 sm:p-5 space-y-3 hover:border-primary/30 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {biz?.logo_url ? (
                          <img src={biz.logo_url} alt={biz.business_name} className="w-full h-full object-cover rounded-xl" />
                        ) : (() => {
                          const CategoryIcon = getCategoryIcon(biz?.business_category);
                          return <CategoryIcon className="w-5 h-5 text-primary" />;
                        })()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {biz?.business_name || order.package_name}
                        </p>
                        {biz && (
                          <Badge variant="outline" className="text-[10px] mt-1">{biz.business_category}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary/80 gap-1 h-7 shrink-0"
                      onClick={() => navigate(`/dashboard/business/${order.id}`)}
                    >
                      বিস্তারিত দেখুন
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Business Details */}
                  {biz && (
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" /> {biz.business_phone}
                      </div>
                      {biz.business_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> {biz.business_address}
                        </div>
                      )}
                      {biz.domain_name && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" /> {biz.domain_name}
                          <Badge variant="secondary" className="text-[10px]">
                            {biz.domain_type === "own" ? "নিজস্ব" : "প্যাকেজ"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer: Status + Package + Price + Renewal */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] gap-1 ${statusInfo.color}`}>
                        <statusInfo.icon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">{order.package_name}</Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-primary">
                        {order.amount.startsWith("৳") ? order.amount : `৳${order.amount}`}
                        <span className="text-[10px] font-normal text-muted-foreground">/{order.billing_period === "yearly" ? "বছর" : "মাস"}</span>
                      </span>
                      {order.renewal_date && (() => {
                        const daysLeft = Math.ceil((new Date(order.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const isUrgent = daysLeft <= 7;
                        const isExpired = daysLeft <= 0;
                        return (
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            isExpired 
                              ? "bg-destructive/15 text-destructive" 
                              : isUrgent 
                                ? "bg-yellow-500/15 text-yellow-500" 
                                : "bg-accent/15 text-accent-foreground"
                          }`}>
                            {isExpired ? "মেয়াদ শেষ!" : `${daysLeft} দিন বাকি`}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
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