import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { Bot, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AiTestPanel from "./AiTestPanel";

interface AiSettings {
  id: string;
  provider: string;
  api_key: string;
  model_name: string;
  enabled: boolean;
  auto_reply_delay: number;
  system_prompt: string;
}

const PROVIDERS = [
  {
    value: "openai",
    label: "OpenAI (ChatGPT)",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-pro"],
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  },
  {
    value: "grok",
    label: "xAI Grok",
    models: ["grok-3", "grok-3-mini", "grok-2"],
    endpoint: "https://api.x.ai/v1/chat/completions",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    endpoint: "https://api.deepseek.com/chat/completions",
  },
  {
    value: "claude",
    label: "Anthropic Claude",
    models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
    endpoint: "https://api.anthropic.com/v1/messages",
  },
  {
    value: "custom",
    label: "Custom (OpenAI Compatible)",
    models: [],
    endpoint: "",
  },
];

export default function ChatAiConfigPanel() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customModel, setCustomModel] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("chat_ai_settings" as any)
      .select("*")
      .limit(1)
      .single();

    if (data && !error) {
      setSettings(data as any);
    }
    setLoading(false);
  };

  const updateField = (field: keyof AiSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    const updateData: any = {
      provider: settings.provider,
      api_key: settings.api_key,
      model_name: settings.model_name,
      enabled: settings.enabled,
      auto_reply_delay: settings.auto_reply_delay,
      system_prompt: settings.system_prompt,
      updated_at: new Date().toISOString(),
    };

    if (settings.provider === "custom") {
      updateData.model_name = `${customEndpoint}||${customModel}`;
    }

    const { error } = await supabase
      .from("chat_ai_settings" as any)
      .update(updateData)
      .eq("id", settings.id);

    if (error) {
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    } else {
      toast.success("AI সেটিংস সেভ হয়েছে!");
    }
    setSaving(false);
  };

  const selectedProvider = PROVIDERS.find((p) => p.value === settings?.provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI অটো-রিপ্লাই সেটিংস</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="ai-enabled" className="text-xs text-muted-foreground">
            {settings.enabled ? "চালু" : "বন্ধ"}
          </Label>
          <Switch
            id="ai-enabled"
            checked={settings.enabled}
            onCheckedChange={(v) => updateField("enabled", v)}
          />
        </div>
      </div>

      {!settings.enabled && (
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground text-center">
          AI অটো-রিপ্লাই বন্ধ আছে। চালু করতে টগল সুইচ অন করুন এবং API কী সেটআপ করুন।
        </div>
      )}

      <div className="space-y-4">
        {/* Provider */}
        <div className="space-y-1.5">
          <Label className="text-xs">AI প্রোভাইডার</Label>
          <select
            value={settings.provider}
            onChange={(e) => {
              const v = e.target.value;
              updateField("provider", v);
              const prov = PROVIDERS.find((p) => p.value === v);
              if (prov && prov.models.length > 0) {
                updateField("model_name", prov.models[0]);
              }
            }}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <Label className="text-xs">API কী</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={settings.api_key}
              onChange={(e) => updateField("api_key", e.target.value)}
              placeholder="sk-... বা আপনার API কী"
              className="text-sm h-9 pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {settings.provider === "openai" && "platform.openai.com থেকে API কী নিন"}
            {settings.provider === "gemini" && "aistudio.google.com থেকে API কী নিন"}
            {settings.provider === "grok" && "console.x.ai থেকে API কী নিন"}
            {settings.provider === "deepseek" && "platform.deepseek.com থেকে API কী নিন"}
            {settings.provider === "claude" && "console.anthropic.com থেকে API কী নিন"}
            {settings.provider === "custom" && "আপনার OpenAI-compatible API কী দিন"}
          </p>
        </div>

        {/* Model */}
        {settings.provider !== "custom" ? (
          <div className="space-y-1.5">
            <Label className="text-xs">মডেল</Label>
            <select
              value={settings.model_name}
              onChange={(e) => updateField("model_name", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {selectedProvider?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">API Endpoint URL</Label>
              <Input
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://your-api.com/v1/chat/completions"
                className="text-sm h-9 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">মডেল নাম</Label>
              <Input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="model-name"
                className="text-sm h-9"
              />
            </div>
          </>
        )}

        {/* Auto-reply delay */}
        <div className="space-y-1.5">
          <Label className="text-xs">অটো-রিপ্লাই ডিলে (সেকেন্ড)</Label>
          <Input
            type="number"
            min={5}
            max={120}
            value={settings.auto_reply_delay}
            onChange={(e) => updateField("auto_reply_delay", parseInt(e.target.value) || 10)}
            className="text-sm h-9 w-24"
          />
          <p className="text-[10px] text-muted-foreground">
            অ্যাডমিন রিপ্লাই না দিলে এই সময় পর AI অটো-রিপ্লাই করবে
          </p>
        </div>

        {/* System Prompt */}
        <div className="space-y-1.5">
          <Label className="text-xs">সিস্টেম প্রম্পট (ঐচ্ছিক)</Label>
          <Textarea
            value={settings.system_prompt}
            onChange={(e) => updateField("system_prompt", e.target.value)}
            placeholder="আপনার AI এজেন্টকে কিভাবে respond করবে সেটা বলুন..."
            className="text-sm min-h-[80px] resize-none"
          />
          <p className="text-[10px] text-muted-foreground">
            খালি রাখলে ডিফল্ট প্রম্পট ব্যবহার হবে
          </p>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full h-9 text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          সেটিংস সেভ করুন
        </Button>

        {/* Test Section */}
        <AiTestPanel settings={settings} customEndpoint={customEndpoint} customModel={customModel} />
      </div>
    </div>
  );
}
