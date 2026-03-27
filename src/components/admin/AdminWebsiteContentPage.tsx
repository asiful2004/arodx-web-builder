import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Save, Loader2, Plus, Trash2, Pencil, X, ChevronRight,
  Layout, DollarSign, Users, Briefcase, Mail, Image, FileText, Settings, Eye, Check, Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

/* ─── Shared helpers ─── */

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
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, key: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    setItems(updated);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3 relative">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeItem(i)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] font-bold text-primary tracking-widest">#{i + 1}</span>
          {fields.map((f) => (
            <FieldInput key={f.key} label={f.label} value={item[f.key] || ""} onChange={(v) => updateItem(i, f.key, v)} multiline={f.multiline} />
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="gap-2 w-full">
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}

/* ─── Section config ─── */

interface SectionConfig {
  key: string;
  title: string;
  icon: any;
  color: string;
  previewRender: (data: any) => React.ReactNode;
  editorRender: (data: any, setData: (d: any) => void) => React.ReactNode;
}

/* ─── Preview components for each section ─── */

function HeroPreview({ data }: { data: any }) {
  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center space-y-3">
      {data?.badge && <span className="inline-block px-3 py-1 text-[10px] font-medium rounded-full border border-primary/30 text-primary bg-primary/5">{data.badge}</span>}
      <h3 className="text-lg font-bold font-display">{data?.title_prefix} <span className="text-primary">{data?.title_brand}</span></h3>
      <p className="text-xs text-muted-foreground">{data?.subtitle}</p>
      <div className="flex gap-2 justify-center">
        {data?.cta_primary_text && <span className="px-3 py-1.5 text-[10px] rounded-md bg-primary text-primary-foreground">{data.cta_primary_text}</span>}
        {data?.cta_secondary_text && <span className="px-3 py-1.5 text-[10px] rounded-md border border-border">{data.cta_secondary_text}</span>}
      </div>
    </div>
  );
}

function AboutPreview({ data }: { data: any }) {
  return (
    <div className="space-y-3 p-4">
      {data?.badge && <span className="inline-block px-3 py-1 text-[10px] font-medium rounded-full border border-primary/30 text-primary bg-primary/5">{data.badge}</span>}
      <h3 className="text-base font-bold font-display">{data?.title} <span className="text-primary">{data?.title_brand}</span></h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{data?.description1}</p>
      {data?.stats?.length > 0 && (
        <div className="flex gap-4">
          {data.stats.slice(0, 4).map((s: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-sm font-bold text-primary">{s.number}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesPreview({ data }: { data: any }) {
  return (
    <div className="space-y-3 p-4">
      <h3 className="text-base font-bold font-display">{data?.title} <span className="text-primary">{data?.title_highlight}</span></h3>
      <div className="grid grid-cols-2 gap-2">
        {(data?.items || []).slice(0, 4).map((s: any, i: number) => (
          <div key={i} className="p-2 rounded-lg border border-border bg-card text-center">
            <div className="text-xs font-semibold">{s.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPreview({ data }: { data: any }) {
  return (
    <div className="space-y-3 p-4">
      <h3 className="text-base font-bold font-display">{data?.title} <span className="text-primary">{data?.title_highlight}</span></h3>
      <div className="flex gap-2 overflow-x-auto">
        {(data?.packages || []).slice(0, 3).map((p: any, i: number) => (
          <div key={i} className={cn("shrink-0 p-3 rounded-lg border text-center min-w-[100px]", p.popular ? "border-primary bg-primary/5" : "border-border bg-card")}>
            <div className="text-xs font-bold">{p.name}</div>
            <div className="text-sm font-bold text-primary mt-1">{p.currency}{p.regularPrice}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2 p-4">
      <h3 className="text-base font-bold font-display">{data?.title_prefix} <span className="text-primary">{data?.title_highlight}</span></h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{data?.subtitle}</p>
      <div className="flex gap-3 text-[10px]">
        <span className="px-2 py-1 bg-destructive/10 text-destructive rounded">{data?.hiring_title}</span>
        <span className="px-2 py-1 bg-primary/10 text-primary rounded">{data?.arodx_title}</span>
      </div>
    </div>
  );
}

function ProcessPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2 p-4">
      <h3 className="text-base font-bold font-display">{data?.title} <span className="text-primary">{data?.title_highlight}</span></h3>
      <div className="flex gap-2">
        {(data?.steps || []).slice(0, 4).map((s: any, i: number) => (
          <div key={i} className="flex-1 p-2 rounded-lg border border-border bg-card text-center">
            <div className="text-xs font-bold text-primary">{s.number}</div>
            <div className="text-[10px]">{s.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2 p-4">
      <h3 className="text-base font-bold font-display">{data?.title} <span className="text-primary">{data?.title_highlight}</span></h3>
      <div className="grid grid-cols-3 gap-2">
        {(data?.projects || []).slice(0, 3).map((p: any, i: number) => (
          <div key={i} className="rounded-lg border border-border overflow-hidden">
            {p.image && <img src={p.image} alt={p.title} className="w-full h-16 object-cover" />}
            <div className="p-1.5">
              <div className="text-[10px] font-semibold truncate">{p.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2 p-4">
      <h3 className="text-base font-bold font-display">{data?.title} <span className="text-primary">{data?.title_highlight}</span></h3>
      <div className="space-y-1 text-xs text-muted-foreground">
        {data?.email && <div>Email: {data.email}</div>}
        {data?.phone && <div>Phone: {data.phone}</div>}
        {data?.address && <div>Address: {data.address}</div>}
      </div>
    </div>
  );
}

function FooterPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
      <div className="text-sm font-bold">{data?.brand_name}</div>
      <p className="text-[10px] text-muted-foreground">{data?.tagline}</p>
      <p className="text-[10px] text-muted-foreground">{data?.copyright_text}</p>
    </div>
  );
}

function BrandingPreview({ data }: { data: any }) {
  return (
    <div className="p-5 flex items-center gap-6">
      {data?.logo_url ? (
        <div className="flex flex-col items-center gap-1.5">
          <img src={data.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-border bg-background p-1" />
          <span className="text-[10px] text-muted-foreground">লোগো</span>
        </div>
      ) : (
        <div className="h-12 w-12 rounded-lg border border-dashed border-border flex items-center justify-center">
          <Image className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}
      {data?.favicon_url ? (
        <div className="flex flex-col items-center gap-1.5">
          <img src={data.favicon_url} alt="Favicon" className="h-8 w-8 object-contain rounded border border-border bg-background p-0.5" />
          <span className="text-[10px] text-muted-foreground">ফেভিকন</span>
        </div>
      ) : (
        <div className="h-8 w-8 rounded border border-dashed border-border flex items-center justify-center">
          <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
        </div>
      )}
      {data?.preloader_logo_url ? (
        <div className="flex flex-col items-center gap-1.5">
          <img src={data.preloader_logo_url} alt="Preloader" className="h-12 w-12 object-contain rounded-lg border border-border bg-background p-1" />
          <span className="text-[10px] text-muted-foreground">লোডিং লোগো</span>
        </div>
      ) : (
        <div className="h-12 w-12 rounded-lg border border-dashed border-border flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

function BrandingUploadField({ label, hint, currentUrl, fieldKey, data, setData, previewSize = "h-14 w-14" }: {
  label: string; hint: string; currentUrl: string | null; fieldKey: string; data: any; setData: (d: any) => void; previewSize?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${fieldKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      setData({ ...data, [fieldKey]: urlData.publicUrl });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => setData({ ...data, [fieldKey]: "" });

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <p className="text-[11px] text-muted-foreground/70">{hint}</p>
      <div className="flex items-center gap-4">
        <div className={cn("rounded-xl border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center overflow-hidden shrink-0", previewSize)}>
          {currentUrl ? (
            <img src={currentUrl} alt={label} className="w-full h-full object-contain p-1" />
          ) : (
            <Image className="h-5 w-5 text-muted-foreground/30" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {currentUrl ? "পরিবর্তন" : "আপলোড"}
            </Button>
            {currentUrl && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={handleRemove}>
                <Trash2 className="h-3 w-3" /> সরান
              </Button>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">PNG, JPG, SVG, GIF, WEBP • সর্বোচ্চ ৫MB</span>
        </div>
        <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.gif,.webp,.ico" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
}

function PreloaderIpRulesEditor({ data, setData }: { data: any; setData: (d: any) => void }) {
  const ipRules: { ip: string; enabled: boolean }[] = data?.preloader_ip_rules || [];
  const setRules = (rules: any[]) => setData({ ...data, preloader_ip_rules: rules });

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">নির্দিষ্ট IP-তে লোডিং অ্যানিমেশন কন্ট্রোল</Label>
      <p className="text-[11px] text-muted-foreground/70">নির্দিষ্ট IP address-এ আলাদাভাবে preloader on/off করতে পারবেন। এটি গ্লোবাল সেটিং ওভাররাইড করবে।</p>
      {ipRules.map((rule: any, i: number) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <Input
            value={rule.ip}
            onChange={(e) => { const u = [...ipRules]; u[i] = { ...u[i], ip: e.target.value }; setRules(u); }}
            placeholder="যেমন: 103.123.45.67"
            className="text-sm flex-1"
          />
          <div className="flex items-center gap-2 shrink-0">
            <Label className="text-xs text-muted-foreground">চালু</Label>
            <Switch
              checked={rule.enabled}
              onCheckedChange={(v) => { const u = [...ipRules]; u[i] = { ...u[i], enabled: v }; setRules(u); }}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => setRules(ipRules.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => setRules([...ipRules, { ip: "", enabled: false }])}>
        <Plus className="h-4 w-4" /> নতুন IP রুল যোগ করুন
      </Button>
    </div>
  );
}

function brandingEditor(data: any, setData: (d: any) => void) {
  return (
    <div className="space-y-6">
      <BrandingUploadField label="সাইট লোগো" hint="Navbar-এ দেখাবে" currentUrl={data.logo_url} fieldKey="logo_url" data={data} setData={setData} />
      <BrandingUploadField label="ফেভিকন" hint="ব্রাউজার ট্যাবে দেখাবে" currentUrl={data.favicon_url} fieldKey="favicon_url" data={data} setData={setData} previewSize="h-10 w-10" />
      <BrandingUploadField label="লোডিং অ্যানিমেশন লোগো" hint="Preloader-এ দেখাবে (GIF/PNG)" currentUrl={data.preloader_logo_url} fieldKey="preloader_logo_url" data={data} setData={setData} />

      {/* Preloader on/off toggle */}
      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">লোডিং অ্যানিমেশন</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">ওয়েবসাইট খোলার সময় loading animation দেখানো হবে কিনা</p>
          </div>
          <Switch
            checked={data.preloader_enabled !== false}
            onCheckedChange={(v) => setData({ ...data, preloader_enabled: v })}
          />
        </div>

        {/* IP-specific rules */}
        <PreloaderIpRulesEditor data={data} setData={setData} />
      </div>
    </div>
  );
}

/* ─── Editor renderers ─── */

function heroEditor(data: any, setData: (d: any) => void) {
  return (
    <div className="space-y-4">
      <FieldInput label="Badge টেক্সট" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
      <FieldInput label="Title Prefix" value={data.title_prefix} onChange={(v) => setData({ ...data, title_prefix: v })} />
      <FieldInput label="Brand Name" value={data.title_brand} onChange={(v) => setData({ ...data, title_brand: v })} />
      <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} />
      <FieldInput label="Description" value={data.description} onChange={(v) => setData({ ...data, description: v })} multiline />
      <div className="grid grid-cols-2 gap-4">
        <FieldInput label="Primary Button Text" value={data.cta_primary_text} onChange={(v) => setData({ ...data, cta_primary_text: v })} />
        <FieldInput label="Primary Button Link" value={data.cta_primary_link} onChange={(v) => setData({ ...data, cta_primary_link: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FieldInput label="Secondary Button Text" value={data.cta_secondary_text} onChange={(v) => setData({ ...data, cta_secondary_text: v })} />
        <FieldInput label="Secondary Button Link" value={data.cta_secondary_link} onChange={(v) => setData({ ...data, cta_secondary_link: v })} />
      </div>
    </div>
  );
}

function aboutEditor(data: any, setData: (d: any) => void) {
  return (
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
  );
}

function servicesEditor(data: any, setData: (d: any) => void) {
  return (
    <div className="space-y-6">
      <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
      <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
      <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
      <div>
        <Label className="text-sm font-semibold mb-3 block">সার্ভিস তালিকা</Label>
        <ListEditor items={data.items || []} setItems={(items) => setData({ ...data, items: items })} fields={[{ key: "title", label: "সার্ভিস নাম" }, { key: "description", label: "বর্ণনা", multiline: true }, { key: "icon", label: "Icon (Globe, TrendingUp, Video, Settings, Megaphone, PenTool)" }]} addLabel="নতুন সার্ভিস যোগ করুন" />
      </div>
    </div>
  );
}

function pricingEditor(data: any, setData: (d: any) => void) {
  return (
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
  );
}

function comparisonEditor(data: any, setData: (d: any) => void) {
  return (
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
  );
}

function processEditor(data: any, setData: (d: any) => void) {
  return (
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
  );
}

function portfolioEditor(data: any, setData: (d: any) => void) {
  return (
    <div className="space-y-6">
      <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
      <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
      <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
      <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} multiline />
      <div>
        <Label className="text-sm font-semibold mb-3 block">প্রজেক্টসমূহ</Label>
        <ListEditor items={data.projects || []} setItems={(items) => setData({ ...data, projects: items })} fields={[{ key: "title", label: "প্রজেক্ট নাম" }, { key: "category", label: "ক্যাটাগরি" }, { key: "description", label: "বর্ণনা", multiline: true }, { key: "image", label: "ইমেজ URL" }, { key: "link", label: "প্রজেক্ট লিংক (URL)" }]} />
      </div>
    </div>
  );
}

/* ─── Office hours ─── */

const DAYS_OF_WEEK = [
  { day: "শনিবার", dayIndex: 6 }, { day: "রবিবার", dayIndex: 0 }, { day: "সোমবার", dayIndex: 1 },
  { day: "মঙ্গলবার", dayIndex: 2 }, { day: "বুধবার", dayIndex: 3 }, { day: "বৃহস্পতিবার", dayIndex: 4 }, { day: "শুক্রবার", dayIndex: 5 },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? "00" : "30";
  const value24 = `${String(h).padStart(2, "0")}:${m}`;
  const period = h < 12 ? "AM" : "PM"; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { value: value24, label: `${h12}:${m} ${period}` };
});

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <select value={value || "08:00"} onChange={(e) => onChange(e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
        {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
    </div>
  );
}

function OfficeHoursEditor({ data, setData }: { data: any; setData: (d: any) => void }) {
  const getSchedule = () => {
    if (data.office_hours?.schedule) return data.office_hours.schedule;
    return DAYS_OF_WEEK.map((d) => ({ day: d.day, dayIndex: d.dayIndex, enabled: d.dayIndex !== 5, open: "08:00", close: "00:00" }));
  };
  const schedule = getSchedule();
  const updateDay = (idx: number, field: string, value: any) => {
    const updated = [...schedule]; updated[idx] = { ...updated[idx], [field]: value };
    setData({ ...data, office_hours: { ...data.office_hours, schedule: updated } });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold block">অফিস সময়সূচি</Label>
      <div className="space-y-2">
        {schedule.map((entry: any, idx: number) => (
          <div key={entry.day} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors", entry.enabled ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30 opacity-60")}>
            <Switch checked={entry.enabled} onCheckedChange={(v) => updateDay(idx, "enabled", v)} />
            <span className="text-sm font-medium w-24 shrink-0">{entry.day}</span>
            {entry.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <TimeSelect label="খোলা" value={entry.open} onChange={(v) => updateDay(idx, "open", v)} />
                <span className="text-muted-foreground text-xs mt-4">-</span>
                <TimeSelect label="বন্ধ" value={entry.close} onChange={(v) => updateDay(idx, "close", v)} />
              </div>
            ) : (
              <span className="text-xs text-destructive font-medium">বন্ধ</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function contactEditor(data: any, setData: (d: any) => void) {
  return (
    <div className="space-y-4">
      <FieldInput label="Badge" value={data.badge} onChange={(v) => setData({ ...data, badge: v })} />
      <FieldInput label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} />
      <FieldInput label="Title Highlight" value={data.title_highlight} onChange={(v) => setData({ ...data, title_highlight: v })} />
      <FieldInput label="Subtitle" value={data.subtitle} onChange={(v) => setData({ ...data, subtitle: v })} multiline />
      <FieldInput label="ইমেইল" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
      <FieldInput label="ফোন" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
      <FieldInput label="ঠিকানা" value={data.address} onChange={(v) => setData({ ...data, address: v })} />
      <OfficeHoursEditor data={data} setData={setData} />
    </div>
  );
}

function footerEditor(data: any, setData: (d: any) => void) {
  return (
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
  );
}

/* ─── Payment Methods Preview & Editor ─── */

function PaymentMethodsPreview({ data }: { data: any }) {
  const methods = data?.methods || [];
  return (
    <div className="p-4 space-y-2">
      <h3 className="text-base font-bold font-display">পেমেন্ট মেথড ({methods.length}টি)</h3>
      <div className="flex gap-3 flex-wrap">
        {methods.map((m: any, i: number) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
            {m.logo_url ? (
              <img src={m.logo_url} alt={m.name} className="h-6 w-6 object-contain" />
            ) : (
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[8px] font-bold">{(m.name || "?")[0]}</div>
            )}
            <div>
              <div className="text-xs font-semibold">{m.name || "Unnamed"}</div>
              <div className="text-[10px] text-muted-foreground">{m.number || "—"}</div>
            </div>
          </div>
        ))}
        {methods.length === 0 && <p className="text-xs text-muted-foreground">কোনো পেমেন্ট মেথড নেই</p>}
      </div>
    </div>
  );
}

function PaymentMethodIconUpload({ index, method, methods, setMethods }: {
  index: number; method: any; methods: any[]; setMethods: (m: any[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `payment-icon-${index}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      const updated = [...methods];
      updated[index] = { ...updated[index], logo_url: urlData.publicUrl };
      setMethods(updated);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-lg border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center overflow-hidden shrink-0">
        {method.logo_url ? (
          <img src={method.logo_url} alt={method.name} className="w-full h-full object-contain p-1" />
        ) : (
          <Image className="h-5 w-5 text-muted-foreground/30" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {method.logo_url ? "পরিবর্তন" : "আইকন আপলোড"}
          </Button>
          {method.logo_url && (
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => {
              const updated = [...methods];
              updated[index] = { ...updated[index], logo_url: "" };
              setMethods(updated);
            }}>
              <Trash2 className="h-3 w-3" /> সরান
            </Button>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">PNG, JPG, SVG • সর্বোচ্চ ৫MB</span>
      </div>
      <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.gif,.webp" className="hidden" onChange={handleUpload} />
    </div>
  );
}

function paymentMethodsEditor(data: any, setData: (d: any) => void) {
  const methods = data?.methods || [];
  const setMethods = (m: any[]) => setData({ ...data, methods: m });

  return (
    <div className="space-y-6">
      {methods.map((method: any, i: number) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">{method.name || `মেথড #${i + 1}`}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setMethods(methods.filter((_: any, idx: number) => idx !== i))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <PaymentMethodIconUpload index={i} method={method} methods={methods} setMethods={setMethods} />

          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="নাম" value={method.name || ""} onChange={(v) => { const u = [...methods]; u[i] = { ...u[i], name: v }; setMethods(u); }} />
            <FieldInput label="নম্বর" value={method.number || ""} onChange={(v) => { const u = [...methods]; u[i] = { ...u[i], number: v }; setMethods(u); }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">ব্র্যান্ড কালার</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={method.color || "#000000"}
                onChange={(e) => { const u = [...methods]; u[i] = { ...u[i], color: e.target.value }; setMethods(u); }}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
              />
              <Input
                value={method.color || ""}
                onChange={(e) => { const u = [...methods]; u[i] = { ...u[i], color: e.target.value }; setMethods(u); }}
                placeholder="#E2136E"
                className="text-sm font-mono flex-1"
              />
            </div>
          </div>
          <FieldInput label="কাস্টম ইন্সট্রাকশন (এই মেথডের জন্য)" value={method.instruction || ""} onChange={(v) => { const u = [...methods]; u[i] = { ...u[i], instruction: v }; setMethods(u); }} multiline />
        </div>
      ))}

      <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => {
        setMethods([...methods, { name: "", number: "", color: "#000000", logo_url: "", instruction: "" }]);
      }}>
        <Plus className="h-4 w-4" /> নতুন পেমেন্ট মেথড যোগ করুন
      </Button>
    </div>
  );
}

/* ─── Section definitions ─── */

const SECTIONS: SectionConfig[] = [
  { key: "branding", title: "ব্র্যান্ডিং (লোগো, ফেভিকন, লোডিং)", icon: Image, color: "from-orange-500/20 to-orange-600/10", previewRender: (d) => <BrandingPreview data={d} />, editorRender: brandingEditor },
  { key: "hero", title: "Hero Section", icon: Layout, color: "from-blue-500/20 to-blue-600/10", previewRender: (d) => <HeroPreview data={d} />, editorRender: heroEditor },
  { key: "about", title: "About Section", icon: Users, color: "from-violet-500/20 to-violet-600/10", previewRender: (d) => <AboutPreview data={d} />, editorRender: aboutEditor },
  { key: "services", title: "Services Section", icon: Briefcase, color: "from-emerald-500/20 to-emerald-600/10", previewRender: (d) => <ServicesPreview data={d} />, editorRender: servicesEditor },
  { key: "pricing", title: "Pricing Section", icon: DollarSign, color: "from-amber-500/20 to-amber-600/10", previewRender: (d) => <PricingPreview data={d} />, editorRender: pricingEditor },
  { key: "payment_methods", title: "পেমেন্ট মেথড", icon: DollarSign, color: "from-lime-500/20 to-lime-600/10", previewRender: (d) => <PaymentMethodsPreview data={d} />, editorRender: paymentMethodsEditor },
  { key: "comparison", title: "Comparison Section", icon: Users, color: "from-rose-500/20 to-rose-600/10", previewRender: (d) => <ComparisonPreview data={d} />, editorRender: comparisonEditor },
  { key: "process", title: "Process Section", icon: Settings, color: "from-cyan-500/20 to-cyan-600/10", previewRender: (d) => <ProcessPreview data={d} />, editorRender: processEditor },
  { key: "portfolio", title: "Portfolio Section", icon: Image, color: "from-pink-500/20 to-pink-600/10", previewRender: (d) => <PortfolioPreview data={d} />, editorRender: portfolioEditor },
  { key: "contact", title: "Contact Section", icon: Mail, color: "from-teal-500/20 to-teal-600/10", previewRender: (d) => <ContactPreview data={d} />, editorRender: contactEditor },
  { key: "footer", title: "Footer", icon: FileText, color: "from-gray-500/20 to-gray-600/10", previewRender: (d) => <FooterPreview data={d} />, editorRender: footerEditor },
];

/* ─── Section Card with inline edit ─── */

function SectionCard({ section }: { section: SectionConfig }) {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSetting();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [localData, setLocalData] = useState<any>(null);

  const sectionData = settings?.[section.key];

  useEffect(() => {
    if (sectionData && !localData) {
      setLocalData(sectionData);
    }
  }, [sectionData]);

  const handleEdit = () => {
    setLocalData(sectionData || {});
    setEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { key: section.key, value: localData },
      {
        onSuccess: () => {
          toast({ title: `${section.title} আপডেট হয়েছে!` });
          setEditing(false);
        },
        onError: () => toast({ title: "Error", description: "আপডেট করতে সমস্যা হয়েছে", variant: "destructive" }),
      }
    );
  };

  const handleCancel = () => {
    setLocalData(sectionData || {});
    setEditing(false);
  };

  const Icon = section.icon;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden group hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className={cn("px-5 py-4 bg-gradient-to-r flex items-center justify-between", section.color)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center shadow-sm">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold font-display">{section.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 gap-1.5 text-xs">
                <X className="h-3.5 w-3.5" /> বাতিল
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-8 gap-1.5 text-xs">
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                পাবলিশ
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={handleEdit} className="h-8 gap-1.5 text-xs bg-background/80 backdrop-blur">
              <Pencil className="h-3.5 w-3.5" /> এডিট
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-5 border-t border-border"
            >
              {localData && section.editorRender(localData, setLocalData)}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer"
              onClick={handleEdit}
            >
              {sectionData ? section.previewRender(sectionData) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  কনটেন্ট সেট করা হয়নি - এডিট করতে ক্লিক করুন
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─── */

export default function AdminWebsiteContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            ওয়েবসাইট কনটেন্ট
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            প্রতিটি সেকশনের প্রিভিউ দেখুন এবং পেন্সিল আইকনে ক্লিক করে এডিট করুন
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" /> ওয়েবসাইট দেখুন
          </Button>
        </a>
      </div>

      <div className="grid gap-5">
        {SECTIONS.map((section) => (
          <SectionCard key={section.key} section={section} />
        ))}
      </div>
    </div>
  );
}
