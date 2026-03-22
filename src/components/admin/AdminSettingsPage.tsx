import { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, Save, ShieldAlert, Clock, Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Pencil, FileText, Bot, Mail, Eye, EyeOff, Send } from "lucide-react";
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
        onSuccess: () => toast({ title: "রেট লিমিট আপডেট হয়েছে!" }),
        onError: () => toast({ title: "Error", description: "আপডেট করতে সমস্যা হয়েছে", variant: "destructive" }),
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

  const fetchCronData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: jobsData } = await supabase.rpc("get_cron_jobs" as any);
      const { data: runsData } = await supabase.rpc("get_cron_run_details" as any);
      setJobs((jobsData as any[]) || []);
      setRunDetails((runsData as any[]) || []);
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
            <div className="space-y-2">
              {runDetails.map((run, idx) => (
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
          )}
        </CardContent>
      </Card>
    </div>
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
        <p className="text-sm text-muted-foreground">সিকিউরিটি, AI চ্যাট এবং অটোমেশন সেটিংস</p>
      </div>

      <div className="grid gap-6">
        {/* Security */}
        <RateLimitSection />

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
