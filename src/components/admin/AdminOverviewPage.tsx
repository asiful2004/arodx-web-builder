import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, CheckCircle2, Clock, XCircle, TrendingUp,
  Building2, Users, Ticket, Activity, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalOrders: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  totalBusinesses: number;
  totalUsers: number;
  openTickets: number;
}

const StatCard = ({ icon: Icon, label, value, color, bg, delay = 0 }: {
  icon: any; label: string; value: string | number; color: string; bg: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-xl bg-card border border-border p-4 sm:p-5"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
  </motion.div>
);

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pending: 0, confirmed: 0, cancelled: 0,
    totalBusinesses: 0, totalUsers: 0, openTickets: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [ordersRes, businessRes, ticketsRes] = await Promise.all([
      supabase.from("orders").select("status"),
      supabase.from("businesses").select("id"),
      supabase.from("tickets").select("id, status").in("status", ["open", "in_progress", "waiting"]),
    ]);

    const orders = ordersRes.data || [];
    setStats({
      totalOrders: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      confirmed: orders.filter(o => o.status === "confirmed").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      totalBusinesses: businessRes.data?.length || 0,
      totalUsers: 0,
      openTickets: ticketsRes.data?.length || 0,
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
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">অ্যাডমিন ওভারভিউ</h1>
            <p className="text-sm text-muted-foreground">সব কিছু এক নজরে দেখুন</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={ShoppingBag} label="মোট অর্ডার" value={stats.totalOrders} color="text-primary" bg="bg-primary/10" delay={0} />
        <StatCard icon={Clock} label="পেন্ডিং" value={stats.pending} color="text-yellow-600" bg="bg-yellow-500/10" delay={0.04} />
        <StatCard icon={CheckCircle2} label="কনফার্মড" value={stats.confirmed} color="text-green-600" bg="bg-green-500/10" delay={0.08} />
        <StatCard icon={Building2} label="ব্যবসা" value={stats.totalBusinesses} color="text-blue-600" bg="bg-blue-500/10" delay={0.12} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-bold text-destructive">{stats.cancelled}</p>
            <p className="text-[10px] text-muted-foreground">বাতিলকৃত</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-orange-500">{stats.openTickets}</p>
            <p className="text-[10px] text-muted-foreground">ওপেন টিকেট</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">
              {stats.totalOrders > 0 ? Math.round((stats.confirmed / stats.totalOrders) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground">কনফার্ম রেট</p>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            সাম্প্রতিক অর্ডার
          </h2>
          <Badge variant="outline" className="text-[10px]">{recentOrders.length}টি</Badge>
        </div>
        <div className="divide-y divide-border/50">
          {recentOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">কোনো অর্ডার নেই</p>
            </div>
          ) : (
            recentOrders.map((order, i) => {
              const sc = statusConfig[order.status] || statusConfig.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground">{order.package_name} • {new Date(order.created_at).toLocaleDateString("bn-BD", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{order.amount}</span>
                    <Badge variant="outline" className={`text-[10px] border ${sc.className}`}>
                      {sc.label}
                    </Badge>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
