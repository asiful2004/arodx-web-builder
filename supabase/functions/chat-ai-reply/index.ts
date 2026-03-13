import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // If the most recent message is from admin or ai, skip
    const lastMsg = recentMessages[0];
    if (lastMsg.sender_type === "admin" || lastMsg.sender_type === "ai") {
      return new Response(JSON.stringify({ skipped: true, reason: "admin already replied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get full conversation history (last 20 messages)
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

    // Build messages for AI
    const aiMessages = [
      {
        role: "system",
        content: `তুমি ArodX এর একজন বাংলা ভাষী AI সাপোর্ট এজেন্ট। তোমার নাম "ArodX সাপোর্ট"। 
তোমার কাজ হলো ক্লায়েন্টদের সাহায্য করা যতক্ষণ না একজন সত্যিকারের অ্যাডমিন আসে।

নিয়মাবলী:
- সবসময় বাংলায় উত্তর দাও (তবে ক্লায়েন্ট ইংরেজিতে বললে ইংরেজিতেও দিতে পারো)
- বন্ধুসুলভ, পেশাদার এবং সংক্ষিপ্ত উত্তর দাও
- ArodX হলো একটি ওয়েব ডিজাইন ও ডেভেলপমেন্ট সার্ভিস প্রোভাইডার
- তুমি সাধারণ প্রশ্নের উত্তর দিতে পারো (প্রাইসিং, সার্ভিস, সাপোর্ট ইত্যাদি)
- জটিল বা নির্দিষ্ট বিষয়ে বলো যে একজন অ্যাডমিন শীঘ্রই সাহায্য করবেন
- কখনও বলবে না যে তুমি AI, বলো "আমাদের সাপোর্ট টিম" বা "আমরা"
- উত্তর ২-৩ বাক্যে সীমাবদ্ধ রাখো

ক্লায়েন্টের নাম: ${clientName}`,
      },
      ...(history || [])
        .filter((m) => m.sender_type !== "system" && m.message_type === "text")
        .map((m) => ({
          role: m.sender_type === "client" ? "user" : "assistant",
          content: m.message,
        })),
    ];

    // Call Lovable AI
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
          max_tokens: 300,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const replyText =
      aiData.choices?.[0]?.message?.content?.trim() || "ধন্যবাদ! একজন প্রতিনিধি শীঘ্রই আপনাকে সাহায্য করবেন।";

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
