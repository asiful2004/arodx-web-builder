import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserCog, Plus, Users, ClipboardList, Palette, Code, Briefcase, Megaphone,
  BarChart3, CheckCircle2, Clock, AlertCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useStaffTasks, useTeamMembers, ROLE_CONFIG, SUB_ROLE_KEYS, type SubRoleKey, TASK_STATUS_CONFIG } from "@/hooks/useStaffTasks";
import TaskCard from "@/components/staff/TaskCard";
import CreateTaskDialog from "@/components/staff/CreateTaskDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ROLE_ICONS: Record<SubRoleKey, typeof Palette> = {
  graphics_designer: Palette,
  web_developer: Code,
  project_manager: Briefcase,
  digital_marketer: Megaphone,
};

export default function StaffHRPage() {
  const { tasks, loading: tasksLoading, refetch } = useStaffTasks();
  const { members, loading: membersLoading } = useTeamMembers();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultRole, setCreateDefaultRole] = useState<SubRoleKey | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getInitials = (name: string | null) =>
    (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Stats
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed" && t.status !== "cancelled").length;

  const handleCreateForRole = (role: SubRoleKey) => {
    setCreateDefaultRole(role);
    setCreateOpen(true);
  };

  const filteredTasks = (role?: string) => {
    let filtered = role ? tasks.filter((t) => t.target_role === role) : tasks;
    if (statusFilter !== "all") filtered = filtered.filter((t) => t.status === statusFilter);
    return filtered;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <UserCog className="h-5.5 w-5.5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">এইচআর ড্যাশবোর্ড</h1>
              <p className="text-[11px] text-muted-foreground">টিম ও টাস্ক ম্যানেজমেন্ট</p>
            </div>
          </div>
          <Button onClick={() => { setCreateDefaultRole(undefined); setCreateOpen(true); }} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            নতুন টাস্ক
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "মোট টাস্ক", value: totalTasks, icon: ClipboardList, color: "text-foreground" },
          { label: "পেন্ডিং", value: pendingTasks, icon: Clock, color: "text-yellow-600" },
          { label: "চলমান", value: inProgressTasks, icon: BarChart3, color: "text-blue-600" },
          { label: "সম্পন্ন", value: completedTasks, icon: CheckCircle2, color: "text-green-600" },
          { label: "ওভারডিউ", value: overdueTasks, icon: AlertCircle, color: "text-destructive" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-3.5"
          >
            <div className="flex items-center justify-between mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUB_ROLE_KEYS.map((role, i) => {
          const cfg = ROLE_CONFIG[role];
          const Icon = ROLE_ICONS[role];
          const roleMembers = members.filter((m) => m.roles.includes(role));
          const roleTasks = tasks.filter((t) => t.target_role === role);
          const roleActive = roleTasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;

          return (
            <motion.button
              key={role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.2 }}
              onClick={() => setActiveTab(role)}
              className={`rounded-xl border bg-card p-4 text-left transition-all hover:shadow-sm ${activeTab === role ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
            >
              <div className={`h-8 w-8 rounded-lg ${cfg.color} flex items-center justify-center mb-2`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-foreground truncate">{cfg.short}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-muted-foreground">{roleMembers.length} জন</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">{roleActive} টাস্ক</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs px-3">সবগুলো</TabsTrigger>
            {SUB_ROLE_KEYS.map((role) => (
              <TabsTrigger key={role} value={role} className="text-xs px-3 hidden sm:flex">
                {ROLE_CONFIG[role].short}
              </TabsTrigger>
            ))}
            <TabsTrigger value="team" className="text-xs px-3">টিম</TabsTrigger>
          </TabsList>

          {/* Status Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: "all", label: "সব" },
              { value: "pending", label: "পেন্ডিং" },
              { value: "in_progress", label: "চলমান" },
              { value: "review", label: "রিভিউ" },
              { value: "completed", label: "সম্পন্ন" },
            ].map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                className="h-7 text-[10px] px-2.5"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Overview - All Tasks */}
        <TabsContent value="overview" className="mt-4 space-y-3">
          {tasksLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredTasks().length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো টাস্ক নেই</p>
            </div>
          ) : (
            filteredTasks().map((task) => (
              <TaskCard key={task.id} task={task} canManage canChangeStatus={false} onRefetch={refetch} showRole />
            ))
          )}
        </TabsContent>

        {/* Per-Role Tabs */}
        {SUB_ROLE_KEYS.map((role) => (
          <TabsContent key={role} value={role} className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {(() => { const Icon = ROLE_ICONS[role]; return <Icon className="h-4 w-4 text-muted-foreground" />; })()}
                <h3 className="text-sm font-semibold text-foreground">{ROLE_CONFIG[role].label}</h3>
                <Badge variant="outline" className="text-[10px]">{filteredTasks(role).length} টাস্ক</Badge>
              </div>
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => handleCreateForRole(role)}>
                <Plus className="h-3 w-3" />
                টাস্ক দিন
              </Button>
            </div>

            {/* Members in this role */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {members.filter((m) => m.roles.includes(role)).map((m) => (
                <div key={m.user_id} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">{getInitials(m.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-medium text-foreground">{m.full_name || "নাম নেই"}</span>
                </div>
              ))}
              {members.filter((m) => m.roles.includes(role)).length === 0 && (
                <p className="text-xs text-muted-foreground">এই রোলে কোনো মেম্বার নেই</p>
              )}
            </div>

            <div className="space-y-3">
              {filteredTasks(role).length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">কোনো টাস্ক নেই</p>
                </div>
              ) : (
                filteredTasks(role).map((task) => (
                  <TaskCard key={task.id} task={task} canManage canChangeStatus={false} onRefetch={refetch} />
                ))
              )}
            </div>
          </TabsContent>
        ))}

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4">
          {membersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো টিম মেম্বার নেই</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m, i) => {
                const memberTasks = tasks.filter((t) => t.assigned_to === m.user_id);
                const activeTasks = memberTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
                const completedCount = memberTasks.filter((t) => t.status === "completed").length;

                return (
                  <motion.div
                    key={m.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{getInitials(m.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{m.full_name || "নাম নেই"}</p>
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {m.roles.filter((r) => SUB_ROLE_KEYS.includes(r as SubRoleKey)).map((r) => (
                            <Badge key={r} variant="outline" className={`text-[9px] px-1 py-0 ${ROLE_CONFIG[r as SubRoleKey]?.color}`}>
                              {ROLE_CONFIG[r as SubRoleKey]?.short}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-foreground">{memberTasks.length}</p>
                        <p className="text-[9px] text-muted-foreground">মোট</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-blue-500/5">
                        <p className="text-lg font-bold text-blue-600">{activeTasks}</p>
                        <p className="text-[9px] text-muted-foreground">চলমান</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-green-500/5">
                        <p className="text-lg font-bold text-green-600">{completedCount}</p>
                        <p className="text-[9px] text-muted-foreground">সম্পন্ন</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        members={members}
        defaultRole={createDefaultRole}
        onCreated={refetch}
      />
    </div>
  );
}
