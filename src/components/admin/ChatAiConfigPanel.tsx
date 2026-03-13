import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bot, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AiTestPanel from "./AiTestPanel";

interface AiSettings {
  id: string;
  enabled: boolean;
  auto_reply_delay: number;
  system_prompt: string;
}

export default function ChatAiConfigPanel() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("chat_ai_settings" as any)
      .select("id, enabled, auto_reply_delay, system_prompt")
      .limit(1)
      .single();

    if (data && !error) {
      setSettings(data as any);
    }
    setLoading(false);
  };

  const updateField = (field: keyof AiSettings, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from("chat_ai_settings" as any)
      .update({
        enabled: settings.enabled,
        auto_reply_delay: settings.auto_reply_delay,
        system_prompt: settings.system_prompt,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", settings.id);

    if (error) {
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    } else {
      toast.success("AI সেটিংস সেভ হয়েছে!");
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

  if (!settings) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI অটো-রিপ্লাই</h3>
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
          AI অটো-রিপ্লাই বন্ধ আছে। চালু করতে টগল সুইচ অন করুন।
        </div>
      )}

      <div className="space-y-4">
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

        <Button onClick={saveSettings} disabled={saving} className="w-full h-9 text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          সেটিংস সেভ করুন
        </Button>

        {/* Test Section */}
        {settings.enabled && <AiTestPanel />}
      </div>
    </div>
  );
}
