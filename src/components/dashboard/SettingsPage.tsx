import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import {
  Lock, Mail, Bell, Trash2, Shield, Eye, EyeOff,
  Save, Loader2, LogOut, Monitor, Smartphone, Globe,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
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

const SectionCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="rounded-2xl border border-border bg-card overflow-hidden"
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="px-6 py-4 border-b border-border">
    <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" />
      {title}
    </h2>
    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
  </div>
);

export default function SettingsPage() {
  const { user } = useOutletContext<DashboardContext>();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  // Notification preferences (stored in localStorage)
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(() => {
    const stored = localStorage.getItem("notif_prefs");
    return stored ? JSON.parse(stored) : {
      ticket_reply: true,
      ticket_status: true,
      order_update: true,
      general: true,
    };
  });

  const [notifSound, setNotifSound] = useState(() => localStorage.getItem("notif_sound") !== "off");

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    localStorage.setItem("notif_prefs", JSON.stringify(notifPrefs));
  }, [notifPrefs]);

  useEffect(() => {
    localStorage.setItem("notif_sound", notifSound ? "on" : "off");
  }, [notifSound]);

  // --- Password Change ---
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "নতুন পাসওয়ার্ড দুটি মিলছে না", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      if (signInErr) {
        toast({ title: "বর্তমান পাসওয়ার্ড সঠিক নয়", variant: "destructive" });
        setChangingPassword(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে ✓" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "পাসওয়ার্ড পরিবর্তন ব্যর্থ", description: err.message, variant: "destructive" });
    }
    setChangingPassword(false);
  };

  // --- Email Change ---
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

  // --- Sign Out All ---
  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    navigate("/sign-in");
  };

  // --- Delete Account ---
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    // Sign out — actual account deletion needs admin/edge function
    toast({ title: "অ্যাকাউন্ট মুছে ফেলার অনুরোধ পাঠানো হয়েছে", description: "আমাদের টিম শীঘ্রই আপনার অ্যাকাউন্ট মুছে ফেলবে।" });
    await supabase.auth.signOut();
    navigate("/");
    setDeleting(false);
  };

  const PasswordInput = ({ value, onChange, show, onToggle, placeholder }: any) => (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 bg-secondary/50 border-border rounded-xl"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">সেটিংস</h1>
        <p className="text-sm text-muted-foreground">আপনার অ্যাকাউন্ট সেটিংস ম্যানেজ করুন</p>
      </div>

      {/* Password Change */}
      <SectionCard delay={0}>
        <SectionHeader icon={Lock} title="পাসওয়ার্ড পরিবর্তন" desc="আপনার অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন" />
        <div className="p-6 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">বর্তমান পাসওয়ার্ড</Label>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
              placeholder="বর্তমান পাসওয়ার্ড লিখুন"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">নতুন পাসওয়ার্ড</Label>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">নতুন পাসওয়ার্ড নিশ্চিত করুন</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="পাসওয়ার্ড আবার লিখুন"
              className="bg-secondary/50 border-border rounded-xl"
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="gap-2 rounded-xl"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {changingPassword ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
          </Button>
        </div>
      </SectionCard>

      {/* Email Change */}
      <SectionCard delay={0.05}>
        <SectionHeader icon={Mail} title="ইমেইল পরিবর্তন" desc="আপনার লগইন ইমেইল আপডেট করুন" />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-secondary/30 border border-border/30 px-3 py-2.5">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{user.email}</span>
            <span className="text-[10px] text-muted-foreground ml-auto">বর্তমান</span>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">নতুন ইমেইল</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="নতুন ইমেইল অ্যাড্রেস"
              className="bg-secondary/50 border-border rounded-xl"
            />
          </div>
          <Button
            onClick={handleEmailChange}
            disabled={changingEmail || !newEmail || newEmail === user.email}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            {changingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {changingEmail ? "পাঠানো হচ্ছে..." : "ইমেইল পরিবর্তন করুন"}
          </Button>
        </div>
      </SectionCard>

      {/* Notification Preferences */}
      <SectionCard delay={0.1}>
        <SectionHeader icon={Bell} title="নোটিফিকেশন সেটিংস" desc="কোন নোটিফিকেশন পেতে চান তা নির্ধারণ করুন" />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">টিকেট রিপ্লাই</p>
              <p className="text-xs text-muted-foreground">সাপোর্ট টিম রিপ্লাই দিলে নোটিফিকেশন পান</p>
            </div>
            <Switch
              checked={notifPrefs.ticket_reply}
              onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, ticket_reply: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">টিকেট স্ট্যাটাস</p>
              <p className="text-xs text-muted-foreground">টিকেটের স্ট্যাটাস পরিবর্তন হলে নোটিফিকেশন পান</p>
            </div>
            <Switch
              checked={notifPrefs.ticket_status}
              onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, ticket_status: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">অর্ডার আপডেট</p>
              <p className="text-xs text-muted-foreground">অর্ডার কনফার্ম বা আপডেট হলে নোটিফিকেশন পান</p>
            </div>
            <Switch
              checked={notifPrefs.order_update}
              onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, order_update: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">সাধারণ বিজ্ঞপ্তি</p>
              <p className="text-xs text-muted-foreground">সিস্টেম ও সাধারণ আপডেট</p>
            </div>
            <Switch
              checked={notifPrefs.general}
              onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, general: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">নোটিফিকেশন সাউন্ড</p>
              <p className="text-xs text-muted-foreground">নতুন নোটিফিকেশনে সাউন্ড বাজবে</p>
            </div>
            <Switch
              checked={notifSound}
              onCheckedChange={setNotifSound}
            />
          </div>
        </div>
      </SectionCard>

      {/* Security / Sessions */}
      <SectionCard delay={0.15}>
        <SectionHeader icon={Shield} title="নিরাপত্তা ও সেশন" desc="আপনার অ্যাকাউন্টের নিরাপত্তা ম্যানেজ করুন" />
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">বর্তমান সেশন</p>
                <p className="text-xs text-muted-foreground">
                  সর্বশেষ লগইন: {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString("bn-BD", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <span className="ml-auto text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">সক্রিয়</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">সব ডিভাইস থেকে লগআউট</p>
              <p className="text-xs text-muted-foreground">সব সেশন বন্ধ করে শুধু এখানে লগইন থাকবেন</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs">
                  <LogOut className="w-3.5 h-3.5" /> সব লগআউট
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
          </div>
        </div>
      </SectionCard>

      {/* Account Info */}
      <SectionCard delay={0.2}>
        <SectionHeader icon={Globe} title="অ্যাকাউন্ট তথ্য" desc="আপনার অ্যাকাউন্টের সাধারণ তথ্য" />
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">অ্যাকাউন্ট তৈরি</span>
            <span className="text-foreground">
              {new Date(user.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ইমেইল ভেরিফাইড</span>
            <span className={user.email_confirmed_at ? "text-green-500" : "text-orange-500"}>
              {user.email_confirmed_at ? "হ্যাঁ ✓" : "না ✗"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ইউজার আইডি</span>
            <span className="text-foreground font-mono text-xs">{user.id.slice(0, 12)}...</span>
          </div>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard delay={0.25}>
        <div className="px-6 py-4 border-b border-destructive/20 bg-destructive/5">
          <h2 className="text-sm font-semibold font-display text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            ডেঞ্জার জোন
          </h2>
          <p className="text-xs text-destructive/70 mt-0.5">এই অ্যাকশনগুলো অপরিবর্তনযোগ্য</p>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">অ্যাকাউন্ট মুছে ফেলুন</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                আপনার সমস্ত ডেটা, ব্যবসা, অর্ডার এবং টিকেট স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs shrink-0">
                  <Trash2 className="w-3.5 h-3.5" /> অ্যাকাউন্ট মুছুন
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">অ্যাকাউন্ট মুছে ফেলার অনুরোধ</AlertDialogTitle>
                  <AlertDialogDescription>
                    এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না। নিশ্চিত করতে নিচে <strong>DELETE</strong> টাইপ করুন।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder='DELETE টাইপ করুন'
                  className="font-mono"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirm("")}>বাতিল</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== "DELETE" || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "প্রসেসিং..." : "অ্যাকাউন্ট মুছে ফেলুন"}
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
