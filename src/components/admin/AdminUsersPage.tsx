import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Users, Loader2, User, Mail, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: admin can't see other profiles unless RLS allows it
    // This is a placeholder — needs admin SELECT policy on profiles
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProfiles(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">ইউজার ম্যানেজমেন্ট</h1>
        <p className="text-sm text-muted-foreground">রেজিস্টার্ড সকল ইউজার</p>
      </div>

      {profiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
        >
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">কোনো ইউজার পাওয়া যায়নি</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p, i) => {
            const initials = (p.full_name || "U")
              .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-5 flex items-center gap-4"
              >
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {p.full_name || "নাম সেট করা হয়নি"}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(p.created_at).toLocaleDateString("bn-BD", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
