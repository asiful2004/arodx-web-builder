import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

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

async function callLovableAI(messages: any[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY কনফিগার করা নেই।");

  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 429) {
      throw new Error("AI রেট লিমিটে পড়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    }
    if (response.status === 402) {
      throw new Error("AI ক্রেডিট শেষ হয়ে গেছে।");
    }
    console.error("Lovable AI error:", response.status, err);
    throw new Error("AI সার্ভিসে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
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

    // === TEST MODE: chat ===
    if (test_mode === "chat") {
      const { system_prompt, test_message } = body;
      if (!test_message) {
        return new Response(JSON.stringify({ error: "মেসেজ লিখুন" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const msgs = [
        { role: "system", content: system_prompt || DEFAULT_SYSTEM_PROMPT },
        { role: "user", content: test_message },
      ];
      try {
        const reply = await callLovableAI(msgs);
        return new Response(JSON.stringify({ reply: reply || "রিপ্লাই পাওয়া যায়নি" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || "অজানা সমস্যা" }), {
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

    // Get AI settings (only enabled + delay matter now)
    const { data: aiSettings } = await supabase
      .from("chat_ai_settings")
      .select("*")
      .limit(1)
      .single();

    if (!aiSettings || !aiSettings.enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "AI disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin already replied
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

    let replyText: string;
    try {
      replyText = await callLovableAI(aiMessages);
    } catch (apiErr) {
      console.error("AI error:", apiErr);
      return new Response(JSON.stringify({ error: "AI call failed", details: String(apiErr) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!replyText) {
      replyText = "ধন্যবাদ! একজন প্রতিনিধি শীঘ্রই আপনাকে সাহায্য করবেন।";
    }

    // Double-check admin didn't reply while AI was generating
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
