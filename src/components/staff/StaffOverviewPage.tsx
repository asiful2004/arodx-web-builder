import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Ticket, UserCog, Users,
  Palette, Code, Briefcase, Megaphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const baseLinks = [
  { title: "টিকেট সাপোর্ট", description: "ক্লায়েন্টদের টিকেট দেখুন ও উত্তর দিন", icon: Ticket, url: "/staff/tickets", color: "bg-primary/10 text-primary" },
  { title: "লাইভ চ্যাট", description: "রিয়েল-টাইম চ্যাটে ক্লায়েন্টদের সাপোর্ট দিন", icon: MessageCircle, url: "/staff/chat", color: "bg-green-500/10 text-green-600" },
];

const hrLink = { title: "স্টাফ ম্যানেজমেন্ট", description: "স্টাফদের রোল অ্যাসাইন ও ম্যানেজ করুন", icon: Users, url: "/staff/hr", color: "bg-purple-500/10 text-purple-600" };

const panelLinks = [
  { title: "গ্রাফিক্স ডিজাইনার", description: "ডিজাইন টাস্ক ও প্রজেক্ট ম্যানেজমেন্ট", icon: Palette, url: "/staff/graphics-designer", color: "bg-pink-500/10 text-pink-600", role: "graphics_designer" },
  { title: "ওয়েব ডেভেলপার", description: "ডেভেলপমেন্ট টাস্ক ও কোড ম্যানেজমেন্ট", icon: Code, url: "/staff/web-developer", color: "bg-cyan-500/10 text-cyan-600", role: "web_developer" },
  { title: "প্রজেক্ট ম্যানেজার", description: "প্রজেক্ট ট্র্যাকিং ও টিম ম্যানেজমেন্ট", icon: Briefcase, url: "/staff/project-manager", color: "bg-amber-500/10 text-amber-600", role: "project_manager" },
  { title: "ডিজিটাল মার্কেটার", description: "মার্কেটিং ক্যাম্পেইন ও অ্যানালিটিক্স", icon: Megaphone, url: "/staff/digital-marketer", color: "bg-green-500/10 text-green-600", role: "digital_marketer" },
];

export default function StaffOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canManage, setCanManage] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "hr" as any }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]).then(([hrRes, adminRes, rolesRes]) => {
      setCanManage(!!hrRes.data || !!adminRes.data);
      setUserRoles((rolesRes.data || []).map((r: any) => r.role));
    });
  }, [user]);

  const visiblePanels = canManage
    ? panelLinks
    : panelLinks.filter((p) => userRoles.includes(p.role));

  const quickLinks = [
    ...baseLinks,
    ...(canManage ? [hrLink] : []),
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <UserCog className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {canManage ? "এইচআর ড্যাশবোর্ড" : "স্টাফ ড্যাশবোর্ড"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {canManage ? "স্টাফ ও প্যানেল ম্যানেজমেন্ট" : "আপনার কাজের ওভারভিউ"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
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

      {/* Sub-role Panels */}
      {visiblePanels.length > 0 && (
        <>
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              {canManage ? "টিম প্যানেল" : "আপনার প্যানেল"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {canManage ? "প্রতিটি টিমের ডেডিকেটেড প্যানেলে যান" : "আপনার অ্যাসাইন করা প্যানেল"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visiblePanels.map((link, i) => (
              <motion.button
                key={link.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (quickLinks.length + i) * 0.08 }}
                onClick={() => navigate(link.url)}
                className="rounded-xl border border-border bg-card p-5 text-left hover:bg-accent/50 transition-colors group"
              >
                <div className={`h-9 w-9 rounded-lg ${link.color} flex items-center justify-center mb-2.5`}>
                  <link.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{link.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">{link.description}</p>
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
