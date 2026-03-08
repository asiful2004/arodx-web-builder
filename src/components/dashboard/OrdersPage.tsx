import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, Loader2, Package,
  ChevronDown, Globe, Phone, MapPin, Building2, CreditCard, Hash,
  CalendarDays, Layers, FileText, RefreshCw, AlertTriangle,
  ArrowRight, Receipt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

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
  renewal_date: string | null;
  is_active: boolean;
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

interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  amount: string;
  period_start: string;
  period_end: string;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "পেন্ডিং", icon: Clock, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  confirmed: { label: "অ্যাক্টিভ", icon: CheckCircle, className: "bg-green-500/10 text-green-600 border-green-500/20" },
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

function getDaysUntilRenewal(renewalDate: string | null): number | null {
  if (!renewalDate) return null;
  const diff = new Date(renewalDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceDialogOrder, setInvoiceDialogOrder] = useState<Order | null>(null);
  const [renewDialogOrder, setRenewDialogOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [ordersRes, businessRes, invoicesRes] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("businesses").select("*").eq("user_id", user.id),
        supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (businessRes.data) {
        const map: Record<string, Business> = {};
        businessRes.data.forEach((b: any) => { if (b.order_id) map[b.order_id] = b; });
        setBusinesses(map);
      }
      if (invoicesRes.data) setInvoices(invoicesRes.data as Invoice[]);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("user-orders")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => { setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))); })
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

  const activeOrders = orders.filter((o) => o.status === "confirmed" && o.is_active);
  const otherOrders = orders.filter((o) => !(o.status === "confirmed" && o.is_active));

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">আমার সাবস্ক্রিপশন ও অর্ডার</h1>
        <p className="text-sm text-muted-foreground">আপনার প্যাকেজ, বিলিং এবং ইনভয়েস ম্যানেজ করুন</p>
      </div>

      {orders.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই</p>
          <p className="text-xs text-muted-foreground/70 mt-1">আপনি যখন কোনো প্যাকেজ কিনবেন, সেটি এখানে দেখা যাবে</p>
        </motion.div>
      ) : (
        <>
          {/* Active Subscriptions */}
          {activeOrders.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                অ্যাক্টিভ সাবস্ক্রিপশন
              </h2>
              {activeOrders.map((order, i) => (
                <ActiveSubscriptionCard
                  key={order.id}
                  order={order}
                  business={businesses[order.id]}
                  invoices={invoices.filter((inv) => inv.order_id === order.id)}
                  index={i}
                  onViewInvoices={() => setInvoiceDialogOrder(order)}
                  onRenew={() => setRenewDialogOrder(order)}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                />
              ))}
            </section>
          )}

          {/* Other Orders */}
          {otherOrders.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                অন্যান্য অর্ডার
              </h2>
              {otherOrders.map((order, i) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{order.package_name} প্যাকেজ</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{order.amount}</span>
                        <Badge className={`${config.className} border gap-1 text-xs`}>
                          <StatusIcon className="w-3 h-3" />{config.label}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </section>
          )}
        </>
      )}

      {/* Invoice History Dialog */}
      <Dialog open={!!invoiceDialogOrder} onOpenChange={() => setInvoiceDialogOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              ইনভয়েস হিস্ট্রি
            </DialogTitle>
            <DialogDescription>
              {invoiceDialogOrder?.package_name} প্যাকেজের সকল ইনভয়েস
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {invoices.filter((inv) => inv.order_id === invoiceDialogOrder?.id).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">কোনো ইনভয়েস নেই</p>
            ) : (
              invoices.filter((inv) => inv.order_id === invoiceDialogOrder?.id).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{inv.invoice_number}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(inv.period_start)} — {formatDate(inv.period_end)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{inv.amount}</p>
                    <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 border">
                      {inv.status === "paid" ? "পেইড" : inv.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOrder(null)} className="rounded-xl">বন্ধ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Payment Dialog */}
      <Dialog open={!!renewDialogOrder} onOpenChange={() => setRenewDialogOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              প্যাকেজ রিনিউ করুন
            </DialogTitle>
            <DialogDescription>
              {renewDialogOrder?.package_name} প্যাকেজ রিনিউ করতে পেমেন্ট করুন
            </DialogDescription>
          </DialogHeader>
          {renewDialogOrder && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">প্যাকেজ</span>
                  <span className="font-semibold text-foreground">{renewDialogOrder.package_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">বিলিং পিরিয়ড</span>
                  <span className="font-semibold text-foreground">{renewDialogOrder.billing_period === "monthly" ? "মাসিক" : "বার্ষিক"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">রিনিউয়াল মূল্য</span>
                  <span className="font-bold text-foreground text-base">{renewDialogOrder.amount}</span>
                </div>
                {renewDialogOrder.renewal_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">রিনিউয়াল ডেডলাইন</span>
                    <span className="font-semibold text-foreground">{formatDate(renewDialogOrder.renewal_date)}</span>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">
                  রিনিউ করতে <strong>বিকাশ/নগদ</strong> এ পেমেন্ট পাঠান এবং ট্রানজেকশন ID সহ আমাদের সাপোর্ট এ জানান। আমরা দ্রুত আপনার প্যাকেজ রিনিউ করে দেবো।
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenewDialogOrder(null)} className="rounded-xl">বন্ধ করুন</Button>
            <Button
              onClick={() => {
                window.open("https://wa.me/8801926298571?text=" + encodeURIComponent(
                  `আমি ${renewDialogOrder?.package_name} প্যাকেজ রিনিউ করতে চাই। অর্ডার ID: ${renewDialogOrder?.id}`
                ), "_blank");
              }}
              className="gap-1.5 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              সাপোর্টে যোগাযোগ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Active Subscription Card ─── */
function ActiveSubscriptionCard({
  order, business, invoices, index, onViewInvoices, onRenew, expanded, onToggle,
}: {
  order: Order;
  business?: Business;
  invoices: Invoice[];
  index: number;
  onViewInvoices: () => void;
  onRenew: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const daysLeft = getDaysUntilRenewal(order.renewal_date);
  const isUrgent = daysLeft !== null && daysLeft <= 7;
  const isOverdue = daysLeft !== null && daysLeft <= 0;
  const features = packageFeatures[order.package_name] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border bg-card/60 backdrop-blur-xl overflow-hidden ${
        isOverdue ? "border-destructive/40" : isUrgent ? "border-yellow-500/40" : "border-border"
      }`}
    >
      {/* Main card */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground">{order.package_name} প্যাকেজ</p>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-0.5" />অ্যাক্টিভ
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.billing_period === "monthly" ? "মাসিক" : "বার্ষিক"} সাবস্ক্রিপশন • {order.amount}
              </p>
              {business && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />{business.business_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Renewal Banner */}
        {order.renewal_date && (
          <div className={`mt-4 p-3 rounded-xl flex items-center justify-between ${
            isOverdue
              ? "bg-destructive/10 border border-destructive/20"
              : isUrgent
              ? "bg-yellow-500/10 border border-yellow-500/20"
              : "bg-secondary/50 border border-border/30"
          }`}>
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              ) : isUrgent ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
              ) : (
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-xs font-medium text-foreground">
                  {isOverdue
                    ? "রিনিউয়াল মেয়াদ শেষ!"
                    : isUrgent
                    ? `${daysLeft} দিনের মধ্যে রিনিউ করুন`
                    : `পরবর্তী রিনিউয়াল: ${formatDate(order.renewal_date)}`}
                </p>
                {!isOverdue && daysLeft !== null && !isUrgent && (
                  <p className="text-[10px] text-muted-foreground">{daysLeft} দিন বাকি</p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={onRenew}
              className={`gap-1 text-xs rounded-xl ${
                isOverdue || isUrgent
                  ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              রিনিউ করুন
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onViewInvoices} className="gap-1.5 text-xs rounded-xl">
            <Receipt className="w-3.5 h-3.5" />
            ইনভয়েস ({invoices.length})
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} className="gap-1.5 text-xs text-muted-foreground rounded-xl ml-auto">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            বিস্তারিত
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
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
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">অর্ডার তথ্য</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={Hash} label="ট্রানজেকশন ID" value={order.transaction_id} />
                  <InfoRow icon={CreditCard} label="পেমেন্ট মেথড" value={order.payment_method} />
                  <InfoRow icon={CalendarDays} label="অর্ডার তারিখ" value={formatDate(order.created_at)} />
                  <InfoRow icon={Layers} label="প্যাকেজ" value={order.package_name} />
                </div>
              </div>

              {/* Business Details */}
              {business && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">ব্যবসার তথ্য</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={Building2} label="ব্যবসার নাম" value={business.business_name} />
                    <InfoRow icon={Layers} label="ক্যাটাগরি" value={business.business_category} />
                    <InfoRow icon={Phone} label="ফোন" value={business.business_phone} />
                    {business.business_address && <InfoRow icon={MapPin} label="ঠিকানা" value={business.business_address} />}
                    <InfoRow icon={Globe} label="ডোমেইন" value={business.domain_type === "own" ? (business.domain_name || "নিজের ডোমেইন") : "প্যাকেজ ডোমেইন"} />
                  </div>
                </div>
              )}

              {/* Package Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">প্যাকেজে যা যা আছে</h3>
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
