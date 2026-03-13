import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, CheckCircle2, AlertCircle, Loader2, Trash2, User,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  type StaffTask, type TaskStatus, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, ROLE_CONFIG,
  type SubRoleKey,
} from "@/hooks/useStaffTasks";
import { useState } from "react";
import { motion } from "framer-motion";

interface TaskCardProps {
  task: StaffTask;
  canManage: boolean;
  canChangeStatus?: boolean;
  onRefetch: () => void;
  showRole?: boolean;
}

export default function TaskCard({ task, canManage, canChangeStatus = true, onRefetch, showRole = false }: TaskCardProps) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusCfg = TASK_STATUS_CONFIG[task.status];
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
  const roleCfg = ROLE_CONFIG[task.target_role as SubRoleKey];

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setUpdating(true);
    const updateData: any = { status: newStatus };
    if (newStatus === "completed") updateData.completed_at = new Date().toISOString();
    if (newStatus !== "completed") updateData.completed_at = null;

    const { error } = await supabase.from("staff_tasks" as any).update(updateData).eq("id", task.id);
    setUpdating(false);
    if (error) {
      toast({ title: "আপডেট করতে সমস্যা", variant: "destructive" });
    } else {
      onRefetch();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("staff_tasks" as any).delete().eq("id", task.id);
    setDeleting(false);
    if (error) {
      toast({ title: "ডিলিট করতে সমস্যা", variant: "destructive" });
    } else {
      toast({ title: "টাস্ক ডিলিট হয়েছে" });
      onRefetch();
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed" && task.status !== "cancelled";
  const initials = (task.assignee_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-card p-4 transition-all hover:shadow-sm ${isOverdue ? "border-destructive/40" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityCfg.color}`}>
              {priorityCfg.label}
            </Badge>
            {showRole && roleCfg && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleCfg.color}`}>
                {roleCfg.short}
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                ওভারডিউ
              </Badge>
            )}
          </div>

          <h4 className={`text-sm font-semibold text-foreground leading-tight ${task.status === "completed" ? "line-through opacity-60" : ""}`}>
            {task.title}
          </h4>

          {task.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">{task.assignee_name}</span>
            </div>

            {task.due_date && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString("bn-BD")}
              </div>
            )}

            {task.status === "completed" && task.completed_at && (
              <div className="flex items-center gap-1 text-[10px] text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {new Date(task.completed_at).toLocaleDateString("bn-BD")}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)} disabled={updating || !canChangeStatus}>
            <SelectTrigger className={`h-7 text-[10px] w-24 px-2 ${statusCfg.color} border`}>
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TASK_STATUS_CONFIG) as [TaskStatus, { label: string }][]).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
