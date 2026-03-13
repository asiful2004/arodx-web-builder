import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Ticket, UserCog, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const baseLinks = [
  { title: "টিকেট সাপোর্ট", description: "ক্লায়েন্টদের টিকেট দেখুন ও উত্তর দিন", icon: Ticket, url: "/staff/tickets", color: "bg-primary/10 text-primary" },
  { title: "লাইভ চ্যাট", description: "রিয়েল-টাইম চ্যাটে ক্লায়েন্টদের সাপোর্ট দিন", icon: MessageCircle, url: "/staff/chat", color: "bg-green-500/10 text-green-600" },
];

const hrLink = { title: "স্টাফ ম্যানেজমেন্ট", description: "স্টাফদের রোল অ্যাসাইন ও ম্যানেজ করুন", icon: Users, url: "/staff/hr", color: "bg-purple-500/10 text-purple-600" };

export default function StaffOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHR, setShowHR] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "hr" as any }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
    ]).then(([hrRes, adminRes]) => {
      setShowHR(!!hrRes.data || !!adminRes.data);
    });
  }, [user]);

  const quickLinks = showHR ? [...baseLinks, hrLink] : baseLinks;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <UserCog className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">স্টাফ ড্যাশবোর্ড</h1>
            <p className="text-xs text-muted-foreground">আপনার কাজের ওভারভিউ</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((link, i) => (
          <motion.button
            key={link.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(link.url)}
            className="rounded-xl border border-border bg-card p-6 text-left hover:bg-accent/50 transition-colors group"
          >
            <div className={`h-10 w-10 rounded-lg ${link.color} flex items-center justify-center mb-3`}>
              <link.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{link.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
