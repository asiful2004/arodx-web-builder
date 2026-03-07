import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, ShieldCheck, Package, Search, RefreshCw,
  CheckCircle2, Clock, XCircle, IndianRupee,
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

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check admin role
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
      return;
    }
    if (user) {
      checkAdmin();
    }
  }, [user, authLoading]);

  const checkAdmin = async () => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: user!.id,
      _role: "admin",
    });
    if (!data) {
      navigate("/dashboard");
      toast({ title: "অ্যাক্সেস নেই", description: "আপনি অ্যাডমিন নন।", variant: "destructive" });
      return;
    }
    setIsAdmin(true);
    fetchOrders();
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "অর্ডার লোড ব্যর্থ", variant: "destructive" });
    } else {
      setOrders(data || []);
    }
    setLoadingOrders(false);
  };

  // Filter orders
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

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            ড্যাশবোর্ড
          </Link>
          <span className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            অ্যাডমিন প্যানেল
          </span>
          <Button variant="ghost" size="icon" onClick={fetchOrders}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: "মোট অর্ডার", value: stats.total, color: "text-foreground" },
            { label: "পেন্ডিং", value: stats.pending, color: "text-yellow-400" },
            { label: "কনফার্মড", value: stats.confirmed, color: "text-green-400" },
            { label: "বাতিল", value: stats.cancelled, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xl text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden"
        >
          {loadingOrders ? (
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
                          <span className="text-xs text-muted-foreground block">{order.billing_period === "yearly" ? "বার্ষিক" : "মাসিক"}</span>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">৳{order.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {order.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{order.transaction_id}</TableCell>
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
    </div>
  );
};

export default AdminDashboard;
