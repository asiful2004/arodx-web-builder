import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, RefreshCw, Package, CheckCircle2, Clock, XCircle,
  ChevronDown, Building2, CalendarDays, Globe, Phone, MapPin,
  FileText, Receipt, Download, AlertTriangle, Hash, CreditCard,
  Layers, Undo2, CheckCheck, X,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  package_name: string;
  amount: string;
  billing_period: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  renewal_date: string | null;
  is_active: boolean;
  user_id: string | null;
  refund_status: string | null;
  refund_reason: string | null;
  refund_requested_at: string | null;
  refund_resolved_at: string | null;
}

interface Business {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
  created_at: string;
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

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "পেন্ডিং", variant: "secondary", icon: Clock },
  confirmed: { label: "কনফার্মড", variant: "default", icon: CheckCircle2 },
  cancelled: { label: "বাতিল", variant: "destructive", icon: XCircle },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
}

function getDaysUntilRenewal(renewalDate: string | null): number | null {
  if (!renewalDate) return null;
  return Math.ceil((new Date(renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceDialogOrder, setInvoiceDialogOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [ordersRes, bizRes, invRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("businesses").select("*"),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (bizRes.data) {
      const map: Record<string, Business> = {};
      (bizRes.data as any[]).forEach((b) => { if (b.order_id) map[b.order_id] = b; });
      setBusinesses(map);
    }
    if (invRes.data) setInvoices(invRes.data as Invoice[]);
    setLoading(false);
  };

  useEffect(() => {
    let result = orders;
    if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.transaction_id.toLowerCase().includes(q) ||
          o.package_name.toLowerCase().includes(q) ||
          (businesses[o.id]?.business_name || "").toLowerCase().includes(q)
      );
    }
    setFilteredOrders(result);
  }, [orders, statusFilter, searchQuery, businesses]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      toast({ title: "আপডেট ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      // Refetch to get trigger-updated fields (renewal_date, is_active, invoice)
      await fetchAll();
      toast({ title: `অর্ডার ${statusConfig[newStatus]?.label || newStatus} করা হয়েছে` });
    }
    setUpdatingId(null);
  };

  const handleDownloadInvoice = (inv: Invoice, order: Order) => {
    const business = businesses[inv.order_id];
    generateInvoicePDF({
      invoiceNumber: inv.invoice_number,
      date: inv.created_at,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone || business?.business_phone || "",
      businessName: business?.business_name || "",
      packageName: order.package_name,
      billingPeriod: order.billing_period,
      amount: inv.amount,
      paymentMethod: inv.payment_method || order.payment_method,
      transactionId: inv.transaction_id || order.transaction_id,
      status: inv.status,
    });
  };

  const handleRefund = async (orderId: string, action: "approved" | "rejected") => {
    setUpdatingId(orderId);
    const { error } = await supabase.from("orders").update({
      refund_status: action,
      refund_resolved_at: new Date().toISOString(),
    }).eq("id", orderId);
    if (error) {
      toast({ title: "আপডেট ব্যর্থ", variant: "destructive" });
    } else {
      await fetchAll();
      toast({ title: action === "approved" ? "রিফান্ড অ্যাপ্রুভ করা হয়েছে" : "রিফান্ড রিজেক্ট করা হয়েছে" });
    }
    setUpdatingId(null);
  };

  // Stats
  const activeCount = orders.filter((o) => o.status === "confirmed" && o.is_active).length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const refundRequests = orders.filter((o) => o.refund_status === "requested").length;
  const urgentRenewals = orders.filter((o) => {
    const d = getDaysUntilRenewal(o.renewal_date);
    return o.is_active && d !== null && d <= 7;
  }).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">সকল অর্ডার, সাবস্ক্রিপশন ও রিনিউয়াল ম্যানেজ করুন</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5" />রিফ্রেশ
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="মোট অর্ডার" value={orders.length} icon={Package} />
        <StatCard label="অ্যাক্টিভ" value={activeCount} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="পেন্ডিং" value={pendingCount} icon={Clock} color="text-yellow-500" />
        <StatCard label="রিনিউ আর্জেন্ট" value={urgentRenewals} icon={AlertTriangle} color="text-destructive" />
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="নাম, ফোন, ট্রানজেকশন, ব্যবসার নাম দিয়ে খুঁজুন..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50 border-border rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-border rounded-xl"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব</SelectItem>
            <SelectItem value="pending">পেন্ডিং</SelectItem>
            <SelectItem value="confirmed">কনফার্মড</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Orders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>কোনো অর্ডার পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((order) => {
              const sc = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              const biz = businesses[order.id];
              const daysLeft = getDaysUntilRenewal(order.renewal_date);
              const isUrgent = daysLeft !== null && daysLeft <= 7;
              const isOverdue = daysLeft !== null && daysLeft <= 0;
              const isExpanded = expandedId === order.id;
              const orderInvoices = invoices.filter((inv) => inv.order_id === order.id);

              return (
                <div key={order.id}>
                  {/* Main Row */}
                  <div className="p-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {/* Left: Customer & Business */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          order.is_active ? "bg-green-500/10" : "bg-secondary"
                        }`}>
                          <Package className={`w-5 h-5 ${order.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                            <Badge variant={sc.variant} className="gap-1 text-[10px]">
                              <StatusIcon className="w-3 h-3" />{sc.label}
                            </Badge>
                            {isOverdue && (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20 border text-[10px] gap-0.5">
                                <AlertTriangle className="w-3 h-3" />মেয়াদ শেষ
                              </Badge>
                            )}
                            {isUrgent && !isOverdue && (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 border text-[10px] gap-0.5">
                                <AlertTriangle className="w-3 h-3" />{daysLeft} দিন বাকি
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            <span>{order.package_name} • {order.billing_period === "monthly" ? "মাসিক" : "বার্ষিক"}</span>
                            {biz && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />{biz.business_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount, Renewal, Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-foreground">{order.amount}</p>
                          {order.renewal_date && (
                            <p className={`text-[10px] ${isOverdue ? "text-destructive" : isUrgent ? "text-yellow-600" : "text-muted-foreground"}`}>
                              রিনিউ: {formatDate(order.renewal_date)}
                            </p>
                          )}
                        </div>

                        <Select value={order.status} onValueChange={(val) => updateStatus(order.id, val)} disabled={updatingId === order.id}>
                          <SelectTrigger className="w-[110px] h-8 text-xs bg-secondary/50 border-border rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">পেন্ডিং</SelectItem>
                            <SelectItem value="confirmed">কনফার্মড</SelectItem>
                            <SelectItem value="cancelled">বাতিল</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-4 bg-secondary/10 border-t border-border/50">
                          {/* Grid: Order Info + Business Info */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                            {/* Order Info */}
                            <div className="space-y-3">
                              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">অর্ডার তথ্য</h3>
                              <div className="space-y-2">
                                <InfoRow icon={CalendarDays} label="অর্ডার তারিখ" value={formatDate(order.created_at)} />
                                <InfoRow icon={Hash} label="ট্রানজেকশন ID" value={order.transaction_id} />
                                <InfoRow icon={CreditCard} label="পেমেন্ট মেথড" value={order.payment_method} />
                                <InfoRow icon={Layers} label="বিলিং" value={order.billing_period === "monthly" ? "মাসিক" : "বার্ষিক"} />
                                <InfoRow icon={Phone} label="ফোন" value={order.customer_phone} />
                                {order.customer_email && <InfoRow icon={Globe} label="ইমেইল" value={order.customer_email} />}
                              </div>
                            </div>

                            {/* Business Info */}
                            <div className="space-y-3">
                              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ব্যবসার তথ্য</h3>
                              {biz ? (
                                <div className="space-y-2">
                                  <InfoRow icon={Building2} label="ব্যবসার নাম" value={biz.business_name} />
                                  <InfoRow icon={Layers} label="ক্যাটাগরি" value={biz.business_category} />
                                  <InfoRow icon={Phone} label="ব্যবসার ফোন" value={biz.business_phone} />
                                  {biz.business_address && <InfoRow icon={MapPin} label="ঠিকানা" value={biz.business_address} />}
                                  <InfoRow icon={Globe} label="ডোমেইন"
                                    value={biz.domain_type === "own" ? (biz.domain_name || "নিজের ডোমেইন") : "প্যাকেজ ডোমেইন"} />
                                  <InfoRow icon={CalendarDays} label="রেজিস্ট্রেশন" value={formatDate(biz.created_at)} />
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground py-4">ব্যবসার তথ্য এখনো যুক্ত হয়নি</p>
                              )}
                            </div>
                          </div>

                          {/* Subscription & Renewal Info */}
                          {order.status === "confirmed" && (
                            <div className="space-y-3">
                              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">সাবস্ক্রিপশন স্ট্যাটাস</h3>
                              <div className={`p-4 rounded-xl border ${
                                isOverdue ? "bg-destructive/5 border-destructive/20"
                                  : isUrgent ? "bg-yellow-500/5 border-yellow-500/20"
                                  : "bg-green-500/5 border-green-500/20"
                              }`}>
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <div className="flex items-center gap-3">
                                    {isOverdue ? (
                                      <AlertTriangle className="w-5 h-5 text-destructive" />
                                    ) : isUrgent ? (
                                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    ) : (
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    )}
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {isOverdue ? "মেয়াদ শেষ হয়ে গেছে" : isUrgent ? "শীঘ্রই রিনিউ প্রয়োজন" : "অ্যাক্টিভ সাবস্ক্রিপশন"}
                                      </p>
                                      {order.renewal_date && (
                                        <p className="text-xs text-muted-foreground">
                                          পরবর্তী রিনিউ: {formatDate(order.renewal_date)}
                                          {daysLeft !== null && ` (${daysLeft > 0 ? daysLeft + " দিন বাকি" : "মেয়াদ শেষ"})`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className={`${order.is_active
                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"
                                  } border`}>
                                    {order.is_active ? "অ্যাক্টিভ" : "ইনঅ্যাক্টিভ"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Invoice Section */}
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setInvoiceDialogOrder(order)}
                              className="gap-1.5 text-xs rounded-xl">
                              <Receipt className="w-3.5 h-3.5" />
                              ইনভয়েস ({orderInvoices.length})
                            </Button>
                            {orderInvoices[0] && (
                              <Button variant="outline" size="sm"
                                onClick={() => handleDownloadInvoice(orderInvoices[0], order)}
                                className="gap-1.5 text-xs rounded-xl">
                                <Download className="w-3.5 h-3.5" />
                                সর্বশেষ PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Invoice History Dialog */}
      <Dialog open={!!invoiceDialogOrder} onOpenChange={() => setInvoiceDialogOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />ইনভয়েস হিস্ট্রি
            </DialogTitle>
            <DialogDescription>{invoiceDialogOrder?.customer_name} — {invoiceDialogOrder?.package_name} প্যাকেজ</DialogDescription>
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
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">{inv.amount}</p>
                      <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 border">
                        {inv.status === "paid" ? "পেইড" : inv.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => invoiceDialogOrder && handleDownloadInvoice(inv, invoiceDialogOrder)} title="PDF ডাউনলোড">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
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
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color || "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/* ─── Info Row ─── */
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
