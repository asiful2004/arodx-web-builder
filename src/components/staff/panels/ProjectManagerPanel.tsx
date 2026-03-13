import { motion } from "framer-motion";
import { Briefcase, ClipboardList, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useStaffTasks } from "@/hooks/useStaffTasks";
import TaskCard from "@/components/staff/TaskCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ProjectManagerPanel() {
  const { tasks, loading, refetch } = useStaffTasks("project_manager");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const reviewTasks = tasks.filter((t) => t.status === "review").length;

  const filtered = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Briefcase className="h-5.5 w-5.5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">প্রজেক্ট ম্যানেজার</h1>
            <p className="text-[11px] text-muted-foreground">আপনার প্রজেক্ট টাস্ক ও ম্যানেজমেন্ট</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 text-center">
          <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-blue-600">{activeTasks}</p>
          <p className="text-[10px] text-muted-foreground">চলমান</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 text-center">
          <ClipboardList className="h-4 w-4 text-purple-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-purple-600">{reviewTasks}</p>
          <p className="text-[10px] text-muted-foreground">রিভিউ</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 text-center">
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-600">{completedTasks}</p>
          <p className="text-[10px] text-muted-foreground">সম্পন্ন</p>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[{ value: "all", label: "সব" }, { value: "pending", label: "পেন্ডিং" }, { value: "in_progress", label: "চলমান" }, { value: "review", label: "রিভিউ" }, { value: "completed", label: "সম্পন্ন" }].map((f) => (
          <Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" className="h-7 text-[10px] px-2.5" onClick={() => setStatusFilter(f.value)}>{f.label}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-card">
            <Briefcase className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{statusFilter === "all" ? "এখনো কোনো টাস্ক অ্যাসাইন হয়নি" : "এই ফিল্টারে কোনো টাস্ক নেই"}</p>
          </div>
        ) : (
          filtered.map((task) => <TaskCard key={task.id} task={task} canManage={false} onRefetch={refetch} />)
        )}
      </div>
    </div>
  );
}
