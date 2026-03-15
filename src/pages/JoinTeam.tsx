import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Upload, User, Briefcase, FileText, Send,
  Camera, CreditCard, CheckCircle2, Loader2, Plus, X, Link as LinkIcon,
} from "lucide-react";

const STEPS = [
  { id: "personal", label: "ব্যক্তিগত তথ্য", icon: User },
  { id: "identity", label: "পরিচয় যাচাই", icon: CreditCard },
  { id: "job", label: "জব ক্যাটাগরি", icon: Briefcase },
  { id: "portfolio", label: "পোর্টফোলিও", icon: FileText },
  { id: "review", label: "রিভিউ ও সাবমিট", icon: Send },
];

const JOB_CATEGORIES = [
  { value: "project_manager", label: "প্রজেক্ট ম্যানেজার" },
  { value: "web_developer", label: "ওয়েব ডেভেলপার" },
  { value: "digital_marketer", label: "ডিজিটাল মার্কেটার" },
  { value: "graphics_designer", label: "গ্রাফিক্স ডিজাইনার" },
  { value: "other", label: "অন্যান্য" },
];

const JOB_TYPES = [
  { value: "full_time", label: "ফুল-টাইম" },
  { value: "part_time", label: "পার্ট-টাইম" },
  { value: "freelancer", label: "ফ্রিল্যান্সার" },
];

export default function JoinTeam() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [facePhoto, setFacePhoto] = useState<File | null>(null);
  const [jobType, setJobType] = useState("full_time");
  const [jobCategory, setJobCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [expYears, setExpYears] = useState("");
  const [expDetails, setExpDetails] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);
  const [coverLetter, setCoverLetter] = useState("");

  // Preview URLs
  const [nidFrontPreview, setNidFrontPreview] = useState("");
  const [nidBackPreview, setNidBackPreview] = useState("");
  const [facePreview, setFacePreview] = useState("");

  const nidFrontRef = useRef<HTMLInputElement>(null);
  const nidBackRef = useRef<HTMLInputElement>(null);
  const faceRef = useRef<HTMLInputElement>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">অ্যাকাউন্ট প্রয়োজন</h2>
            <p className="text-sm text-muted-foreground">
              টিমে জয়েন করার আবেদন করতে আপনাকে প্রথমে লগইন বা সাইন আপ করতে হবে।
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/signin")} variant="outline">লগইন</Button>
              <Button onClick={() => navigate("/signup")}>সাইন আপ</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (
    file: File | null,
    setter: (f: File | null) => void,
    previewSetter: (s: string) => void
  ) => {
    if (file) {
      setter(file);
      previewSetter(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("job-applications").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("job-applications").getPublicUrl(path);
    return data.publicUrl;
  };

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0:
        if (!fullName.trim()) return "পুরো নাম দিন";
        if (!email.trim()) return "ইমেইল দিন";
        if (!phone.trim()) return "ফোন নম্বর দিন";
        return null;
      case 1:
        if (!nidNumber.trim()) return "NID নম্বর দিন";
        if (!nidFront) return "NID এর সামনের ছবি আপলোড করুন";
        if (!nidBack) return "NID এর পিছনের ছবি আপলোড করুন";
        if (!facePhoto) return "আপনার ফেস ফটো আপলোড করুন";
        return null;
      case 2:
        if (!jobCategory) return "জব ক্যাটাগরি সিলেক্ট করুন";
        if (jobCategory === "other" && !otherCategory.trim()) return "নির্দিষ্ট ক্যাটাগরি লিখুন";
        return null;
      case 3:
        if (!portfolioUrl.trim()) return "পোর্টফোলিও URL দিন";
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast({ title: "তথ্য অসম্পূর্ণ", description: err, variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const [nidFrontUrl, nidBackUrl, facePhotoUrl] = await Promise.all([
        uploadFile(nidFront!, "nid-front"),
        uploadFile(nidBack!, "nid-back"),
        uploadFile(facePhoto!, "face"),
      ]);

      const validLinks = portfolioLinks.filter((l) => l.trim());

      const { error } = await supabase.from("job_applications" as any).insert({
        user_id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        date_of_birth: dob || null,
        address: address.trim() || null,
        nid_number: nidNumber.trim(),
        nid_front_url: nidFrontUrl,
        nid_back_url: nidBackUrl,
        face_photo_url: facePhotoUrl,
        job_type: jobType,
        job_category: jobCategory,
        other_category: jobCategory === "other" ? otherCategory.trim() : null,
        experience_years: expYears ? parseInt(expYears) : null,
        experience_details: expDetails.trim() || null,
        portfolio_url: portfolioUrl.trim(),
        portfolio_links: validLinks,
        cover_letter: coverLetter.trim() || null,
      } as any);

      if (error) throw error;

      toast({ title: "আবেদন সফল!", description: "আপনার আবেদন HR টিমের কাছে পাঠানো হয়েছে।" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "সমস্যা হয়েছে", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const addPortfolioLink = () => setPortfolioLinks([...portfolioLinks, ""]);
  const removePortfolioLink = (i: number) => setPortfolioLinks(portfolioLinks.filter((_, idx) => idx !== i));
  const updatePortfolioLink = (i: number, v: string) => {
    const updated = [...portfolioLinks];
    updated[i] = v;
    setPortfolioLinks(updated);
  };

  const FileUploadBox = ({
    label, file, preview, inputRef, onSelect, icon: Icon,
  }: {
    label: string; file: File | null; preview: string;
    inputRef: React.RefObject<HTMLInputElement>;
    onSelect: (f: File | null) => void; icon: typeof Upload;
  }) => (
    <div
      onClick={() => inputRef.current?.click()}
      className="group relative cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all bg-muted/30 hover:bg-muted/50 overflow-hidden"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
      />
      {preview ? (
        <div className="aspect-[4/3] relative">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-xs font-medium">পরিবর্তন করুন</p>
          </div>
          <Badge className="absolute top-2 right-2 bg-green-500 text-[10px]">
            <CheckCircle2 className="h-3 w-3 mr-1" /> আপলোড হয়েছে
          </Badge>
        </div>
      ) : (
        <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2 p-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">ক্লিক করে আপলোড করুন</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> ফিরে যান
          </Button>
          <p className="text-sm font-bold">টিমে জয়েন করুন</p>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">ক্যারিয়ার সুযোগ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            আমাদের টিমে <span className="text-gradient">জয়েন করুন</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            আপনি কি ক্রিয়েটিভ ও দক্ষ? Arodx টিমে ফুল-টাইম, পার্ট-টাইম বা ফ্রিল্যান্সার হিসেবে কাজ করার সুযোগ পান। নিচের সুবিধাগুলো উপভোগ করুন:
          </p>

          {/* Facilities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { icon: "💰", title: "প্রতিযোগী বেতন", desc: "দক্ষতা অনুযায়ী আকর্ষণীয় পারিশ্রমিক" },
              { icon: "🏠", title: "রিমোট ওয়ার্ক", desc: "ঘরে বসেই কাজ করার সুবিধা" },
              { icon: "📈", title: "ক্যারিয়ার গ্রোথ", desc: "স্কিল ডেভেলপমেন্ট ও প্রমোশন" },
              { icon: "🤝", title: "টিম সাপোর্ট", desc: "দক্ষ ও সহযোগী টিম এনভায়রনমেন্ট" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="rounded-xl border border-border bg-card p-3 text-center space-y-1"
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="text-xs font-semibold text-foreground">{f.title}</p>
                <p className="text-[10px] text-muted-foreground leading-snug">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? "bg-green-500 text-white" :
                  isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <p className={`text-[10px] text-center ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-6 space-y-5">
                {/* Step 0: Personal Info */}
                {step === 0 && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold">ব্যক্তিগত তথ্য</h2>
                      <p className="text-xs text-muted-foreground">আপনার সঠিক তথ্য দিন</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">পুরো নাম *</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার পুরো নাম" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ইমেইল *</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ফোন নম্বর *</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">জন্ম তারিখ</Label>
                        <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">ঠিকানা</Label>
                        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="আপনার বর্তমান ঠিকানা" rows={2} />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 1: Identity Verification */}
                {step === 1 && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold">পরিচয় যাচাই</h2>
                      <p className="text-xs text-muted-foreground">NID ও ফেস ভেরিফিকেশনের জন্য ছবি আপলোড করুন</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">NID নম্বর *</Label>
                      <Input value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="আপনার জাতীয় পরিচয়পত্র নম্বর" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FileUploadBox
                        label="NID সামনের পাশ"
                        file={nidFront}
                        preview={nidFrontPreview}
                        inputRef={nidFrontRef as any}
                        onSelect={(f) => handleFileSelect(f, setNidFront, setNidFrontPreview)}
                        icon={CreditCard}
                      />
                      <FileUploadBox
                        label="NID পিছনের পাশ"
                        file={nidBack}
                        preview={nidBackPreview}
                        inputRef={nidBackRef as any}
                        onSelect={(f) => handleFileSelect(f, setNidBack, setNidBackPreview)}
                        icon={CreditCard}
                      />
                      <FileUploadBox
                        label="ফেস ফটো (সেলফি)"
                        file={facePhoto}
                        preview={facePreview}
                        inputRef={faceRef as any}
                        onSelect={(f) => handleFileSelect(f, setFacePhoto, setFacePreview)}
                        icon={Camera}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-3">
                      ⚠️ NID এর ছবি পরিষ্কার ও পড়ার উপযোগী হতে হবে। ফেস ফটোতে আপনার মুখ স্পষ্ট দেখা যেতে হবে।
                    </p>
                  </>
                )}

                {/* Step 2: Job Category */}
                {step === 2 && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold">জব তথ্য</h2>
                      <p className="text-xs text-muted-foreground">আপনি কোন ক্যাটাগরিতে কাজ করতে চান</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">জব টাইপ *</Label>
                        <Select value={jobType} onValueChange={setJobType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {JOB_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">জব ক্যাটাগরি *</Label>
                        <Select value={jobCategory} onValueChange={setJobCategory}>
                          <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                          <SelectContent>
                            {JOB_CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {jobCategory === "other" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">নির্দিষ্ট ক্যাটাগরি লিখুন *</Label>
                        <Input value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} placeholder="যেমন: Video Editor, Content Writer..." />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">অভিজ্ঞতা (বছর)</Label>
                        <Input type="number" value={expYears} onChange={(e) => setExpYears(e.target.value)} placeholder="যেমন: 2" min="0" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">অভিজ্ঞতার বিবরণ</Label>
                      <Textarea value={expDetails} onChange={(e) => setExpDetails(e.target.value)} placeholder="আপনার কাজের অভিজ্ঞতা সম্পর্কে সংক্ষেপে লিখুন (ঐচ্ছিক)" rows={3} />
                    </div>
                  </>
                )}

                {/* Step 3: Portfolio */}
                {step === 3 && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold">পোর্টফোলিও</h2>
                      <p className="text-xs text-muted-foreground">আপনার কাজের নমুনা শেয়ার করুন (আবশ্যক)</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">প্রধান পোর্টফোলিও URL *</Label>
                      <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://your-portfolio.com" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">অতিরিক্ত লিঙ্ক</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPortfolioLink} className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" /> লিঙ্ক যোগ করুন
                        </Button>
                      </div>
                      {portfolioLinks.map((link, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              value={link}
                              onChange={(e) => updatePortfolioLink(i, e.target.value)}
                              placeholder="https://github.com/username"
                              className="pl-9"
                            />
                          </div>
                          {portfolioLinks.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePortfolioLink(i)} className="shrink-0 h-10 w-10 text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">কভার লেটার (ঐচ্ছিক)</Label>
                      <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="কেন আপনি আমাদের টিমে যোগ দিতে চান..." rows={4} />
                    </div>
                  </>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold">রিভিউ ও সাবমিট</h2>
                      <p className="text-xs text-muted-foreground">সব তথ্য সঠিক কিনা দেখে নিন</p>
                    </div>
                    <div className="space-y-4">
                      {/* Personal */}
                      <div className="rounded-lg border border-border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4" /> ব্যক্তিগত</h3>
                          <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="text-xs h-7">এডিট</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">নাম:</span> {fullName}</div>
                          <div><span className="text-muted-foreground">ইমেইল:</span> {email}</div>
                          <div><span className="text-muted-foreground">ফোন:</span> {phone}</div>
                          {dob && <div><span className="text-muted-foreground">জন্ম:</span> {dob}</div>}
                        </div>
                      </div>
                      {/* Identity */}
                      <div className="rounded-lg border border-border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> পরিচয় যাচাই</h3>
                          <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs h-7">এডিট</Button>
                        </div>
                        <div className="text-xs"><span className="text-muted-foreground">NID:</span> {nidNumber}</div>
                        <div className="flex gap-3">
                          {nidFrontPreview && <img src={nidFrontPreview} className="h-16 rounded-lg object-cover" alt="NID Front" />}
                          {nidBackPreview && <img src={nidBackPreview} className="h-16 rounded-lg object-cover" alt="NID Back" />}
                          {facePreview && <img src={facePreview} className="h-16 rounded-lg object-cover" alt="Face" />}
                        </div>
                      </div>
                      {/* Job */}
                      <div className="rounded-lg border border-border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> জব তথ্য</h3>
                          <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs h-7">এডিট</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">টাইপ:</span> {JOB_TYPES.find(t => t.value === jobType)?.label}</div>
                          <div><span className="text-muted-foreground">ক্যাটাগরি:</span> {jobCategory === "other" ? otherCategory : JOB_CATEGORIES.find(c => c.value === jobCategory)?.label}</div>
                          {expYears && <div><span className="text-muted-foreground">অভিজ্ঞতা:</span> {expYears} বছর</div>}
                        </div>
                      </div>
                      {/* Portfolio */}
                      <div className="rounded-lg border border-border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> পোর্টফোলিও</h3>
                          <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="text-xs h-7">এডিট</Button>
                        </div>
                        <div className="text-xs"><span className="text-muted-foreground">URL:</span> {portfolioUrl}</div>
                        {portfolioLinks.filter(l => l.trim()).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {portfolioLinks.filter(l => l.trim()).map((l, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{l}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={goBack} disabled={step === 0} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" /> পিছনে
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button onClick={goNext} className="gap-1.5">
                      পরবর্তী <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      সাবমিট করুন
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
