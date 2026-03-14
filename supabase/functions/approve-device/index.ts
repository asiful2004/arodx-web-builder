import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the approver
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request
    const { data: request, error: reqError } = await supabaseAdmin
      .from("device_login_requests")
      .select("*")
      .eq("token", token)
      .single();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    if (new Date(request.expires_at) < new Date()) {
      await supabaseAdmin
        .from("device_login_requests")
        .update({ status: "expired" })
        .eq("id", request.id);
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already processed
    if (request.status !== "pending") {
      return new Response(JSON.stringify({ error: "Already processed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For QR-only login (user_email is 'pending'), allow any authenticated user to approve
    // For email-based requests, verify the approver owns this email
    if (request.user_email !== "pending" && user.email !== request.user_email) {
      return new Response(JSON.stringify({ error: "You can only approve your own device requests" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check device count
    const { count } = await supabaseAdmin
      .from("user_devices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if ((count || 0) >= 3) {
      return new Response(JSON.stringify({ error: "Maximum 3 devices allowed. Remove a device first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a magic link for the new device to sign in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
    });

    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: "Failed to generate auth token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the token_hash from the generated link
    const actionLink = linkData.properties?.action_link || "";
    const url = new URL(actionLink);
    const tokenHash = url.searchParams.get("token_hash") || url.hash?.split("token_hash=")[1]?.split("&")[0] || "";

    // Approve the request and store the auth token
    const { error: updateError } = await supabaseAdmin
      .from("device_login_requests")
      .update({
        status: "approved",
        approved_by: user.id,
        user_email: user.email!,
        auth_token: tokenHash,
      })
      .eq("id", request.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to approve" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
