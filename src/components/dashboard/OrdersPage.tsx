import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Clock, CheckCircle, XCircle, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  package_name: string;
  amount: string;
  status: string;
  payment_method: string;
  billing_period: string;
  transaction_id: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "পেন্ডিং", icon: Clock, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  confirmed: { label: "কনফার্মড", icon: CheckCircle, className: "bg-green-500/10 text-green-600 border-green-500/20" },
  cancelled: { label: "বাতিল", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, package_name, amount, status, payment_method, billing_period, transaction_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setOrders(data);
      setLoading(false);
    };

    fetchOrders();

    // Realtime subscription for status updates
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
        <p className="text-sm text-muted-foreground">আপনার সকল অর্ডারের তালিকা</p>
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
            const date = new Date(order.created_at).toLocaleDateString("bn-BD", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm">{order.package_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                          {order.payment_method}
                        </span>
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                          {order.billing_period === "monthly" ? "মাসিক" : "বার্ষিক"}
                        </span>
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                          TxID: {order.transaction_id}
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
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
