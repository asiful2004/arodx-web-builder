import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Calendar, Clock, Globe, ArrowLeft, Link2, Instagram, Facebook, Github, Twitter, Linkedin, Youtube } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  social_links: { platform: string; url: string }[];
  created_at: string;
}

interface RoleData {
  role: string;
}

const SOCIAL_ICONS: Record<string, any> = {
  website: Globe,
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube,
};

const SOCIAL_LABELS: Record<string, string> = {
  website: "ওয়েবসাইট",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  github: "GitHub",
  youtube: "YouTube",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "অ্যাডমিন",
  moderator: "মডারেটর",
  user: "ইউজার",
  client: "ক্লায়েন্ট",
  staff: "স্টাফ",
  hr: "HR",
  graphics_designer: "গ্রাফিক্স ডিজাইনার",
  web_developer: "ওয়েব ডেভেলপার",
  project_manager: "প্রজেক্ট ম্যানেজার",
  digital_marketer: "ডিজিটাল মার্কেটার",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/20",
  hr: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  project_manager: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  web_developer: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  graphics_designer: "bg-purple-500/15 text-purple-600 border-purple-500/20",
  digital_marketer: "bg-cyan-500/15 text-cyan-600 border-cyan-500/20",
  client: "bg-primary/10 text-primary border-primary/20",
  user: "bg-muted text-muted-foreground border-border",
  moderator: "bg-orange-500/15 text-orange-600 border-orange-500/20",
};

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      supabase.from("profiles").select("full_name, avatar_url, bio, social_links, created_at").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]).then(([profileRes, rolesRes]) => {
      if (!profileRes.data) {
        setNotFound(true);
      } else {
        const data = profileRes.data as any;
        setProfile({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          bio: data.bio || null,
          social_links: Array.isArray(data.social_links) ? data.social_links : [],
          created_at: data.created_at,
        });
      }
      if (rolesRes.data) {
        setRoles(rolesRes.data.map((r: any) => r.role));
      }
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">প্রোফাইল পাওয়া যায়নি</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1.5" /> ড্যাশবোর্ডে ফিরে যান</Link>
          </Button>
        </div>
      </div>
    );
  }

  const initials = (profile.full_name || "?")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const joinedDate = new Date(profile.created_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
          <Link to="/dashboard"><ArrowLeft className="w-3.5 h-3.5" /> ড্যাশবোর্ড</Link>
        </Button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="h-20 sm:h-24 bg-gradient-primary opacity-15" />
          <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
            <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-lg sm:text-xl font-bold font-display text-foreground mt-3">
              {profile.full_name || "Unknown"}
            </h1>

            {/* Roles */}
            {roles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {roles.map((role) => (
                  <Badge key={role} variant="outline"
                    className={`text-[10px] px-2 py-0.5 ${ROLE_COLORS[role] || ROLE_COLORS.user}`}>
                    {ROLE_LABELS[role] || role}
                  </Badge>
                ))}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-sm">{profile.bio}</p>
            )}

            {/* Social Links */}
            {profile.social_links.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {profile.social_links.map((link, i) => {
                  const Icon = SOCIAL_ICONS[link.platform] || Link2;
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {SOCIAL_LABELS[link.platform] || link.platform}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-3"
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">যোগদান</p>
              <p className="text-sm text-foreground">{joinedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">সক্রিয়তা</p>
              <p className="text-sm text-foreground">{daysSinceJoin} দিন ধরে সদস্য</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
