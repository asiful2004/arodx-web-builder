import { useState, useEffect } from "react";
import { Mail, Save, Loader2, Send, Eye, MailCheck, ShieldAlert, Lock, CreditCard, CheckCircle2, AlertTriangle, Clock, XCircle, TicketCheck, MessageSquare, Star } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

interface TemplateConfig {
  enabled: boolean;
}

interface AllTemplatesConfig {
  [key: string]: TemplateConfig;
}

const EMAIL_TEMPLATES = [
  {
    key: "welcome",
    icon: MailCheck,
    title: "Welcome Email",
    titleBn: "ওয়েলকাম ইমেইল",
    description: "রেজিস্ট্রেশনের পর স্বাগত ইমেইল",
    category: "auth",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    key: "login-alert",
    icon: ShieldAlert,
    title: "Login Alert",
    titleBn: "লগইন অ্যালার্ট",
    description: "নতুন ডিভাইস থেকে লগইন করলে সতর্কতা",
    category: "auth",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    key: "password-changed",
    icon: Lock,
    title: "Password Changed",
    titleBn: "পাসওয়ার্ড পরিবর্তন",
    description: "পাসওয়ার্ড পরিবর্তনের কনফার্মেশন",
    category: "auth",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "subscription-confirmation",
    icon: CreditCard,
    title: "Subscription Confirmation",
    titleBn: "সাবস্ক্রিপশন কনফার্মেশন",
    description: "প্যাকেজ কেনার পর ইনভয়েসসহ কনফার্মেশন",
    category: "payment",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    key: "payment-success",
    icon: CheckCircle2,
    title: "Payment Success",
    titleBn: "পেমেন্ট সফল",
    description: "মাসিক পেমেন্ট সফল হওয়ার নোটিফিকেশন",
    category: "payment",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "payment-failed",
    icon: AlertTriangle,
    title: "Payment Failed",
    titleBn: "পেমেন্ট ব্যর্থ",
    description: "পেমেন্ট ব্যর্থ হলে পুনরায় পেমেন্টের রিকোয়েস্ট",
    category: "payment",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    key: "renewal-reminder",
    icon: Clock,
    title: "Renewal Reminder",
    titleBn: "রিনিউয়াল রিমাইন্ডার",
    description: "সাবস্ক্রিপশন শেষ হওয়ার ৩-৫ দিন আগে",
    category: "payment",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    key: "subscription-cancelled",
    icon: XCircle,
    title: "Subscription Cancelled",
    titleBn: "সাবস্ক্রিপশন বাতিল",
    description: "মেম্বারশিপ বাতিলের কনফার্মেশন",
    category: "payment",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    key: "ticket-received",
    icon: TicketCheck,
    title: "Ticket Received",
    titleBn: "টিকেট গ্রহণ",
    description: "সাপোর্ট টিকেট তৈরির কনফার্মেশন",
    category: "support",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    key: "support-reply",
    icon: MessageSquare,
    title: "Support Reply",
    titleBn: "সাপোর্ট রিপ্লাই",
    description: "সাপোর্ট টিমের রিপ্লাই নোটিফিকেশন",
    category: "support",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    key: "feedback-request",
    icon: Star,
    title: "Feedback Request",
    titleBn: "ফিডব্যাক রিকোয়েস্ট",
    description: "প্রজেক্ট শেষে রিভিউ দেওয়ার অনুরোধ",
    category: "other",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const CATEGORIES = [
  { key: "auth", label: "অথেনটিকেশন", icon: ShieldAlert },
  { key: "payment", label: "পেমেন্ট ও সাবস্ক্রিপশন", icon: CreditCard },
  { key: "support", label: "সাপোর্ট", icon: TicketCheck },
  { key: "other", label: "অন্যান্য", icon: Star },
];

export default function EmailTemplatesManager() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSetting();
  const [configs, setConfigs] = useState<AllTemplatesConfig>({});
  const [testEmail, setTestEmail] = useState("");
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (settings && !loaded) {
      const existing = (settings.email_templates_config as AllTemplatesConfig) || {};
      // Initialize all templates as enabled by default
      const merged: AllTemplatesConfig = {};
      EMAIL_TEMPLATES.forEach((t) => {
        merged[t.key] = existing[t.key] || { enabled: true };
      });
      setConfigs(merged);
      setLoaded(true);
    }
  }, [settings, loaded]);

  const handleToggle = (key: string, enabled: boolean) => {
    setConfigs((prev) => ({ ...prev, [key]: { ...prev[key], enabled } }));
  };

  const handleToggleAll = (enabled: boolean) => {
    const updated: AllTemplatesConfig = {};
    EMAIL_TEMPLATES.forEach((t) => {
      updated[t.key] = { enabled };
    });
    setConfigs(updated);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { key: "email_templates_config", value: configs },
      {
        onSuccess: () => sonnerToast.success("ইমেইল টেমপ্লেট সেটিংস সেভ হয়েছে!"),
        onError: () => sonnerToast.error("সেভ করতে সমস্যা হয়েছে"),
      }
    );
  };

  const handleTestSend = async (templateKey: string) => {
    if (!testEmail.trim()) {
      sonnerToast.error("প্রথমে একটি টেস্ট ইমেইল এড্রেস দিন");
      return;
    }
    setTestingTemplate(templateKey);
    try {
      const testData: Record<string, any> = {
        name: "Test User",
        email: testEmail,
        dashboardUrl: window.location.origin + "/dashboard",
        device: "Chrome on Windows",
        browser: "Chrome",
        os: "Windows 11",
        package: "Business",
        billingPeriod: "monthly",
        amount: "৫,০০০",
        paymentMethod: "bKash",
        transactionId: "TXN-TEST-123456",
        renewalDate: "01 Feb 2026",
        nextPaymentDate: "01 Feb 2026",
        expiryDate: "31 Jan 2026",
        daysLeft: "৩",
        activeUntil: "বিলিং পিরিয়ড শেষ পর্যন্ত",
        ticketNumber: "TKT-00001",
        subject: "ওয়েবসাইটে সমস্যা",
        category: "Technical",
        priority: "High",
        ticketUrl: window.location.origin + "/dashboard/tickets",
        replyPreview: "আপনার সমস্যাটি আমরা দেখছি। দ্রুতই সমাধান দেওয়া হবে।",
        project: "E-Commerce Website",
        feedbackUrl: window.location.origin + "/dashboard",
        paymentUrl: window.location.origin + "/renewal",
        resubscribeUrl: window.location.origin + "/checkout",
        reason: "পেমেন্ট মেথডে সমস্যা",
      };

      const { data, error } = await supabase.functions.invoke("send-template-email", {
        body: {
          templateName: templateKey,
          recipientEmail: testEmail.trim(),
          data: testData,
        },
      });

      if (error) throw error;
      if (data?.error && !data?.skipped) throw new Error(data.error);
      if (data?.skipped) {
        sonnerToast.warning("এই টেমপ্লেট বর্তমানে ডিজেবল আছে");
        return;
      }
      sonnerToast.success(`${templateKey} টেস্ট ইমেইল পাঠানো হয়েছে!`);
    } catch (err: any) {
      sonnerToast.error(err.message || "ইমেইল পাঠাতে সমস্যা হয়েছে");
    } finally {
      setTestingTemplate(null);
    }
  };

  if (isLoading || !loaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const enabledCount = Object.values(configs).filter((c) => c.enabled).length;
  const totalCount = EMAIL_TEMPLATES.length;

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">ইমেইল টেমপ্লেট</CardTitle>
              <CardDescription>প্রতিটি ইমেইল টেমপ্লেট আলাদাভাবে চালু/বন্ধ করুন</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {enabledCount}/{totalCount} সক্রিয়
            </Badge>
            <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" className="gap-2">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              সেভ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">সব টেমপ্লেট একসাথে চালু/বন্ধ করুন</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleToggleAll(true)}>
                সব চালু
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleToggleAll(false)}>
                সব বন্ধ
              </Button>
            </div>
          </div>

          {/* Test Email Input */}
          <div className="flex gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <Send className="h-4 w-4 text-primary mt-1.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium text-foreground">টেস্ট ইমেইল পাঠান</p>
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="text-sm h-8"
              />
              <p className="text-[10px] text-muted-foreground">প্রতিটি টেমপ্লেটের পাশে টেস্ট বাটন দিয়ে পাঠাতে পারবেন</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates by Category */}
      {CATEGORIES.map((cat) => {
        const catTemplates = EMAIL_TEMPLATES.filter((t) => t.category === cat.key);
        if (catTemplates.length === 0) return null;

        return (
          <Card key={cat.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <cat.icon className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">{cat.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {catTemplates.map((template) => {
                const isEnabled = configs[template.key]?.enabled !== false;
                const isTesting = testingTemplate === template.key;

                return (
                  <div
                    key={template.key}
                    className={`p-3 rounded-xl border transition-all ${
                      isEnabled
                        ? "border-border bg-background"
                        : "border-border/50 bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg ${template.bgColor} flex items-center justify-center shrink-0`}>
                          <template.icon className={`h-4 w-4 ${template.color}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{template.titleBn}</p>
                            <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">{template.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleTestSend(template.key)}
                          disabled={isTesting || !testEmail.trim()}
                          title="টেস্ট ইমেইল পাঠান"
                        >
                          {isTesting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(v) => handleToggle(template.key, v)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
