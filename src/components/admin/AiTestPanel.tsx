import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, FlaskConical, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AiSettings {
  id: string;
  provider: string;
  api_key: string;
  model_name: string;
  enabled: boolean;
  auto_reply_delay: number;
  system_prompt: string;
}

interface AiTestPanelProps {
  settings: AiSettings;
  customEndpoint: string;
  customModel: string;
}

export default function AiTestPanel({ settings, customEndpoint, customModel }: AiTestPanelProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<"success" | "error" | null>(null);
  const [verifyMessage, setVerifyMessage] = useState("");

  const [testMsg, setTestMsg] = useState("হ্যালো, আপনাদের সার্ভিস সম্পর্কে জানতে চাই");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting] = useState(false);

  const verifyConnection = async () => {
    if (!settings.api_key) {
      toast.error("আগে API কী দিন");
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    setVerifyMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai-reply", {
        body: {
          test_mode: "verify",
          provider: settings.provider,
          api_key: settings.api_key,
          model_name: settings.provider === "custom"
            ? `${customEndpoint}||${customModel}`
            : settings.model_name,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setVerifyResult("success");
        setVerifyMessage(data.message || "API কানেকশন সফল!");
      } else {
        setVerifyResult("error");
        setVerifyMessage(data?.error || "কানেকশন ব্যর্থ");
      }
    } catch (err: any) {
      setVerifyResult("error");
      setVerifyMessage(err?.message || "কানেকশন চেক ব্যর্থ হয়েছে");
    }
    setVerifying(false);
  };

  const sendTestMessage = async () => {
    if (!settings.api_key || !testMsg.trim()) {
      toast.error("API কী ও মেসেজ দিন");
      return;
    }
    setTesting(true);
    setTestReply("");

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai-reply", {
        body: {
          test_mode: "chat",
          provider: settings.provider,
          api_key: settings.api_key,
          model_name: settings.provider === "custom"
            ? `${customEndpoint}||${customModel}`
            : settings.model_name,
          system_prompt: settings.system_prompt,
          test_message: testMsg,
        },
      });

      if (error) throw error;

      if (data?.reply) {
        setTestReply(data.reply);
      } else {
        setTestReply("❌ " + (data?.error || "রিপ্লাই পাওয়া যায়নি"));
      }
    } catch (err: any) {
      setTestReply("❌ এরর: " + (err?.message || "অজানা সমস্যা"));
    }
    setTesting(false);
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-4 mt-2 bg-muted/30">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-foreground">টেস্ট প্যানেল</h4>
      </div>

      {/* Verify Connection */}
      <div className="space-y-2">
        <Label className="text-xs">API কানেকশন চেক</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={verifyConnection}
          disabled={verifying}
          className="w-full h-8 text-xs"
        >
          {verifying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : verifyResult === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
          ) : verifyResult === "error" ? (
            <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
          ) : (
            <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
          )}
          {verifying ? "চেক করা হচ্ছে..." : "কানেকশন ভেরিফাই করুন"}
        </Button>
        {verifyMessage && (
          <p className={`text-[10px] ${verifyResult === "success" ? "text-green-600" : "text-red-500"}`}>
            {verifyResult === "success" ? "✅" : "❌"} {verifyMessage}
          </p>
        )}
      </div>

      {/* Test Message */}
      <div className="space-y-2">
        <Label className="text-xs">টেস্ট মেসেজ পাঠান</Label>
        <div className="flex gap-1.5">
          <Input
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            placeholder="একটি টেস্ট মেসেজ লিখুন..."
            className="text-xs h-8 flex-1"
          />
          <Button
            variant="default"
            size="sm"
            onClick={sendTestMessage}
            disabled={testing}
            className="h-8 px-2.5 shrink-0"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {testReply && (
          <div className="bg-background border border-border rounded-md p-2.5 text-xs text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
            <p className="text-[10px] text-muted-foreground mb-1 font-medium">AI রিপ্লাই:</p>
            {testReply}
          </div>
        )}
      </div>
    </div>
  );
}