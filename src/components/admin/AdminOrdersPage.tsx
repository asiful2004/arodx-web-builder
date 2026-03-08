import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search, RefreshCw, Package, CheckCircle2, Clock, XCircle,
} from "lucide-react";

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
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "পেন্ডিং", variant: "secondary", icon: Clock },
  confirmed: { label: "কনফার্মড", variant: "default", icon: CheckCircle2 },
  cancelled: { label: "বাতিল", variant: "destructive", icon: XCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "অর্ডার লোড ব্যর্থ", variant: "destructive" });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.transaction_id.toLowerCase().includes(q) ||
          o.package_name.toLowerCase().includes(q)
      );
    }
    setFilteredOrders(result);
  }, [orders, statusFilter, searchQuery]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({ title: "আপডেট ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast({ title: `অর্ডার ${statusConfig[newStatus]?.label || newStatus} করা হয়েছে` });
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">সকল অর্ডার দেখুন ও ম্যানেজ করুন</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5" />
          রিফ্রেশ
        </Button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="নাম, ফোন, ট্রানজেকশন আইডি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-border rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-border rounded-xl">
            <SelectValue placeholder="স্ট্যাটাস" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব</SelectItem>
            <SelectItem value="pending">পেন্ডিং</SelectItem>
            <SelectItem value="confirmed">কনফার্মড</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden"
      >
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">তারিখ</TableHead>
                  <TableHead className="text-muted-foreground">কাস্টমার</TableHead>
                  <TableHead className="text-muted-foreground">প্যাকেজ</TableHead>
                  <TableHead className="text-muted-foreground">পরিমাণ</TableHead>
                  <TableHead className="text-muted-foreground">পেমেন্ট</TableHead>
                  <TableHead className="text-muted-foreground">ট্রানজেকশন</TableHead>
                  <TableHead className="text-muted-foreground">স্ট্যাটাস</TableHead>
                  <TableHead className="text-muted-foreground">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const sc = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <TableRow key={order.id} className="border-border">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("bn-BD", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{order.package_name}</span>
                        <span className="text-xs text-muted-foreground block">
                          {order.billing_period === "yearly" ? "বার্ষিক" : "মাসিক"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{order.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {order.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {order.transaction_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(val) => updateStatus(order.id, val)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary/50 border-border rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">পেন্ডিং</SelectItem>
                            <SelectItem value="confirmed">কনফার্মড</SelectItem>
                            <SelectItem value="cancelled">বাতিল</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
