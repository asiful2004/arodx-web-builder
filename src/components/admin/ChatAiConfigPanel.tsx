import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Save, Loader2, MessageCircle, Layout, Sparkles, Plus, X, User } from "lucide-react";
import { toast } from "sonner";
import AiTestPanel from "./AiTestPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

interface AiSettings {
  id: string;
  enabled: boolean;
  auto_reply_delay: number;
  system_prompt: string;
}

interface ChatWidgetConfig {
  ai_agent_name: string;
  ai_agent_avatar: string;
  chat_position: "left" | "right";
  welcome_title: string;
  welcome_description: string;
  faq_questions: string[];
  header_title: string;
  show_agent_profiles: boolean;
}

const DEFAULT_CONFIG: ChatWidgetConfig = {
  ai_agent_name: "ArodX AI",
  ai_agent_avatar: "",
  chat_position: "left",
  welcome_title: "আমাদের সাথে চ্যাট করুন",
  welcome_description: "আমরা আপনাকে সাহায্য করতে প্রস্তুত।",
  faq_questions: [],
  header_title: "ArodX Support",
  show_agent_profiles: true,
};

export default function ChatAiConfigPanel() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [config, setConfig] = useState<ChatWidgetConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFaq, setNewFaq] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    // Fetch AI settings
    const { data: aiData } = await supabase
      .from("chat_ai_settings" as any)
      .select("id, enabled, auto_reply_delay, system_prompt")
      .limit(1)
      .single();
    if (aiData) setSettings(aiData as any);

    // Fetch widget config
    const { data: configData } = await supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", "chat_widget_config")
      .single();
    if (configData?.value) {
      setConfig({ ...DEFAULT_CONFIG, ...(configData.value as any) });
    }
    setLoading(false);
  };

  const updateAiField = (field: keyof AiSettings, value: any) => {
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const updateConfigField = (field: keyof ChatWidgetConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const addFaq = () => {
    if (!newFaq.trim()) return;
    setConfig((prev) => ({ ...prev, faq_questions: [...prev.faq_questions, newFaq.trim()] }));
    setNewFaq("");
  };

  const removeFaq = (index: number) => {
    setConfig((prev) => ({ ...prev, faq_questions: prev.faq_questions.filter((_, i) => i !== index) }));
  };

  const saveAll = async () => {
    setSaving(true);

    // Save AI settings
    if (settings) {
      const { error: aiError } = await supabase
        .from("chat_ai_settings" as any)
        .update({
          enabled: settings.enabled,
          auto_reply_delay: settings.auto_reply_delay,
          system_prompt: settings.system_prompt,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", settings.id);
      if (aiError) {
        toast.error("AI সেটিংস সেভ করতে সমস্যা হয়েছে");
        setSaving(false);
        return;
      }
    }

    // Save widget config
    const { error: configError } = await supabase
      .from("site_settings" as any)
      .upsert({
        key: "chat_widget_config",
        value: config,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "key" });

    if (configError) {
      toast.error("চ্যাট কনফিগ সেভ করতে সমস্যা হয়েছে");
    } else {
      toast.success("সমস্ত সেটিংস সেভ হয়েছে!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="widget" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="widget" className="text-xs gap-1">
            <Layout className="h-3.5 w-3.5" />
            উইজেট
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs gap-1">
            <Bot className="h-3.5 w-3.5" />
            AI সেটআপ
          </TabsTrigger>
          <TabsTrigger value="test" className="text-xs gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            টেস্ট
          </TabsTrigger>
        </TabsList>

        {/* Widget Customization */}
        <TabsContent value="widget" className="space-y-4 mt-4">
          {/* Header Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">হেডার টাইটেল</Label>
            <Input
              value={config.header_title}
              onChange={(e) => updateConfigField("header_title", e.target.value)}
              className="text-sm h-9"
              placeholder="ArodX Support"
            />
          </div>

          {/* Welcome Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">স্বাগত শিরোনাম</Label>
            <Input
              value={config.welcome_title}
              onChange={(e) => updateConfigField("welcome_title", e.target.value)}
              className="text-sm h-9"
            />
          </div>

          {/* Welcome Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">স্বাগত বিবরণ</Label>
            <Textarea
              value={config.welcome_description}
              onChange={(e) => updateConfigField("welcome_description", e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          {/* Chat Position */}
          <div className="space-y-1.5">
            <Label className="text-xs">চ্যাট পজিশন</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={config.chat_position === "left" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => updateConfigField("chat_position", "left")}
              >
                বামে
              </Button>
              <Button
                type="button"
                variant={config.chat_position === "right" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => updateConfigField("chat_position", "right")}
              >
                ডানে
              </Button>
            </div>
          </div>

          {/* AI Agent Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">AI এজেন্ট নাম</Label>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={config.ai_agent_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Input
                value={config.ai_agent_name}
                onChange={(e) => updateConfigField("ai_agent_name", e.target.value)}
                className="text-sm h-9"
                placeholder="ArodX AI"
              />
            </div>
          </div>

          {/* AI Agent Avatar URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">AI এজেন্ট আভাটার URL</Label>
            <Input
              value={config.ai_agent_avatar}
              onChange={(e) => updateConfigField("ai_agent_avatar", e.target.value)}
              className="text-sm h-9"
              placeholder="https://example.com/avatar.png"
            />
            <p className="text-[10px] text-muted-foreground">খালি রাখলে ডিফল্ট আভাটার ব্যবহার হবে</p>
          </div>

          {/* Show Agent Profiles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs">এজেন্ট প্রোফাইল দেখান</Label>
            </div>
            <Switch
              checked={config.show_agent_profiles}
              onCheckedChange={(v) => updateConfigField("show_agent_profiles", v)}
            />
          </div>

          {/* FAQ Questions */}
          <div className="space-y-2">
            <Label className="text-xs">FAQ প্রশ্নসমূহ</Label>
            {config.faq_questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 px-3 py-1.5 rounded-md bg-muted text-xs text-foreground truncate">
                  {q}
                </div>
                <button
                  onClick={() => removeFaq(i)}
                  className="p-1 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newFaq}
                onChange={(e) => setNewFaq(e.target.value)}
                className="text-sm h-8 flex-1"
                placeholder="নতুন প্রশ্ন যোগ করুন..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFaq())}
              />
              <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={addFaq} disabled={!newFaq.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* AI Setup */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          {settings && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <Label className="text-xs font-semibold">AI অটো-রিপ্লাই</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {settings.enabled ? "চালু" : "বন্ধ"}
                  </span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(v) => updateAiField("enabled", v)}
                  />
                </div>
              </div>

              {!settings.enabled && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground text-center">
                  AI অটো-রিপ্লাই বন্ধ আছে। চালু করতে টগল সুইচ অন করুন।
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">অটো-রিপ্লাই ডিলে (সেকেন্ড)</Label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.auto_reply_delay}
                  onChange={(e) => updateAiField("auto_reply_delay", parseInt(e.target.value) || 10)}
                  className="text-sm h-9 w-24"
                />
                <p className="text-[10px] text-muted-foreground">
                  এডমিন রিপ্লাই না দিলে এই সময় পর AI অটো-রিপ্লাই করবে
                </p>
              </div>
            </>
          )}
        </TabsContent>

        {/* Test */}
        <TabsContent value="test" className="mt-4">
          {settings?.enabled ? (
            <AiTestPanel />
          ) : (
            <div className="bg-muted/50 rounded-lg p-6 text-center text-xs text-muted-foreground">
              AI অটো-রিপ্লাই চালু করুন টেস্ট করতে
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <Button onClick={saveAll} disabled={saving} className="w-full h-9 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        সব সেটিংস সেভ করুন
      </Button>
    </div>
  );
}
