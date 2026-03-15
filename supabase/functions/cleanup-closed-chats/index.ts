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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let autoClosed = 0;
    let deleted = 0;

    // === STEP 1: Auto-close active chats where client hasn't responded in 24 hours ===
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get active sessions
    const { data: activeSessions } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("status", "active");

    if (activeSessions && activeSessions.length > 0) {
      for (const session of activeSessions) {
        // Get the last message in this session
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("sender_type, created_at")
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Auto-close if:
        // - No messages at all and session is older than 24h
        // - Last message is from admin/system and older than 24h (client didn't respond)
        if (lastMsg) {
          const isClientMsg = lastMsg.sender_type === "client";
          const isOld = lastMsg.created_at < twentyFourHoursAgo;
          // Close if last message is NOT from client and is older than 24h
          if (!isClientMsg && isOld) {
            await supabase
              .from("chat_sessions")
              .update({ status: "closed" })
              .eq("id", session.id);
            // Send system message
            await supabase.from("chat_messages").insert({
              session_id: session.id,
              sender_type: "system",
              message: "২৪ ঘণ্টায় কোনো রিসপন্স না পাওয়ায় এই চ্যাট স্বয়ংক্রিয়ভাবে বন্ধ হয়ে গেছে।",
            });
            autoClosed++;
          }
        } else {
          // No messages — check session creation time
          const { data: sessionData } = await supabase
            .from("chat_sessions")
            .select("created_at")
            .eq("id", session.id)
            .single();
          if (sessionData && sessionData.created_at < twentyFourHoursAgo) {
            await supabase
              .from("chat_sessions")
              .update({ status: "closed" })
              .eq("id", session.id);
            await supabase.from("chat_messages").insert({
              session_id: session.id,
              sender_type: "system",
              message: "২৪ ঘণ্টায় কোনো রিসপন্স না পাওয়ায় এই চ্যাট স্বয়ংক্রিয়ভাবে বন্ধ হয়ে গেছে।",
            });
            autoClosed++;
          }
        }
      }
    }

    // === STEP 2: Delete closed sessions older than 72 hours ===
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const { data: oldSessions, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("status", "closed")
      .lt("updated_at", seventyTwoHoursAgo);

    if (fetchError) {
      console.error("Error fetching old sessions:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (oldSessions && oldSessions.length > 0) {
      const sessionIds = oldSessions.map((s) => s.id);

      // Delete messages first (foreign key constraint)
      await supabase
        .from("chat_messages")
        .delete()
        .in("session_id", sessionIds);

      // Delete sessions
      await supabase
        .from("chat_sessions")
        .delete()
        .in("id", sessionIds);

      deleted = sessionIds.length;
    }

    console.log(`Auto-closed: ${autoClosed}, Deleted: ${deleted}`);

    return new Response(
      JSON.stringify({
        auto_closed: autoClosed,
        deleted,
        message: `Auto-closed ${autoClosed} inactive chats, deleted ${deleted} old closed chats`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("cleanup-closed-chats error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
