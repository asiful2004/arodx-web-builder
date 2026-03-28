import { useState, useEffect } from "react";
import { Save, Loader2, RotateCcw, Eye, Smartphone, Monitor, X } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

interface TemplateCustomization {
  subject?: string;
  heading?: string;
  bodyText?: string;
}

interface AllCustomizations {
  [templateKey: string]: TemplateCustomization;
}

// Default values for each template (matches edge function defaults)
const TEMPLATE_DEFAULTS: Record<string, { subject: string; heading: string; bodyText: string; fields: string[] }> = {
  "welcome": {
    subject: "Arodx - স্বাগতম!",
    heading: "স্বাগতম!",
    bodyText: "Arodx-এ আপনাকে স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন আপনি আমাদের সকল সেবা উপভোগ করতে পারবেন।",
    fields: ["subject", "heading", "bodyText"],
  },
  "login-alert": {
    subject: "Arodx - নতুন ডিভাইস থেকে লগইন",
    heading: "নতুন লগইন সনাক্ত হয়েছে",
    bodyText: "আপনার অ্যাকাউন্টে একটি নতুন ডিভাইস থেকে লগইন করা হয়েছে। আপনি যদি এই লগইন করে থাকেন, তাহলে কোনো পদক্ষেপ নেওয়ার প্রয়োজন নেই।",
    fields: ["subject", "heading", "bodyText"],
  },
  "password-changed": {
    subject: "Arodx - পাসওয়ার্ড পরিবর্তন হয়েছে",
    heading: "পাসওয়ার্ড পরিবর্তন সফল",
    bodyText: "আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।",
    fields: ["subject", "heading", "bodyText"],
  },
  "subscription-confirmation": {
    subject: "Arodx - সাবস্ক্রিপশন নিশ্চিত হয়েছে",
    heading: "সাবস্ক্রিপশন সফল!",
    bodyText: "আমাদের পরিবারে যোগ দেওয়ার জন্য ধন্যবাদ।",
    fields: ["subject", "heading", "bodyText"],
  },
  "payment-success": {
    subject: "Arodx - পেমেন্ট সফল হয়েছে",
    heading: "পেমেন্ট সফল!",
    bodyText: "আপনার মাসিক পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। আপনার সকল সেবা সচল আছে।",
    fields: ["subject", "heading", "bodyText"],
  },
  "payment-failed": {
    subject: "Arodx - পেমেন্ট ব্যর্থ হয়েছে",
    heading: "পেমেন্ট ব্যর্থ!",
    bodyText: "দুঃখিত, আপনার সাম্প্রতিক পেমেন্ট প্রসেস করা সম্ভব হয়নি। অনুগ্রহ করে আপনার পেমেন্ট তথ্য আপডেট করে পুনরায় চেষ্টা করুন।",
    fields: ["subject", "heading", "bodyText"],
  },
  "renewal-reminder": {
    subject: "Arodx - সাবস্ক্রিপশন রিনিউয়াল রিমাইন্ডার",
    heading: "রিনিউয়াল রিমাইন্ডার",
    bodyText: "নিরবচ্ছিন্ন সেবা পেতে অনুগ্রহ করে সময়মত রিনিউ করুন।",
    fields: ["subject", "heading", "bodyText"],
  },
  "subscription-cancelled": {
    subject: "Arodx - সাবস্ক্রিপশন বাতিল হয়েছে",
    heading: "সাবস্ক্রিপশন বাতিল",
    bodyText: "আপনি যেকোনো সময় পুনরায় সাবস্ক্রাইব করতে পারবেন। আমরা আপনাকে আবার পেতে চাই!",
    fields: ["subject", "heading", "bodyText"],
  },
  "ticket-received": {
    subject: "Arodx - সাপোর্ট টিকেট",
    heading: "টিকেট গ্রহণ করা হয়েছে",
    bodyText: "আপনার সাপোর্ট টিকেট সফলভাবে গ্রহণ করা হয়েছে। আমাদের টিম যত দ্রুত সম্ভব আপনার সমস্যার সমাধান করবে।",
    fields: ["subject", "heading", "bodyText"],
  },
  "support-reply": {
    subject: "Arodx - টিকেট রিপ্লাই",
    heading: "নতুন সাপোর্ট রিপ্লাই",
    bodyText: "",
    fields: ["subject", "heading"],
  },
  "feedback-request": {
    subject: "Arodx - আপনার মতামত জানান",
    heading: "আপনার মতামত গুরুত্বপূর্ণ",
    bodyText: "আপনার সেবা সম্পর্কে আপনার মূল্যবান মতামত জানতে চাই। আপনার ফিডব্যাক আমাদের সেবার মান উন্নত করতে সাহায্য করবে।",
    fields: ["subject", "heading", "bodyText"],
  },
};

const FIELD_LABELS: Record<string, string> = {
  subject: "ইমেইল সাবজেক্ট",
  heading: "শিরোনাম",
  bodyText: "মূল টেক্সট",
};

interface Props {
  templateKey: string;
  templateTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmailTemplateEditor({ templateKey, templateTitle, open, onOpenChange }: Props) {
  const { data: settings } = useSiteSettings();
  const updateMutation = useUpdateSiteSetting();
  const [customization, setCustomization] = useState<TemplateCustomization>({});
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const defaults = TEMPLATE_DEFAULTS[templateKey];

  useEffect(() => {
    if (open && settings) {
      const all = (settings.email_template_customizations as AllCustomizations) || {};
      setCustomization(all[templateKey] || {});
      setPreviewHtml(null);
    }
  }, [open, settings, templateKey]);

  const getValue = (field: string) => {
    return (customization as any)[field] ?? (defaults as any)?.[field] ?? "";
  };

  const handleFieldChange = (field: string, value: string) => {
    setCustomization((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const existing = (settings?.email_template_customizations as AllCustomizations) || {};
    const updated = { ...existing, [templateKey]: customization };
    updateMutation.mutate(
      { key: "email_template_customizations", value: updated },
      {
        onSuccess: () => {
          sonnerToast.success("টেম্পলেট কাস্টমাইজেশন সেভ হয়েছে!");
          setPreviewHtml(null);
        },
        onError: () => sonnerToast.error("সেভ করতে সমস্যা হয়েছে"),
      }
    );
  };

  const handleReset = () => {
    setCustomization({});
    sonnerToast.info("ডিফল্ট ভ্যালুতে রিসেট করা হয়েছে। সেভ করুন।");
  };

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const previewData: Record<string, any> = {
        name: "রাহুল আহমেদ",
        email: "rahul@example.com",
        dashboardUrl: "#",
        device: "Chrome on Windows",
        browser: "Chrome 120",
        os: "Windows 11",
        package: "Business",
        billingPeriod: "monthly",
        amount: "৫,০০০",
        paymentMethod: "bKash",
        transactionId: "TXN-PREVIEW-123456",
        renewalDate: "০১ ফেব্রুয়ারি ২০২৬",
        nextPaymentDate: "০১ ফেব্রুয়ারি ২০২৬",
        expiryDate: "৩১ জানুয়ারি ২০২৬",
        daysLeft: "৩",
        activeUntil: "বিলিং পিরিয়ড শেষ পর্যন্ত",
        ticketNumber: "TKT-00001",
        subject: "ওয়েবসাইটে সমস্যা",
        category: "Technical",
        priority: "High",
        ticketUrl: "#",
        replyPreview: "আপনার সমস্যাটি আমরা দেখছি। শীঘ্রই সমাধান দেওয়া হবে।",
        project: "E-Commerce Website",
        feedbackUrl: "#",
        paymentUrl: "#",
        resubscribeUrl: "#",
        reason: "পেমেন্ট মেথডে সমস্যা",
        // Pass customization overrides
        _customization: customization,
      };

      const { data, error } = await supabase.functions.invoke("send-template-email", {
        body: {
          templateName: templateKey,
          recipientEmail: "__preview__",
          data: previewData,
          previewOnly: true,
        },
      });
      if (error) throw error;
      if (data?.html) setPreviewHtml(data.html);
      else if (data?.error) sonnerToast.error(data.error);
    } catch (err: any) {
      sonnerToast.error(err.message || "প্রিভিউ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!defaults) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold">{templateTitle} — এডিটর</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">সাবজেক্ট, শিরোনাম এবং মূল টেক্সট কাস্টমাইজ করুন</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleReset}>
                <RotateCcw className="h-3 w-3" /> রিসেট
              </Button>
              <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                সেভ
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0">
            {/* Editor Panel */}
            <div className="p-5 space-y-4 border-r border-border overflow-auto max-h-[70vh]">
              {defaults.fields.map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{FIELD_LABELS[field]}</Label>
                  {field === "bodyText" ? (
                    <Textarea
                      value={getValue(field)}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={defaults[field as keyof typeof defaults] as string}
                      rows={4}
                      className="text-sm resize-none"
                    />
                  ) : (
                    <Input
                      value={getValue(field)}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={defaults[field as keyof typeof defaults] as string}
                      className="text-sm"
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    ডিফল্ট: {(defaults[field as keyof typeof defaults] as string) || "—"}
                  </p>
                </div>
              ))}

              <div className="pt-2">
                <p className="text-[11px] text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  ফাঁকা রাখলে ডিফল্ট ভ্যালু ব্যবহৃত হবে। কাস্টমাইজেশন সেভ করার পর ইমেইল পাঠালে নতুন টেক্সট দেখা যাবে।
                </p>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={loadPreview} disabled={loadingPreview}>
                    {loadingPreview ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                    প্রিভিউ
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode("desktop")}>
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode("mobile")}>
                    <Smartphone className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-muted/20 p-4 flex justify-center max-h-[60vh]">
                {!previewHtml && !loadingPreview && (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-sm text-muted-foreground">প্রিভিউ বাটনে ক্লিক করুন</p>
                  </div>
                )}
                {loadingPreview && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                {previewHtml && !loadingPreview && (
                  <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${viewMode === "mobile" ? "w-[375px]" : "w-full max-w-[580px]"}`}>
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full border-0"
                      style={{ minHeight: "500px", height: "100%" }}
                      title={`${templateKey} preview`}
                      sandbox="allow-same-origin"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
