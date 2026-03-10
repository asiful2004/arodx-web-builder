import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Building2, Save, Upload, X, Plus, Trash2, Loader2,
  Image as ImageIcon, Link as LinkIcon, Mail, Globe, Phone, MapPin,
  FileText, Instagram, Facebook, Youtube, Twitter,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface BusinessData {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
  logo_url: string | null;
  social_links: SocialLink[];
  description: string | null;
  email: string | null;
  website_url: string | null;
}

interface OrderData {
  id: string;
  package_name: string;
  status: string;
  is_active: boolean;
}

const socialPlatforms = [
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "twitter", label: "Twitter / X", icon: Twitter },
  { value: "other", label: "অন্যান্য", icon: LinkIcon },
];

// Package-based feature config
const packageFeatures: Record<string, { maxSocialLinks: number; canAddDescription: boolean; canAddEmail: boolean; canAddWebsite: boolean }> = {
  Starter: { maxSocialLinks: 1, canAddDescription: true, canAddEmail: true, canAddWebsite: false },
  Business: { maxSocialLinks: 3, canAddDescription: true, canAddEmail: true, canAddWebsite: true },
  Enterprise: { maxSocialLinks: 10, canAddDescription: true, canAddEmail: true, canAddWebsite: true },
};

const getFeatures = (packageName: string) => {
  return packageFeatures[packageName] || packageFeatures.Starter;
};

export default function BusinessConfigPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<DashboardContext>();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);

  // Editable fields
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  useEffect(() => {
    if (!orderId) return;
    const fetchData = async () => {
      setLoading(true);
      const [orderRes, bizRes] = await Promise.all([
        supabase.from("orders").select("id, package_name, status, is_active").eq("id", orderId).eq("user_id", user.id).single(),
        supabase.from("businesses").select("*").eq("order_id", orderId).eq("user_id", user.id).maybeSingle(),
      ]);

      const orderData = orderRes.data as OrderData | null;
      setOrder(orderData);

      if (bizRes.data) {
        const biz = bizRes.data as any;
        const bizData: BusinessData = {
          ...biz,
          social_links: Array.isArray(biz.social_links) ? biz.social_links : [],
        };
        setBusiness(bizData);
        setDescription(bizData.description || "");
        setEmail(bizData.email || "");
        setWebsiteUrl(bizData.website_url || "");
        setSocialLinks(bizData.social_links || []);
        setBusinessPhone(bizData.business_phone || "");
        setBusinessAddress(bizData.business_address || "");
        setLogoPreview(bizData.logo_url);
      }

      setLoading(false);
    };
    fetchData();
  }, [orderId, user.id]);

  const features = order ? getFeatures(order.package_name) : getFeatures("Starter");

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "ফাইল সাইজ বেশি", description: "সর্বোচ্চ ৫MB পর্যন্ত আপলোড করা যাবে", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const addSocialLink = () => {
    if (socialLinks.length >= features.maxSocialLinks) {
      toast({ title: "সীমা অতিক্রম", description: `আপনার ${order?.package_name} প্যাকেজে সর্বোচ্চ ${features.maxSocialLinks}টি সোশ্যাল মিডিয়া লিংক যোগ করা যাবে`, variant: "destructive" });
      return;
    }
    setSocialLinks([...socialLinks, { platform: "facebook", url: "" }]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!business || !order) return;
    setSaving(true);

    try {
      let newLogoUrl = business.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/${business.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("business-logos")
          .upload(path, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("business-logos")
          .getPublicUrl(path);
        newLogoUrl = urlData.publicUrl;
      } else if (!logoPreview) {
        newLogoUrl = null;
      }

      // Filter out empty social links
      const validLinks = socialLinks.filter(l => l.url.trim());

      const { error } = await supabase
        .from("businesses")
        .update({
          logo_url: newLogoUrl,
          description: description.trim() || null,
          email: email.trim() || null,
          website_url: features.canAddWebsite ? (websiteUrl.trim() || null) : undefined,
          social_links: validLinks as any,
          business_phone: businessPhone.trim() || business.business_phone,
          business_address: businessAddress.trim() || null,
        })
        .eq("id", business.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "সংরক্ষিত!", description: "ব্যবসার তথ্য আপডেট করা হয়েছে" });
      // Update local state
      setBusiness({
        ...business,
        logo_url: newLogoUrl,
        description: description.trim() || null,
        email: email.trim() || null,
        website_url: websiteUrl.trim() || null,
        social_links: validLinks,
        business_phone: businessPhone.trim() || business.business_phone,
        business_address: businessAddress.trim() || null,
      });
      setLogoFile(null);
    } catch (err: any) {
      toast({ title: "সমস্যা হয়েছে", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!order || !business) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </Button>
        <div className="text-center py-20 text-muted-foreground">
          <p>ব্যবসা পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  const isActive = order.status === "confirmed" && order.is_active;

  if (!isActive) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/business/${orderId}`)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </Button>
        <div className="text-center py-20 text-muted-foreground space-y-2">
          <Building2 className="w-12 h-12 mx-auto opacity-30" />
          <p className="text-sm font-medium">ব্যবসা সক্রিয় নেই</p>
          <p className="text-xs">শুধুমাত্র সক্রিয় ব্যবসা কনফিগার করা যায়</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/dashboard/business/${orderId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold font-display text-foreground truncate">
              {business.business_name} — কনফিগ
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              প্যাকেজ: <Badge variant="secondary" className="text-[10px]">{order.package_name}</Badge>
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 ml-11 sm:ml-0 w-fit">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          সংরক্ষণ করুন
        </Button>
      </div>

      {/* Logo Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          ব্যবসার লোগো
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center overflow-hidden">
            {logoPreview ? (
              <>
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                <button
                  onClick={removeLogo}
                  className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <Building2 className="w-8 h-8 text-muted-foreground/30" />
            )}
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3 h-3" />
              {logoPreview ? "লোগো পরিবর্তন" : "লোগো আপলোড"}
            </Button>
            <p className="text-[11px] text-muted-foreground">PNG, JPG, SVG, WEBP • সর্বোচ্চ ৫MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp"
              className="hidden"
              onChange={handleLogoSelect}
            />
          </div>
        </div>
      </motion.div>

      {/* Basic Info Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          মৌলিক তথ্য
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> ফোন নম্বর
            </Label>
            <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> ইমেইল
            </Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@yourbusiness.com" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> ঠিকানা
            </Label>
            <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="ব্যবসার ঠিকানা" />
          </div>
          {features.canAddWebsite && (
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> ওয়েবসাইট URL
              </Label>
              <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" />
            </div>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> ব্যবসার বিবরণ
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="আপনার ব্যবসা সম্পর্কে সংক্ষেপে লিখুন..."
              rows={3}
            />
          </div>
        </div>
      </motion.div>

      {/* Social Media Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-primary" />
            সোশ্যাল মিডিয়া
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {socialLinks.length}/{features.maxSocialLinks}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-7 text-xs"
              onClick={addSocialLink}
              disabled={socialLinks.length >= features.maxSocialLinks}
            >
              <Plus className="w-3 h-3" />
              যোগ করুন
            </Button>
          </div>
        </div>

        {socialLinks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">কোনো সোশ্যাল মিডিয়া লিংক নেই</p>
            <p className="text-[11px] mt-1">
              আপনার {order.package_name} প্যাকেজে সর্বোচ্চ {features.maxSocialLinks}টি লিংক যোগ করতে পারবেন
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {socialLinks.map((link, index) => {
              const platform = socialPlatforms.find(p => p.value === link.platform);
              const PlatformIcon = platform?.icon || LinkIcon;
              return (
                <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-border/50">
                  <select
                    value={link.platform}
                    onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground w-32 shrink-0"
                  >
                    {socialPlatforms.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <div className="flex-1 relative">
                    <PlatformIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                      placeholder={`${platform?.label || "সোশ্যাল মিডিয়া"} লিংক দিন`}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeSocialLink(index)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {socialLinks.length >= features.maxSocialLinks && socialLinks.length > 0 && (
          <p className="text-[11px] text-muted-foreground text-center">
            আরো সোশ্যাল মিডিয়া যোগ করতে প্যাকেজ আপগ্রেড করুন
          </p>
        )}
      </motion.div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}
