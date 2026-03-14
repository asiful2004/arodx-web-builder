import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { User, Mail, Calendar, Clock, Edit3, Save, X, Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  setProfile: (p: { full_name: string | null; avatar_url: string | null }) => void;
}

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

export default function ProfilePage() {
  const { user, profile, setProfile } = useOutletContext<DashboardContext>();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const initials = (profile.full_name || user.email || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const joinedDate = new Date(user.created_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq("user_id", user.id);
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

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="h-16 sm:h-20 bg-gradient-primary opacity-15" />
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 -mt-8 sm:-mt-10 flex items-end gap-3 sm:gap-4">
          <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-card shadow-lg shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-base sm:text-lg font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold font-display text-foreground truncate">
              {profile.full_name || "নাম সেট করুন"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            প্রোফাইল তথ্য
          </h2>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground hover:text-primary gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> এডিট
            </Button>
          )}
        </div>

        <div className="p-6">
          {editing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">পুরো নাম</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="আপনার নাম লিখুন" className="bg-secondary/50 border-border rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">অ্যাভাটার URL</label>
                <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg" className="bg-secondary/50 border-border rounded-xl" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} size="sm"
                  className="gap-1.5 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90">
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditing(false);
                  setFullName(profile.full_name || "");
                  setAvatarUrl(profile.avatar_url || "");
                }} className="gap-1.5 rounded-xl">
                  <X className="w-3.5 h-3.5" /> বাতিল
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
  );
}
