import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AiTestPanel() {
  const [testMsg, setTestMsg] = useState("হ্যালো, আপনাদের সার্ভিস সম্পর্কে জানতে চাই");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting] = useState(false);

  const sendTestMessage = async () => {
    if (!testMsg.trim()) {
      toast.error("মেসেজ লিখুন");
      return;
    }
    setTesting(true);
    setTestReply("");

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai-reply", {
        body: {
          test_mode: "chat",
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
    <div className="border border-border rounded-lg p-3 space-y-3 mt-2 bg-muted/30">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-foreground">টেস্ট মেসেজ পাঠান</h4>
      </div>

      <div className="space-y-2">
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
