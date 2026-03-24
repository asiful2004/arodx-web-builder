import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText, CheckCircle2, XCircle, Trash2, Loader2, Clock, User,
  Briefcase, CreditCard, ExternalLink, Eye, AlertCircle,
} from "lucide-react";

interface Application {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  address: string | null;
  nid_number: string;
  nid_front_url: string;
  nid_back_url: string;
  face_photo_url: string;
  job_type: string;
  job_category: string;
  other_category: string | null;
  experience_years: number | null;
  experience_details: string | null;
  portfolio_url: string;
  portfolio_links: string[];
  cover_letter: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  auto_delete_at: string | null;
  created_at: string;
}

const JOB_CATEGORIES: Record<string, string> = {
  project_manager: "প্রজেক্ট ম্যানেজার",
  web_developer: "ওয়েব ডেভেলপার",
  digital_marketer: "ডিজিটাল মার্কেটার",
  graphics_designer: "গ্রাফিক্স ডিজাইনার",
  other: "অন্যান্য",
};

const JOB_TYPES: Record<string, string> = {
  full_time: "ফুল-টাইম",
  part_time: "পার্ট-টাইম",
  freelancer: "ফ্রিল্যান্সার",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "পেন্ডিং", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  approved: { label: "অ্যাপ্রুভড", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "রিজেক্টেড", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
};

const ROLE_MAP: Record<string, string> = {
  project_manager: "project_manager",
  web_developer: "web_developer",
  digital_marketer: "digital_marketer",
  graphics_designer: "graphics_designer",
};

export default function HRApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_applications" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setApplications(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleApprove = async (app: Application) => {
    setProcessing(true);
    try {
      // Update application status
      await supabase.from("job_applications" as any).update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      } as any).eq("id", app.id);

      // Assign role if it's a predefined category (not "other")
      const roleKey = ROLE_MAP[app.job_category];
      if (roleKey) {
        await supabase.from("user_roles").insert({
          user_id: app.user_id,
          role: roleKey as any,
        });
      }

      // Send notification
      await supabase.from("notifications").insert({
        user_id: app.user_id,
        title: "আবেদন অ্যাপ্রুভড!",
        body: roleKey
          ? `আপনার ${JOB_CATEGORIES[app.job_category]} পদের আবেদন অনুমোদিত হয়েছে। স্টাফ প্যানেলে প্রবেশ করুন।`
          : `আপনার "${app.other_category}" পদের আবেদন অনুমোদিত হয়েছে।`,
        type: "job_application",
        link: roleKey ? "/staff" : "/dashboard",
      });

      toast({ title: "অ্যাপ্রুভড!", description: `${app.full_name}-এর আবেদন অনুমোদিত হয়েছে।` });
      setDetailOpen(false);
      fetchApplications();
    } catch (err: any) {
      toast({ title: "সমস্যা", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    try {
      const autoDeleteAt = new Date();
      autoDeleteAt.setDate(autoDeleteAt.getDate() + 7);

      await supabase.from("job_applications" as any).update({
        status: "rejected",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectReason || null,
        auto_delete_at: autoDeleteAt.toISOString(),
      } as any).eq("id", selectedApp.id);

      // Notify user
      await supabase.from("notifications").insert({
        user_id: selectedApp.user_id,
        title: "আবেদন রিজেক্ট হয়েছে",
        body: rejectReason || "দুঃখিত, আপনার আবেদন এই মুহূর্তে গ্রহণ করা সম্ভব হয়নি।",
        type: "job_application",
        link: "/dashboard",
      });

      toast({ title: "রিজেক্ট করা হয়েছে", description: "৭ দিন পর অটো ডিলিট হবে।" });
      setRejectOpen(false);
      setDetailOpen(false);
      setRejectReason("");
      fetchApplications();
    } catch (err: any) {
      toast({ title: "সমস্যা", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (app: Application) => {
    if (!confirm(`${app.full_name}-এর আবেদন ডিলিট করতে চান?`)) return;
    await supabase.from("job_applications" as any).delete().eq("id", app.id);
    toast({ title: "ডিলিট হয়েছে" });
    fetchApplications();
  };

  const filtered = applications.filter((a) => {
    if (activeTab === "all") return true;
    return a.status === activeTab;
  });

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const openDetail = (app: Application) => {
    setSelectedApp(app);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">জব আবেদন</h1>
              <p className="text-[11px] text-muted-foreground">ফ্রিল্যান্সার ও স্টাফ আবেদন ম্যানেজমেন্ট</p>
            </div>
          </div>
          <Badge variant="outline">{applications.filter(a => a.status === "pending").length} পেন্ডিং</Badge>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "পেন্ডিং", value: applications.filter(a => a.status === "pending").length, color: "text-yellow-600" },
          { label: "অ্যাপ্রুভড", value: applications.filter(a => a.status === "approved").length, color: "text-green-600" },
          { label: "রিজেক্টেড", value: applications.filter(a => a.status === "rejected").length, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="text-xs">পেন্ডিং</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">অ্যাপ্রুভড</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">রিজেক্টেড</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">সব</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">কোনো আবেদন নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((app, i) => {
                const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openDetail(app)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={app.face_photo_url} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(app.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">{app.full_name}</p>
                              <Badge variant="outline" className={`text-[10px] shrink-0 ${statusCfg.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{statusCfg.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="secondary" className="text-[10px]">
                                {app.job_category === "other" ? app.other_category : JOB_CATEGORIES[app.job_category]}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{JOB_TYPES[app.job_type]}</Badge>
                              {app.experience_years && <span className="text-[10px] text-muted-foreground">{app.experience_years} বছর অভিজ্ঞতা</span>}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(app.created_at).toLocaleDateString("bn-BD")}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(app); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(app); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedApp.face_photo_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(selectedApp.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedApp.full_name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{selectedApp.email} • {selectedApp.phone}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Personal Info */}
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4" /> ব্যক্তিগত তথ্য</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">নাম:</span> {selectedApp.full_name}</div>
                    <div><span className="text-muted-foreground">ইমেইল:</span> {selectedApp.email}</div>
                    <div><span className="text-muted-foreground">ফোন:</span> {selectedApp.phone}</div>
                    {selectedApp.date_of_birth && <div><span className="text-muted-foreground">জন্ম:</span> {selectedApp.date_of_birth}</div>}
                    {selectedApp.address && <div className="col-span-2"><span className="text-muted-foreground">ঠিকানা:</span> {selectedApp.address}</div>}
                  </div>
                </div>

                {/* NID Verification */}
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> NID ও ফেস ভেরিফিকেশন</h3>
                  <p className="text-xs"><span className="text-muted-foreground">NID নম্বর:</span> {selectedApp.nid_number}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <a href={selectedApp.nid_front_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border hover:ring-2 ring-primary/30 transition-all">
                      <img src={selectedApp.nid_front_url} alt="NID Front" className="w-full aspect-[4/3] object-cover" />
                      <p className="text-[10px] text-center py-1 bg-muted">সামনের পাশ</p>
                    </a>
                    <a href={selectedApp.nid_back_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border hover:ring-2 ring-primary/30 transition-all">
                      <img src={selectedApp.nid_back_url} alt="NID Back" className="w-full aspect-[4/3] object-cover" />
                      <p className="text-[10px] text-center py-1 bg-muted">পিছনের পাশ</p>
                    </a>
                    <a href={selectedApp.face_photo_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border hover:ring-2 ring-primary/30 transition-all">
                      <img src={selectedApp.face_photo_url} alt="Face" className="w-full aspect-[4/3] object-cover" />
                      <p className="text-[10px] text-center py-1 bg-muted">ফেস ফটো</p>
                    </a>
                  </div>
                </div>

                {/* Job Info */}
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> জব তথ্য</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">টাইপ:</span> {JOB_TYPES[selectedApp.job_type]}</div>
                    <div>
                      <span className="text-muted-foreground">ক্যাটাগরি:</span>{" "}
                      {selectedApp.job_category === "other" ? selectedApp.other_category : JOB_CATEGORIES[selectedApp.job_category]}
                      {selectedApp.job_category === "other" && (
                        <Badge variant="outline" className="ml-1 text-[9px] text-amber-600 border-amber-300">অন্যান্য</Badge>
                      )}
                    </div>
                    {selectedApp.experience_years != null && (
                      <div><span className="text-muted-foreground">অভিজ্ঞতা:</span> {selectedApp.experience_years} বছর</div>
                    )}
                  </div>
                  {selectedApp.experience_details && (
                    <p className="text-xs mt-2 p-2 bg-muted/50 rounded">{selectedApp.experience_details}</p>
                  )}
                  {selectedApp.job_category === "other" && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 rounded text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>অন্যান্য ক্যাটাগরি — অ্যাপ্রুভ হলেও অটোমেটিক স্টাফ প্যানেল অ্যাক্সেস পাবে না</span>
                    </div>
                  )}
                </div>

                {/* Portfolio */}
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> পোর্টফোলিও</h3>
                  <a href={selectedApp.portfolio_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> {selectedApp.portfolio_url}
                  </a>
                  {selectedApp.portfolio_links && (selectedApp.portfolio_links as string[]).filter(l => l).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedApp.portfolio_links as string[]).filter(l => l).map((l, i) => (
                        <a key={i} href={l} target="_blank" rel="noreferrer">
                          <Badge variant="outline" className="text-[10px] hover:bg-primary/10 cursor-pointer">{l}</Badge>
                        </a>
                      ))}
                    </div>
                  )}
                  {selectedApp.cover_letter && (
                    <div className="mt-2">
                      <p className="text-[10px] text-muted-foreground mb-1">কভার লেটার:</p>
                      <p className="text-xs p-3 bg-muted/50 rounded-lg">{selectedApp.cover_letter}</p>
                    </div>
                  )}
                </div>

                {/* Rejection info */}
                {selectedApp.status === "rejected" && (
                  <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 space-y-1">
                    <p className="text-xs font-semibold text-red-600">রিজেক্ট করা হয়েছে</p>
                    {selectedApp.rejection_reason && <p className="text-xs text-red-600/80">{selectedApp.rejection_reason}</p>}
                    {selectedApp.auto_delete_at && (
                      <p className="text-[10px] text-red-500">অটো ডিলিট: {new Date(selectedApp.auto_delete_at).toLocaleDateString("bn-BD")}</p>
                    )}
                  </div>
                )}
              </div>

              {selectedApp.status === "pending" && (
                <DialogFooter className="mt-4 gap-2">
                  <Button variant="destructive" onClick={() => { setRejectOpen(true); }} disabled={processing} className="gap-1.5">
                    <XCircle className="h-4 w-4" /> রিজেক্ট
                  </Button>
                  <Button onClick={() => handleApprove(selectedApp)} disabled={processing} className="gap-1.5">
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    অ্যাপ্রুভ
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>আবেদন রিজেক্ট</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">কারণ (ঐচ্ছিক)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="রিজেক্ট করার কারণ লিখুন..."
              rows={3}
            />
            <p className="text-[10px] text-muted-foreground">রিজেক্ট করলে ৭ দিন পর আবেদনটি অটোমেটিক ডিলিট হয়ে যাবে।</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "রিজেক্ট করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
