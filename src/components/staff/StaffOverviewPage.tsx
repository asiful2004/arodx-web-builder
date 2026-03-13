import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Ticket, UserCog, Users,
  Palette, Code, Briefcase, Megaphone,
  ClipboardList, CheckCircle2, Clock, BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useStaffTasks, ROLE_CONFIG, SUB_ROLE_KEYS, type SubRoleKey } from "@/hooks/useStaffTasks";
import { Badge } from "@/components/ui/badge";

const ROLE_ICONS: Record<SubRoleKey, typeof Palette> = {
  graphics_designer: Palette,
  web_developer: Code,
  project_manager: Briefcase,
  digital_marketer: Megaphone,
};

const ROLE_URLS: Record<SubRoleKey, string> = {
  graphics_designer: "/staff/graphics-designer",
  web_developer: "/staff/web-developer",
  project_manager: "/staff/project-manager",
  digital_marketer: "/staff/digital-marketer",
};

export default function StaffOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canManage, setCanManage] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { tasks } = useStaffTasks();

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

  const myTasks = tasks.filter((t) => t.assigned_to === user?.id);
  const myActive = myTasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;
  const myCompleted = myTasks.filter((t) => t.status === "completed").length;
  const myOverdue = myTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed" && t.status !== "cancelled").length;

  const visiblePanels = canManage
    ? SUB_ROLE_KEYS
    : SUB_ROLE_KEYS.filter((r) => userRoles.includes(r));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
            <UserCog className="h-5.5 w-5.5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {canManage ? "এইচআর ড্যাশবোর্ড" : "স্টাফ ড্যাশবোর্ড"}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {canManage ? "টিম পারফরম্যান্স ও ম্যানেজমেন্ট" : "আপনার কাজের ওভারভিউ"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* My Tasks Summary */}
      {!canManage && myTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-xl border border-border bg-card p-3.5 text-center">
            <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{myActive}</p>
            <p className="text-[10px] text-muted-foreground">চলমান টাস্ক</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-3.5 text-center">
            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{myCompleted}</p>
            <p className="text-[10px] text-muted-foreground">সম্পন্ন</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={`rounded-xl border bg-card p-3.5 text-center ${myOverdue > 0 ? "border-destructive/40" : "border-border"}`}>
            <BarChart3 className={`h-4 w-4 mx-auto mb-1 ${myOverdue > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <p className={`text-2xl font-bold ${myOverdue > 0 ? "text-destructive" : "text-foreground"}`}>{myOverdue}</p>
            <p className="text-[10px] text-muted-foreground">ওভারডিউ</p>
          </motion.div>
        </div>
      )}

      {/* HR Stats */}
      {canManage && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "মোট টাস্ক", value: tasks.length, color: "text-foreground", icon: ClipboardList },
            { label: "চলমান", value: tasks.filter((t) => t.status === "in_progress" || t.status === "pending").length, color: "text-blue-600", icon: Clock },
            { label: "সম্পন্ন", value: tasks.filter((t) => t.status === "completed").length, color: "text-green-600", icon: CheckCircle2 },
            { label: "ওভারডিউ", value: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed" && t.status !== "cancelled").length, color: "text-destructive", icon: BarChart3 },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-3.5">
              <s.icon className={`h-4 w-4 ${s.color} mb-1`} />
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">কুইক অ্যাক্সেস</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "টিকেট সাপোর্ট", desc: "ক্লায়েন্টদের টিকেট", icon: Ticket, url: "/staff/tickets", color: "from-primary/10 to-primary/5" },
            { title: "লাইভ চ্যাট", desc: "রিয়েল-টাইম সাপোর্ট", icon: MessageCircle, url: "/staff/chat", color: "from-green-500/10 to-green-500/5" },
            ...(canManage ? [
              { title: "এইচআর ম্যানেজমেন্ট", desc: "টিম ও টাস্ক ম্যানেজ", icon: Users, url: "/staff/hr", color: "from-purple-500/10 to-purple-500/5" },
            ] : []),
          ].map((link, i) => (
            <motion.button
              key={link.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.2 }}
              onClick={() => navigate(link.url)}
              className="rounded-xl border border-border bg-gradient-to-br p-4 text-left hover:shadow-sm transition-all group"
              style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
            >
              <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <h3 className="text-xs font-semibold text-foreground">{link.title}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{link.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {visiblePanels.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {canManage ? "টিম প্যানেল" : "আপনার প্যানেল"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {visiblePanels.map((role, i) => {
              const cfg = ROLE_CONFIG[role];
              const Icon = ROLE_ICONS[role];
              const roleTasks = tasks.filter((t) => t.target_role === role);
              const active = roleTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;

              return (
                <motion.button
                  key={role}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 + 0.3 }}
                  onClick={() => navigate(ROLE_URLS[role])}
                  className="rounded-xl border border-border bg-card p-4 text-left hover:shadow-sm hover:border-primary/30 transition-all group"
                >
                  <div className={`h-9 w-9 rounded-lg ${cfg.color} flex items-center justify-center mb-2`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{cfg.label}</p>
                  {active > 0 && (
                    <Badge variant="outline" className="mt-1.5 text-[9px] px-1.5 py-0">{active} চলমান</Badge>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
