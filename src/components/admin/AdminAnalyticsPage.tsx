import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Users, ShoppingBag, TrendingUp, MessageCircle,
  Ticket, Building2, DollarSign, Activity, Clock, UserPlus,
  ArrowUpRight, ArrowDownRight, Globe, Smartphone, Monitor,
  Tablet, Eye, MousePointerClick, RefreshCw
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Interfaces ────────────────────────────────────
interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalOrders: number;
  totalRevenue: number;
  confirmedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalChatSessions: number;
  activeChatSessions: number;
  totalBusinesses: number;
  totalMessages: number;
  avgResponseTime: string;
  userGrowth: { month: string; users: number }[];
  orderTrend: { month: string; orders: number; revenue: number }[];
  ticketsByCategory: { name: string; value: number }[];
  ordersByPackage: { name: string; value: number }[];
  dailyActivity: { day: string; orders: number; tickets: number; chats: number }[];
  userRolesDistribution: { role: string; count: number }[];
  revenueByMethod: { method: string; amount: number }[];
  // Traffic
  totalPageViews: number;
  todayPageViews: number;
  uniqueSessions: number;
  topPages: { page: string; views: number }[];
  trafficByDevice: { device: string; count: number }[];
  trafficByBrowser: { browser: string; count: number }[];
  trafficByOS: { os: string; count: number }[];
  dailyTraffic: { day: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "hsl(210, 70%, 50%)",
];

// ─── Stat Card ────────────────────────────────────
const StatCard = ({
  icon: Icon, label, value, subValue, trend, delay = 0
}: {
  icon: any; label: string; value: string | number;
  subValue?: string; trend?: "up" | "down" | "neutral"; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex flex-col gap-0.5 p-2.5 sm:p-4 rounded-xl bg-card border border-border min-w-0"
  >
    <div className="flex items-center justify-between gap-1">
      <span className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider truncate">{label}</span>
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
      </div>
    </div>
    <span className="text-base sm:text-2xl font-bold font-display text-foreground truncate">{value}</span>
    {subValue && (
      <span className="text-[9px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
        {trend === "up" && <ArrowUpRight className="w-2.5 h-2.5 text-green-500 shrink-0" />}
        {trend === "down" && <ArrowDownRight className="w-2.5 h-2.5 text-destructive shrink-0" />}
        <span className="truncate">{subValue}</span>
      </span>
    )}
  </motion.div>
);

// ─── Chart Card ────────────────────────────────
const ChartCard = ({
  title, icon: Icon, children, delay = 0
}: {
  title: string; icon: any; children: React.ReactNode; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden"
  >
    <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-border">
      <h3 className="text-[11px] sm:text-sm font-semibold font-display text-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
        <span className="truncate">{title}</span>
      </h3>
    </div>
    <div className="p-2 sm:p-4">{children}</div>
  </motion.div>
);

// ─── Helpers ────────────────────────────────────
const getMonthName = (date: Date): string =>
  date.toLocaleDateString("bn-BD", { month: "short", year: "2-digit" });

const getLast7Days = (): string[] => {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("bn-BD", { weekday: "short", day: "numeric" }));
  }
  return days;
};

const getLast7DaysDates = (): Date[] => {
  const dates: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
};

const DEVICE_ICONS: Record<string, any> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

// ─── Main Component ────────────────────────────────
export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const chartHeight = isMobile ? 200 : 260;
  const pieOuterRadius = isMobile ? 55 : 80;
  const pieInnerRadius = isMobile ? 25 : 40;
  const axisFontSize = isMobile ? 8 : 11;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [
        ordersRes, profilesRes, ticketsRes, chatSessionsRes,
        chatMessagesRes, businessesRes, rolesRes, pageViewsRes
      ] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("profiles").select("created_at, user_id"),
        supabase.from("tickets").select("*"),
        supabase.from("chat_sessions").select("*"),
        supabase.from("chat_messages").select("session_id, sender_type, created_at"),
        supabase.from("businesses").select("id, created_at"),
        supabase.from("user_roles").select("role"),
        supabase.from("page_views" as any).select("*"),
      ]);

      const orders = ordersRes.data || [];
      const profiles = profilesRes.data || [];
      const tickets = ticketsRes.data || [];
      const chatSessions = chatSessionsRes.data || [];
      const chatMessages = chatMessagesRes.data || [];
      const businesses = businessesRes.data || [];
      const roles = rolesRes.data || [];
      const pageViews = (pageViewsRes.data || []) as any[];

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const newUsersThisMonth = profiles.filter(p => new Date(p.created_at) >= thisMonthStart).length;
      const totalRevenue = orders.filter(o => o.status === "confirmed").reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

      // User growth (last 6 months)
      const userGrowth: { month: string; users: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        userGrowth.push({
          month: getMonthName(ms),
          users: profiles.filter(p => { const d = new Date(p.created_at); return d >= ms && d <= me; }).length,
        });
      }

      // Order trend
      const orderTrend: { month: string; orders: number; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const mo = orders.filter(o => { const d = new Date(o.created_at); return d >= ms && d <= me; });
        orderTrend.push({
          month: getMonthName(ms),
          orders: mo.length,
          revenue: mo.filter(o => o.status === "confirmed").reduce((s, o) => s + (parseFloat(o.amount) || 0), 0),
        });
      }

      // Category maps
      const catMap: Record<string, number> = {};
      tickets.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + 1; });
      const pkgMap: Record<string, number> = {};
      orders.forEach(o => { pkgMap[o.package_name] = (pkgMap[o.package_name] || 0) + 1; });

      // Daily activity
      const dayLabels = getLast7Days();
      const dayDates = getLast7DaysDates();
      const dailyActivity = dayLabels.map((day, i) => {
        const ds = dayDates[i]; const de = new Date(ds); de.setDate(de.getDate() + 1);
        return {
          day,
          orders: orders.filter(o => { const d = new Date(o.created_at); return d >= ds && d < de; }).length,
          tickets: tickets.filter(t => { const d = new Date(t.created_at); return d >= ds && d < de; }).length,
          chats: chatSessions.filter(c => { const d = new Date(c.created_at); return d >= ds && d < de; }).length,
        };
      });

      // Roles
      const roleMap: Record<string, number> = {};
      roles.forEach(r => { roleMap[r.role as string] = (roleMap[r.role as string] || 0) + 1; });

      // Revenue by method
      const methodMap: Record<string, number> = {};
      orders.filter(o => o.status === "confirmed").forEach(o => {
        const m = o.payment_method || "অন্যান্য";
        methodMap[m] = (methodMap[m] || 0) + (parseFloat(o.amount) || 0);
      });

      // ─── Traffic Analytics ───
      const todayPageViews = pageViews.filter(pv => new Date(pv.created_at) >= todayStart).length;
      const uniqueSessions = new Set(pageViews.map(pv => pv.session_id)).size;

      // Top pages
      const pageMap: Record<string, number> = {};
      pageViews.forEach(pv => { pageMap[pv.page_path] = (pageMap[pv.page_path] || 0) + 1; });
      const topPages = Object.entries(pageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([page, views]) => ({ page, views }));

      // Device breakdown
      const deviceMap: Record<string, number> = {};
      pageViews.forEach(pv => { deviceMap[pv.device_type || "desktop"] = (deviceMap[pv.device_type || "desktop"] || 0) + 1; });
      const trafficByDevice = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));

      // Browser breakdown
      const browserMap: Record<string, number> = {};
      pageViews.forEach(pv => { browserMap[pv.browser || "Other"] = (browserMap[pv.browser || "Other"] || 0) + 1; });
      const trafficByBrowser = Object.entries(browserMap).sort((a, b) => b[1] - a[1]).map(([browser, count]) => ({ browser, count }));

      // OS breakdown
      const osMap: Record<string, number> = {};
      pageViews.forEach(pv => { osMap[pv.os || "Other"] = (osMap[pv.os || "Other"] || 0) + 1; });
      const trafficByOS = Object.entries(osMap).sort((a, b) => b[1] - a[1]).map(([os, count]) => ({ os, count }));

      // Daily traffic
      const dailyTraffic = dayLabels.map((day, i) => {
        const ds = dayDates[i]; const de = new Date(ds); de.setDate(de.getDate() + 1);
        return {
          day,
          views: pageViews.filter(pv => { const d = new Date(pv.created_at); return d >= ds && d < de; }).length,
        };
      });

      // Top referrers
      const refMap: Record<string, number> = {};
      pageViews.forEach(pv => {
        if (pv.referrer) {
          try {
            const host = new URL(pv.referrer).hostname || pv.referrer;
            refMap[host] = (refMap[host] || 0) + 1;
          } catch {
            refMap[pv.referrer] = (refMap[pv.referrer] || 0) + 1;
          }
        }
      });
      const topReferrers = Object.entries(refMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([referrer, count]) => ({ referrer, count }));

      setData({
        totalUsers: profiles.length, newUsersThisMonth,
        totalOrders: orders.length, totalRevenue,
        confirmedOrders: orders.filter(o => o.status === "confirmed").length,
        pendingOrders: orders.filter(o => o.status === "pending").length,
        cancelledOrders: orders.filter(o => o.status === "cancelled").length,
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === "open" || t.status === "in_progress").length,
        resolvedTickets: tickets.filter(t => t.status === "resolved" || t.status === "closed").length,
        totalChatSessions: chatSessions.length,
        activeChatSessions: chatSessions.filter(c => c.status === "active").length,
        totalBusinesses: businesses.length,
        totalMessages: chatMessages.length,
        avgResponseTime: "~2 মিনিট",
        userGrowth, orderTrend,
        ticketsByCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })),
        ordersByPackage: Object.entries(pkgMap).map(([name, value]) => ({ name, value })),
        dailyActivity,
        userRolesDistribution: Object.entries(roleMap).map(([role, count]) => ({ role, count })),
        revenueByMethod: Object.entries(methodMap).map(([method, amount]) => ({ method, amount })),
        totalPageViews: pageViews.length, todayPageViews, uniqueSessions,
        topPages, trafficByDevice, trafficByBrowser, trafficByOS, dailyTraffic, topReferrers,
      });
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-muted-foreground text-sm">ডেটা লোড করতে সমস্যা হয়েছে</div>;
  }

  const chartConfig = {
    users: { label: "ইউজার", color: "hsl(var(--primary))" },
    orders: { label: "অর্ডার", color: "hsl(var(--primary))" },
    revenue: { label: "রেভিনিউ", color: "hsl(var(--chart-2, 160 60% 45%))" },
    tickets: { label: "টিকেট", color: "hsl(var(--chart-3, 30 80% 55%))" },
    chats: { label: "চ্যাট", color: "hsl(var(--chart-4, 280 65% 60%))" },
    views: { label: "ভিউ", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-display text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            অ্যানালিটিক্স
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">ট্রাফিক, ইউজার ও বিজনেস ডেটা</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} className="gap-1.5 text-xs">
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">রিফ্রেশ</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="traffic" className="space-y-3 sm:space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-0.5 sm:gap-1 w-full">
          <TabsTrigger value="traffic" className="text-[10px] sm:text-xs flex-1 min-w-0">
            <Globe className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">ট্রাফিক</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-[10px] sm:text-xs flex-1 min-w-0">
            <Activity className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">ওভারভিউ</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-[10px] sm:text-xs flex-1 min-w-0">
            <Users className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">ইউজার</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="text-[10px] sm:text-xs flex-1 min-w-0">
            <DollarSign className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">রেভিনিউ</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="text-[10px] sm:text-xs flex-1 min-w-0">
            <Ticket className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">সাপোর্ট</span>
          </TabsTrigger>
        </TabsList>

        {/* ════════ TRAFFIC TAB ════════ */}
        <TabsContent value="traffic" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={Eye} label="মোট পেজ ভিউ" value={data.totalPageViews} delay={0} />
            <StatCard icon={MousePointerClick} label="আজকের ভিউ" value={data.todayPageViews} trend="up" subValue="আজ" delay={0.03} />
            <StatCard icon={Users} label="ইউনিক সেশন" value={data.uniqueSessions} delay={0.06} />
            <StatCard icon={Globe} label="রেফারার" value={data.topReferrers.length} delay={0.09} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Daily Traffic */}
            <ChartCard title="দৈনিক ট্রাফিক (গত ৭ দিন)" icon={TrendingUp} delay={0.1}>
              <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                <AreaChart data={data.dailyTraffic} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="day" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#trafficGrad)" strokeWidth={2} name="পেজ ভিউ" />
                </AreaChart>
              </ChartContainer>
            </ChartCard>

            {/* Device Breakdown */}
            <ChartCard title="ডিভাইস ব্রেকডাউন" icon={Smartphone} delay={0.15}>
              {data.trafficByDevice.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-3" style={{ minHeight: chartHeight }}>
                  <ChartContainer config={chartConfig} className="w-full sm:w-1/2" style={{ height: chartHeight }}>
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={data.trafficByDevice}
                        cx="50%" cy="50%"
                        innerRadius={pieInnerRadius} outerRadius={pieOuterRadius}
                        dataKey="count" nameKey="device"
                      >
                        {data.trafficByDevice.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 flex-wrap justify-center">
                    {data.trafficByDevice.map((d, i) => {
                      const DevIcon = DEVICE_ICONS[d.device] || Monitor;
                      const pct = data.totalPageViews > 0 ? ((d.count / data.totalPageViews) * 100).toFixed(0) : 0;
                      return (
                        <div key={d.device} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <DevIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground capitalize">{d.device}</span>
                          <span className="text-muted-foreground">({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: chartHeight }}>
                  ডেটা নেই
                </div>
              )}
            </ChartCard>
          </div>

          {/* Top Pages & Referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartCard title="জনপ্রিয় পেজসমূহ" icon={Eye} delay={0.2}>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {data.topPages.length > 0 ? data.topPages.map((p, i) => (
                  <div key={p.page} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                      <span className="text-xs text-foreground truncate">{p.page}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary shrink-0 ml-2">{p.views}</span>
                  </div>
                )) : (
                  <p className="text-center text-xs text-muted-foreground py-8">পেজ ভিউ ডেটা নেই</p>
                )}
              </div>
            </ChartCard>

            <ChartCard title="ট্রাফিক সোর্স (রেফারার)" icon={Globe} delay={0.25}>
              <div className="space-y-2">
                {data.topReferrers.length > 0 ? data.topReferrers.map((r, i) => {
                  const pct = data.totalPageViews > 0 ? ((r.count / data.totalPageViews) * 100) : 0;
                  return (
                    <div key={r.referrer} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground truncate max-w-[60%]">{r.referrer}</span>
                        <span className="text-muted-foreground shrink-0">{r.count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-xs text-muted-foreground py-8">রেফারার ডেটা নেই</p>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Browser & OS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ChartCard title="ব্রাউজার ব্রেকডাউন" icon={Globe} delay={0.3}>
              {data.trafficByBrowser.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                  <BarChart data={data.trafficByBrowser} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="browser" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} name="ভিজিট" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: chartHeight }}>ডেটা নেই</div>
              )}
            </ChartCard>

            <ChartCard title="অপারেটিং সিস্টেম" icon={Monitor} delay={0.35}>
              {data.trafficByOS.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                  <BarChart data={data.trafficByOS} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="os" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-4, 280 65% 60%))" radius={[4, 4, 0, 0]} name="ভিজিট" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: chartHeight }}>ডেটা নেই</div>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* ════════ OVERVIEW TAB ════════ */}
        <TabsContent value="overview" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={ShoppingBag} label="মোট অর্ডার" value={data.totalOrders} subValue={`${data.confirmedOrders} কনফার্মড`} trend="up" delay={0} />
            <StatCard icon={Building2} label="ব্যবসা" value={data.totalBusinesses} delay={0.03} />
            <StatCard icon={MessageCircle} label="চ্যাট" value={data.totalChatSessions} subValue={`${data.activeChatSessions} সক্রিয়`} delay={0.06} />
            <StatCard icon={Activity} label="মেসেজ" value={data.totalMessages} delay={0.09} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartCard title="সাপ্তাহিক অ্যাক্টিভিটি" icon={Activity} delay={0.1}>
              <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                <BarChart data={data.dailyActivity} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="day" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="অর্ডার" />
                  <Bar dataKey="tickets" fill="hsl(var(--chart-3, 30 80% 55%))" radius={[3, 3, 0, 0]} name="টিকেট" />
                  <Bar dataKey="chats" fill="hsl(var(--chart-4, 280 65% 60%))" radius={[3, 3, 0, 0]} name="চ্যাট" />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="প্যাকেজ ডিস্ট্রিবিউশন" icon={ShoppingBag} delay={0.15}>
              {data.ordersByPackage.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={data.ordersByPackage} cx="50%" cy="50%" outerRadius={pieOuterRadius} dataKey="value" nameKey="name"
                      label={isMobile ? false : ({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={!isMobile}
                    >
                      {data.ordersByPackage.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: chartHeight }}>ডেটা নেই</div>
              )}
            </ChartCard>
          </div>

          <ChartCard title="অর্ডার স্ট্যাটাস" icon={ShoppingBag} delay={0.2}>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-2 sm:p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{data.pendingOrders}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">পেন্ডিং</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-lg sm:text-2xl font-bold text-green-600">{data.confirmedOrders}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">কনফার্মড</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-lg sm:text-2xl font-bold text-destructive">{data.cancelledOrders}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">বাতিল</p>
              </div>
            </div>
          </ChartCard>
        </TabsContent>

        {/* ════════ USERS TAB ════════ */}
        <TabsContent value="users" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <StatCard icon={Users} label="মোট ইউজার" value={data.totalUsers} subValue={`এই মাসে +${data.newUsersThisMonth}`} trend="up" delay={0} />
            <StatCard icon={UserPlus} label="নতুন (এই মাস)" value={data.newUsersThisMonth} delay={0.03} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartCard title="ইউজার গ্রোথ (৬ মাস)" icon={UserPlus} delay={0.1}>
              <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                <AreaChart data={data.userGrowth} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#userGrad)" strokeWidth={2} name="ইউজার" />
                </AreaChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="রোল ডিস্ট্রিবিউশন" icon={Users} delay={0.15}>
              {data.userRolesDistribution.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={data.userRolesDistribution} cx="50%" cy="50%" innerRadius={pieInnerRadius} outerRadius={pieOuterRadius} dataKey="count" nameKey="role"
                      label={isMobile ? false : ({ role, percent }: any) => `${role} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={!isMobile}
                    >
                      {data.userRolesDistribution.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: chartHeight }}>ডেটা নেই</div>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* ════════ REVENUE TAB ════════ */}
        <TabsContent value="revenue" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <StatCard icon={DollarSign} label="মোট রেভিনিউ" value={`৳${data.totalRevenue.toLocaleString("bn-BD")}`} delay={0} />
            <StatCard icon={ShoppingBag} label="কনফার্মড" value={data.confirmedOrders} delay={0.03} />
            <StatCard icon={Clock} label="গড় রেসপন্স" value={data.avgResponseTime} delay={0.06} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartCard title="অর্ডার ও রেভিনিউ ট্রেন্ড" icon={TrendingUp} delay={0.1}>
              <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                <LineChart data={data.orderTrend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} name="অর্ডার" />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2, 160 60% 45%))" strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} name="রেভিনিউ (৳)" />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="পেমেন্ট মেথড" icon={DollarSign} delay={0.15}>
              {data.revenueByMethod.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                  <BarChart data={data.revenueByMethod} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis type="number" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                    <YAxis type="category" dataKey="method" tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" width={isMobile ? 55 : 80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="৳" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: chartHeight }}>কোনো কনফার্মড অর্ডার নেই</div>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* ════════ SUPPORT TAB ════════ */}
        <TabsContent value="support" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={Ticket} label="মোট টিকেট" value={data.totalTickets} subValue={`${data.openTickets} ওপেন`} delay={0} />
            <StatCard icon={Ticket} label="সমাধানকৃত" value={data.resolvedTickets} delay={0.03} />
            <StatCard icon={MessageCircle} label="সক্রিয় চ্যাট" value={data.activeChatSessions} delay={0.06} />
            <StatCard icon={Activity} label="মোট মেসেজ" value={data.totalMessages} delay={0.09} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartCard title="টিকেট ক্যাটেগরি" icon={Ticket} delay={0.1}>
              {data.ticketsByCategory.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
                  <BarChart data={data.ticketsByCategory} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="name" tick={{ fontSize: isMobile ? 7 : 10 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: axisFontSize }} className="fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--chart-3, 30 80% 55%))" radius={[4, 4, 0, 0]} name="টিকেট" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: chartHeight }}>কোনো টিকেট নেই</div>
              )}
            </ChartCard>

            <ChartCard title="সাপোর্ট সামারি" icon={MessageCircle} delay={0.15}>
              <div className="grid grid-cols-2 gap-2 sm:gap-3" style={{ minHeight: chartHeight }}>
                <div className="text-center p-2.5 sm:p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center">
                  <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1.5" />
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{data.openTickets}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">ওপেন টিকেট</p>
                </div>
                <div className="text-center p-2.5 sm:p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center">
                  <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mb-1.5" />
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{data.resolvedTickets}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">সমাধানকৃত</p>
                </div>
                <div className="text-center p-2.5 sm:p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mb-1.5" />
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{data.activeChatSessions}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">সক্রিয় চ্যাট</p>
                </div>
                <div className="text-center p-2.5 sm:p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex flex-col items-center justify-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mb-1.5" />
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{data.totalMessages}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">মোট মেসেজ</p>
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
