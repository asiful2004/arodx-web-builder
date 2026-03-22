import { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, Save, ShieldAlert, Clock, Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Pencil, FileText, Bot, Mail, Eye, EyeOff, Send } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import ChatAiConfigPanel from "./ChatAiConfigPanel";

// ===== Rate Limit Section =====
function RateLimitSection() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSetting();
  const { toast } = useToast();
  const [localData, setLocalData] = useState<any>(null);

  useEffect(() => {
    if (settings?.rate_limit) {
      setLocalData(settings.rate_limit);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(
      { key: "rate_limit", value: localData },
      {
        onSuccess: () => sonnerToast.success("রেট লিমিট আপডেট হয়েছে!"),
        onError: () => sonnerToast.error("আপডেট করতে সমস্যা হয়েছে"),
      }
    );
  };

  if (isLoading || !localData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">লগইন রেট লিমিট</CardTitle>
            <CardDescription>ভুল পাসওয়ার্ড দিলে লগইন ব্লক করুন</CardDescription>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" className="gap-2">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          সেভ
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div>
            <Label className="text-sm font-semibold">রেট লিমিট সক্রিয়</Label>
            <p className="text-xs text-muted-foreground mt-1">ভুল পাসওয়ার্ড দিলে নির্দিষ্ট সময়ের জন্য লগইন ব্লক হবে</p>
          </div>
          <Switch checked={localData.enabled ?? true} onCheckedChange={(v) => setLocalData({ ...localData, enabled: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">সর্বোচ্চ চেষ্টা</Label>
            <Input type="number" min={1} max={20} value={localData.max_attempts ?? 5} onChange={(e) => setLocalData({ ...localData, max_attempts: parseInt(e.target.value) || 5 })} className="text-sm" />
            <p className="text-[10px] text-muted-foreground">এতবার ভুল পাসওয়ার্ড দিলে লক হবে</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">লকআউট সময় (মিনিট)</Label>
            <Input type="number" min={1} max={60} value={localData.lockout_minutes ?? 15} onChange={(e) => setLocalData({ ...localData, lockout_minutes: parseInt(e.target.value) || 15 })} className="text-sm" />
            <p className="text-[10px] text-muted-foreground">কত মিনিট লগইন ব্লক থাকবে</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <strong>বর্তমান সেটিং:</strong> {localData.max_attempts ?? 5}বার ভুল পাসওয়ার্ড দিলে {localData.lockout_minutes ?? 15} মিনিটের জন্য লগইন ব্লক হবে।
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Cron Jobs Section =====
interface CronJob { jobname: string; schedule: string; active: boolean; }
interface CronRunDetail { jobid: number; job_pid: number; status: string; return_message: string; start_time: string; end_time: string; runid: number; }

const CRON_JOB_LABELS: Record<string, { label: string; description: string }> = {
  "cleanup-closed-chats-hourly": { label: "চ্যাট ক্লিনআপ", description: "প্রতি ঘণ্টায় ২৪ঘণ্টা inactive চ্যাট বন্ধ ও ৭২ঘণ্টা পুরনো চ্যাট ডিলিট" },
  "cleanup-rejected-applications-daily": { label: "আবেদন ক্লিনআপ", description: "প্রতিদিন রাত ৩টায় expired rejected আবেদন ডিলিট" },
};

const SCHEDULE_PRESETS = [
  { label: "প্রতি ১০ মিনিট", value: "*/10 * * * *" },
  { label: "প্রতি ৩০ মিনিট", value: "*/30 * * * *" },
  { label: "প্রতি ঘণ্টায়", value: "0 * * * *" },
  { label: "প্রতি ৩ ঘণ্টায়", value: "0 */3 * * *" },
  { label: "প্রতি ৬ ঘণ্টায়", value: "0 */6 * * *" },
  { label: "প্রতি ১২ ঘণ্টায়", value: "0 */12 * * *" },
  { label: "প্রতিদিন রাত ১২টায়", value: "0 0 * * *" },
  { label: "প্রতিদিন রাত ৩টায়", value: "0 3 * * *" },
  { label: "প্রতিদিন সকাল ৬টায়", value: "0 6 * * *" },
  { label: "প্রতি সপ্তাহে (রবিবার)", value: "0 0 * * 0" },
];

function CronJobsSection() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [runDetails, setRunDetails] = useState<CronRunDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 5;

  const fetchCronData = useCallback(async () => {
    setLoading(true);
    try {
      // Cleanup old entries (3+ days)
      await supabase.rpc("cleanup_old_cron_runs" as any);
      const { data: jobsData } = await supabase.rpc("get_cron_jobs" as any);
      const { data: runsData } = await supabase.rpc("get_cron_run_details" as any);
      setJobs((jobsData as any[]) || []);
      setRunDetails((runsData as any[]) || []);
      setHistoryPage(1);
    } catch (err) {
      console.error("Error fetching cron data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCronData(); }, [fetchCronData]);

  const triggerJob = async (jobName: string) => {
    setTriggering(jobName);
    try {
      const fnName = jobName.includes("chat") ? "cleanup-closed-chats" : "cleanup-rejected-applications";
      const { error } = await supabase.functions.invoke(fnName, { body: { time: new Date().toISOString() } });
      if (error) throw error;
      toast({ title: "সফল!", description: `${CRON_JOB_LABELS[jobName]?.label || jobName} ম্যানুয়ালি রান হয়েছে` });
      setTimeout(fetchCronData, 2000);
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || "রান করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setTriggering(null);
    }
  };

  const updateSchedule = async (jobName: string) => {
    if (!editSchedule.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("update_cron_schedule" as any, { _jobname: jobName, _schedule: editSchedule.trim() });
      if (error) throw error;
      toast({ title: "সফল!", description: "শিডিউল আপডেট হয়েছে" });
      setEditingJob(null);
      setEditSchedule("");
      fetchCronData();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || "আপডেট করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "succeeded") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />সফল</Badge>;
    if (status === "failed") return <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />ব্যর্থ</Badge>;
    return <Badge variant="secondary" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>;
  };

  const formatTime = (t: string) => {
    try { return new Date(t).toLocaleString("bn-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
    catch { return t; }
  };

  if (loading) {
    return <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Clock className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-lg">Cron Jobs</CardTitle>
              <CardDescription>স্বয়ংক্রিয় নির্ধারিত কাজসমূহ</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCronData} className="gap-2"><RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">কোনো Cron Job পাওয়া যায়নি</p>
          ) : (
            jobs.map((job) => {
              const meta = CRON_JOB_LABELS[job.jobname] || { label: job.jobname, description: "" };
              const isEditing = editingJob === job.jobname;
              const currentPreset = SCHEDULE_PRESETS.find(p => p.value === job.schedule);
              return (
                <div key={job.jobname} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                        <Badge variant={job.active ? "default" : "secondary"} className="text-[10px]">{job.active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                      </div>
                      {meta.description && <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono">{job.schedule}</code>
                        {currentPreset && <span className="text-[10px] text-muted-foreground">({currentPreset.label})</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => { setEditingJob(isEditing ? null : job.jobname); setEditSchedule(job.schedule); }}>
                        <Pencil className="h-3 w-3" /> এডিট
                      </Button>
                      <Button variant="default" size="sm" className="gap-1.5 text-xs h-8" onClick={() => triggerJob(job.jobname)} disabled={triggering === job.jobname}>
                        {triggering === job.jobname ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} রান করুন
                      </Button>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="pt-3 border-t border-border space-y-3">
                      <Label className="text-xs font-medium">শিডিউল পরিবর্তন করুন</Label>
                      <Select value={editSchedule} onValueChange={setEditSchedule}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="শিডিউল সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label} ({p.value})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Input value={editSchedule} onChange={(e) => setEditSchedule(e.target.value)} placeholder="Custom cron: * * * * *" className="text-sm h-9 font-mono" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateSchedule(job.jobname)} disabled={saving} className="gap-1.5 text-xs">
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} সেভ করুন
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingJob(null)} className="text-xs">বাতিল</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-lg">রান হিস্ট্রি</CardTitle>
              <CardDescription>সাম্প্রতিক Cron Job রানের লগ</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {runDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">এখনো কোনো রান রেকর্ড নেই</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {runDetails.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE).map((run, idx) => (
                  <div key={`${run.runid}-${idx}`} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(run.status)}
                        <span className="text-xs text-muted-foreground">Job #{run.jobid}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{formatTime(run.start_time)}</span>
                    </div>
                    {run.return_message && (
                      <p className="text-[11px] text-muted-foreground bg-background rounded p-2 font-mono break-all">{run.return_message}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {runDetails.length > HISTORY_PER_PAGE && (
                <div className="flex items-center justify-center gap-1 pt-2">
                  {Array.from({ length: Math.ceil(runDetails.length / HISTORY_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={historyPage === page ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setHistoryPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground text-center">সর্বোচ্চ ৩ দিনের হিস্ট্রি রাখা হয়, পুরনো রেকর্ড স্বয়ংক্রিয়ভাবে মুছে যায়</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== SMTP Config Section =====
const DEFAULT_SMTP = {
  enabled: false,
  host: "",
  port: 587,
  secure: true,
  username: "",
  password: "",
  from_name: "",
  from_email: "",
};

function SmtpConfigSection() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSetting();
  const { toast } = useToast();
  const [localData, setLocalData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalData({ ...DEFAULT_SMTP, ...(settings.smtp || {}) });
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(
      { key: "smtp", value: localData },
      {
        onSuccess: () => sonnerToast.success("SMTP সেটিংস সেভ হয়েছে!"),
        onError: () => sonnerToast.error("সেভ করতে সমস্যা হয়েছে"),
      }
    );
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      sonnerToast.error("টেস্ট ইমেইল পাঠানোর জন্য একটি ইমেইল এড্রেস দিন");
      return;
    }
    setTesting(true);
    try {
      const brandedHtml = `
<!DOCTYPE html>
<html lang="bn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:2px;">ARODX</h1>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:0.5px;">Web Development Agency</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;background:#ecfdf5;border-radius:50%;line-height:56px;font-size:28px;">&#9989;</div>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#18181b;text-align:center;">SMTP Configuration Successful!</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#71717a;text-align:center;line-height:1.6;">
              Your SMTP settings are working correctly. Emails can now be sent from your admin panel using your configured SMTP server.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e4e4e7;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Configuration Details</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#71717a;">SMTP Host</td>
                      <td style="padding:4px 0;font-size:13px;color:#18181b;text-align:right;font-weight:500;">${localData.host || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#71717a;">Port</td>
                      <td style="padding:4px 0;font-size:13px;color:#18181b;text-align:right;font-weight:500;">${localData.port || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#71717a;">Encryption</td>
                      <td style="padding:4px 0;font-size:13px;color:#18181b;text-align:right;font-weight:500;">${localData.port === 465 ? 'SSL' : 'STARTTLS'}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#71717a;">Sender</td>
                      <td style="padding:4px 0;font-size:13px;color:#18181b;text-align:right;font-weight:500;">${localData.from_email || localData.username || 'N/A'}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
              This is an automated test email. No action is required.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:24px 40px;border-top:1px solid #e4e4e7;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#18181b;font-weight:600;">Arodx</p>
            <p style="margin:0 0 8px;font-size:11px;color:#a1a1aa;">Creative design, development & marketing - all under one roof.</p>
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              <a href="mailto:arodxofficial@gmail.com" style="color:#0ea5e9;text-decoration:none;">arodxofficial@gmail.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
      const { data, error } = await supabase.functions.invoke("send-smtp-email", {
        body: {
          to: testEmail.trim(),
          subject: "SMTP Test Email - Arodx",
          html: brandedHtml,
          text: "SMTP configuration is working correctly. Your SMTP settings are properly configured. - Arodx",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      sonnerToast.success(`টেস্ট ইমেইল পাঠানো হয়েছে! ${testEmail} চেক করুন`);
    } catch (err: any) {
      sonnerToast.error(err.message || "ইমেইল পাঠাতে সমস্যা হয়েছে");
    } finally {
      setTesting(false);
    }
  };

  if (isLoading || !localData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const update = (key: string, value: any) => setLocalData({ ...localData, [key]: value });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">SMTP কনফিগারেশন</CardTitle>
            <CardDescription>কাস্টম SMTP সার্ভার দিয়ে ইমেইল পাঠান</CardDescription>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" className="gap-2">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          সেভ
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div>
            <Label className="text-sm font-semibold">SMTP সক্রিয়</Label>
            <p className="text-xs text-muted-foreground mt-1">SMTP দিয়ে ইমেইল পাঠানো সক্রিয় করুন</p>
          </div>
          <Switch checked={localData.enabled} onCheckedChange={(v) => update("enabled", v)} />
        </div>

        {/* Server Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">সার্ভার সেটিংস</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">SMTP হোস্ট</Label>
              <Input
                placeholder="smtp.gmail.com"
                value={localData.host}
                onChange={(e) => update("host", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">পোর্ট</Label>
              <Select value={String(localData.port)} onValueChange={(v) => update("port", parseInt(v))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 (SMTP)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="587">587 (TLS — recommended)</SelectItem>
                  <SelectItem value="2525">2525 (Alternative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <Label className="text-xs font-semibold">SSL/TLS সিকিউর কানেকশন</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">পোর্ট 465 এর জন্য SSL, 587 এর জন্য STARTTLS</p>
            </div>
            <Switch checked={localData.secure} onCheckedChange={(v) => update("secure", v)} />
          </div>
        </div>

        {/* Auth */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">অথেনটিকেশন</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">ইউজারনেম / ইমেইল</Label>
              <Input
                placeholder="your@email.com"
                value={localData.username}
                onChange={(e) => update("username", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">পাসওয়ার্ড / App Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={localData.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Gmail হলে App Password ব্যবহার করুন</p>
            </div>
          </div>
        </div>

        {/* Sender Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">প্রেরকের তথ্য</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">প্রেরকের নাম</Label>
              <Input
                placeholder="ArodX"
                value={localData.from_name}
                onChange={(e) => update("from_name", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">প্রেরকের ইমেইল</Label>
              <Input
                type="email"
                placeholder="noreply@yourdomain.com"
                value={localData.from_email}
                onChange={(e) => update("from_email", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Test Email */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            টেস্ট ইমেইল পাঠান
          </h4>
          <p className="text-xs text-muted-foreground">SMTP সেটিংস সঠিক আছে কিনা যাচাই করতে একটি টেস্ট ইমেইল পাঠান</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="text-sm flex-1"
            />
            <Button onClick={handleTestEmail} disabled={testing || !localData.enabled} size="sm" className="gap-2 shrink-0">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              পাঠান
            </Button>
          </div>
          {!localData.enabled && (
            <p className="text-[10px] text-destructive">টেস্ট করতে প্রথমে SMTP সক্রিয় করুন</p>
          )}
        </div>

        {/* Gmail Guide */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1.5">
          <p className="text-xs font-semibold text-foreground">📧 Gmail SMTP সেটআপ গাইড:</p>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
            <li>হোস্ট: <code className="bg-muted px-1 rounded">smtp.gmail.com</code>, পোর্ট: <code className="bg-muted px-1 rounded">587</code></li>
            <li>Google Account → Security → 2-Step Verification চালু করুন</li>
            <li>App Passwords → Generate করে পাসওয়ার্ড ফিল্ডে দিন</li>
            <li>ইউজারনেম হবে আপনার Gmail address</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          সিস্টেম সেটিংস
        </h1>
        <p className="text-sm text-muted-foreground">সিকিউরিটি, ইমেইল, AI চ্যাট এবং অটোমেশন সেটিংস</p>
      </div>

      <div className="grid gap-6">
        {/* Security */}
        <RateLimitSection />

        {/* SMTP Config */}
        <SmtpConfigSection />

        {/* AI Chat Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI চ্যাট সেটিংস</CardTitle>
                <CardDescription>চ্যাটবটের অটো-রিপ্লাই কনফিগার করুন</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChatAiConfigPanel />
          </CardContent>
        </Card>

        {/* Cron Jobs */}
        <CronJobsSection />
      </div>
    </div>
  );
}
