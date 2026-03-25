import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Building2, Globe, Phone, MapPin, Loader2, Mail, Settings, Calendar, Plus,
  Clock, CheckCircle2, XCircle, AlertTriangle, PackageCheck,
  Shirt, ShoppingCart, UtensilsCrossed, Stethoscope, GraduationCap, Briefcase,
  Palette, Cpu, Car, Plane, Landmark, Dumbbell, Music, Camera, Wrench, Heart,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import BusinessManageDialog from "./BusinessManageDialog";
import CreateCustomBusinessDialog from "./CreateCustomBusinessDialog";
import { toast } from "sonner";

const categoryIconMap: Record<string, LucideIcon> = {
  "Fashion & Clothing": Shirt, "E-commerce": ShoppingCart, "Food & Restaurant": UtensilsCrossed,
  "Health & Medical": Stethoscope, "Education": GraduationCap, "Business & Corporate": Briefcase,
  "Creative & Design": Palette, "Technology": Cpu, "Automotive": Car, "Travel & Tourism": Plane,
  "Finance & Banking": Landmark, "Fitness & Sports": Dumbbell, "Entertainment & Media": Music,
  "Photography": Camera, "Services & Maintenance": Wrench, "Beauty & Wellness": Heart,
};

const getCategoryIcon = (category?: string): LucideIcon => {
  if (!category) return Building2;
  return categoryIconMap[category] || Building2;
};

interface Business {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
  logo_url: string | null;
  description: string | null;
  email: string | null;
  website_url: string | null;
  created_at: string;
  user_id: string;
  order_id: string | null;
  delivered_at: string | null;
  owner_name?: string | null;
  owner_avatar?: string | null;
  owner_email?: string | null;
  order_status?: string;
  order_amount?: string;
  order_package?: string;
  order_billing_period?: string;
  order_renewal_date?: string | null;
  order_is_active?: boolean;
}

function getDaysRemaining(renewalDate: string | null | undefined): number | null {
  if (!renewalDate) return null;
  const now = new Date();
  const renewal = new Date(renewalDate);
  return Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeliveryDaysLeft(deliveredAt: string): number {
  const delivered = new Date(deliveredAt);
  const deleteAt = new Date(delivered.getTime() + 7 * 24 * 60 * 60 * 1000);
  return Math.ceil((deleteAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getRenewalBadge(days: number | null, t: (key: string, fallback?: string) => string) {
  if (days === null) return null;
  if (days < 0) return { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: t("admin.biz.expired") };
  if (days <= 7) return { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle, label: `${days} ${t("admin.biz.daysLeft")}` };
  if (days <= 30) return { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock, label: `${days} ${t("admin.biz.daysLeft")}` };
  return { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2, label: `${days} ${t("admin.biz.daysLeft")}` };
}

export default function AdminBusinessesPage() {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: bizData } = await supabase
      .from("businesses")
      .select("*, orders(customer_email, package_name, amount, status, billing_period, renewal_date, is_active)")
      .order("created_at", { ascending: false });

    if (!bizData || bizData.length === 0) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(bizData.map((b) => b.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const enriched: Business[] = bizData.map((b: any) => {
      const profile = profileMap.get(b.user_id);
      const order = b.orders;
      return {
        ...b,
        owner_name: profile?.full_name || null,
        owner_avatar: profile?.avatar_url || null,
        owner_email: order?.customer_email || null,
        order_status: order?.status || null,
        order_amount: order?.amount || null,
        order_package: order?.package_name || null,
        order_billing_period: order?.billing_period || null,
        order_renewal_date: order?.renewal_date || null,
        order_is_active: order?.is_active || false,
      };
    });

    setBusinesses(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleManage = (biz: Business) => {
    setSelectedBiz(biz);
    setDialogOpen(true);
  };

  const handleMarkDelivered = async (biz: Business) => {
    const { error } = await supabase
      .from("businesses")
      .update({ delivered_at: new Date().toISOString() } as any)
      .eq("id", biz.id);
    if (error) {
      toast.error(t("admin.biz.deliverFailed"));
    } else {
      toast.success(t("admin.biz.deliverSuccess"));
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">{t("admin.businesses")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.biz.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> {t("admin.biz.custom.createBtn")}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {t("admin.biz.total")}: {businesses.length}
          </Badge>
        </div>
      </div>

      {businesses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
        >
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">{t("admin.biz.empty")}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {businesses.map((biz, i) => {
            const days = getDaysRemaining(biz.order_renewal_date);
            const renewalBadge = getRenewalBadge(days, t);
            const CategoryIcon = getCategoryIcon(biz.business_category);
            const isDelivered = !!biz.delivered_at;
            const deliveryDaysLeft = isDelivered ? getDeliveryDaysLeft(biz.delivered_at!) : null;

            return (
              <motion.div
                key={biz.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border bg-card/60 backdrop-blur-xl p-5 space-y-3 group relative ${
                  isDelivered ? "border-emerald-500/30 opacity-75" : "border-border"
                }`}
              >
                {/* Delivered overlay badge */}
                {isDelivered && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25 text-[10px] gap-1">
                      <PackageCheck className="w-3 h-3" />
                      {t("admin.biz.delivered")} • {deliveryDaysLeft! > 0 ? `${deliveryDaysLeft} ${t("admin.biz.daysLeft")}` : t("admin.biz.deletingSoon")}
                    </Badge>
                  </div>
                )}

                {/* Header: Logo + Name + Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {biz.logo_url ? (
                        <img src={biz.logo_url} alt={biz.business_name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <CategoryIcon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{biz.business_name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{biz.business_category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Mark as delivered button - only show if not already delivered */}
                    {!isDelivered && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon" variant="ghost"
                              className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              onClick={() => handleMarkDelivered(biz)}
                            >
                              <PackageCheck className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("admin.biz.markDelivered")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon" variant="ghost"
                            className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleManage(biz)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("admin.biz.manage")}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 shrink-0" /> <span className="truncate">{biz.business_phone}</span>
                  </div>
                  {biz.business_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{biz.business_address}</span>
                    </div>
                  )}
                  {biz.domain_name && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 shrink-0" /> <span className="truncate">{biz.domain_name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {biz.domain_type === "own" ? t("admin.biz.domainOwn") : t("admin.biz.domainPackage")}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Subscription / Order info */}
                {biz.order_id && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {biz.order_package && (
                      <Badge variant="secondary" className="text-[10px]">{biz.order_package}</Badge>
                    )}
                    {biz.order_amount && (
                      <Badge variant="outline" className="text-[10px]">৳{biz.order_amount}</Badge>
                    )}
                    {biz.order_billing_period && (
                      <Badge variant="outline" className="text-[10px]">
                        {biz.order_billing_period === "monthly" ? t("admin.biz.monthly") : t("admin.biz.yearly")}
                      </Badge>
                    )}
                    {biz.order_status && (
                      <Badge
                        className={`text-[10px] border ${
                          biz.order_status === "confirmed"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : biz.order_status === "cancelled"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                        }`}
                      >
                        {t(`admin.biz.status.${biz.order_status}`)}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Renewal countdown */}
                {renewalBadge && !isDelivered && (
                  <div className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border ${renewalBadge.color}`}>
                    <renewalBadge.icon className="w-3 h-3 shrink-0" />
                    <span className="font-medium">{renewalBadge.label}</span>
                    {biz.order_renewal_date && (
                      <span className="ml-auto text-[10px] opacity-70">
                        {new Date(biz.order_renewal_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                )}

                {/* Owner + registration date */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarImage src={biz.owner_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                      {(biz.owner_name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {biz.owner_name || t("admin.biz.noName")}
                    </p>
                    {biz.owner_email && (
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5 shrink-0" /> {biz.owner_email}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(biz.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <BusinessManageDialog
        business={selectedBiz}
        open={dialogOpen}
        onOpenChange={(val) => {
          setDialogOpen(val);
          if (!val) setSelectedBiz(null);
        }}
        onSaved={fetchData}
      />

      <CreateCustomBusinessDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchData}
      />
    </div>
  );
}
