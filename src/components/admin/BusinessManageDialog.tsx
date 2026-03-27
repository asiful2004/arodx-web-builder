import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Fashion & Clothing", "E-commerce", "Food & Restaurant", "Health & Medical",
  "Education", "Business & Corporate", "Creative & Design", "Technology",
  "Automotive", "Travel & Tourism", "Finance & Banking", "Fitness & Sports",
  "Entertainment & Media", "Photography", "Services & Maintenance", "Beauty & Wellness",
];

const ORDER_STATUSES = ["pending", "confirmed", "cancelled"];
const BILLING_PERIODS = ["monthly", "yearly"];

interface BusinessFull {
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
  user_id: string;
  order_id: string | null;
  order_status?: string;
  order_amount?: string;
  order_package?: string;
  order_billing_period?: string;
  order_renewal_date?: string | null;
  order_is_active?: boolean;
}

interface Props {
  business: BusinessFull | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function BusinessManageDialog({ business, open, onOpenChange, onSaved }: Props) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  // Business fields
  const [bizName, setBizName] = useState("");
  const [bizCategory, setBizCategory] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizDomainType, setBizDomainType] = useState("package");
  const [bizDomainName, setBizDomainName] = useState("");
  const [bizDescription, setBizDescription] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizWebsite, setBizWebsite] = useState("");

  // Order fields
  const [orderStatus, setOrderStatus] = useState("pending");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPackage, setOrderPackage] = useState("");
  const [orderBillingPeriod, setOrderBillingPeriod] = useState("monthly");
  const [orderRenewalDate, setOrderRenewalDate] = useState("");

  // Populate when business changes
  const populateFields = () => {
    if (!business) return;
    setBizName(business.business_name || "");
    setBizCategory(business.business_category || "");
    setBizPhone(business.business_phone || "");
    setBizAddress(business.business_address || "");
    setBizDomainType(business.domain_type || "package");
    setBizDomainName(business.domain_name || "");
    setBizDescription(business.description || "");
    setBizEmail(business.email || "");
    setBizWebsite(business.website_url || "");
    setOrderStatus(business.order_status || "pending");
    setOrderAmount(business.order_amount || "");
    setOrderPackage(business.order_package || "");
    setOrderBillingPeriod(business.order_billing_period || "monthly");
    setOrderRenewalDate(business.order_renewal_date ? business.order_renewal_date.slice(0, 10) : "");
  };

  // Reset on open
  const handleOpenChange = (val: boolean) => {
    if (val && business) populateFields();
    onOpenChange(val);
  };

  // Use effect alternative - populate when dialog opens
  if (open && business && bizName === "" && business.business_name !== "") {
    populateFields();
  }

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    try {
      // Update business table
      const { error: bizError } = await supabase
        .from("businesses")
        .update({
          business_name: bizName,
          business_category: bizCategory,
          business_phone: bizPhone,
          business_address: bizAddress || null,
          domain_type: bizDomainType,
          domain_name: bizDomainName || null,
          description: bizDescription || null,
          email: bizEmail || null,
          website_url: bizWebsite || null,
        })
        .eq("id", business.id);

      if (bizError) throw bizError;

      // Update order if exists
      if (business.order_id) {
        const orderUpdate: Record<string, any> = {
          status: orderStatus,
          amount: orderAmount,
          package_name: orderPackage,
          billing_period: orderBillingPeriod,
        };
        if (orderRenewalDate) {
          orderUpdate.renewal_date = new Date(orderRenewalDate).toISOString();
        }
        if (orderStatus === "confirmed") {
          orderUpdate.is_active = true;
        } else if (orderStatus === "cancelled") {
          orderUpdate.is_active = false;
        }

        const { error: orderError } = await supabase
          .from("orders")
          .update(orderUpdate)
          .eq("id", business.order_id);

        if (orderError) throw orderError;
      }

      toast.success(t("admin.biz.saveSuccess"));
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!business) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("admin.biz.manage")} - {business.business_name}
          </DialogTitle>
          <DialogDescription>{t("admin.biz.manageDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Information */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{t("admin.biz.businessInfo")}</Badge>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.name")}</Label>
                <Input value={bizName} onChange={e => setBizName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.category")}</Label>
                <Select value={bizCategory} onValueChange={setBizCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.phone")}</Label>
                <Input value={bizPhone} onChange={e => setBizPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.email")}</Label>
                <Input value={bizEmail} onChange={e => setBizEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">{t("admin.biz.address")}</Label>
                <Input value={bizAddress} onChange={e => setBizAddress(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.domainType")}</Label>
                <Select value={bizDomainType} onValueChange={setBizDomainType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="package">{t("admin.biz.domainPackage")}</SelectItem>
                    <SelectItem value="own">{t("admin.biz.domainOwn")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.domainName")}</Label>
                <Input value={bizDomainName} onChange={e => setBizDomainName(e.target.value)} placeholder="example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.website")}</Label>
                <Input value={bizWebsite} onChange={e => setBizWebsite(e.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">{t("admin.biz.description")}</Label>
                <Textarea value={bizDescription} onChange={e => setBizDescription(e.target.value)} rows={2} />
              </div>
            </div>
          </div>

          {/* Order / Subscription Info */}
          {business.order_id && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{t("admin.biz.subscriptionInfo")}</Badge>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.biz.package")}</Label>
                  <Input value={orderPackage} onChange={e => setOrderPackage(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.biz.amount")}</Label>
                  <Input value={orderAmount} onChange={e => setOrderAmount(e.target.value)} placeholder="৳" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.biz.billingPeriod")}</Label>
                  <Select value={orderBillingPeriod} onValueChange={setOrderBillingPeriod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BILLING_PERIODS.map(p => (
                        <SelectItem key={p} value={p}>
                          {p === "monthly" ? t("admin.biz.monthly") : t("admin.biz.yearly")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.biz.orderStatus")}</Label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>
                          {t(`admin.biz.status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.biz.renewalDate")}</Label>
                  <Input type="date" value={orderRenewalDate} onChange={e => setOrderRenewalDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("admin.biz.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {t("admin.biz.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
