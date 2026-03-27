import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND = {
  name: "ArodX",
  tagline: "Web Development Agency",
  primaryColor: "#2659FF",
  gradientStart: "#2659FF",
  gradientEnd: "#4789FF",
  bgColor: "#f0f4ff",
  textDark: "#1a1a2e",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  borderColor: "#e2e8f0",
  email: "arodxofficial@gmail.com",
};

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bgColor};font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bgColor};padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(38,89,255,0.08);">
<tr><td style="background:linear-gradient(135deg,${BRAND.gradientStart},${BRAND.gradientEnd});padding:28px 32px;text-align:center;">
<h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1.5px;">${BRAND.name}</h1>
<p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">${BRAND.tagline}</p>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid ${BRAND.borderColor};text-align:center;">
<p style="margin:0 0 2px;font-size:12px;color:${BRAND.textDark};font-weight:600;">${BRAND.name}</p>
<p style="margin:0;font-size:11px;color:${BRAND.textLight};"><a href="mailto:${BRAND.email}" style="color:${BRAND.primaryColor};text-decoration:none;">${BRAND.email}</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function otpBlock(code: string): string {
  return `<div style="text-align:center;margin:24px 0;">
<div style="display:inline-block;background:${BRAND.bgColor};border:2px dashed ${BRAND.primaryColor};border-radius:12px;padding:16px 32px;">
<p style="margin:0 0 4px;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;">ভেরিফিকেশন কোড</p>
<p style="margin:0;font-size:36px;font-weight:800;color:${BRAND.primaryColor};letter-spacing:8px;">${code}</p>
</div></div>`;
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:24px 0;">
<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.gradientStart},${BRAND.gradientEnd});color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;box-shadow:0 4px 12px rgba(38,89,255,0.25);">${text}</a>
</div>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:${BRAND.textMuted};line-height:1.7;">${text}</p>`;
}

async function sendViaSMTP(smtp: any, senderEmail: string, recipientEmail: string, subject: string, html: string, text: string) {
  const smtpPort = smtp.port || 587;
  const te = new TextEncoder();
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const htmlB64 = encodeBase64(te.encode(html));
  const textB64 = encodeBase64(te.encode(text));
  const subjectEnc = `=?UTF-8?B?${encodeBase64(te.encode(subject))}?=`;

  const mime = [
    `From: ${BRAND.name} <${senderEmail}>`,
    `To: ${recipientEmail}`,
    `Subject: ${subjectEnc}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``, `--${boundary}`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``, textB64, ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``, htmlB64, ``,
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
    await conn.write(te.encode(cmd + "\r\n"));
    return await readLine();
  }

  await readLine();
  const ehlo = await sendCmd("EHLO localhost");
  if (ehlo.toLowerCase().includes("starttls") && smtpPort !== 465) {
    await sendCmd("STARTTLS");
    const tlsConn = await Deno.startTls(conn, { hostname: smtp.host });
    conn.read = tlsConn.read.bind(tlsConn);
    conn.write = tlsConn.write.bind(tlsConn);
    (conn as any)._tls = tlsConn;
    await sendCmd("EHLO localhost");
  }

  const authStr = encodeBase64(te.encode(`\x00${smtp.username}\x00${smtp.password}`));
  await sendCmd(`AUTH PLAIN ${authStr}`);
  await sendCmd(`MAIL FROM:<${senderEmail}>`);
  await sendCmd(`RCPT TO:<${recipientEmail}>`);
  await sendCmd("DATA");
  await conn.write(te.encode(mime + "\r\n.\r\n"));
  await readLine();
  await sendCmd("QUIT");
  try { conn.close(); } catch { /* ok */ }
}

function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 6; i++) otp += digits[arr[i] % 10];
  return otp;
}

function generateResetToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, siteUrl } = await req.json();

    if (!type || !email) {
      return new Response(JSON.stringify({ error: "Missing type or email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // Get SMTP config
    const { data: smtpRow } = await sbAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    const smtp = smtpRow?.value as any;
    if (!smtp?.enabled || !smtp.host || !smtp.username || !smtp.password) {
      return new Response(JSON.stringify({ error: "SMTP not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const senderEmail = smtp.from_email?.trim() && isValidEmail(smtp.from_email.trim()) ? smtp.from_email.trim() : smtp.username;

    if (type === "signup") {
      // Generate OTP and store
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Invalidate old codes
      await sbAdmin.from("verification_codes").delete()
        .eq("email", email).eq("code_type", "signup");

      await sbAdmin.from("verification_codes").insert({
        email, code: otp, code_type: "signup", expires_at: expiresAt,
      });

      // Get user name
      const { data: userData } = await sbAdmin.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email === email);
      const name = user?.user_metadata?.full_name || email;

      const subject = `${BRAND.name} - ইমেইল ভেরিফিকেশন কোড`;
      const html = baseLayout("ইমেইল ভেরিফিকেশন", [
        p(`প্রিয় <strong>${name}</strong>,`),
        p(`${BRAND.name}-এ আপনার অ্যাকাউন্ট তৈরি করার জন্য ধন্যবাদ। আপনার ইমেইল ভেরিফাই করতে নিচের কোডটি ব্যবহার করুন:`),
        otpBlock(otp),
        p("এই কোডটি ১৫ মিনিটের মধ্যে মেয়াদ শেষ হবে।"),
        p("আপনি এই অ্যাকাউন্ট তৈরি না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।"),
      ].join(""));
      const text = `আপনার ভেরিফিকেশন কোড: ${otp}`;

      await sendViaSMTP(smtp, senderEmail, email, subject, html, text);
      console.log(`Signup OTP sent via SMTP to ${email}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "verify") {
      const { code } = await req.json().catch(() => ({ code: "" }));
      // This is handled differently - code comes from initial parse
    } else if (type === "verify_otp") {
      // Verify OTP against our table
      // Actually this needs the code too, let me restructure
    } else if (type === "reset") {
      // Generate reset token
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Invalidate old codes
      await sbAdmin.from("verification_codes").delete()
        .eq("email", email).eq("code_type", "reset");

      await sbAdmin.from("verification_codes").insert({
        email, code: token, code_type: "reset", expires_at: expiresAt,
      });

      const resetUrl = `${siteUrl || "https://lovable232323543535353553535343453434.lovable.app"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      const { data: userData } = await sbAdmin.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email === email);
      const name = user?.user_metadata?.full_name || email;

      const subject = `${BRAND.name} - পাসওয়ার্ড রিসেট`;
      const html = baseLayout("পাসওয়ার্ড রিসেট", [
        p(`প্রিয় <strong>${name}</strong>,`),
        p("আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার অনুরোধ পাওয়া গেছে। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন:"),
        ctaButton("পাসওয়ার্ড রিসেট করুন", resetUrl),
        p("এই লিংকটি ১ ঘন্টার মধ্যে মেয়াদ শেষ হবে।"),
        p("আপনি এই অনুরোধ না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।"),
      ].join(""));
      const text = `পাসওয়ার্ড রিসেট করতে এই লিংকে যান: ${resetUrl}`;

      await sendViaSMTP(smtp, senderEmail, email, subject, html, text);
      console.log(`Password reset email sent via SMTP to ${email}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "resend_otp") {
      // Same as signup - regenerate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await sbAdmin.from("verification_codes").delete()
        .eq("email", email).eq("code_type", "signup");

      await sbAdmin.from("verification_codes").insert({
        email, code: otp, code_type: "signup", expires_at: expiresAt,
      });

      const { data: userData } = await sbAdmin.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email === email);
      const name = user?.user_metadata?.full_name || email;

      const subject = `${BRAND.name} - নতুন ভেরিফিকেশন কোড`;
      const html = baseLayout("নতুন ভেরিফিকেশন কোড", [
        p(`প্রিয় <strong>${name}</strong>,`),
        p("আপনার নতুন ভেরিফিকেশন কোড:"),
        otpBlock(otp),
        p("এই কোডটি ১৫ মিনিটের মধ্যে মেয়াদ শেষ হবে।"),
      ].join(""));
      const text = `আপনার নতুন ভেরিফিকেশন কোড: ${otp}`;

      await sendViaSMTP(smtp, senderEmail, email, subject, html, text);
      console.log(`Resend OTP sent via SMTP to ${email}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "verify_code") {
      const { code } = await new Response(req.body).json().catch(() => ({ code: "" }));
      // Need code from initial parse - restructure
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Custom auth email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
