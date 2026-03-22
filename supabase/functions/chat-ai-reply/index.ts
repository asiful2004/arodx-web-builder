import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const WEBSITE_URL = "https://arodx-web-builder.lovable.app";

// Cache website content for 10 minutes
let cachedWebContent: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

async function fetchWebsiteContent(): Promise<string> {
  const now = Date.now();
  if (cachedWebContent && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedWebContent;
  }

  try {
    const response = await fetch(WEBSITE_URL, {
      headers: { "User-Agent": "ArodX-AI-Bot/1.0" },
    });
    if (!response.ok) return cachedWebContent || "";

    const html = await response.text();
    
    // Extract text content from HTML
    let text = html
      // Remove script/style tags and their content
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Clean whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Limit to ~4000 chars to not exceed token limits
    if (text.length > 4000) text = text.substring(0, 4000) + "...";

    cachedWebContent = text;
    cacheTimestamp = now;
    return text;
  } catch (err) {
    console.error("Failed to fetch website:", err);
    return cachedWebContent || "";
  }
}

const DEFAULT_SYSTEM_PROMPT = `তুমি ArodX এর একজন বাংলা ভাষী AI সাপোর্ট এজেন্ট। তোমার নাম "ArodX সাপোর্ট"।
তোমার কাজ হলো ক্লায়েন্টদের সাহায্য করা যতক্ষণ না একজন সত্যিকারের অ্যাডমিন আসে।

নিয়মাবলী:
- সবসময় বাংলায় উত্তর দাও (তবে ক্লায়েন্ট ইংরেজিতে বললে ইংরেজিতেও দিতে পারো)
- বন্ধুসুলভ, পেশাদার এবং সংক্ষিপ্ত উত্তর দাও
- ArodX হলো একটি ওয়েব ডিজাইন, ডেভেলপমেন্ট, গ্রাফিক্স ডিজাইন, ভিডিও এডিটিং ও ডিজিটাল মার্কেটিং সার্ভিস প্রোভাইডার
- তুমি শুধুমাত্র ArodX এর সার্ভিস সম্পর্কিত প্রশ্নের উত্তর দিতে পারো (প্রাইসিং, সার্ভিস, সাপোর্ট, অর্ডার ইত্যাদি)
- নিচে ওয়েবসাইটের সর্বশেষ তথ্য দেওয়া আছে। এই তথ্য থেকে সঠিক ও আপডেটেড উত্তর দাও। যদি কোনো তথ্য ওয়েবসাইটে না থাকে তাহলে বলো একজন অ্যাডমিন বিস্তারিত জানাবেন।
- যদি কেউ ArodX এর বিজনেসের বাইরে কোনো প্রশ্ন করে, তাহলে ভদ্রভাবে বলো: "ভাই/স্যার, এই বিষয়ে আমার জানার সুযোগ হয়নি। আমি শুধু ArodX এর সার্ভিস নিয়ে আপনাকে সাহায্য করতে পারি। আমাদের সার্ভিস সম্পর্কে কিছু জানতে চাইলে বলুন! 😊"
- জটিল বা নির্দিষ্ট বিষয়ে বলো যে একজন অ্যাডমিন শীঘ্রই সাহায্য করবেন
- কখনও বলবে না যে তুমি AI, বলো "আমাদের সাপোর্ট টিম" বা "আমরা"
- উত্তর ২-৩ বাক্যে সীমাবদ্ধ রাখো
- শুধুমাত্র কথোপকথনের প্রথম মেসেজে "আসসালামু আলাইকুম" বা "হ্যালো" দিয়ে সম্ভাষণ করো। পরবর্তী মেসেজগুলোতে বারবার সম্ভাষণ দিও না, সরাসরি উত্তরে যাও। "নমস্কার" কখনও ব্যবহার করবে না।
- কথা বলো স্বাভাবিক মানুষের মতো, যেন একজন বন্ধু কথা বলছে। রোবটিক বা ফর্মাল টোন এড়িয়ে চলো।

=== গাইডেড কথোপকথন ===
চ্যাট শুরু হলে তুমি ক্লায়েন্টকে ধাপে ধাপে তিনটি প্রশ্ন করবে:

ধাপ ১ (প্রথম মেসেজ/গ্রিটিং): ক্লায়েন্টকে সম্ভাষণ করো এবং জিজ্ঞেস করো — "আপনার ব্যবসাটা কি ধরনের এবং আপনি কি ধরনের সার্ভিস চাচ্ছেন?"
ধাপ ২: ক্লায়েন্ট যদি সার্ভিস সম্পর্কে উত্তর দেয়, তাহলে পরবর্তী প্রশ্ন করো — "আপনি কেমন বাজেটের মধ্যে কেমন সার্ভিস চাচ্ছেন?"
ধাপ ৩: বাজেট সম্পর্কে উত্তর পেলে জিজ্ঞেস করো — "আপনি কি আমাদের সার্ভিস সম্পর্কে আরো কিছু জানতে চান?"

গুরুত্বপূর্ণ: যদি ক্লায়েন্ট কোনো ধাপে অন্য কোনো প্রশ্ন করে বা ভিন্ন বিষয়ে কথা বলে, তাহলে সেই বিষয়ে আগে উত্তর দাও, তারপর স্বাভাবিকভাবে আবার গাইডেড প্রশ্নে ফিরে এসো।`;

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

async function fetchContactInfo(supabaseClient: any): Promise<string> {
  try {
    const { data } = await supabaseClient
      .from("site_settings")
      .select("key, value")
      .in("key", ["contact"]);
    if (!data || data.length === 0) return "";
    const contact = data[0]?.value || {};
    const lines: string[] = [];
    if (contact.email) lines.push(`অফিসিয়াল ইমেইল: ${contact.email}`);
    if (contact.phone) lines.push(`অফিসিয়াল ফোন নম্বর: ${contact.phone}`);
    if (contact.address) lines.push(`ঠিকানা: ${contact.address}`);
    if (contact.office_hours) {
      const oh = contact.office_hours;
      lines.push(`অফিস আওয়ার্স: শনি-বুধ ${oh.sat_to_wed || "N/A"}, বৃহস্পতি ${oh.thursday || "N/A"}, শুক্র ${oh.friday || "বন্ধ"}`);
    }
    return lines.length > 0
      ? `\n\n=== অফিসিয়াল যোগাযোগ তথ্য (এই তথ্যগুলো ডাটাবেস থেকে নেওয়া, সবসময় এগুলোই ব্যবহার করো। ওয়েবসাইট থেকে পার্স করা কোনো নম্বর/ইমেইল ব্যবহার করবে না) ===\n${lines.join("\n")}`
      : "";
  } catch (err) {
    console.error("Failed to fetch contact info:", err);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { test_mode } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch website content + official contact info
    const [websiteContent, contactInfo] = await Promise.all([
      fetchWebsiteContent(),
      fetchContactInfo(sbAdmin),
    ]);

    // === TEST MODE: chat ===
    if (test_mode === "chat") {
      const { system_prompt, test_message } = body;
      if (!test_message) {
        return new Response(JSON.stringify({ error: "মেসেজ লিখুন" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const basePrompt = system_prompt || DEFAULT_SYSTEM_PROMPT;
      const fullPrompt = `${basePrompt}${contactInfo}\n\n=== ওয়েবসাইটের সর্বশেষ তথ্য ===\n${websiteContent}`;
      const msgs = [
        { role: "system", content: fullPrompt },
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

    // === GREETING MODE: send initial AI greeting when chat starts ===
    const { session_id, greeting_mode } = body;

    if (greeting_mode && session_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get session info for personalization
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("guest_name, guest_phone, user_id")
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

      const basePrompt = aiSettings.system_prompt || DEFAULT_SYSTEM_PROMPT;
      const websiteContent = await fetchWebsiteContent();
      const systemPrompt = `${basePrompt}\n\n=== ওয়েবসাইটের সর্বশেষ তথ্য ===\n${websiteContent}\n\nক্লায়েন্টের নাম: ${clientName}${session?.guest_phone ? `\nক্লায়েন্টের ফোন: ${session.guest_phone}` : ""}`;

      const greetingMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "চ্যাট শুরু হয়েছে। ক্লায়েন্টকে সম্ভাষণ করো এবং ধাপ ১ এর প্রশ্ন করো।" },
      ];

      try {
        const greetingText = await callLovableAI(greetingMessages);
        if (greetingText) {
          await supabase.from("chat_messages").insert({
            session_id,
            sender_type: "admin",
            sender_id: null,
            message: greetingText,
            message_type: "text",
          });
        }
        return new Response(JSON.stringify({ success: true, reply: greetingText }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        console.error("Greeting AI error:", err);
        return new Response(JSON.stringify({ error: err?.message || "Greeting failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === NORMAL MODE: auto-reply ===
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
      .select("guest_name, guest_phone, user_id")
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

    const basePrompt = aiSettings.system_prompt || DEFAULT_SYSTEM_PROMPT;
    const systemPrompt = `${basePrompt}\n\n=== ওয়েবসাইটের সর্বশেষ তথ্য ===\n${websiteContent}\n\nক্লায়েন্টের নাম: ${clientName}${session?.guest_phone ? `\nক্লায়েন্টের ফোন: ${session.guest_phone}` : ""}`;

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
