import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Loader2, Plus, Trash2, Globe, Layout, DollarSign, Users, Briefcase, Mail, Image, FileText, ShieldAlert, Clock, Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

// Generic JSON editor for a section
function SectionEditor({ sectionKey, title, icon: Icon, children }: {
  sectionKey: string;
  title: string;
  icon: any;
  children: (data: any, setData: (d: any) => void) => React.ReactNode;
}) {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSetting();
  const { toast } = useToast();
  const [localData, setLocalData] = useState<any>(null);

  useEffect(() => {
    if (settings?.[sectionKey]) {
      setLocalData(settings[sectionKey]);
    }
  }, [settings, sectionKey]);

  const handleSave = () => {
    updateMutation.mutate(
      { key: sectionKey, value: localData },
      {
        onSuccess: () => toast({ title: `${title} আপডেট হয়েছে!` }),
        onError: () => toast({ title: "Error", description: "আপডেট করতে সমস্যা হয়েছে", variant: "destructive" }),
      }
    );
  };

  if (isLoading || !localData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>এই সেকশনের কনটেন্ট এডিট করুন</CardDescription>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" className="gap-2">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          সেভ করুন
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {children(localData, setLocalData)}
      </CardContent>
    </Card>
  );
}

function FieldInput({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" />
      ) : (
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
    </div>
  );
}

function ListEditor({ items, setItems, fields, addLabel = "নতুন আইটেম যোগ করুন" }: {
  items: any[];
  setItems: (items: any[]) => void;
  fields: { key: string; label: string; multiline?: boolean }[];
  addLabel?: string;
}) {
  const addItem = () => {
    const newItem: any = {};
    fields.forEach((f) => (newItem[f.key] = ""));
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    setItems(updated);
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => removeItem(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] font-bold text-primary tracking-widest">#{i + 1}</span>
          {fields.map((f) => (
            <FieldInput
              key={f.key}
              label={f.label}
              value={item[f.key] || ""}
              onChange={(v) => updateItem(i, f.key, v)}
              multiline={f.multiline}
            />
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="gap-2 w-full">
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}

// ===== Tab Components =====

function HeroTab() {
  return (
    <SectionEditor sectionKey="hero" title="Hero Section" icon={Layout}>
      {(data, setData) => (
        <div className="space-y-4">
          <FieldInput label="Badge টেক্সট" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title Prefix" value={data.title_prefix} onChange={(v) => setData({ ...data, title_prefix: v })} />
          <FieldInput label="Brand Name" value={data.title_brand} onChange={(v) => setData({ ...data, title_brand: v })} />
          <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} />
          <FieldInput label="Description" value={data.description} onChange={(v) => setData({ ...data, description: v })} />
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Primary Button Text" value={data.cta_primary_text} onChange={(v) => setData({ ...data, cta_primary_text: v })} />
            <FieldInput label="Primary Button Link" value={data.cta_primary_link} onChange={(v) => setData({ ...data, cta_primary_link: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Secondary Button Text" value={data.cta_secondary_text} onChange={(v) => setData({ ...data, cta_secondary_text: v })} />
            <FieldInput label="Secondary Button Link" value={data.cta_secondary_link} onChange={(v) => setData({ ...data, cta_secondary_link: v })} />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function AboutTab() {
  return (
    <SectionEditor sectionKey="about" title="About Section" icon={Users}>
      {(data, setData) => (
        <div className="space-y-6">
          <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
          <FieldInput label="Brand Name" value={data.title_brand} onChange={(v) => setData({ ...data, title_brand: v })} />
          <FieldInput label="বর্ণনা ১" value={data.description1} onChange={(v) => setData({ ...data, description1: v })} multiline />
          <FieldInput label="বর্ণনা ২" value={data.description2} onChange={(v) => setData({ ...data, description2: v })} multiline />

          <div>
            <Label className="text-sm font-semibold mb-3 block">পরিসংখ্যান</Label>
            <ListEditor
              items={data.stats || []}
              setItems={(items) => setData({ ...data, stats: items })}
              fields={[
                { key: "number", label: "সংখ্যা" },
                { key: "label", label: "লেবেল" },
              ]}
              addLabel="নতুন পরিসংখ্যান যোগ করুন"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">আমাদের মূল্যবোধ</Label>
            <ListEditor
              items={data.values || []}
              setItems={(items) => setData({ ...data, values: items })}
              fields={[
                { key: "title", label: "শিরোনাম" },
                { key: "description", label: "বর্ণনা", multiline: true },
              ]}
              addLabel="নতুন মূল্যবোধ যোগ করুন"
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function ServicesTab() {
  return (
    <SectionEditor sectionKey="services" title="Services Section" icon={Briefcase}>
      {(data, setData) => (
        <div className="space-y-6">
          <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
          <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />

          <div>
            <Label className="text-sm font-semibold mb-3 block">সার্ভিস তালিকা</Label>
            <ListEditor
              items={data.items || []}
              setItems={(items) => setData({ ...data, items: items })}
              fields={[
                { key: "title", label: "সার্ভিস নাম" },
                { key: "description", label: "বর্ণনা", multiline: true },
                { key: "icon", label: "Icon (Globe, TrendingUp, Video, Settings, Megaphone, PenTool)" },
              ]}
              addLabel="নতুন সার্ভিস যোগ করুন"
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function PricingTab() {
  return (
    <SectionEditor sectionKey="pricing" title="Pricing Section" icon={DollarSign}>
      {(data, setData) => (
        <div className="space-y-6">
          <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
          <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
          <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} />
          <FieldInput label="Custom CTA Text" value={data.custom_cta_text} onChange={(v) => setData({ ...data, custom_cta_text: v })} />
          <FieldInput label="Custom CTA Description" value={data.custom_cta_description} onChange={(v) => setData({ ...data, custom_cta_description: v })} />

          <div>
            <Label className="text-sm font-semibold mb-3 block">প্যাকেজসমূহ</Label>
            {(data.packages || []).map((pkg: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{pkg.name || `প্যাকেজ #${i + 1}`}</span>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Popular</Label>
                    <Switch
                      checked={pkg.popular}
                      onCheckedChange={(v) => {
                        const pkgs = [...data.packages];
                        pkgs[i] = { ...pkgs[i], popular: v };
                        setData({ ...data, packages: pkgs });
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                      setData({ ...data, packages: data.packages.filter((_: any, idx: number) => idx !== i) });
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="প্যাকেজ নাম" value={pkg.name} onChange={(v) => {
                    const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], name: v }; setData({ ...data, packages: pkgs });
                  }} />
                  <FieldInput label="Description" value={pkg.description} onChange={(v) => {
                    const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], description: v }; setData({ ...data, packages: pkgs });
                  }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FieldInput label="Monthly Price" value={pkg.regularPrice} onChange={(v) => {
                    const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], regularPrice: v }; setData({ ...data, packages: pkgs });
                  }} />
                  <FieldInput label="1st Month Price" value={pkg.firstYearPrice} onChange={(v) => {
                    const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], firstYearPrice: v }; setData({ ...data, packages: pkgs });
                  }} />
                  <FieldInput label="Yearly Price" value={pkg.regularYearlyPrice} onChange={(v) => {
                    const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], regularYearlyPrice: v }; setData({ ...data, packages: pkgs });
                  }} />
                  <FieldInput label="1st Year Price" value={pkg.firstYearYearlyPrice} onChange={(v) => {
                    const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], firstYearYearlyPrice: v }; setData({ ...data, packages: pkgs });
                  }} />
                </div>
                <FieldInput label="Currency Symbol" value={pkg.currency} onChange={(v) => {
                  const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], currency: v }; setData({ ...data, packages: pkgs });
                }} />
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">ফিচার তালিকা (প্রতি লাইনে একটি)</Label>
                  <Textarea
                    value={(pkg.features || []).join("\n")}
                    onChange={(e) => {
                      const pkgs = [...data.packages];
                      pkgs[i] = { ...pkgs[i], features: e.target.value.split("\n").filter((f: string) => f.trim()) };
                      setData({ ...data, packages: pkgs });
                    }}
                    rows={5}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => {
              setData({
                ...data,
                packages: [...(data.packages || []), {
                  name: "New Package", regularPrice: "0", firstYearPrice: "0",
                  regularYearlyPrice: "0", firstYearYearlyPrice: "0", currency: "৳",
                  description: "", popular: false, features: [],
                }],
              });
            }}>
              <Plus className="h-4 w-4" /> নতুন প্যাকেজ যোগ করুন
            </Button>
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function ComparisonTab() {
  return (
    <SectionEditor sectionKey="comparison" title="Comparison Section" icon={Users}>
      {(data, setData) => (
        <div className="space-y-6">
          <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title Prefix" value={data.title_prefix} onChange={(v) => setData({ ...data, title_prefix: v })} />
          <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
          <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} multiline />
          <FieldInput label="Hiring Title" value={data.hiring_title} onChange={(v) => setData({ ...data, hiring_title: v })} />
          <FieldInput label="Arodx Title" value={data.arodx_title} onChange={(v) => setData({ ...data, arodx_title: v })} />

          <div>
            <Label className="text-sm font-semibold mb-3 block">নিয়োগের সমস্যা</Label>
            <ListEditor
              items={data.hiring_problems || []}
              setItems={(items) => setData({ ...data, hiring_problems: items })}
              fields={[
                { key: "title", label: "শিরোনাম" },
                { key: "description", label: "বর্ণনা", multiline: true },
              ]}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">Arodx এর সুবিধা</Label>
            <ListEditor
              items={data.arodx_benefits || []}
              setItems={(items) => setData({ ...data, arodx_benefits: items })}
              fields={[
                { key: "title", label: "শিরোনাম" },
                { key: "description", label: "বর্ণনা", multiline: true },
              ]}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">তুলনা টেবিল</Label>
            <ListEditor
              items={data.comparison_points || []}
              setItems={(items) => setData({ ...data, comparison_points: items })}
              fields={[
                { key: "feature", label: "ফিচার" },
                { key: "hiring", label: "লোক নিয়োগ" },
                { key: "arodx", label: "Arodx" },
              ]}
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function ProcessTab() {
  return (
    <SectionEditor sectionKey="process" title="Process Section" icon={Settings}>
      {(data, setData) => (
        <div className="space-y-6">
          <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
          <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
          <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} multiline />
          <FieldInput label="Bottom CTA Text" value={data.bottom_cta} onChange={(v) => setData({ ...data, bottom_cta: v })} multiline />

          <div>
            <Label className="text-sm font-semibold mb-3 block">ধাপসমূহ</Label>
            <ListEditor
              items={data.steps || []}
              setItems={(items) => setData({ ...data, steps: items })}
              fields={[
                { key: "number", label: "নম্বর (01, 02...)" },
                { key: "title", label: "শিরোনাম" },
                { key: "subtitle", label: "সাবটাইটেল" },
                { key: "description", label: "বর্ণনা", multiline: true },
                { key: "icon", label: "Icon (ClipboardCheck, PenTool, Code, Megaphone)" },
              ]}
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function PortfolioTab() {
  return (
    <SectionEditor sectionKey="portfolio" title="Portfolio Section" icon={Image}>
      {(data, setData) => (
        <div className="space-y-6">
          <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
          <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
          <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} multiline />

          <div>
            <Label className="text-sm font-semibold mb-3 block">প্রজেক্টসমূহ</Label>
            <ListEditor
              items={data.projects || []}
              setItems={(items) => setData({ ...data, projects: items })}
              fields={[
                { key: "title", label: "প্রজেক্ট নাম" },
                { key: "category", label: "ক্যাটাগরি" },
                { key: "description", label: "বর্ণনা", multiline: true },
                { key: "image", label: "ইমেজ URL" },
              ]}
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function ContactTab() {
  return (
    <SectionEditor sectionKey="contact" title="Contact Section" icon={Mail}>
      {(data, setData) => (
        <div className="space-y-4">
          <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
          <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
          <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
          <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} multiline />
          <FieldInput label="ইমেইল" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
          <FieldInput label="ফোন" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
          <FieldInput label="ঠিকানা" value={data.address} onChange={(v) => setData({ ...data, address: v })} />

          <div>
            <Label className="text-sm font-semibold mb-3 block">অফিস সময়সূচি</Label>
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
              <FieldInput label="শনি – বুধবার" value={data.office_hours?.sat_to_wed} onChange={(v) => setData({ ...data, office_hours: { ...data.office_hours, sat_to_wed: v } })} />
              <FieldInput label="বৃহস্পতিবার" value={data.office_hours?.thursday} onChange={(v) => setData({ ...data, office_hours: { ...data.office_hours, thursday: v } })} />
              <FieldInput label="শুক্রবার" value={data.office_hours?.friday} onChange={(v) => setData({ ...data, office_hours: { ...data.office_hours, friday: v } })} />
            </div>
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function FooterTab() {
  return (
    <SectionEditor sectionKey="footer" title="Footer" icon={FileText}>
      {(data, setData) => (
        <div className="space-y-6">
          <FieldInput label="ব্র্যান্ড নাম" value={data.brand_name} onChange={(v) => setData({ ...data, brand_name: v })} />
          <FieldInput label="Tagline" value={data.tagline} onChange={(v) => setData({ ...data, tagline: v })} />
          <FieldInput label="Copyright Text" value={data.copyright_text} onChange={(v) => setData({ ...data, copyright_text: v })} />
          <FieldInput label="বর্ণনা" value={data.description} onChange={(v) => setData({ ...data, description: v })} multiline />
          <FieldInput label="ইমেইল" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
          <FieldInput label="ফোন" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
          <FieldInput label="ঠিকানা" value={data.address} onChange={(v) => setData({ ...data, address: v })} />

          <div>
            <Label className="text-sm font-semibold mb-3 block">সোশ্যাল মিডিয়া লিংক</Label>
            <ListEditor
              items={data.social_links || []}
              setItems={(items) => setData({ ...data, social_links: items })}
              fields={[
                { key: "platform", label: "প্ল্যাটফর্ম নাম" },
                { key: "url", label: "URL" },
                { key: "icon", label: "Icon (Facebook, Instagram, Twitter, Youtube)" },
              ]}
              addLabel="নতুন সোশ্যাল লিংক যোগ করুন"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">দ্রুত লিংক</Label>
            <ListEditor
              items={data.quick_links || []}
              setItems={(items) => setData({ ...data, quick_links: items })}
              fields={[
                { key: "label", label: "লেবেল" },
                { key: "url", label: "URL" },
              ]}
              addLabel="নতুন লিংক যোগ করুন"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">সার্ভিস লিংক</Label>
            <ListEditor
              items={data.service_links || []}
              setItems={(items) => setData({ ...data, service_links: items })}
              fields={[
                { key: "label", label: "সার্ভিস নাম" },
                { key: "url", label: "URL" },
              ]}
              addLabel="নতুন সার্ভিস লিংক যোগ করুন"
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

function RateLimitTab() {
  return (
    <SectionEditor sectionKey="rate_limit" title="লগইন রেট লিমিট" icon={ShieldAlert}>
      {(data, setData) => (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
            <div>
              <Label className="text-sm font-semibold">রেট লিমিট সক্রিয়</Label>
              <p className="text-xs text-muted-foreground mt-1">ভুল পাসওয়ার্ড দিলে নির্দিষ্ট সময়ের জন্য লগইন ব্লক হবে</p>
            </div>
            <Switch
              checked={data.enabled ?? true}
              onCheckedChange={(v) => setData({ ...data, enabled: v })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">সর্বোচ্চ চেষ্টা</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={data.max_attempts ?? 5}
                onChange={(e) => setData({ ...data, max_attempts: parseInt(e.target.value) || 5 })}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">এতবার ভুল পাসওয়ার্ড দিলে লক হবে</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">লকআউট সময় (মিনিট)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={data.lockout_minutes ?? 15}
                onChange={(e) => setData({ ...data, lockout_minutes: parseInt(e.target.value) || 15 })}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">কত মিনিট লগইন ব্লক থাকবে</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground">
              <strong>বর্তমান সেটিং:</strong> {data.max_attempts ?? 5}বার ভুল পাসওয়ার্ড দিলে {data.lockout_minutes ?? 15} মিনিটের জন্য লগইন ব্লক হবে।
            </p>
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

interface CronJob {
  jobname: string;
  schedule: string;
  active: boolean;
}

interface CronRunDetail {
  jobid: number;
  job_pid: number;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
  command: string;
  runid: number;
}

const CRON_JOB_LABELS: Record<string, { label: string; description: string }> = {
  "cleanup-closed-chats-hourly": {
    label: "চ্যাট ক্লিনআপ",
    description: "প্রতি ঘণ্টায় ২৪ঘণ্টা inactive চ্যাট বন্ধ ও ৭২ঘণ্টা পুরনো চ্যাট ডিলিট",
  },
  "cleanup-rejected-applications-daily": {
    label: "আবেদন ক্লিনআপ",
    description: "প্রতিদিন রাত ৩টায় expired rejected আবেদন ডিলিট",
  },
};

const SCHEDULE_PRESETS = [
  { label: "প্রতি ১০ মিনিট", value: "*/10 * * * *" },
  { label: "প্রতি ৩০ মিনিট", value: "*/30 * * * *" },
  { label: "প্রতি ঘণ্টায়", value: "0 * * * *" },
  { label: "প্রতি ৩ ঘণ্টায়", value: "0 */3 * * *" },
  { label: "প্রতি ৬ ঘণ্টায়", value: "0 */6 * * *" },
  { label: "প্রতি ১২ ঘণ্টায়", value: "0 */12 * * *" },
  { label: "প্রতিদিন রাত ১২টায়", value: "0 0 * * *" },
  { label: "প্রতিদিন রাত ৩টায়", value: "0 3 * * *" },
  { label: "প্রতিদিন সকাল ৬টায়", value: "0 6 * * *" },
  { label: "প্রতি সপ্তাহে (রবিবার)", value: "0 0 * * 0" },
];

function CronJobsTab() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [runDetails, setRunDetails] = useState<CronRunDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCronData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch cron jobs
      const { data: jobsData } = await supabase.rpc("get_cron_jobs" as any);
      // Fetch recent run details
      const { data: runsData } = await supabase.rpc("get_cron_run_details" as any);
      
      setJobs((jobsData as any[]) || []);
      setRunDetails((runsData as any[]) || []);
    } catch (err) {
      console.error("Error fetching cron data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCronData();
  }, [fetchCronData]);

  const triggerJob = async (jobName: string) => {
    setTriggering(jobName);
    try {
      const fnName = jobName.includes("chat") ? "cleanup-closed-chats" : "cleanup-rejected-applications";
      const { error } = await supabase.functions.invoke(fnName, { body: { time: new Date().toISOString() } });
      if (error) throw error;
      toast({ title: "সফল!", description: `${CRON_JOB_LABELS[jobName]?.label || jobName} ম্যানুয়ালি রান হয়েছে` });
      // Refresh data after a small delay
      setTimeout(fetchCronData, 2000);
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || "রান করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setTriggering(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "succeeded") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />সফল</Badge>;
    if (status === "failed") return <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />ব্যর্থ</Badge>;
    return <Badge variant="secondary" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>;
  };

  const formatTime = (t: string) => {
    try {
      return new Date(t).toLocaleString("bn-BD", { 
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" 
      });
    } catch { return t; }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Jobs Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Cron Jobs</CardTitle>
              <CardDescription>স্বয়ংক্রিয় নির্ধারিত কাজসমূহ</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCronData} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">কোনো Cron Job পাওয়া যায়নি</p>
          ) : (
            jobs.map((job) => {
              const meta = CRON_JOB_LABELS[job.jobname] || { label: job.jobname, description: "" };
              return (
                <div key={job.jobname} className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                      <Badge variant={job.active ? "default" : "secondary"} className="text-[10px]">
                        {job.active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">শিডিউল: {job.schedule}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => triggerJob(job.jobname)} 
                    disabled={triggering === job.jobname}
                    className="gap-2 shrink-0"
                  >
                    {triggering === job.jobname ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    এখনই রান করুন
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Run History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">রান হিস্ট্রি</CardTitle>
              <CardDescription>সাম্প্রতিক Cron Job রানের লগ</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {runDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">এখনো কোনো রান রেকর্ড নেই</p>
          ) : (
            <div className="space-y-2">
              {runDetails.map((run, idx) => (
                <div key={`${run.runid}-${idx}`} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(run.status)}
                      <span className="text-xs text-muted-foreground">
                        Job #{run.jobid}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatTime(run.start_time)}
                    </span>
                  </div>
                  {run.return_message && (
                    <p className="text-[11px] text-muted-foreground bg-background rounded p-2 font-mono break-all">
                      {run.return_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">সাইট সেটিংস</h1>
        <p className="text-sm text-muted-foreground">ওয়েবসাইটের সকল কনটেন্ট এখান থেকে এডিট করুন</p>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="hero" className="text-xs">Hero</TabsTrigger>
          <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
          <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs">Pricing</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">Comparison</TabsTrigger>
          <TabsTrigger value="process" className="text-xs">Process</TabsTrigger>
          <TabsTrigger value="portfolio" className="text-xs">Portfolio</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
          <TabsTrigger value="footer" className="text-xs">Footer</TabsTrigger>
          <TabsTrigger value="rate_limit" className="text-xs">🔒 Rate Limit</TabsTrigger>
          <TabsTrigger value="cron_jobs" className="text-xs">⏰ Cron Jobs</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="hero"><HeroTab /></TabsContent>
          <TabsContent value="about"><AboutTab /></TabsContent>
          <TabsContent value="services"><ServicesTab /></TabsContent>
          <TabsContent value="pricing"><PricingTab /></TabsContent>
          <TabsContent value="comparison"><ComparisonTab /></TabsContent>
          <TabsContent value="process"><ProcessTab /></TabsContent>
          <TabsContent value="portfolio"><PortfolioTab /></TabsContent>
          <TabsContent value="contact"><ContactTab /></TabsContent>
          <TabsContent value="footer"><FooterTab /></TabsContent>
          <TabsContent value="rate_limit"><RateLimitTab /></TabsContent>
          <TabsContent value="cron_jobs"><CronJobsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
