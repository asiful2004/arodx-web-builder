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

    // Find closed sessions older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: oldSessions, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("status", "closed")
      .lt("updated_at", sevenDaysAgo);

    if (fetchError) {
      console.error("Error fetching old sessions:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!oldSessions || oldSessions.length === 0) {
      return new Response(JSON.stringify({ deleted: 0, message: "No old closed sessions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionIds = oldSessions.map((s) => s.id);

    // Delete messages first (foreign key constraint)
    const { error: msgError } = await supabase
      .from("chat_messages")
      .delete()
      .in("session_id", sessionIds);

    if (msgError) {
      console.error("Error deleting messages:", msgError);
      return new Response(JSON.stringify({ error: msgError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete sessions
    const { error: sessError } = await supabase
      .from("chat_sessions")
      .delete()
      .in("id", sessionIds);

    if (sessError) {
      console.error("Error deleting sessions:", sessError);
      return new Response(JSON.stringify({ error: sessError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Cleaned up ${sessionIds.length} closed chat sessions`);

    return new Response(
      JSON.stringify({ deleted: sessionIds.length, message: `Deleted ${sessionIds.length} old closed sessions` }),
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
