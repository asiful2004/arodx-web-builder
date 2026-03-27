import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Plus, Search, X, UserPlus } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Fashion & Clothing", "E-commerce", "Food & Restaurant", "Health & Medical",
  "Education", "Business & Corporate", "Creative & Design", "Technology",
  "Automotive", "Travel & Tourism", "Finance & Banking", "Fitness & Sports",
  "Entertainment & Media", "Photography", "Services & Maintenance", "Beauty & Wellness",
  "Custom",
];

const BILLING_PERIODS = ["monthly", "yearly", "one_time"];

interface UserOption {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateCustomBusinessDialog({ open, onOpenChange, onCreated }: Props) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Business info
  const [bizName, setBizName] = useState("");
  const [bizCategory, setBizCategory] = useState("Custom");
  const [bizPhone, setBizPhone] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizDescription, setBizDescription] = useState("");
  const [bizDomainType, setBizDomainType] = useState("package");
  const [bizDomainName, setBizDomainName] = useState("");
  const [bizWebsite, setBizWebsite] = useState("");

  // Step 2: Package / services
  const [packageName, setPackageName] = useState("Custom Package");
  const [amount, setAmount] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [services, setServices] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");

  // Step 3: Assign user
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setBizName(""); setBizCategory("Custom"); setBizPhone(""); setBizAddress("");
      setBizEmail(""); setBizDescription(""); setBizDomainType("package");
      setBizDomainName(""); setBizWebsite("");
      setPackageName("Custom Package"); setAmount(""); setBillingPeriod("monthly");
      setServices([""]); setNotes("");
      setUserSearch(""); setUserResults([]); setSelectedUser(null);
    }
  }, [open]);

  // Search users
  const searchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) { setUserResults([]); return; }
    setSearching(true);
    try {
      const { data: emails } = await supabase.rpc("get_user_emails");
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url");

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const q = query.toLowerCase();
      const results: UserOption[] = (emails || [])
        .filter((u: any) => u.email?.toLowerCase().includes(q) || profileMap.get(u.user_id)?.full_name?.toLowerCase().includes(q))
        .slice(0, 8)
        .map((u: any) => {
          const p = profileMap.get(u.user_id);
          return { user_id: u.user_id, email: u.email, full_name: p?.full_name || null, avatar_url: p?.avatar_url || null };
        });
      setUserResults(results);
    } catch { setUserResults([]); }
    setSearching(false);
  };

  // Add/remove service items
  const updateService = (index: number, value: string) => {
    const updated = [...services];
    updated[index] = value;
    setServices(updated);
  };
  const addService = () => setServices([...services, ""]);
  const removeService = (index: number) => {
    if (services.length <= 1) return;
    setServices(services.filter((_, i) => i !== index));
  };

  // Create business
  const handleCreate = async () => {
    if (!selectedUser) {
      toast.error(t("admin.biz.custom.selectUserRequired"));
      return;
    }
    if (!bizName.trim()) {
      toast.error(t("admin.biz.custom.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      // 1. Create order
      const serviceList = services.filter(s => s.trim());
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: selectedUser.user_id,
          customer_name: selectedUser.full_name || selectedUser.email,
          customer_phone: bizPhone || "N/A",
          customer_email: selectedUser.email,
          package_name: packageName || "Custom Package",
          amount: amount || "0",
          billing_period: billingPeriod === "one_time" ? "monthly" : billingPeriod,
          payment_method: "custom",
          transaction_id: `CUSTOM-${Date.now()}`,
          status: "confirmed",
          is_active: true,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // 2. Create business
      const { error: bizError } = await supabase
        .from("businesses")
        .insert({
          user_id: selectedUser.user_id,
          order_id: orderData.id,
          business_name: bizName,
          business_category: bizCategory,
          business_phone: bizPhone || "N/A",
          business_address: bizAddress || null,
          email: bizEmail || selectedUser.email,
          description: [
            bizDescription,
            serviceList.length > 0 ? `\n\n📋 ${t("admin.biz.custom.servicesIncluded")}:\n${serviceList.map(s => `• ${s}`).join("\n")}` : "",
            notes ? `\n\n📝 ${t("admin.biz.custom.notes")}: ${notes}` : "",
          ].filter(Boolean).join(""),
          domain_type: bizDomainType,
          domain_name: bizDomainName || null,
          website_url: bizWebsite || null,
        });

      if (bizError) throw bizError;

      // 3. Upgrade user to client role
      await supabase
        .from("user_roles")
        .insert({ user_id: selectedUser.user_id, role: "client" as any })
        .select()
        .maybeSingle();

      toast.success(t("admin.biz.custom.createSuccess"));
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create business");
    } finally {
      setSaving(false);
    }
  };

  const canNext1 = bizName.trim().length > 0;
  const canNext2 = true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {t("admin.biz.custom.title")}
          </DialogTitle>
          <DialogDescription>{t("admin.biz.custom.desc")}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {s === 1 ? t("admin.biz.custom.step1") : s === 2 ? t("admin.biz.custom.step2") : t("admin.biz.custom.step3")}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="space-y-4">
            <Badge variant="outline" className="text-[10px]">{t("admin.biz.custom.step1")}</Badge>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.name")} *</Label>
                <Input value={bizName} onChange={e => setBizName(e.target.value)} placeholder={t("admin.biz.name")} />
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
        )}

        {/* Step 2: Package / Services */}
        {step === 2 && (
          <div className="space-y-4">
            <Badge variant="outline" className="text-[10px]">{t("admin.biz.custom.step2")}</Badge>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.custom.packageName")}</Label>
                <Input value={packageName} onChange={e => setPackageName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.amount")}</Label>
                <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="৳" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.biz.billingPeriod")}</Label>
                <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BILLING_PERIODS.map(p => (
                      <SelectItem key={p} value={p}>
                        {p === "monthly" ? t("admin.biz.monthly") : p === "yearly" ? t("admin.biz.yearly") : t("admin.biz.custom.oneTime")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Services list */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("admin.biz.custom.servicesIncluded")}</Label>
              {services.map((service, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={service}
                    onChange={e => updateService(i, e.target.value)}
                    placeholder={`${t("admin.biz.custom.serviceItem")} ${i + 1}`}
                    className="flex-1"
                  />
                  {services.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => removeService(i)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addService} className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> {t("admin.biz.custom.addService")}
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.biz.custom.notes")}</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t("admin.biz.custom.notesPlaceholder")} />
            </div>
          </div>
        )}

        {/* Step 3: Assign User */}
        {step === 3 && (
          <div className="space-y-4">
            <Badge variant="outline" className="text-[10px]">{t("admin.biz.custom.step3")}</Badge>

            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{selectedUser.full_name || selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSelectedUser(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={e => searchUsers(e.target.value)}
                    placeholder={t("admin.biz.custom.searchUser")}
                    className="pl-9"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                {userResults.length > 0 && (
                  <div className="rounded-xl border border-border bg-card max-h-48 overflow-y-auto divide-y divide-border">
                    {userResults.map(u => (
                      <button
                        key={u.user_id}
                        onClick={() => { setSelectedUser(u); setUserResults([]); setUserSearch(""); }}
                        className="flex items-center gap-3 w-full p-2.5 hover:bg-accent/50 transition-colors text-left"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {(u.full_name || u.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{u.full_name || "-"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-xs">
              <p className="font-semibold text-foreground text-sm">{t("admin.biz.custom.summary")}</p>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                <span className="text-muted-foreground">{t("admin.biz.name")}:</span>
                <span className="text-foreground font-medium">{bizName || "-"}</span>
                <span className="text-muted-foreground">{t("admin.biz.category")}:</span>
                <span className="text-foreground">{bizCategory}</span>
                <span className="text-muted-foreground">{t("admin.biz.custom.packageName")}:</span>
                <span className="text-foreground">{packageName || "—"}</span>
                <span className="text-muted-foreground">{t("admin.biz.amount")}:</span>
                <span className="text-foreground">৳{amount || "0"}</span>
                <span className="text-muted-foreground">{t("admin.biz.custom.servicesIncluded")}:</span>
                <span className="text-foreground">{services.filter(s => s.trim()).length} {t("admin.biz.custom.items")}</span>
                <span className="text-muted-foreground">{t("admin.biz.custom.assignedTo")}:</span>
                <span className="text-foreground font-medium">{selectedUser ? (selectedUser.full_name || selectedUser.email) : "—"}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2)} disabled={saving}>
              {t("admin.biz.custom.back")}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("admin.biz.cancel")}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((step + 1) as 2 | 3)} disabled={step === 1 && !canNext1}>
              {t("admin.biz.custom.next")}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={saving || !selectedUser}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
              {t("admin.biz.custom.create")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
