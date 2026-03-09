import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, CheckCircle2, Clock, XCircle, TrendingUp,
  Building2, Users, DollarSign
} from "lucide-react";

interface Stats {
  totalOrders: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  totalBusinesses: number;
}

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }: {
  icon: any; label: string; value: string | number; color: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex flex-col gap-3 p-5 rounded-xl bg-card border border-border"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <span className="text-2xl font-bold font-display text-foreground">{value}</span>
  </motion.div>
);

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pending: 0, confirmed: 0, cancelled: 0, totalBusinesses: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [ordersRes, businessRes] = await Promise.all([
      supabase.from("orders").select("status"),
      supabase.from("businesses").select("id"),
    ]);

    const orders = ordersRes.data || [];
    setStats({
      totalOrders: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      confirmed: orders.filter(o => o.status === "confirmed").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      totalBusinesses: businessRes.data?.length || 0,
    });

    const { data: recent } = await supabase
      .from("orders")
      .select("id, customer_name, package_name, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentOrders(recent || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "পেন্ডিং", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    confirmed: { label: "কনফার্মড", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    cancelled: { label: "বাতিল", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">অ্যাডমিন ওভারভিউ</h1>
        <p className="text-sm text-muted-foreground">সব কিছু এক নজরে দেখুন</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={ShoppingBag} label="মোট অর্ডার" value={stats.totalOrders} color="bg-primary/10 text-primary" delay={0} />
        <StatCard icon={Clock} label="পেন্ডিং" value={stats.pending} color="bg-yellow-500/10 text-yellow-600" delay={0.05} />
        <StatCard icon={CheckCircle2} label="কনফার্মড" value={stats.confirmed} color="bg-green-500/10 text-green-600" delay={0.1} />
        <StatCard icon={XCircle} label="বাতিল" value={stats.cancelled} color="bg-destructive/10 text-destructive" delay={0.15} />
        <StatCard icon={Building2} label="ব্যবসা" value={stats.totalBusinesses} color="bg-accent/20 text-accent-foreground" delay={0.2} />
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            সাম্প্রতিক অর্ডার
          </h2>
        </div>
        <div className="divide-y divide-border">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-10 text-center text-muted-foreground text-sm">
              কোনো অর্ডার নেই
            </div>
          ) : (
            recentOrders.map((order) => {
              const sc = statusConfig[order.status] || statusConfig.pending;
              return (
                <div key={order.id} className="px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.package_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{order.amount}</span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${sc.className}`}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
