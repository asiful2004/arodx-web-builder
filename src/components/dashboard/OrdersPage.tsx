import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, Loader2, Package,
  ChevronDown, Globe, Phone, MapPin, Building2, CreditCard, Hash,
  CalendarDays, Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  package_name: string;
  amount: string;
  status: string;
  payment_method: string;
  billing_period: string;
  transaction_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  created_at: string;
}

interface Business {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "পেন্ডিং", icon: Clock, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  confirmed: { label: "কনফার্মড", icon: CheckCircle, className: "bg-green-500/10 text-green-600 border-green-500/20" },
  cancelled: { label: "বাতিল", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const packageFeatures: Record<string, string[]> = {
  Starter: [
    "Website + ১টি Landing Page (Hosting সহ)",
    "Basic Maintenance & Support",
    "মাসে ২টি Video Edit",
    "Basic SEO Setup",
    "১টি Social Media Management",
    "Basic Brand Guidelines",
  ],
  Business: [
    "Website + ৫টি Landing Page (Hosting সহ)",
    "Full Maintenance & Technical Support",
    "মাসে ৫টি Video Edit",
    "Advanced SEO + Ad Campaign",
    "৩টি Social Media Management",
    "Brand Strategy & Logo Optimization",
    "Monthly Graphics Package",
    "Basic Business Automation",
  ],
  Enterprise: [
    "Website + ১০টি Landing Page (Hosting সহ)",
    "Free .com Domain (১ বছরের জন্য)",
    "Priority Technical Support & Maintenance",
    "Unlimited Video Editing",
    "Complete Digital Marketing (SEO, Ads, Organic)",
    "All Social Media Management",
    "Complete Brand Identity & Strategy",
    "Premium Graphics & UI/UX Design",
    "Advanced Business Automation",
    "Dedicated Account Manager",
  ],
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [ordersRes, businessRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);

      if (businessRes.data) {
        const map: Record<string, Business> = {};
        businessRes.data.forEach((b: any) => {
          if (b.order_id) map[b.order_id] = b;
        });
        setBusinesses(map);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("user-orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">আমার অর্ডার</h1>
        <p className="text-sm text-muted-foreground">আপনার সকল অর্ডারের তালিকা ও বিস্তারিত</p>
      </div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
        >
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            আপনি যখন কোনো প্যাকেজ কিনবেন, সেটি এখানে দেখা যাবে
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === order.id;
            const business = businesses[order.id];
            const features = packageFeatures[order.package_name] || [];
            const date = new Date(order.created_at).toLocaleDateString("bn-BD", {
              year: "numeric", month: "long", day: "numeric",
            });
            const time = new Date(order.created_at).toLocaleTimeString("bn-BD", {
              hour: "2-digit", minute: "2-digit",
            });

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden"
              >
                {/* Header - always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{order.package_name} প্যাকেজ</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{date} • {time}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full capitalize">
                            {order.payment_method}
                          </span>
                          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                            {order.billing_period === "monthly" ? "মাসিক" : "বার্ষিক"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className={`${config.className} border gap-1 text-xs`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                      <span className="text-sm font-bold text-foreground">{order.amount}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </button>

                {/* Expandable details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                        {/* Order Details */}
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            অর্ডার তথ্য
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoRow icon={Hash} label="ট্রানজেকশন ID" value={order.transaction_id} />
                            <InfoRow icon={CreditCard} label="পেমেন্ট মেথড" value={order.payment_method} />
                            <InfoRow icon={CalendarDays} label="বিলিং" value={order.billing_period === "monthly" ? "মাসিক" : "বার্ষিক"} />
                            <InfoRow icon={Layers} label="প্যাকেজ" value={order.package_name} />
                          </div>
                        </div>

                        {/* Business Details */}
                        {business && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                              ব্যবসার তথ্য
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <InfoRow icon={Building2} label="ব্যবসার নাম" value={business.business_name} />
                              <InfoRow icon={Layers} label="ক্যাটাগরি" value={business.business_category} />
                              <InfoRow icon={Phone} label="ফোন" value={business.business_phone} />
                              {business.business_address && (
                                <InfoRow icon={MapPin} label="ঠিকানা" value={business.business_address} />
                              )}
                              <InfoRow
                                icon={Globe}
                                label="ডোমেইন"
                                value={business.domain_type === "own" ? (business.domain_name || "নিজের ডোমেইন") : "প্যাকেজ ডোমেইন"}
                              />
                            </div>
                          </div>
                        )}

                        {/* Package Features */}
                        {features.length > 0 && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                              প্যাকেজে যা যা আছে
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {features.map((f, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-foreground">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                  <span className="text-xs">{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/30 border border-border/30">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xs font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
