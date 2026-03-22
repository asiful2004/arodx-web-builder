import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: hasAdmin } = await sbAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SMTP config from site_settings
    const { data: smtpRow } = await sbAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    const smtp = smtpRow?.value as any;
    if (!smtp?.enabled) {
      return new Response(
        JSON.stringify({ error: "SMTP is not enabled" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!smtp.host || !smtp.username || !smtp.password) {
      return new Response(
        JSON.stringify({ error: "SMTP configuration incomplete" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' or 'subject'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Connect and send
    const client = new SMTPClient({
      connection: {
        hostname: smtp.host,
        port: smtp.port || 587,
        tls: smtp.port === 465,
        auth: {
          username: smtp.username,
          password: smtp.password,
        },
      },
    });

    // Build a valid "from" field
    let fromField: string;
    const senderEmail = smtp.from_email?.trim() || smtp.username;
    if (smtp.from_name?.trim()) {
      fromField = `${smtp.from_name.trim()} <${senderEmail}>`;
    } else {
      fromField = senderEmail;
    }

    await client.send({
      from: fromField,
      to,
      subject,
      content: text || "Email sent via SMTP",
      html: html || undefined,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("SMTP Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
