import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Loader2, Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { type TaskPriority, type SubRoleKey, ROLE_CONFIG, TASK_PRIORITY_CONFIG } from "@/hooks/useStaffTasks";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: { user_id: string; full_name: string | null; roles: string[] }[];
  defaultRole?: SubRoleKey;
  onCreated: () => void;
}

export default function CreateTaskDialog({ open, onOpenChange, members, defaultRole, onCreated }: CreateTaskDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [targetRole, setTargetRole] = useState<SubRoleKey | "">(defaultRole || "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredMembers = targetRole
    ? members.filter((m) => m.roles.includes(targetRole))
    : members;

  const handleCreate = async () => {
    if (!user || !title.trim() || !assignedTo || !targetRole) return;
    setCreating(true);

    const { error } = await supabase.from("staff_tasks" as any).insert({
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo,
      assigned_by: user.id,
      target_role: targetRole,
      priority,
      due_date: dueDate || null,
    });

    setCreating(false);
    if (error) {
      toast({ title: "টাস্ক তৈরি করতে সমস্যা", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "টাস্ক সফলভাবে তৈরি হয়েছে" });
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setPriority("medium");
      if (!defaultRole) setTargetRole("");
      onOpenChange(false);
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">নতুন টাস্ক তৈরি করুন</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">টাস্ক টাইটেল *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="টাস্কের নাম লিখুন" className="text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">বিস্তারিত</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="টাস্কের বিস্তারিত বিবরণ..." rows={3} className="text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">টিম *</Label>
              <Select value={targetRole} onValueChange={(v) => { setTargetRole(v as SubRoleKey); setAssignedTo(""); }}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="টিম বাছাই" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_CONFIG) as [SubRoleKey, typeof ROLE_CONFIG[SubRoleKey]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">অ্যাসাইন করুন *</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="মেম্বার বাছাই" /></SelectTrigger>
                <SelectContent>
                  {filteredMembers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.user_id.slice(0, 8)}</SelectItem>
                  ))}
                  {filteredMembers.length === 0 && (
                    <SelectItem value="none" disabled>কোনো মেম্বার নেই</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">প্রায়োরিটি</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriority, { label: string }][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ডেডলাইন</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">বাতিল</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !assignedTo || !targetRole || creating} size="sm" className="gap-1.5">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            তৈরি করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
