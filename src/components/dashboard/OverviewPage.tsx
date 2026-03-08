import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import {
  ShoppingBag, Calendar, Activity, Shield, TrendingUp, Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

const StatCard = ({ icon: Icon, label, value, color = "text-primary" }: {
  icon: any; label: string; value: string; color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-2 p-5 rounded-xl bg-card border border-border"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <span className="text-xl font-bold text-foreground">{value}</span>
  </motion.div>
);

export default function OverviewPage() {
  const { user, profile, isAdmin } = useOutletContext<DashboardContext>();

  const initials = (profile.full_name || user.email || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const joinedDate = new Date(user.created_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
      >
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
        <div className="relative flex items-center gap-5">
          <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-glow">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-display text-foreground">
              স্বাগতম, {profile.full_name || "ব্যবহারকারী"}! 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              আপনার ড্যাশবোর্ড থেকে সব কিছু ম্যানেজ করুন
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <Activity className="w-3 h-3 text-green-500" />
            <span>{isAdmin ? "অ্যাডমিন" : "অ্যাক্টিভ"}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label="যোগদান" value={joinedDate} />
        <StatCard icon={Activity} label="সদস্যপদ" value={`${daysSinceJoin} দিন`} color="text-accent" />
        <StatCard icon={ShoppingBag} label="মোট অর্ডার" value="০" />
      </div>

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          সাম্প্রতিক কার্যকলাপ
        </h2>
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">এখনো কোনো কার্যকলাপ নেই</p>
          <p className="text-xs mt-1">আপনার অর্ডার ও আপডেট এখানে দেখা যাবে</p>
        </div>
      </motion.div>
    </div>
  );
}
