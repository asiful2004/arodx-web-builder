import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Search, Globe, FileText, BarChart3, TrendingUp, Eye, MousePointerClick,
  AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Minus,
  Save, RefreshCw, Smartphone, Monitor, Zap, Link2, Image as ImageIcon, Type,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

interface SEOConfig {
  home_title: string;
  home_description: string;
  home_keywords: string;
  og_image: string;
  og_type: string;
  twitter_card: string;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  structured_data_enabled: boolean;
  sitemap_enabled: boolean;
  auto_meta_enabled: boolean;
  google_verification: string;
  bing_verification: string;
}

const defaultSEO: SEOConfig = {
  home_title: "Arodx - বাংলাদেশের সেরা Digital Agency",
  home_description: "Arodx হলো বাংলাদেশের অন্যতম সেরা ডিজিটাল এজেন্সি।",
  home_keywords: "arodx, digital agency, web development, bangladesh",
  og_image: "",
  og_type: "website",
  twitter_card: "summary_large_image",
  canonical_url: "https://arodx.com",
  robots_index: true,
  robots_follow: true,
  structured_data_enabled: true,
  sitemap_enabled: true,
  auto_meta_enabled: true,
  google_verification: "",
  bing_verification: "",
};

// SEO Score calculator
function calcSEOScore(config: SEOConfig): { score: number; issues: { type: "error" | "warning" | "success"; msg: string }[] } {
  const issues: { type: "error" | "warning" | "success"; msg: string }[] = [];
  let score = 0;
  const max = 100;

  // Title
  if (config.home_title.length >= 30 && config.home_title.length <= 60) {
    score += 15; issues.push({ type: "success", msg: "Title length optimal (30-60 chars)" });
  } else if (config.home_title.length > 0) {
    score += 8; issues.push({ type: "warning", msg: `Title length: ${config.home_title.length} chars (ideal: 30-60)` });
  } else {
    issues.push({ type: "error", msg: "Missing page title" });
  }

  // Description
  if (config.home_description.length >= 120 && config.home_description.length <= 160) {
    score += 15; issues.push({ type: "success", msg: "Meta description length optimal" });
  } else if (config.home_description.length > 0) {
    score += 8; issues.push({ type: "warning", msg: `Description: ${config.home_description.length} chars (ideal: 120-160)` });
  } else {
    issues.push({ type: "error", msg: "Missing meta description" });
  }

  // Keywords
  if (config.home_keywords.split(",").filter(Boolean).length >= 3) {
    score += 10; issues.push({ type: "success", msg: "Keywords defined" });
  } else if (config.home_keywords.length > 0) {
    score += 5; issues.push({ type: "warning", msg: "Add more keywords (at least 3)" });
  } else {
    issues.push({ type: "error", msg: "No keywords defined" });
  }

  // OG Image
  if (config.og_image) { score += 10; issues.push({ type: "success", msg: "OG image set" }); }
  else { issues.push({ type: "warning", msg: "No OG image set for social sharing" }); }

  // Canonical
  if (config.canonical_url) { score += 10; issues.push({ type: "success", msg: "Canonical URL set" }); }
  else { issues.push({ type: "warning", msg: "No canonical URL" }); }

  // Indexing
  if (config.robots_index) { score += 10; issues.push({ type: "success", msg: "Search indexing enabled" }); }
  else { issues.push({ type: "warning", msg: "Search indexing disabled" }); }

  // Structured data
  if (config.structured_data_enabled) { score += 10; issues.push({ type: "success", msg: "Structured data enabled" }); }
  else { issues.push({ type: "warning", msg: "Structured data disabled" }); }

  // Sitemap
  if (config.sitemap_enabled) { score += 10; issues.push({ type: "success", msg: "Sitemap enabled" }); }
  else { issues.push({ type: "warning", msg: "Sitemap disabled" }); }

  // Verification
  if (config.google_verification) { score += 5; issues.push({ type: "success", msg: "Google verification set" }); }
  else { issues.push({ type: "warning", msg: "No Google Search Console verification" }); }

  if (config.bing_verification) { score += 5; issues.push({ type: "success", msg: "Bing verification set" }); }

  return { score: Math.min(score, max), issues };
}

// Mock analytics data generators
function generatePageViewData() {
  const pages = ["/", "/signin", "/signup", "/dashboard", "/checkout", "/join-team"];
  return pages.map(p => ({
    page: p === "/" ? "Home" : p.replace("/", "").replace("-", " "),
    views: Math.floor(Math.random() * 2000) + 100,
    unique: Math.floor(Math.random() * 1200) + 50,
    bounce: Math.floor(Math.random() * 40) + 20,
    avgTime: `${Math.floor(Math.random() * 4) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
  }));
}

function generateTrafficTrend() {
  const days = ["সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি", "রবি"];
  return days.map(d => ({
    day: d,
    organic: Math.floor(Math.random() * 500) + 100,
    direct: Math.floor(Math.random() * 200) + 50,
    referral: Math.floor(Math.random() * 100) + 20,
    social: Math.floor(Math.random() * 80) + 10,
  }));
}

function generateKeywordData() {
  return [
    { keyword: "arodx", position: 3, change: 2, volume: 450, clicks: 120 },
    { keyword: "digital agency bangladesh", position: 7, change: -1, volume: 880, clicks: 85 },
    { keyword: "web development bd", position: 12, change: 5, volume: 1200, clicks: 45 },
    { keyword: "arodx web builder", position: 1, change: 0, volume: 220, clicks: 180 },
    { keyword: "best web agency dhaka", position: 15, change: 3, volume: 650, clicks: 30 },
    { keyword: "website design bangladesh", position: 9, change: -2, volume: 950, clicks: 65 },
    { keyword: "digital marketing dhaka", position: 18, change: 4, volume: 1100, clicks: 22 },
    { keyword: "arodx pricing", position: 2, change: 1, volume: 180, clicks: 95 },
  ];
}

function generateDeviceData() {
  return [
    { name: "Desktop", value: 45, color: "hsl(var(--primary))" },
    { name: "Mobile", value: 42, color: "hsl(var(--accent))" },
    { name: "Tablet", value: 13, color: "hsl(var(--muted-foreground))" },
  ];
}

function generateCrawlData() {
  return [
    { page: "/", status: "indexed", lastCrawl: "2 ঘণ্টা আগে" },
    { page: "/signin", status: "indexed", lastCrawl: "6 ঘণ্টা আগে" },
    { page: "/signup", status: "indexed", lastCrawl: "1 দিন আগে" },
    { page: "/dashboard", status: "noindex", lastCrawl: "N/A" },
    { page: "/admin", status: "noindex", lastCrawl: "N/A" },
    { page: "/checkout", status: "indexed", lastCrawl: "3 দিন আগে" },
  ];
}

export default function AdminSEOPage() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [config, setConfig] = useState<SEOConfig>(defaultSEO);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Load from DB
  useEffect(() => {
    if (settings?.seo_config) {
      setConfig({ ...defaultSEO, ...(settings.seo_config as any) });
    }
  }, [settings]);

  const { score, issues } = calcSEOScore(config);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "seo_config", value: config });
      toast.success("SEO সেটিংস সেভ হয়েছে");
    } catch {
      toast.error("সেভ করতে সমস্যা হয়েছে");
    }
    setSaving(false);
  };

  const pageViewData = generatePageViewData();
  const trafficTrend = generateTrafficTrend();
  const keywordData = generateKeywordData();
  const deviceData = generateDeviceData();
  const crawlData = generateCrawlData();

  const scoreColor = score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const scoreBg = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            SEO ম্যানেজমেন্ট
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            সার্চ ইঞ্জিন অপ্টিমাইজেশন সেটিংস ও অ্যানালিটিক্স
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "সেভ হচ্ছে..." : "সেটিংস সেভ করুন"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> ওভারভিউ
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> সেটিংস
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> অ্যানালিটিক্স
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> কিওয়ার্ডস
          </TabsTrigger>
          <TabsTrigger value="technical" className="gap-1.5">
            <Globe className="w-3.5 h-3.5" /> টেকনিক্যাল
          </TabsTrigger>
        </TabsList>

        {/* === OVERVIEW TAB === */}
        <TabsContent value="overview" className="space-y-6">
          {/* Score Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">SEO স্কোর</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke={score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444"} strokeWidth="10" strokeDasharray={`${score * 3.27} 327`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <Badge variant={score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive"}>
                  {score >= 80 ? "ভালো" : score >= 50 ? "মোটামুটি" : "দুর্বল"}
                </Badge>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">SEO চেকলিস্ট</CardTitle>
                <CardDescription>
                  {issues.filter(i => i.type === "success").length}/{issues.length} আইটেম পাস করেছে
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                  {issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm py-1.5 px-2 rounded-md bg-muted/30">
                      {issue.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      ) : issue.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <span>{issue.msg}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "মোট পেইজ ভিউ", value: "12,458", change: "+18%", up: true, icon: Eye },
              { label: "অর্গানিক ট্রাফিক", value: "4,832", change: "+25%", up: true, icon: TrendingUp },
              { label: "বাউন্স রেট", value: "32%", change: "-5%", up: true, icon: MousePointerClick },
              { label: "সার্চ ইম্প্রেশন", value: "28,900", change: "+12%", up: true, icon: Globe },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                    <span className={`text-xs flex items-center gap-0.5 ${stat.up ? "text-green-500" : "text-red-500"}`}>
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* === SETTINGS TAB === */}
        <TabsContent value="settings" className="space-y-6">
          {/* Meta Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="w-5 h-5" /> মেটা ট্যাগ সেটিংস
              </CardTitle>
              <CardDescription>সার্চ ইঞ্জিনে আপনার সাইট কিভাবে দেখাবে</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>পেইজ টাইটেল</Label>
                <Input
                  value={config.home_title}
                  onChange={e => setConfig({ ...config, home_title: e.target.value })}
                  placeholder="Your page title"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Google সার্চে দেখাবে</span>
                  <span className={`text-xs ${config.home_title.length > 60 ? "text-red-500" : "text-green-500"}`}>
                    {config.home_title.length}/60
                  </span>
                </div>
              </div>

              <div>
                <Label>মেটা ডেসক্রিপশন</Label>
                <Textarea
                  value={config.home_description}
                  onChange={e => setConfig({ ...config, home_description: e.target.value })}
                  placeholder="Your meta description"
                  rows={3}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">সার্চ রেজাল্টে snippet হিসেবে দেখাবে</span>
                  <span className={`text-xs ${config.home_description.length > 160 ? "text-red-500" : "text-green-500"}`}>
                    {config.home_description.length}/160
                  </span>
                </div>
              </div>

              <div>
                <Label>কিওয়ার্ডস (কমা দিয়ে আলাদা করুন)</Label>
                <Input
                  value={config.home_keywords}
                  onChange={e => setConfig({ ...config, home_keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {config.home_keywords.split(",").filter(k => k.trim()).length} টি কিওয়ার্ড
                </p>
              </div>

              {/* Google Preview */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-2">Google প্রিভিউ</p>
                <div className="space-y-0.5">
                  <p className="text-blue-600 text-lg leading-tight line-clamp-1 cursor-pointer hover:underline">
                    {config.home_title || "Page Title"}
                  </p>
                  <p className="text-green-700 text-sm">{config.canonical_url || "https://example.com"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {config.home_description || "Meta description will appear here..."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social & OG */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="w-5 h-5" /> সোশ্যাল মিডিয়া / Open Graph
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>OG Image URL</Label>
                <Input
                  value={config.og_image}
                  onChange={e => setConfig({ ...config, og_image: e.target.value })}
                  placeholder="https://example.com/og-image.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>OG Type</Label>
                  <Input
                    value={config.og_type}
                    onChange={e => setConfig({ ...config, og_type: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Twitter Card</Label>
                  <Input
                    value={config.twitter_card}
                    onChange={e => setConfig({ ...config, twitter_card: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indexing & Technical */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="w-5 h-5" /> ইনডেক্সিং ও টেকনিক্যাল
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Canonical URL</Label>
                <Input
                  value={config.canonical_url}
                  onChange={e => setConfig({ ...config, canonical_url: e.target.value })}
                  placeholder="https://arodx.com"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">সার্চ ইনডেক্সিং</p>
                    <p className="text-xs text-muted-foreground">Google কে ইনডেক্স করতে দিন</p>
                  </div>
                  <Switch checked={config.robots_index} onCheckedChange={v => setConfig({ ...config, robots_index: v })} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">লিংক ফলো</p>
                    <p className="text-xs text-muted-foreground">লিংক ফলো করতে দিন</p>
                  </div>
                  <Switch checked={config.robots_follow} onCheckedChange={v => setConfig({ ...config, robots_follow: v })} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Structured Data (JSON-LD)</p>
                    <p className="text-xs text-muted-foreground">Rich snippets সক্রিয় করুন</p>
                  </div>
                  <Switch checked={config.structured_data_enabled} onCheckedChange={v => setConfig({ ...config, structured_data_enabled: v })} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Sitemap</p>
                    <p className="text-xs text-muted-foreground">XML Sitemap সক্রিয় করুন</p>
                  </div>
                  <Switch checked={config.sitemap_enabled} onCheckedChange={v => setConfig({ ...config, sitemap_enabled: v })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Google Verification Code</Label>
                  <Input
                    value={config.google_verification}
                    onChange={e => setConfig({ ...config, google_verification: e.target.value })}
                    placeholder="google-site-verification=..."
                  />
                </div>
                <div>
                  <Label>Bing Verification Code</Label>
                  <Input
                    value={config.bing_verification}
                    onChange={e => setConfig({ ...config, bing_verification: e.target.value })}
                    placeholder="msvalidate.01=..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ANALYTICS TAB === */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Traffic Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ট্রাফিক ট্রেন্ড (সাপ্তাহিক)</CardTitle>
              <CardDescription>সোর্স অনুযায়ী ভিজিটর</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                organic: { label: "Organic", color: "hsl(var(--primary))" },
                direct: { label: "Direct", color: "hsl(142, 76%, 36%)" },
                referral: { label: "Referral", color: "hsl(221, 83%, 53%)" },
                social: { label: "Social", color: "hsl(280, 67%, 50%)" },
              }} className="h-[300px]">
                <AreaChart data={trafficTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="organic" stackId="1" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="direct" stackId="1" fill="hsl(142, 76%, 36%)" stroke="hsl(142, 76%, 36%)" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="referral" stackId="1" fill="hsl(221, 83%, 53%)" stroke="hsl(221, 83%, 53%)" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="social" stackId="1" fill="hsl(280, 67%, 50%)" stroke="hsl(280, 67%, 50%)" fillOpacity={0.3} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Page Views Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">পেইজ ভিউ</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  views: { label: "Views", color: "hsl(var(--primary))" },
                  unique: { label: "Unique", color: "hsl(var(--accent))" },
                }} className="h-[260px]">
                  <BarChart data={pageViewData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="page" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unique" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Device Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ডিভাইস ব্রেকডাউন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ChartContainer config={{
                    Desktop: { label: "Desktop", color: "hsl(var(--primary))" },
                    Mobile: { label: "Mobile", color: "hsl(var(--accent))" },
                    Tablet: { label: "Tablet", color: "hsl(var(--muted-foreground))" },
                  }} className="h-[220px] w-[220px]">
                    <PieChart>
                      <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} strokeWidth={2}>
                        {deviceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="space-y-3">
                    {deviceData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            {d.name === "Desktop" ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                            {d.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{d.value}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Page Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">পেইজ পারফরম্যান্স</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">পেইজ</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">ভিউ</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">ইউনিক</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">বাউন্স %</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">গড় সময়</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageViewData.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-medium">{row.page}</td>
                        <td className="text-right py-2.5 px-3">{row.views.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-3">{row.unique.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-3">
                          <span className={row.bounce > 40 ? "text-red-500" : "text-green-500"}>{row.bounce}%</span>
                        </td>
                        <td className="text-right py-2.5 px-3">{row.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === KEYWORDS TAB === */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">কিওয়ার্ড র‌্যাংকিং</CardTitle>
              <CardDescription>আপনার ওয়েবসাইটের সার্চ পজিশন</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">কিওয়ার্ড</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">পজিশন</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">পরিবর্তন</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">সার্চ ভলিউম</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">ক্লিকস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordData.map((kw, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-medium">{kw.keyword}</td>
                        <td className="text-center py-2.5 px-3">
                          <Badge variant={kw.position <= 3 ? "default" : kw.position <= 10 ? "secondary" : "outline"}>
                            #{kw.position}
                          </Badge>
                        </td>
                        <td className="text-center py-2.5 px-3">
                          <span className={`flex items-center justify-center gap-0.5 text-xs ${kw.change > 0 ? "text-green-500" : kw.change < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                            {kw.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : kw.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(kw.change)}
                          </span>
                        </td>
                        <td className="text-right py-2.5 px-3">{kw.volume.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-3">{kw.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Position Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">কিওয়ার্ড পজিশন ডিস্ট্রিবিউশন</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                clicks: { label: "Clicks", color: "hsl(var(--primary))" },
              }} className="h-[260px]">
                <BarChart data={keywordData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="keyword" type="category" width={180} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TECHNICAL TAB === */}
        <TabsContent value="technical" className="space-y-6">
          {/* Crawl Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ক্রল স্ট্যাটাস</CardTitle>
              <CardDescription>সার্চ ইঞ্জিন ক্রলিং এর অবস্থা</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">পেইজ</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">স্ট্যাটাস</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">শেষ ক্রল</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crawlData.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-mono text-xs">{row.page}</td>
                        <td className="text-center py-2.5 px-3">
                          <Badge variant={row.status === "indexed" ? "default" : "secondary"}>
                            {row.status === "indexed" ? "ইনডেক্সড" : "নো-ইনডেক্স"}
                          </Badge>
                        </td>
                        <td className="text-right py-2.5 px-3 text-muted-foreground">{row.lastCrawl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Technical Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "SSL Certificate", status: true, detail: "Active, Valid" },
              { label: "robots.txt", status: true, detail: "কনফিগার করা আছে" },
              { label: "sitemap.xml", status: config.sitemap_enabled, detail: config.sitemap_enabled ? "সক্রিয়" : "নিষ্ক্রিয়" },
              { label: "Canonical Tags", status: !!config.canonical_url, detail: config.canonical_url || "সেট করা হয়নি" },
              { label: "Mobile Responsive", status: true, detail: "মোবাইল ফ্রেন্ডলি" },
              { label: "Page Speed", status: true, detail: "ভালো (Score: 85+)" },
            ].map((check, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {check.status ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{check.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
