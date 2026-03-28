import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== Brand Constants =====
const BRAND = {
  name: "Arodx",
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
  dangerColor: "#ef4444",
  email: "arodxofficial@gmail.com",
};

// ===== SVG Icons (inline, no emoji) =====
const ICONS = {
  welcome: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primaryColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  shield: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.warningColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  lock: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.successColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  creditCard: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primaryColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  checkCircle: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.successColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  alertTriangle: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.dangerColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
  clock: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.warningColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  xCircle: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.dangerColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`,
  ticket: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primaryColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
  messageCircle: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.accentColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`,
  star: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.warningColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

// ===== Base Layout =====
function baseLayout(icon: string, title: string, content: string, footerNote?: string): string {
  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bgColor};font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bgColor};padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(38,89,255,0.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,${BRAND.gradientStart},${BRAND.gradientEnd});padding:28px 32px;text-align:center;">
<h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1.5px;">${BRAND.name}</h1>
<p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:0.5px;">${BRAND.tagline}</p>
</td></tr>

<!-- Icon + Title -->
<tr><td style="padding:32px 32px 0;text-align:center;">
<div style="display:inline-block;width:72px;height:72px;background:${BRAND.bgColor};border-radius:50%;line-height:72px;text-align:center;margin-bottom:16px;">
${icon}
</div>
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.textDark};">${title}</h2>
</td></tr>

<!-- Content -->
<tr><td style="padding:16px 32px 32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid ${BRAND.borderColor};text-align:center;">
${footerNote ? `<p style="margin:0 0 8px;font-size:11px;color:${BRAND.textLight};">${footerNote}</p>` : ''}
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

function infoRow(label: string, value: string): string {
  return `<tr>
<td style="padding:8px 12px;font-size:13px;color:${BRAND.textMuted};border-bottom:1px solid #f1f5f9;">${label}</td>
<td style="padding:8px 12px;font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:500;border-bottom:1px solid #f1f5f9;">${value}</td>
</tr>`;
}

function infoTable(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid ${BRAND.borderColor};margin:16px 0;overflow:hidden;">
${rows}
</table>`;
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:24px 0;">
<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.gradientStart},${BRAND.gradientEnd});color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;box-shadow:0 4px 12px rgba(38,89,255,0.25);">${text}</a>
</div>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:${BRAND.textMuted};line-height:1.7;">${text}</p>`;
}

// ===== Template Generators =====
const TEMPLATES: Record<string, (data: any) => { subject: string; html: string; text: string }> = {

  "welcome": (data) => ({
    subject: `${BRAND.name} - স্বাগতম!`,
    html: baseLayout(ICONS.welcome, "স্বাগতম!", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph(`${BRAND.name}-এ আপনাকে স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন আপনি আমাদের সকল সেবা উপভোগ করতে পারবেন।`),
      infoTable(
        infoRow("অ্যাকাউন্ট", data.email || "N/A") +
        infoRow("রেজিস্ট্রেশন তারিখ", new Date().toLocaleDateString("bn-BD"))
      ),
      paragraph("আপনার ড্যাশবোর্ড থেকে সকল সেবা ম্যানেজ করতে পারবেন।"),
      ctaButton("ড্যাশবোর্ডে যান", data.dashboardUrl || "#"),
    ].join(""), "এই ইমেইলটি আপনার রেজিস্ট্রেশন নিশ্চিত করতে পাঠানো হয়েছে"),
    text: `${BRAND.name}-এ স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।`,
  }),

  "login-alert": (data) => ({
    subject: `${BRAND.name} - নতুন ডিভাইস থেকে লগইন`,
    html: baseLayout(ICONS.shield, "নতুন লগইন সনাক্ত হয়েছে", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph("আপনার অ্যাকাউন্টে একটি নতুন ডিভাইস থেকে লগইন করা হয়েছে। আপনি যদি এই লগইন করে থাকেন, তাহলে কোনো পদক্ষেপ নেওয়ার প্রয়োজন নেই।"),
      infoTable(
        infoRow("ডিভাইস", data.device || "Unknown") +
        infoRow("ব্রাউজার", data.browser || "Unknown") +
        infoRow("অপারেটিং সিস্টেম", data.os || "Unknown") +
        infoRow("সময়", new Date().toLocaleString("bn-BD"))
      ),
      `<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin:16px 0;">
<p style="margin:0;font-size:13px;color:#92400e;font-weight:500;">আপনি এই লগইন না করে থাকলে অনুগ্রহ করে এখনই আপনার পাসওয়ার্ড পরিবর্তন করুন।</p>
</div>`,
    ].join(""), "এটি একটি নিরাপত্তা সংক্রান্ত নোটিফিকেশন"),
    text: `আপনার অ্যাকাউন্টে নতুন ডিভাইস থেকে লগইন সনাক্ত হয়েছে।`,
  }),

  "password-changed": (data) => ({
    subject: `${BRAND.name} - পাসওয়ার্ড পরিবর্তন হয়েছে`,
    html: baseLayout(ICONS.lock, "পাসওয়ার্ড পরিবর্তন সফল", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph("আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।"),
      infoTable(
        infoRow("অ্যাকাউন্ট", data.email || "N/A") +
        infoRow("সময়", new Date().toLocaleString("bn-BD"))
      ),
      `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin:16px 0;">
<p style="margin:0;font-size:13px;color:#991b1b;font-weight:500;">আপনি এই পরিবর্তন না করে থাকলে অনুগ্রহ করে অবিলম্বে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।</p>
</div>`,
    ].join(""), "এটি একটি নিরাপত্তা সংক্রান্ত নোটিফিকেশন"),
    text: `আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।`,
  }),

  "subscription-confirmation": (data) => ({
    subject: `${BRAND.name} - সাবস্ক্রিপশন নিশ্চিত হয়েছে`,
    html: baseLayout(ICONS.creditCard, "সাবস্ক্রিপশন সফল!", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph(`আপনার <strong>${data.package || 'প্যাকেজ'}</strong> সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে! আমাদের পরিবারে যোগ দেওয়ার জন্য ধন্যবাদ।`),
      infoTable(
        infoRow("প্যাকেজ", data.package || "N/A") +
        infoRow("বিলিং পিরিয়ড", data.billingPeriod === "yearly" ? "বার্ষিক" : "মাসিক") +
        infoRow("পরিমাণ", `${data.amount || '0'} টাকা`) +
        infoRow("পেমেন্ট মেথড", data.paymentMethod || "N/A") +
        infoRow("ট্রানজ্যাকশন ID", data.transactionId || "N/A") +
        infoRow("পরবর্তী রিনিউয়াল", data.renewalDate || "N/A")
      ),
      ctaButton("ড্যাশবোর্ডে যান", data.dashboardUrl || "#"),
    ].join(""), "এটি আপনার সাবস্ক্রিপশন রসিদ"),
    text: `আপনার ${data.package || 'প্যাকেজ'} সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।`,
  }),

  "payment-success": (data) => ({
    subject: `${BRAND.name} - পেমেন্ট সফল হয়েছে`,
    html: baseLayout(ICONS.checkCircle, "পেমেন্ট সফল!", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph("আপনার মাসিক পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। আপনার সকল সেবা সচল আছে।"),
      infoTable(
        infoRow("প্যাকেজ", data.package || "N/A") +
        infoRow("পরিমাণ", `${data.amount || '0'} টাকা`) +
        infoRow("পেমেন্ট মেথড", data.paymentMethod || "N/A") +
        infoRow("ট্রানজ্যাকশন ID", data.transactionId || "N/A") +
        infoRow("পরবর্তী পেমেন্ট", data.nextPaymentDate || "N/A")
      ),
    ].join(""), "এটি আপনার পেমেন্ট রসিদ"),
    text: `আপনার পেমেন্ট ${data.amount || ''} টাকা সফলভাবে সম্পন্ন হয়েছে।`,
  }),

  "payment-failed": (data) => ({
    subject: `${BRAND.name} - পেমেন্ট ব্যর্থ হয়েছে`,
    html: baseLayout(ICONS.alertTriangle, "পেমেন্ট ব্যর্থ!", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph("দুঃখিত, আপনার সাম্প্রতিক পেমেন্ট প্রসেস করা সম্ভব হয়নি। অনুগ্রহ করে আপনার পেমেন্ট তথ্য আপডেট করে পুনরায় চেষ্টা করুন।"),
      infoTable(
        infoRow("প্যাকেজ", data.package || "N/A") +
        infoRow("পরিমাণ", `${data.amount || '0'} টাকা`) +
        infoRow("কারণ", data.reason || "পেমেন্ট মেথডে সমস্যা")
      ),
      `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin:16px 0;">
<p style="margin:0;font-size:13px;color:#991b1b;font-weight:500;">সেবা বন্ধ হওয়া এড়াতে অনুগ্রহ করে যত তাড়াতাড়ি সম্ভব পেমেন্ট সম্পন্ন করুন।</p>
</div>`,
      ctaButton("পেমেন্ট করুন", data.paymentUrl || "#"),
    ].join(""), "এটি একটি পেমেন্ট সংক্রান্ত নোটিফিকেশন"),
    text: `আপনার পেমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`,
  }),

  "renewal-reminder": (data) => ({
    subject: `${BRAND.name} - সাবস্ক্রিপশন রিনিউয়াল রিমাইন্ডার`,
    html: baseLayout(ICONS.clock, "রিনিউয়াল রিমাইন্ডার", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph(`আপনার <strong>${data.package || 'প্যাকেজ'}</strong> সাবস্ক্রিপশন <strong>${data.daysLeft || '৩'} দিন</strong> পর শেষ হবে। নিরবচ্ছিন্ন সেবা পেতে অনুগ্রহ করে সময়মত রিনিউ করুন।`),
      infoTable(
        infoRow("প্যাকেজ", data.package || "N/A") +
        infoRow("মেয়াদ শেষ", data.expiryDate || "N/A") +
        infoRow("রিনিউয়াল মূল্য", `${data.amount || '0'} টাকা`)
      ),
      ctaButton("এখনই রিনিউ করুন", data.renewalUrl || "#"),
    ].join(""), "এটি একটি সাবস্ক্রিপশন রিমাইন্ডার"),
    text: `আপনার সাবস্ক্রিপশন ${data.daysLeft || '৩'} দিন পর শেষ হবে।`,
  }),

  "subscription-cancelled": (data) => ({
    subject: `${BRAND.name} - সাবস্ক্রিপশন বাতিল হয়েছে`,
    html: baseLayout(ICONS.xCircle, "সাবস্ক্রিপশন বাতিল", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph(`আপনার <strong>${data.package || 'প্যাকেজ'}</strong> সাবস্ক্রিপশন বাতিল করা হয়েছে।`),
      infoTable(
        infoRow("প্যাকেজ", data.package || "N/A") +
        infoRow("বাতিলের তারিখ", new Date().toLocaleDateString("bn-BD")) +
        infoRow("সেবা চলবে", data.activeUntil || "বিলিং পিরিয়ড শেষ পর্যন্ত")
      ),
      paragraph("আপনি যেকোনো সময় পুনরায় সাবস্ক্রাইব করতে পারবেন। আমরা আপনাকে আবার পেতে চাই!"),
      ctaButton("পুনরায় সাবস্ক্রাইব করুন", data.resubscribeUrl || "#"),
    ].join(""), "সাবস্ক্রিপশন বাতিলের কনফার্মেশন"),
    text: `আপনার ${data.package || ''} সাবস্ক্রিপশন বাতিল করা হয়েছে।`,
  }),

  "ticket-received": (data) => ({
    subject: `${BRAND.name} - সাপোর্ট টিকেট #${data.ticketNumber || ''}`,
    html: baseLayout(ICONS.ticket, "টিকেট গ্রহণ করা হয়েছে", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph("আপনার সাপোর্ট টিকেট সফলভাবে গ্রহণ করা হয়েছে। আমাদের টিম যত দ্রুত সম্ভব আপনার সমস্যার সমাধান করবে।"),
      infoTable(
        infoRow("টিকেট নম্বর", data.ticketNumber || "N/A") +
        infoRow("বিষয়", data.subject || "N/A") +
        infoRow("ক্যাটাগরি", data.category || "General") +
        infoRow("প্রায়োরিটি", data.priority || "Medium") +
        infoRow("স্ট্যাটাস", "Open")
      ),
      ctaButton("টিকেট দেখুন", data.ticketUrl || "#"),
    ].join(""), `টিকেট ট্র্যাকিং ID: ${data.ticketNumber || ''}`),
    text: `আপনার সাপোর্ট টিকেট ${data.ticketNumber || ''} গ্রহণ করা হয়েছে।`,
  }),

  "support-reply": (data) => ({
    subject: `${BRAND.name} - টিকেট #${data.ticketNumber || ''} রিপ্লাই`,
    html: baseLayout(ICONS.messageCircle, "নতুন সাপোর্ট রিপ্লাই", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph(`আপনার টিকেট <strong>#${data.ticketNumber || ''}</strong>-এ আমাদের সাপোর্ট টিম রিপ্লাই দিয়েছে।`),
      `<div style="background:#f8fafc;border-left:3px solid ${BRAND.primaryColor};border-radius:0 8px 8px 0;padding:16px;margin:16px 0;">
<p style="margin:0 0 4px;font-size:11px;color:${BRAND.textLight};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">সাপোর্ট টিম রিপ্লাই</p>
<p style="margin:0;font-size:14px;color:${BRAND.textDark};line-height:1.6;">${data.replyPreview || 'বিস্তারিত দেখতে টিকেটে যান'}</p>
</div>`,
      ctaButton("রিপ্লাই দেখুন", data.ticketUrl || "#"),
    ].join(""), `টিকেট #${data.ticketNumber || ''}`),
    text: `আপনার টিকেট #${data.ticketNumber || ''}-এ নতুন রিপ্লাই এসেছে।`,
  }),

  "feedback-request": (data) => ({
    subject: `${BRAND.name} - আপনার মতামত জানান`,
    html: baseLayout(ICONS.star, "আপনার মতামত গুরুত্বপূর্ণ", [
      paragraph(`প্রিয় <strong>${data.name || 'গ্রাহক'}</strong>,`),
      paragraph("আপনার সেবা সম্পর্কে আপনার মূল্যবান মতামত জানতে চাই। আপনার ফিডব্যাক আমাদের সেবার মান উন্নত করতে সাহায্য করবে।"),
      data.project ? infoTable(infoRow("প্রজেক্ট", data.project)) : '',
      ctaButton("ফিডব্যাক দিন", data.feedbackUrl || "#"),
      paragraph("আপনার সময় দেওয়ার জন্য অগ্রিম ধন্যবাদ।"),
    ].join(""), "আমরা আপনার মতামতকে মূল্যায়ন করি"),
    text: `আপনার মূল্যবান মতামত জানাতে অনুরোধ করা হচ্ছে।`,
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { templateName, recipientEmail, data, previewOnly } = body;

    if (!templateName || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing templateName or recipientEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if template exists
    const templateFn = TEMPLATES[templateName];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${templateName}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preview mode - just return the rendered HTML without sending
    if (previewOnly) {
      const rendered = templateFn(data || {});
      return new Response(
        JSON.stringify({ success: true, html: rendered.html, subject: rendered.subject }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if template is enabled
    const { data: configRow } = await sbAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "email_templates_config")
      .single();

    const config = (configRow?.value as any) || {};
    if (config[templateName]?.enabled === false) {
      return new Response(
        JSON.stringify({ error: "Template is disabled", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMTP config
    const { data: smtpRow } = await sbAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    const smtp = smtpRow?.value as any;
    if (!smtp?.enabled) {
      return new Response(
        JSON.stringify({ error: "SMTP is not enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!smtp.host || !smtp.username || !smtp.password) {
      return new Response(
        JSON.stringify({ error: "SMTP configuration incomplete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email
    const rendered = templateFn(data || {});

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const rawFrom = smtp.from_email?.trim();
    const senderEmail = (rawFrom && isValidEmail(rawFrom)) ? rawFrom : smtp.username;
    const smtpPort = smtp.port || 587;

    // Build MIME message with base64 encoding for proper UTF-8 support
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const textEncoder = new TextEncoder();

    const htmlBase64 = encodeBase64(textEncoder.encode(rendered.html));
    const textBase64 = encodeBase64(textEncoder.encode(rendered.text));
    const subjectEncoded = `=?UTF-8?B?${encodeBase64(textEncoder.encode(rendered.subject))}?=`;

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

    // Send via raw SMTP
    const useImplicitTLS = smtpPort === 465;
    let conn: Deno.Conn;

    if (useImplicitTLS) {
      conn = await Deno.connectTls({ hostname: smtp.host, port: smtpPort });
    } else {
      conn = await Deno.connect({ hostname: smtp.host, port: smtpPort });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    async function readResponse(): Promise<string> {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : "";
    }

    async function sendCmd(cmd: string): Promise<string> {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    }

    // Greeting
    await readResponse();

    // EHLO
    await sendCmd(`EHLO localhost`);

    // STARTTLS for port 587
    if (!useImplicitTLS) {
      const starttlsResp = await sendCmd("STARTTLS");
      if (starttlsResp.startsWith("220")) {
        conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: smtp.host });
        await sendCmd(`EHLO localhost`);
      }
    }

    // AUTH LOGIN
    await sendCmd("AUTH LOGIN");
    await sendCmd(encodeBase64(encoder.encode(smtp.username)));
    const authResp = await sendCmd(encodeBase64(encoder.encode(smtp.password)));
    if (!authResp.startsWith("235")) {
      conn.close();
      throw new Error("SMTP Authentication failed: " + authResp.trim());
    }

    // MAIL FROM
    await sendCmd(`MAIL FROM:<${senderEmail}>`);

    // RCPT TO
    await sendCmd(`RCPT TO:<${recipientEmail}>`);

    // DATA
    await sendCmd("DATA");

    // Send message body + terminator
    await conn.write(encoder.encode(mimeMessage + "\r\n.\r\n"));
    const dataResp = await readResponse();
    if (!dataResp.startsWith("250")) {
      conn.close();
      throw new Error("SMTP DATA failed: " + dataResp.trim());
    }

    // QUIT
    await sendCmd("QUIT");
    try { conn.close(); } catch { /* ignore */ }

    console.log(`Email sent: ${templateName} -> ${recipientEmail}`);

    return new Response(
      JSON.stringify({ success: true, template: templateName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Template email error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
