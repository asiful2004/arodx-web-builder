import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Save, Loader2, Plus, Trash2, Layout, DollarSign, Users, Briefcase, Mail, Image, FileText, Settings } from "lucide-react";
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
            <ListEditor items={data.stats || []} setItems={(items) => setData({ ...data, stats: items })} fields={[{ key: "number", label: "সংখ্যা" }, { key: "label", label: "লেবেল" }]} addLabel="নতুন পরিসংখ্যান যোগ করুন" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-3 block">আমাদের মূল্যবোধ</Label>
            <ListEditor items={data.values || []} setItems={(items) => setData({ ...data, values: items })} fields={[{ key: "title", label: "শিরোনাম" }, { key: "description", label: "বর্ণনা", multiline: true }]} addLabel="নতুন মূল্যবোধ যোগ করুন" />
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
            <ListEditor items={data.items || []} setItems={(items) => setData({ ...data, items: items })} fields={[{ key: "title", label: "সার্ভিস নাম" }, { key: "description", label: "বর্ণনা", multiline: true }, { key: "icon", label: "Icon (Globe, TrendingUp, Video, Settings, Megaphone, PenTool)" }]} addLabel="নতুন সার্ভিস যোগ করুন" />
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
                    <Switch checked={pkg.popular} onCheckedChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], popular: v }; setData({ ...data, packages: pkgs }); }} />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setData({ ...data, packages: data.packages.filter((_: any, idx: number) => idx !== i) }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="প্যাকেজ নাম" value={pkg.name} onChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], name: v }; setData({ ...data, packages: pkgs }); }} />
                  <FieldInput label="Description" value={pkg.description} onChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], description: v }; setData({ ...data, packages: pkgs }); }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FieldInput label="Monthly Price" value={pkg.regularPrice} onChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], regularPrice: v }; setData({ ...data, packages: pkgs }); }} />
                  <FieldInput label="1st Month Price" value={pkg.firstYearPrice} onChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], firstYearPrice: v }; setData({ ...data, packages: pkgs }); }} />
                  <FieldInput label="Yearly Price" value={pkg.regularYearlyPrice} onChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], regularYearlyPrice: v }; setData({ ...data, packages: pkgs }); }} />
                  <FieldInput label="1st Year Price" value={pkg.firstYearYearlyPrice} onChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], firstYearYearlyPrice: v }; setData({ ...data, packages: pkgs }); }} />
                </div>
                <FieldInput label="Currency Symbol" value={pkg.currency} onChange={(v) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], currency: v }; setData({ ...data, packages: pkgs }); }} />
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">ফিচার তালিকা (প্রতি লাইনে একটি)</Label>
                  <Textarea value={(pkg.features || []).join("\n")} onChange={(e) => { const pkgs = [...data.packages]; pkgs[i] = { ...pkgs[i], features: e.target.value.split("\n").filter((f: string) => f.trim()) }; setData({ ...data, packages: pkgs }); }} rows={5} className="text-sm" />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => {
              setData({ ...data, packages: [...(data.packages || []), { name: "New Package", regularPrice: "0", firstYearPrice: "0", regularYearlyPrice: "0", firstYearYearlyPrice: "0", currency: "৳", description: "", popular: false, features: [] }] });
            }}><Plus className="h-4 w-4" /> নতুন প্যাকেজ যোগ করুন</Button>
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
            <ListEditor items={data.hiring_problems || []} setItems={(items) => setData({ ...data, hiring_problems: items })} fields={[{ key: "title", label: "শিরোনাম" }, { key: "description", label: "বর্ণনা", multiline: true }]} />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-3 block">Arodx এর সুবিধা</Label>
            <ListEditor items={data.arodx_benefits || []} setItems={(items) => setData({ ...data, arodx_benefits: items })} fields={[{ key: "title", label: "শিরোনাম" }, { key: "description", label: "বর্ণনা", multiline: true }]} />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-3 block">তুলনা টেবিল</Label>
            <ListEditor items={data.comparison_points || []} setItems={(items) => setData({ ...data, comparison_points: items })} fields={[{ key: "feature", label: "ফিচার" }, { key: "hiring", label: "লোক নিয়োগ" }, { key: "arodx", label: "Arodx" }]} />
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
            <ListEditor items={data.steps || []} setItems={(items) => setData({ ...data, steps: items })} fields={[{ key: "number", label: "নম্বর (01, 02...)" }, { key: "title", label: "শিরোনাম" }, { key: "subtitle", label: "সাবটাইটেল" }, { key: "description", label: "বর্ণনা", multiline: true }, { key: "icon", label: "Icon (ClipboardCheck, PenTool, Code, Megaphone)" }]} />
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
            <ListEditor items={data.projects || []} setItems={(items) => setData({ ...data, projects: items })} fields={[{ key: "title", label: "প্রজেক্ট নাম" }, { key: "category", label: "ক্যাটাগরি" }, { key: "description", label: "বর্ণনা", multiline: true }, { key: "image", label: "ইমেজ URL" }]} />
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
            <ListEditor items={data.social_links || []} setItems={(items) => setData({ ...data, social_links: items })} fields={[{ key: "platform", label: "প্ল্যাটফর্ম নাম" }, { key: "url", label: "URL" }, { key: "icon", label: "Icon (Facebook, Instagram, Twitter, Youtube)" }]} addLabel="নতুন সোশ্যাল লিংক যোগ করুন" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-3 block">দ্রুত লিংক</Label>
            <ListEditor items={data.quick_links || []} setItems={(items) => setData({ ...data, quick_links: items })} fields={[{ key: "label", label: "লেবেল" }, { key: "url", label: "URL" }]} addLabel="নতুন লিংক যোগ করুন" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-3 block">সার্ভিস লিংক</Label>
            <ListEditor items={data.service_links || []} setItems={(items) => setData({ ...data, service_links: items })} fields={[{ key: "label", label: "সার্ভিস নাম" }, { key: "url", label: "URL" }]} addLabel="নতুন সার্ভিস লিংক যোগ করুন" />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}

export default function AdminWebsiteContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          ওয়েবসাইট কনটেন্ট
        </h1>
        <p className="text-sm text-muted-foreground">ওয়েবসাইটের প্রতিটি সেকশনের কনটেন্ট এডিট করুন</p>
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
        </div>
      </Tabs>
    </div>
  );
}
