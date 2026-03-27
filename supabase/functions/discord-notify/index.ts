import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  event_type: "ticket" | "chat" | "order";
  data: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { event_type, data } = payload;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch webhook settings
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "discord_webhooks")
      .single();

    if (!settingsRow?.value) {
      return new Response(JSON.stringify({ ok: false, reason: "no webhook config" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = settingsRow.value as Record<string, any>;

    let webhookUrl = "";
    let embed: Record<string, any> = {};

    if (event_type === "ticket" && config.ticket_enabled && config.ticket_webhook) {
      webhookUrl = config.ticket_webhook;
      embed = {
        title: "New Support Ticket",
        description: `**${data.ticket_number}** - ${data.subject}`,
        color: 0x2659ff,
        fields: [
          { name: "Category", value: data.category || "General", inline: true },
          { name: "Priority", value: data.priority || "Medium", inline: true },
          { name: "Status", value: data.status || "Open", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Arodx Support System" },
      };
    } else if (event_type === "chat" && config.chat_enabled && config.chat_webhook) {
      webhookUrl = config.chat_webhook;
      const isNew = data.status === "active";
      embed = {
        title: isNew ? "New Live Chat Session" : "Chat Session Closed",
        description: isNew
          ? `**${data.guest_name || "Guest"}** started a chat session`
          : `Chat session closed - ${data.guest_name || "Guest"}`,
        color: isNew ? 0x10b981 : 0xef4444,
        fields: [
          { name: "Name", value: data.guest_name || "N/A", inline: true },
          { name: "Email", value: data.guest_email || "N/A", inline: true },
          { name: "Phone", value: data.guest_phone || "N/A", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Arodx Live Chat" },
      };
    } else if (event_type === "order" && config.order_enabled && config.order_webhook) {
      webhookUrl = config.order_webhook;
      embed = {
        title: "New Order Received",
        description: `**${data.customer_name}** placed a new order`,
        color: 0xf59e0b,
        fields: [
          { name: "Package", value: data.package_name || "N/A", inline: true },
          { name: "Amount", value: data.amount || "N/A", inline: true },
          { name: "Payment", value: data.payment_method || "N/A", inline: true },
          { name: "Billing", value: data.billing_period || "N/A", inline: true },
          { name: "Phone", value: data.customer_phone || "N/A", inline: true },
          { name: "Email", value: data.customer_email || "N/A", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Arodx Orders" },
      };
    } else {
      return new Response(JSON.stringify({ ok: false, reason: "webhook not enabled for this event" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send to Discord
    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    const ok = discordRes.ok;
    return new Response(JSON.stringify({ ok }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Discord notify error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
