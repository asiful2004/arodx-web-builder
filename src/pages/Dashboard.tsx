import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Calendar, LogOut, ArrowLeft, Shield, Clock,
  Edit3, Save, X, Activity
} from "lucide-react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/50">
    <Icon className="w-5 h-5 text-primary" />
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: "", avatar_url: "" });
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
        setIsAdmin(!!data);
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setAvatarUrl(data.avatar_url || "");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq("user_id", user!.id);

      if (error) throw error;
      setProfile({ full_name: fullName, avatar_url: avatarUrl });
      setEditing(false);
      toast({ title: "প্রোফাইল আপডেট হয়েছে!" });
    } catch (error: any) {
      toast({ title: "আপডেট ব্যর্থ", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (profile.full_name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = new Date(user.created_at).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম
          </Link>
          <span className="text-sm font-display font-semibold text-foreground">ড্যাশবোর্ড</span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-xs text-primary gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                অ্যাডমিন
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xl"
        >
          {/* Gradient accent bar */}
          <div className="h-24 bg-gradient-primary opacity-20" />

          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end gap-4 mb-6">
              <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-xl font-bold font-display text-foreground">
                  {profile.full_name || "নাম সেট করুন"}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Calendar} label="যোগদান" value={joinedDate} />
              <StatCard icon={Activity} label="দিন" value={`${daysSinceJoin} দিন`} />
              <StatCard icon={Shield} label="স্ট্যাটাস" value="অ্যাক্টিভ" />
            </div>
          </div>
        </motion.div>

        {/* Profile Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              প্রোফাইল তথ্য
            </h2>
            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="text-xs text-muted-foreground hover:text-primary gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                এডিট
              </Button>
            )}
          </div>

          <div className="p-6">
            {editing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">পুরো নাম</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="bg-secondary/50 border-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">অ্যাভাটার URL</label>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-secondary/50 border-border rounded-xl"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="gap-1.5 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setFullName(profile.full_name || "");
                      setAvatarUrl(profile.avatar_url || "");
                    }}
                    className="gap-1.5 rounded-xl"
                  >
                    <X className="w-3.5 h-3.5" />
                    বাতিল
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <InfoRow icon={User} label="পুরো নাম" value={profile.full_name || "সেট করা হয়নি"} />
                <InfoRow icon={Mail} label="ইমেইল" value={user.email || ""} />
                <InfoRow icon={Calendar} label="যোগদান" value={joinedDate} />
                <InfoRow icon={Clock} label="সক্রিয়তা" value={`${daysSinceJoin} দিন ধরে সদস্য`} />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground truncate">{value}</p>
    </div>
  </div>
);

export default Dashboard;
