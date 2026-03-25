import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ScrollText, Search, Filter, RefreshCw, User, Clock, Globe,
  ChevronDown, ChevronUp, Trash2, Activity, Shield, Settings,
  ShoppingBag, Ticket, Building2, Users, MessageCircle, FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  action_type: string;
  description: string | null;
  metadata: Record<string, any>;
  page_path: string | null;
  created_at: string;
}

const ACTION_TYPE_CONFIG: Record<string, { icon: any; color: string; label_bn: string; label_en: string }> = {
  auth: { icon: Shield, color: "text-blue-500 bg-blue-500/10", label_bn: "অথেন্টিকেশন", label_en: "Authentication" },
  profile: { icon: User, color: "text-violet-500 bg-violet-500/10", label_bn: "প্রোফাইল", label_en: "Profile" },
  settings: { icon: Settings, color: "text-gray-500 bg-gray-500/10", label_bn: "সেটিংস", label_en: "Settings" },
  order: { icon: ShoppingBag, color: "text-green-500 bg-green-500/10", label_bn: "অর্ডার", label_en: "Order" },
  business: { icon: Building2, color: "text-orange-500 bg-orange-500/10", label_bn: "ব্যবসা", label_en: "Business" },
  ticket: { icon: Ticket, color: "text-yellow-500 bg-yellow-500/10", label_bn: "টিকেট", label_en: "Ticket" },
  admin: { icon: Shield, color: "text-red-500 bg-red-500/10", label_bn: "অ্যাডমিন", label_en: "Admin" },
  staff: { icon: Users, color: "text-indigo-500 bg-indigo-500/10", label_bn: "স্টাফ", label_en: "Staff" },
  navigation: { icon: Globe, color: "text-cyan-500 bg-cyan-500/10", label_bn: "নেভিগেশন", label_en: "Navigation" },
  general: { icon: Activity, color: "text-muted-foreground bg-muted", label_bn: "সাধারণ", label_en: "General" },
};

export default function AdminLogsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("activity_logs" as any)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (typeFilter !== "all") {
      query = query.eq("action_type", typeFilter);
    }
    if (search.trim()) {
      query = query.or(`user_email.ilike.%${search}%,user_name.ilike.%${search}%,action.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (!error && data) {
      setLogs(data as any as ActivityLog[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, typeFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-activity-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          if (page === 0) {
            setLogs((prev) => [payload.new as any as ActivityLog, ...prev.slice(0, PAGE_SIZE - 1)]);
            setTotalCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [page]);

  const handleCleanup = async () => {
    const { error } = await supabase.rpc("cleanup_old_activity_logs" as any);
    if (error) {
      toast({ title: "ক্লিনআপ ব্যর্থ", variant: "destructive" });
    } else {
      toast({ title: "পুরাতন লগ মুছে ফেলা হয়েছে ✓" });
      fetchLogs();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("bn-BD", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const getTypeConfig = (type: string) => ACTION_TYPE_CONFIG[type] || ACTION_TYPE_CONFIG.general;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              {t("admin.logs")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("admin.logsDesc")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalCount} {t("admin.logsTotal")}
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              {t("admin.logsRefresh")}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleCleanup} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              {t("admin.logsCleanup")}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.logsSearch")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-muted/30 border-border/60 rounded-xl h-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] rounded-xl h-10 bg-muted/30">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.logsAllTypes")}</SelectItem>
            {Object.entries(ACTION_TYPE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label_bn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Logs List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ScrollText className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t("admin.logsEmpty")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            <AnimatePresence initial={false}>
              {logs.map((log, i) => {
                const cfg = getTypeConfig(log.action_type);
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedLog(log)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{log.action}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {cfg.label_bn}
                        </Badge>
                      </div>
                      {log.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/70">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_name || log.user_email || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(log.created_at)}
                        </span>
                        {log.page_path && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.page_path}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {t("admin.logsPage")} {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                ← {t("admin.logsPrev")}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                {t("admin.logsNext")} →
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-primary" />
              {t("admin.logsDetail")}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {(selectedLog.user_name || selectedLog.user_email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{selectedLog.user_name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{selectedLog.user_email || "N/A"}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <DetailItem label={t("admin.logsAction")} value={selectedLog.action} />
                <DetailItem label={t("admin.logsType")} value={getTypeConfig(selectedLog.action_type).label_bn} />
                <DetailItem label={t("admin.logsTime")} value={formatTime(selectedLog.created_at)} />
                <DetailItem label={t("admin.logsPath")} value={selectedLog.page_path || "N/A"} />
              </div>

              {selectedLog.description && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{t("admin.logsDescription")}</p>
                  <p className="text-sm text-foreground">{selectedLog.description}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{t("admin.logsMetadata")}</p>
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-all font-mono bg-background/50 rounded-lg p-2 mt-1 max-h-40 overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-[10px] text-muted-foreground/60 text-center">
                ID: {selectedLog.id}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}
