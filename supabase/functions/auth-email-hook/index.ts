import { Webhook } from "@lovable.dev/webhooks-js";
import { createClient } from "@supabase/supabase-js";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ===== Brand Constants =====
const BRAND = {
  name: "ArodX",
  tagline: "Web Development Agency",
  primaryColor: "#2659FF",
  primaryDark: "#1a3fcc",
  accentColor: "#4789FF",
  gradientStart: "#2659FF",
  gradientEnd: "#4789FF",
  bgColor: "#f0f4ff",
  textDark: "#1a1a2e",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  borderColor: "#e2e8f0",
  successColor: "#10b981",
  warningColor: "#f59e0b",
  email: "arodxofficial@gmail.com",
};

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bgColor};font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bgColor};padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(38,89,255,0.08);">
<tr><td style="background:linear-gradient(135deg,${BRAND.gradientStart},${BRAND.gradientEnd});padding:28px 32px;text-align:center;">
<h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1.5px;">${BRAND.name}</h1>
<p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:0.5px;">${BRAND.tagline}</p>
</td></tr>
<tr><td style="padding:32px 32px 32px;">
${content}
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid ${BRAND.borderColor};text-align:center;">
<p style="margin:0 0 2px;font-size:12px;color:${BRAND.textDark};font-weight:600;">${BRAND.name}</p>
<p style="margin:0;font-size:11px;color:${BRAND.textLight};">
<a href="mailto:${BRAND.email}" style="color:${BRAND.primaryColor};text-decoration:none;">${BRAND.email}</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:24px 0;">
<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.gradientStart},${BRAND.gradientEnd});color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;box-shadow:0 4px 12px rgba(38,89,255,0.25);">${text}</a>
</div>`;
}

function otpBlock(code: string): string {
  return `<div style="text-align:center;margin:24px 0;">
<div style="display:inline-block;background:${BRAND.bgColor};border:2px dashed ${BRAND.primaryColor};border-radius:12px;padding:16px 32px;">
<p style="margin:0 0 4px;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;">ভেরিফিকেশন কোড</p>
<p style="margin:0;font-size:36px;font-weight:800;color:${BRAND.primaryColor};letter-spacing:8px;">${code}</p>
</div>
</div>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:${BRAND.textMuted};line-height:1.7;">${text}</p>`;
}

// Auth email templates
function renderAuthEmail(type: string, data: any): { subject: string; html: string; text: string } {
  const name = data.user?.user_metadata?.full_name || data.user?.email || "গ্রাহক";
  const token = data.email_data?.token || "";
  const confirmUrl = data.email_data?.confirmation_url || data.email_data?.redirect_to || "#";
  const newEmail = data.email_data?.new_email || "";

  switch (type) {
    case "signup":
      return {
        subject: `${BRAND.name} - ইমেইল ভেরিফিকেশন কোড`,
        html: baseLayout("ইমেইল ভেরিফিকেশন", [
          paragraph(`প্রিয় <strong>${name}</strong>,`),
          paragraph(`${BRAND.name}-এ আপনার অ্যাকাউন্ট তৈরি করার জন্য ধন্যবাদ। আপনার ইমেইল ভেরিফাই করতে নিচের কোডটি ব্যবহার করুন:`),
          otpBlock(token),
          paragraph("এই কোডটি ১৫ মিনিটের মধ্যে মেয়াদ শেষ হবে।"),
          paragraph("আপনি এই অ্যাকাউন্ট তৈরি না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।"),
        ].join("")),
        text: `আপনার ভেরিফিকেশন কোড: ${token}`,
      };

    case "recovery":
      return {
        subject: `${BRAND.name} - পাসওয়ার্ড রিসেট`,
        html: baseLayout("পাসওয়ার্ড রিসেট", [
          paragraph(`প্রিয় <strong>${name}</strong>,`),
          paragraph("আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার অনুরোধ পাওয়া গেছে। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন:"),
          ctaButton("পাসওয়ার্ড রিসেট করুন", confirmUrl),
          paragraph("এই লিংকটি ১ ঘন্টার মধ্যে মেয়াদ শেষ হবে।"),
          paragraph("আপনি এই অনুরোধ না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।"),
        ].join("")),
        text: `পাসওয়ার্ড রিসেট করতে এই লিংকে যান: ${confirmUrl}`,
      };

    case "magiclink":
      return {
        subject: `${BRAND.name} - লগইন লিংক`,
        html: baseLayout("ম্যাজিক লিংক লগইন", [
          paragraph(`প্রিয় <strong>${name}</strong>,`),
          paragraph("নিচের বাটনে ক্লিক করে আপনার অ্যাকাউন্টে লগইন করুন:"),
          ctaButton("লগইন করুন", confirmUrl),
          paragraph("এই লিংকটি ১৫ মিনিটের মধ্যে মেয়াদ শেষ হবে।"),
        ].join("")),
        text: `লগইন করতে এই লিংকে যান: ${confirmUrl}`,
      };

    case "invite":
      return {
        subject: `${BRAND.name} - আমন্ত্রণ`,
        html: baseLayout("আমন্ত্রণ", [
          paragraph(`প্রিয় <strong>${name}</strong>,`),
          paragraph(`আপনাকে ${BRAND.name}-এ আমন্ত্রণ জানানো হয়েছে। নিচের বাটনে ক্লিক করে আপনার অ্যাকাউন্ট সেট আপ করুন:`),
          ctaButton("আমন্ত্রণ গ্রহণ করুন", confirmUrl),
        ].join("")),
        text: `আমন্ত্রণ গ্রহণ করতে: ${confirmUrl}`,
      };

    case "email_change":
      return {
        subject: `${BRAND.name} - ইমেইল পরিবর্তন নিশ্চিতকরণ`,
        html: baseLayout("ইমেইল পরিবর্তন", [
          paragraph(`প্রিয় <strong>${name}</strong>,`),
          paragraph(`আপনার ইমেইল পরিবর্তন করে <strong>${newEmail}</strong> করার অনুরোধ পাওয়া গেছে।`),
          ctaButton("ইমেইল পরিবর্তন নিশ্চিত করুন", confirmUrl),
          paragraph("আপনি এই অনুরোধ না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।"),
        ].join("")),
        text: `ইমেইল পরিবর্তন নিশ্চিত করতে: ${confirmUrl}`,
      };

    case "reauthentication":
      return {
        subject: `${BRAND.name} - রি-অথেনটিকেশন কোড`,
        html: baseLayout("রি-অথেনটিকেশন", [
          paragraph(`প্রিয় <strong>${name}</strong>,`),
          paragraph("আপনার পরিচয় নিশ্চিত করতে নিচের কোডটি ব্যবহার করুন:"),
          otpBlock(token),
          paragraph("এই কোডটি ১০ মিনিটের মধ্যে মেয়াদ শেষ হবে।"),
        ].join("")),
        text: `আপনার রি-অথেনটিকেশন কোড: ${token}`,
      };

    default:
      return {
        subject: `${BRAND.name} - নোটিফিকেশন`,
        html: baseLayout("নোটিফিকেশন", [
          paragraph(`প্রিয় <strong>${name}</strong>,`),
          paragraph("আপনার অ্যাকাউন্ট সম্পর্কিত একটি নোটিফিকেশন।"),
          token ? otpBlock(token) : "",
          confirmUrl !== "#" ? ctaButton("এগিয়ে যান", confirmUrl) : "",
        ].join("")),
        text: `অ্যাকাউন্ট নোটিফিকেশন। ${token ? "কোড: " + token : ""}`,
      };
  }
}

// Raw SMTP sender (same as send-template-email)
async function sendViaSMTP(
  smtp: any,
  senderEmail: string,
  recipientEmail: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const smtpPort = smtp.port || 587;
  const textEncoder = new TextEncoder();
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const htmlBase64 = encodeBase64(textEncoder.encode(html));
  const textBase64 = encodeBase64(textEncoder.encode(text));
  const subjectEncoded = `=?UTF-8?B?${encodeBase64(textEncoder.encode(subject))}?=`;

  const mimeMessage = [
    `From: ${senderEmail}`,
    `To: ${recipientEmail}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    textBase64,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlBase64,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  const conn = await Deno.connect({ hostname: smtp.host, port: smtpPort });
  const decoder = new TextDecoder();

  async function readLine(): Promise<string> {
    const buf = new Uint8Array(4096);
    let result = "";
    while (true) {
      const n = await conn.read(buf);
      if (n === null) break;
      result += decoder.decode(buf.subarray(0, n));
      if (result.includes("\r\n")) break;
    }
    return result.trim();
  }

  async function sendCmd(cmd: string): Promise<string> {
    await conn.write(textEncoder.encode(cmd + "\r\n"));
    return await readLine();
  }

  await readLine(); // greeting

  let ehloResp = await sendCmd(`EHLO localhost`);
  const supportsStartTLS = ehloResp.toLowerCase().includes("starttls");

  if (supportsStartTLS && smtpPort !== 465) {
    await sendCmd("STARTTLS");
    const tlsConn = await Deno.startTls(conn, { hostname: smtp.host });
    const origRead = conn.read.bind(conn);
    const origWrite = conn.write.bind(conn);
    conn.read = tlsConn.read.bind(tlsConn);
    conn.write = tlsConn.write.bind(tlsConn);
    (conn as any)._tls = tlsConn;
    await sendCmd(`EHLO localhost`);
  }

  const authStr = encodeBase64(textEncoder.encode(`\x00${smtp.username}\x00${smtp.password}`));
  await sendCmd(`AUTH PLAIN ${authStr}`);
  await sendCmd(`MAIL FROM:<${senderEmail}>`);
  await sendCmd(`RCPT TO:<${recipientEmail}>`);
  await sendCmd("DATA");
  await conn.write(textEncoder.encode(mimeMessage + "\r\n.\r\n"));
  await readLine();
  await sendCmd("QUIT");
  try { conn.close(); } catch { /* ignore */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // Verify webhook signature if LOVABLE_API_KEY exists
    const body = await req.text();
    if (lovableApiKey) {
      try {
        const wh = new Webhook(lovableApiKey);
        const svixId = req.headers.get("svix-id") || "";
        const svixTimestamp = req.headers.get("svix-timestamp") || "";
        const svixSignature = req.headers.get("svix-signature") || "";
        wh.verify(body, { "svix-id": svixId, "svix-timestamp": svixTimestamp, "svix-signature": svixSignature });
      } catch (verifyErr) {
        console.error("Webhook verification failed:", verifyErr);
        // Continue anyway - some auth events may not have signatures
      }
    }

    const payload = JSON.parse(body);
    console.log("Auth email hook received:", payload.email_data?.email_action_type || "unknown");

    const emailType = payload.email_data?.email_action_type || "unknown";
    const recipientEmail = payload.user?.email;

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SMTP config from site_settings
    const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: smtpRow } = await sbAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    const smtp = smtpRow?.value as any;
    if (!smtp?.enabled || !smtp.host || !smtp.username || !smtp.password) {
      console.error("SMTP not configured or disabled, cannot send auth email");
      return new Response(JSON.stringify({ error: "SMTP not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Render the auth email template
    const rendered = renderAuthEmail(emailType, payload);

    // Determine sender
    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const rawFrom = smtp.from_email?.trim();
    const senderEmail = rawFrom && isValidEmail(rawFrom) ? rawFrom : smtp.username;

    // Send via SMTP
    await sendViaSMTP(smtp, senderEmail, recipientEmail, rendered.subject, rendered.html, rendered.text);

    console.log(`Auth email sent via SMTP: ${emailType} -> ${recipientEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Auth email hook error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to send auth email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});