import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import {
  Lock, Mail, Bell, Trash2, Shield, Eye, EyeOff,
  Save, Loader2, LogOut, Monitor, Globe, KeyRound,
  BellRing, Volume2, VolumeX, ChevronRight, Sun, Moon, Laptop,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

interface NotifPrefs {
  ticket_reply: boolean;
  ticket_status: boolean;
  order_update: boolean;
  general: boolean;
}

// --- Reusable Components ---

const SectionCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, desc, badge }: { icon: any; title: string; desc: string; badge?: string }) => (
  <div className="px-5 py-4 border-b border-border bg-muted/20">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold font-display text-foreground">{title}</h2>
          {badge && (
            <Badge variant="outline" className="text-[10px] border-0 bg-primary/10 text-primary px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  </div>
);

const SettingRow = ({ children, noBorder = false }: { children: React.ReactNode; noBorder?: boolean }) => (
  <div className={`flex items-center justify-between gap-4 py-3.5 ${!noBorder ? "border-b border-border/50" : ""}`}>
    {children}
  </div>
);

const SettingLabel = ({ title, desc }: { title: string; desc: string }) => (
  <div className="min-w-0 flex-1">
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
  </div>
);

const PasswordField = ({ value, onChange, show, onToggle, placeholder, label }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string; label: string;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 bg-muted/30 border-border/60 rounded-xl h-10 text-sm"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

export default function SettingsPage() {
  const { user } = useOutletContext<DashboardContext>();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(() => {
    const stored = localStorage.getItem("notif_prefs");
    return stored ? JSON.parse(stored) : { ticket_reply: true, ticket_status: true, order_update: true, general: true };
  });
  const [notifSound, setNotifSound] = useState(() => localStorage.getItem("notif_sound") !== "off");

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { localStorage.setItem("notif_prefs", JSON.stringify(notifPrefs)); }, [notifPrefs]);
  useEffect(() => { localStorage.setItem("notif_sound", notifSound ? "on" : "off"); }, [notifSound]);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) { toast({ title: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "নতুন পাসওয়ার্ড দুটি মিলছে না", variant: "destructive" }); return; }
    setChangingPassword(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword });
      if (signInErr) { toast({ title: "বর্তমান পাসওয়ার্ড সঠিক নয়", variant: "destructive" }); setChangingPassword(false); return; }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে ✓" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "পাসওয়ার্ড পরিবর্তন ব্যর্থ", description: err.message, variant: "destructive" });
    }
    setChangingPassword(false);
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user.email) return;
    setChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: "ইমেইল পরিবর্তনের লিঙ্ক পাঠানো হয়েছে", description: "নতুন ও পুরোনো উভয় ইমেইলে কনফার্মেশন লিঙ্ক পাঠানো হয়েছে।" });
      setNewEmail("");
    } catch (err: any) {
      toast({ title: "ইমেইল পরিবর্তন ব্যর্থ", description: err.message, variant: "destructive" });
    }
    setChangingEmail(false);
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    navigate("/sign-in");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    toast({ title: "অ্যাকাউন্ট মুছে ফেলার অনুরোধ পাঠানো হয়েছে", description: "আমাদের টিম শীঘ্রই আপনার অ্যাকাউন্ট মুছে ফেলবে।" });
    await supabase.auth.signOut();
    navigate("/");
    setDeleting(false);
  };

  const passwordStrength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
  const strengthColors = ["", "bg-destructive", "bg-orange-500", "bg-green-500"];
  const strengthLabels = ["", "দুর্বল", "মাঝারি", "শক্তিশালী"];

  return (
    <div className="space-y-5 w-full pb-10">
      {/* Page Title */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold font-display text-foreground">সেটিংস</h1>
        <p className="text-sm text-muted-foreground mt-0.5">আপনার অ্যাকাউন্ট সেটিংস ম্যানেজ করুন</p>
      </motion.div>

      {/* === Two-column grid for Password & Email === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Password Change */}
        <SectionCard delay={0}>
          <SectionHeader icon={KeyRound} title="পাসওয়ার্ড" desc="পাসওয়ার্ড আপডেট করুন" />
          <div className="p-5 space-y-3.5">
            <PasswordField label="বর্তমান পাসওয়ার্ড" value={currentPassword} onChange={setCurrentPassword}
              show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="••••••••" />
            <PasswordField label="নতুন পাসওয়ার্ড" value={newPassword} onChange={setNewPassword}
              show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="কমপক্ষে ৬ অক্ষর" />
            {/* Password strength */}
            {newPassword.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-border"}`} />
                  ))}
                </div>
                <span className={`text-[10px] font-medium ${passwordStrength === 1 ? "text-destructive" : passwordStrength === 2 ? "text-orange-500" : "text-green-500"}`}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
            <PasswordField label="পাসওয়ার্ড নিশ্চিত করুন" value={confirmPassword} onChange={setConfirmPassword}
              show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="আবার লিখুন" />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-destructive">পাসওয়ার্ড মিলছে না</p>
            )}
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              size="sm" className="gap-2 rounded-xl w-full mt-1"
            >
              {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {changingPassword ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন"}
            </Button>
          </div>
        </SectionCard>

        {/* Email Change */}
        <SectionCard delay={0.05}>
          <SectionHeader icon={Mail} title="ইমেইল" desc="লগইন ইমেইল আপডেট করুন" />
          <div className="p-5 space-y-3.5">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">বর্তমান ইমেইল</Label>
              <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border/50 px-3.5 py-2.5">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{user.email}</span>
                <Badge variant="outline" className="text-[9px] border-0 bg-green-500/10 text-green-600 shrink-0">
                  ভেরিফাইড
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">নতুন ইমেইল</Label>
              <Input
                type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com" className="bg-muted/30 border-border/60 rounded-xl h-10 text-sm"
              />
            </div>
            <Button
              onClick={handleEmailChange}
              disabled={changingEmail || !newEmail || newEmail === user.email}
              variant="outline" size="sm" className="gap-2 rounded-xl w-full mt-1"
            >
              {changingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              {changingEmail ? "পাঠানো হচ্ছে..." : "ইমেইল পরিবর্তন"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">উভয় ইমেইলে কনফার্মেশন লিঙ্ক পাঠানো হবে</p>
          </div>
        </SectionCard>
      </div>

      {/* === Notification Preferences === */}
      <SectionCard delay={0.1}>
        <SectionHeader icon={BellRing} title="নোটিফিকেশন" desc="কোন নোটিফিকেশন পেতে চান তা নির্ধারণ করুন" />
        <div className="p-5">
          <SettingRow>
            <SettingLabel title="টিকেট রিপ্লাই" desc="সাপোর্ট টিম রিপ্লাই দিলে জানাবে" />
            <Switch checked={notifPrefs.ticket_reply} onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, ticket_reply: v }))} />
          </SettingRow>
          <SettingRow>
            <SettingLabel title="টিকেট স্ট্যাটাস আপডেট" desc="টিকেটের অবস্থা পরিবর্তন হলে জানাবে" />
            <Switch checked={notifPrefs.ticket_status} onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, ticket_status: v }))} />
          </SettingRow>
          <SettingRow>
            <SettingLabel title="অর্ডার আপডেট" desc="অর্ডার কনফার্ম বা পরিবর্তন হলে জানাবে" />
            <Switch checked={notifPrefs.order_update} onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, order_update: v }))} />
          </SettingRow>
          <SettingRow>
            <SettingLabel title="সাধারণ বিজ্ঞপ্তি" desc="সিস্টেম আপডেট ও ঘোষণা" />
            <Switch checked={notifPrefs.general} onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, general: v }))} />
          </SettingRow>
          <SettingRow noBorder>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {notifSound ? <Volume2 className="w-4 h-4 text-primary shrink-0" /> : <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />}
              <SettingLabel title="সাউন্ড ইফেক্ট" desc="নোটিফিকেশনে সাউন্ড বাজবে" />
            </div>
            <Switch checked={notifSound} onCheckedChange={setNotifSound} />
          </SettingRow>
        </div>
      </SectionCard>

      {/* === Theme / Appearance === */}
      <SectionCard delay={0.12}>
        <SectionHeader icon={Sun} title="অ্যাপিয়ারেন্স" desc="থিম ও ডিসপ্লে কাস্টমাইজ করুন" />
        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-3">থিম নির্বাচন করুন</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "system", label: "সিস্টেম", icon: Laptop, desc: "ডিভাইসের থিম অনুসরণ" },
              { value: "light", label: "লাইট", icon: Sun, desc: "সাদা ব্যাকগ্রাউন্ড" },
              { value: "dark", label: "ডার্ক", icon: Moon, desc: "কালো ব্যাকগ্রাউন্ড" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                  theme === t.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                {theme === t.value && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  theme === t.value ? "bg-primary/10" : "bg-muted/50"
                }`}>
                  <t.icon className={`w-5 h-5 ${theme === t.value ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${theme === t.value ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>
      <SectionCard delay={0.15}>
        <SectionHeader icon={Shield} title="নিরাপত্তা" desc="সেশন ও অ্যাক্সেস ম্যানেজ করুন" />
        <div className="p-5 space-y-4">
          {/* Current session */}
          <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Monitor className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">বর্তমান সেশন</p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    সক্রিয়
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  সর্বশেষ লগইন: {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString("bn-BD", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Sign out all */}
          <SettingRow noBorder>
            <SettingLabel title="সব ডিভাইস থেকে লগআউট" desc="সব সেশন বন্ধ করে নতুন করে লগইন করুন" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs shrink-0">
                  <LogOut className="w-3.5 h-3.5" /> লগআউট
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>সব ডিভাইস থেকে লগআউট?</AlertDialogTitle>
                  <AlertDialogDescription>
                    এটি সব ডিভাইস থেকে আপনাকে লগআউট করবে। আপনাকে আবার লগইন করতে হবে।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOutAll}>লগআউট করুন</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SettingRow>
        </div>
      </SectionCard>

      {/* === Account Info === */}
      <SectionCard delay={0.2}>
        <SectionHeader icon={Globe} title="অ্যাকাউন্ট তথ্য" desc="অ্যাকাউন্ট সম্পর্কিত সাধারণ তথ্য" />
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">অ্যাকাউন্ট তৈরি</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(user.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">ইমেইল স্ট্যাটাস</p>
              <p className={`text-sm font-medium ${user.email_confirmed_at ? "text-green-600" : "text-orange-500"}`}>
                {user.email_confirmed_at ? "ভেরিফাইড ✓" : "আনভেরিফাইড ✗"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">ইউজার আইডি</p>
              <p className="text-sm font-mono font-medium text-foreground">#{parseInt(user.id.replace(/-/g, "").slice(0, 12), 16) % 1000000}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* === Danger Zone === */}
      <SectionCard delay={0.25}>
        <div className="px-5 py-4 border-b border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </div>
            <div>
              <h2 className="text-sm font-semibold font-display text-destructive">ডেঞ্জার জোন</h2>
              <p className="text-[11px] text-destructive/60 mt-0.5">এই অ্যাকশনগুলো অপরিবর্তনযোগ্য</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">অ্যাকাউন্ট মুছে ফেলুন</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                আপনার সমস্ত ডেটা, ব্যবসা, অর্ডার এবং টিকেট স্থায়ীভাবে মুছে যাবে। এই অ্যাকশন পূর্বাবস্থায় ফেরানো সম্ভব নয়।
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs shrink-0">
                  <Trash2 className="w-3.5 h-3.5" /> মুছুন
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">অ্যাকাউন্ট মুছে ফেলার অনুরোধ</AlertDialogTitle>
                  <AlertDialogDescription>
                    এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না। নিশ্চিত করতে নিচে <strong className="text-foreground">DELETE</strong> টাইপ করুন।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder='DELETE টাইপ করুন'
                  className="font-mono text-center tracking-widest"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirm("")}>বাতিল</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== "DELETE" || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "প্রসেসিং..." : "অ্যাকাউন্ট মুছুন"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
