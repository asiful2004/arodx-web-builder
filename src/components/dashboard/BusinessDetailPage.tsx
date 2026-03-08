import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Building2, Layers, Phone, MapPin, Globe,
  Package, CreditCard, CalendarClock, Hash, CheckCircle2,
  AlertTriangle, XCircle, Clock, FileText, Receipt, Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface OrderData {
  id: string;
  package_name: string;
  amount: string;
  billing_period: string;
  renewal_date: string | null;
  is_active: boolean;
  status: string;
  refund_status: string | null;
  payment_method: string;
  transaction_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  created_at: string;
}

interface BusinessData {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
  created_at: string;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  amount: string;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

const getStatusInfo = (order: OrderData) => {
  if (order.status === "confirmed" && order.is_active) {
    if (order.renewal_date) {
      const daysLeft = Math.ceil(
        (new Date(order.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= 0)
        return { label: "মেয়াদ শেষ", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
      if (daysLeft <= 7)
        return { label: `${daysLeft} দিন বাকি`, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    }
    return { label: "সক্রিয়", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" };
  }
  if (order.refund_status === "approved")
    return { label: "রিফান্ডেড", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
  if (order.refund_status === "pending")
    return { label: "রিফান্ড পেন্ডিং", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (!order.is_active || order.status === "cancelled")
    return { label: "নিষ্ক্রিয়", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" };
  return { label: "পেন্ডিং", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-all">{value}</p>
    </div>
  </div>
);

export default function BusinessDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<DashboardContext>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const fetchAll = async () => {
      setLoading(true);
      const [orderRes, bizRes, invRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("businesses")
          .select("*")
          .eq("order_id", orderId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("invoices")
          .select("id, invoice_number, amount, status, period_start, period_end, created_at")
          .eq("order_id", orderId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setOrder(orderRes.data as OrderData | null);
      setBusiness(bizRes.data as BusinessData | null);
      setInvoices((invRes.data as InvoiceData[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, [orderId, user.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </Button>
        <div className="text-center py-20 text-muted-foreground">
          <p>অর্ডার পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order);
  const orderDate = new Date(order.created_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });
  const expiryDate = order.renewal_date
    ? new Date(order.renewal_date).toLocaleDateString("bn-BD", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold font-display text-foreground truncate">
            {business?.business_name || order.package_name}
          </h1>
          <p className="text-xs text-muted-foreground">অর্ডার: {orderDate}</p>
        </div>
        <Badge variant="outline" className={`${statusInfo.bg} ${statusInfo.color} border-0 shrink-0`}>
          <statusInfo.icon className="w-3 h-3 mr-1" />
          {statusInfo.label}
        </Badge>
        {order.status === "confirmed" && order.is_active && (
          <Button
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => navigate(`/dashboard/business/${orderId}/config`)}
          >
            <Settings2 className="w-4 h-4" />
            কনফিগার করুন
          </Button>
        )}
      </div>

      {/* Business Info */}
      {business && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-primary" />
            ব্যবসার তথ্য
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow icon={Building2} label="ব্যবসার নাম" value={business.business_name} />
            <InfoRow icon={Layers} label="ক্যাটাগরি" value={business.business_category} />
            <InfoRow icon={Phone} label="ফোন" value={business.business_phone} />
            {business.business_address && (
              <InfoRow icon={MapPin} label="ঠিকানা" value={business.business_address} />
            )}
            <InfoRow
              icon={Globe}
              label="ডোমেইন"
              value={business.domain_name || (business.domain_type === "own" ? "নিজস্ব ডোমেইন" : "প্যাকেজ ডোমেইন")}
            />
          </div>
        </motion.div>
      )}

      {/* Package Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-primary" />
          প্যাকেজ ও পেমেন্ট তথ্য
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <InfoRow icon={Package} label="প্যাকেজ" value={order.package_name} />
          <InfoRow icon={CreditCard} label="মূল্য" value={`${order.amount}/${order.billing_period === "yearly" ? "বছর" : "মাস"}`} />
          <InfoRow icon={CalendarClock} label="মেয়াদ শেষ" value={expiryDate} />
          <InfoRow icon={CreditCard} label="পেমেন্ট মেথড" value={order.payment_method} />
          <InfoRow icon={Hash} label="ট্রানজেকশন আইডি" value={order.transaction_id} />
          <InfoRow icon={Hash} label="অর্ডার আইডি" value={order.id.slice(0, 12) + "..."} />
        </div>
      </motion.div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-primary" />
            ইনভয়েস
          </h2>
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{inv.amount}</p>
                  <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-0">
                    {inv.status === "paid" ? "পরিশোধিত" : inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
