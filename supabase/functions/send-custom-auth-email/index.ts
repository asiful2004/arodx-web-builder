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
</table></td></tr></table>
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

  let conn: Deno.Conn = await Deno.connect({ hostname: smtp.host, port: smtpPort });
  const decoder = new TextDecoder();
  let carry = "";

  async function readLine(): Promise<string> {
    if (carry.includes("\n")) {
      const idx = carry.indexOf("\n");
      const line = carry.slice(0, idx + 1);
      carry = carry.slice(idx + 1);
      return line.replace(/\r?\n$/, "");
    }

    const buf = new Uint8Array(4096);
    while (true) {
      const n = await conn.read(buf);
      if (n === null) break;
      carry += decoder.decode(buf.subarray(0, n));
      if (carry.includes("\n")) {
        const idx = carry.indexOf("\n");
        const line = carry.slice(0, idx + 1);
        carry = carry.slice(idx + 1);
        return line.replace(/\r?\n$/, "");
      }
    }

    const rest = carry;
    carry = "";
    return rest.trim();
  }

  async function readResponse(): Promise<string> {
    const first = await readLine();
    if (!first) return "";

    const lines = [first];
    const match = first.match(/^(\d{3})([\s-])/);
    if (!match) return first;

    const code = match[1];
    const sep = match[2];
    if (sep === "-") {
      while (true) {
        const line = await readLine();
        if (!line) break;
        lines.push(line);
        if (line.startsWith(`${code} `)) break;
      }
    }

    return lines.join("\n");
  }

  function assertCode(response: string, expected: number[], step: string) {
    const code = Number(response.slice(0, 3));
    if (!Number.isFinite(code) || !expected.includes(code)) {
      throw new Error(`SMTP ${step} failed: ${response || "No response"}`);
    }
  }

  async function sendCmd(cmd: string): Promise<string> {
    await conn.write(te.encode(cmd + "\r\n"));
    return await readResponse();
  }

  const greeting = await readResponse();
  assertCode(greeting, [220], "greeting");

  const ehlo = await sendCmd("EHLO localhost");
  assertCode(ehlo, [250], "EHLO");

  if (ehlo.toLowerCase().includes("starttls") && smtpPort !== 465) {
    const tlsResp = await sendCmd("STARTTLS");
    assertCode(tlsResp, [220], "STARTTLS");
    conn = await Deno.startTls(conn, { hostname: smtp.host });
    const ehloTls = await sendCmd("EHLO localhost");
    assertCode(ehloTls, [250], "EHLO after STARTTLS");
  }

  const authStr = encodeBase64(te.encode(`\x00${smtp.username}\x00${smtp.password}`));
  const authResp = await sendCmd(`AUTH PLAIN ${authStr}`);
  assertCode(authResp, [235, 503], "AUTH");

  const mailFromResp = await sendCmd(`MAIL FROM:<${senderEmail}>`);
  assertCode(mailFromResp, [250], "MAIL FROM");

  const rcptResp = await sendCmd(`RCPT TO:<${recipientEmail}>`);
  assertCode(rcptResp, [250, 251], "RCPT TO");

  const dataResp = await sendCmd("DATA");
  assertCode(dataResp, [354], "DATA");

  await conn.write(te.encode(mime + "\r\n.\r\n"));
  const queuedResp = await readResponse();
  assertCode(queuedResp, [250], "message body");

  const quitResp = await sendCmd("QUIT");
  assertCode(quitResp, [221], "QUIT");

  try { conn.close(); } catch { /* ok */ }
}

function generateOTP(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => (b % 10).toString()).join("");
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
    const body = await req.json();
    const { type, email, code, siteUrl, newPassword } = body;

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
      .from("site_settings").select("value").eq("key", "smtp").single();

    const smtp = smtpRow?.value as any;
    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const senderEmail = smtp?.from_email?.trim() && isValidEmail(smtp.from_email.trim())
      ? smtp.from_email.trim() : smtp?.username || BRAND.email;

    async function getUserName(targetEmail: string): Promise<string> {
      const { data } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 });
      const user = data?.users?.find((u: any) => u.email === targetEmail);
      return user?.user_metadata?.full_name || targetEmail;
    }

    // ===== SEND SIGNUP OTP =====
    if (type === "signup" || type === "resend_otp") {
      if (!smtp?.enabled) {
        return new Response(JSON.stringify({ error: "SMTP not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Invalidate old codes
      await sbAdmin.from("verification_codes").delete()
        .eq("email", email).eq("code_type", "signup");

      const { error: insertErr } = await sbAdmin.from("verification_codes").insert({
        email, code: otp, code_type: "signup", expires_at: expiresAt,
      });
      if (insertErr) throw insertErr;

      const name = await getUserName(email);
      const isResend = type === "resend_otp";
      const subject = `${BRAND.name} - ${isResend ? "নতুন " : ""}ভেরিফিকেশন কোড`;
      const html = baseLayout(isResend ? "নতুন ভেরিফিকেশন কোড" : "ইমেইল ভেরিফিকেশন", [
        p(`প্রিয় <strong>${name}</strong>,`),
        isResend
          ? p("আপনার নতুন ভেরিফিকেশন কোড:")
          : p(`${BRAND.name}-এ আপনার অ্যাকাউন্ট তৈরি করার জন্য ধন্যবাদ। আপনার ইমেইল ভেরিফাই করতে নিচের কোডটি ব্যবহার করুন:`),
        otpBlock(otp),
        p("এই কোডটি ১৫ মিনিটের মধ্যে মেয়াদ শেষ হবে।"),
        p("আপনি এই অ্যাকাউন্ট তৈরি না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।"),
      ].join(""));
      const text = `আপনার ভেরিফিকেশন কোড: ${otp}`;

      await sendViaSMTP(smtp, senderEmail, email, subject, html, text);
      console.log(`${type} OTP sent via SMTP to ${email}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== VERIFY OTP =====
    if (type === "verify_otp") {
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing code" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: codeRow, error: codeErr } = await sbAdmin
        .from("verification_codes")
        .select("*")
        .eq("email", email)
        .eq("code_type", "signup")
        .eq("code", code)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (codeErr || !codeRow) {
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark code as used
      await sbAdmin.from("verification_codes")
        .update({ used: true })
        .eq("id", codeRow.id);

      // Set email_verified in profiles
      const { data: userData } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 });
      const user = userData?.users?.find((u: any) => u.email === email);
      if (user) {
        await sbAdmin.from("profiles")
          .update({ email_verified: true })
          .eq("user_id", user.id);
      }

      console.log(`Email verified for ${email}`);

      return new Response(JSON.stringify({ success: true, verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== SEND PASSWORD RESET =====
    if (type === "reset") {
      if (!smtp?.enabled) {
        return new Response(JSON.stringify({ error: "SMTP not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user exists
      const { data: userData } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 });
      const user = userData?.users?.find((u: any) => u.email === email);
      if (!user) {
        // Don't reveal if user exists - return success anyway
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await sbAdmin.from("verification_codes").delete()
        .eq("email", email).eq("code_type", "reset");

      await sbAdmin.from("verification_codes").insert({
        email, code: token, code_type: "reset", expires_at: expiresAt,
      });

      const baseUrl = siteUrl || "https://lovable232323543535353553535343453434.lovable.app";
      const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const name = user.user_metadata?.full_name || email;

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
    }

    // ===== VERIFY RESET TOKEN & UPDATE PASSWORD =====
    if (type === "reset_verify") {
      if (!code || !newPassword) {
        return new Response(JSON.stringify({ error: "Missing token or password" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: codeRow, error: codeErr } = await sbAdmin
        .from("verification_codes")
        .select("*")
        .eq("email", email)
        .eq("code_type", "reset")
        .eq("code", code)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (codeErr || !codeRow) {
        return new Response(JSON.stringify({ error: "Invalid or expired reset token" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark token as used
      await sbAdmin.from("verification_codes")
        .update({ used: true })
        .eq("id", codeRow.id);

      // Find user and update password
      const { data: userData } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 });
      const user = userData?.users?.find((u: any) => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await sbAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      if (updateErr) throw updateErr;

      console.log(`Password updated for ${email}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
