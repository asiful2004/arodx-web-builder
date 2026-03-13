import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLeaveRequests, LEAVE_TYPE_CONFIG } from "@/hooks/useAttendance";
import { CalendarDays } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeaveRequestDialog({ open, onOpenChange }: Props) {
  const { submitLeave } = useLeaveRequests();
  const [leaveType, setLeaveType] = useState("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;
    setSubmitting(true);
    await submitLeave(leaveType, startDate, endDate, reason);
    setSubmitting(false);
    onOpenChange(false);
    setLeaveType("casual");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            লিভ রিকোয়েস্ট
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">লিভের ধরন</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(LEAVE_TYPE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">শুরুর তারিখ</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">শেষ তারিখ</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">কারণ</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="লিভের কারণ লিখুন..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <Button onClick={handleSubmit} disabled={!startDate || !endDate || submitting} className="w-full">
            {submitting ? "পাঠানো হচ্ছে..." : "রিকোয়েস্ট পাঠান"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
