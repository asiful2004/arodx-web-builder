import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SYSTEM_PROMPT = `তুমি ArodX এর একজন বাংলা ভাষী AI সাপোর্ট এজেন্ট। তোমার নাম "ArodX সাপোর্ট"।
তোমার কাজ হলো ক্লায়েন্টদের সাহায্য করা যতক্ষণ না একজন সত্যিকারের অ্যাডমিন আসে।

নিয়মাবলী:
- সবসময় বাংলায় উত্তর দাও (তবে ক্লায়েন্ট ইংরেজিতে বললে ইংরেজিতেও দিতে পারো)
- বন্ধুসুলভ, পেশাদার এবং সংক্ষিপ্ত উত্তর দাও
- ArodX হলো একটি ওয়েব ডিজাইন ও ডেভেলপমেন্ট সার্ভিস প্রোভাইডার
- তুমি সাধারণ প্রশ্নের উত্তর দিতে পারো (প্রাইসিং, সার্ভিস, সাপোর্ট ইত্যাদি)
- জটিল বা নির্দিষ্ট বিষয়ে বলো যে একজন অ্যাডমিন শীঘ্রই সাহায্য করবেন
- কখনও বলবে না যে তুমি AI, বলো "আমাদের সাপোর্ট টিম" বা "আমরা"
- উত্তর ২-৩ বাক্যে সীমাবদ্ধ রাখো`;

// Provider endpoint mapping
function getEndpoint(provider: string, modelName: string): { url: string; model: string } {
  switch (provider) {
    case "openai":
      return { url: "https://api.openai.com/v1/chat/completions", model: modelName };
    case "gemini":
      return { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: modelName };
    case "grok":
      return { url: "https://api.x.ai/v1/chat/completions", model: modelName };
    case "deepseek":
      return { url: "https://api.deepseek.com/chat/completions", model: modelName };
    case "claude":
      return { url: "https://api.anthropic.com/v1/messages", model: modelName };
    case "custom": {
      // model_name stores "endpoint||model" for custom
      const parts = modelName.split("||");
      return { url: parts[0] || "", model: parts[1] || "default" };
    }
    default:
      return { url: "https://api.openai.com/v1/chat/completions", model: modelName };
  }
}

async function callClaude(apiKey: string, model: string, messages: any[]): Promise<string> {
  const systemMsg = messages.find((m: any) => m.role === "system");
  const userMsgs = messages.filter((m: any) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      system: systemMsg?.content || "",
      messages: userMsgs,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error [${response.status}]: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

async function callOpenAICompatible(url: string, apiKey: string, model: string, messages: any[]): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error [${response.status}]: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { test_mode } = body;

    // === TEST MODE: verify connection ===
    if (test_mode === "verify") {
      const { provider, api_key, model_name } = body;
      if (!api_key) {
        return new Response(JSON.stringify({ success: false, error: "API কী দেওয়া হয়নি" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { url, model } = getEndpoint(provider, model_name);
      const testMessages = [
        { role: "user", content: "Say hi" },
      ];
      try {
        if (provider === "claude") {
          await callClaude(api_key, model, testMessages);
        } else {
          await callOpenAICompatible(url, api_key, model, testMessages);
        }
        return new Response(JSON.stringify({ success: true, message: `${provider} API কানেকশন সফল! মডেল: ${model}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: String(err) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === TEST MODE: chat ===
    if (test_mode === "chat") {
      const { provider, api_key, model_name, system_prompt, test_message } = body;
      if (!api_key || !test_message) {
        return new Response(JSON.stringify({ error: "API কী ও মেসেজ দরকার" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { url, model } = getEndpoint(provider, model_name);
      const msgs = [
        { role: "system", content: system_prompt || DEFAULT_SYSTEM_PROMPT },
        { role: "user", content: test_message },
      ];
      try {
        let reply: string;
        if (provider === "claude") {
          reply = await callClaude(api_key, model, msgs);
        } else {
          reply = await callOpenAICompatible(url, api_key, model, msgs);
        }
        return new Response(JSON.stringify({ reply: reply || "রিপ্লাই পাওয়া যায়নি" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === NORMAL MODE: auto-reply ===
    const { session_id } = body;
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get AI settings
    const { data: aiSettings } = await supabase
      .from("chat_ai_settings")
      .select("*")
      .limit(1)
      .single();

    if (!aiSettings || !aiSettings.enabled || !aiSettings.api_key) {
      return new Response(JSON.stringify({ skipped: true, reason: "AI not configured or disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin already replied after the last client message
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("sender_type, message, created_at")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!recentMessages || recentMessages.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no messages" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastMsg = recentMessages[0];
    if (lastMsg.sender_type === "admin") {
      return new Response(JSON.stringify({ skipped: true, reason: "admin already replied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get conversation history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("sender_type, message, message_type")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(20);

    // Get session info
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("guest_name, user_id")
      .eq("id", session_id)
      .single();

    let clientName = session?.guest_name || "ক্লায়েন্ট";
    if (session?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user_id)
        .single();
      if (profile?.full_name) clientName = profile.full_name;
    }

    // Build system prompt
    const systemPrompt = (aiSettings.system_prompt || DEFAULT_SYSTEM_PROMPT)
      + `\n\nক্লায়েন্টের নাম: ${clientName}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || [])
        .filter((m: any) => m.sender_type !== "system" && m.message_type === "text")
        .map((m: any) => ({
          role: m.sender_type === "client" ? "user" : "assistant",
          content: m.message,
        })),
    ];

    // Call the configured AI provider
    const { url, model } = getEndpoint(aiSettings.provider, aiSettings.model_name);
    let replyText: string;

    try {
      if (aiSettings.provider === "claude") {
        replyText = await callClaude(aiSettings.api_key, model, aiMessages);
      } else {
        replyText = await callOpenAICompatible(url, aiSettings.api_key, model, aiMessages);
      }
    } catch (apiErr) {
      console.error("AI provider error:", apiErr);
      return new Response(JSON.stringify({ error: "AI API call failed", details: String(apiErr) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!replyText) {
      replyText = "ধন্যবাদ! একজন প্রতিনিধি শীঘ্রই আপনাকে সাহায্য করবেন।";
    }

    // Double-check: admin may have replied while AI was generating
    const { data: checkAgain } = await supabase
      .from("chat_messages")
      .select("sender_type")
      .eq("session_id", session_id)
      .in("sender_type", ["admin"])
      .gt("created_at", lastMsg.created_at)
      .limit(1);

    if (checkAgain && checkAgain.length > 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "admin replied during AI generation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert AI reply
    await supabase.from("chat_messages").insert({
      session_id,
      sender_type: "admin",
      sender_id: null,
      message: replyText,
      message_type: "text",
    });

    return new Response(JSON.stringify({ success: true, reply: replyText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-ai-reply error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
