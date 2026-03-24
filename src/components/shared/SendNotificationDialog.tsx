import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Search, Users, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserItem {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
}

export default function SendNotificationDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);

    Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url"),
      supabase.rpc("get_user_emails"),
    ]).then(([profilesRes, emailsRes]) => {
      const emailMap = new Map(
        (emailsRes.data || []).map((e: any) => [e.user_id, e.email])
      );
      const allUsers = (profilesRes.data || [])
        .filter((p: any) => p.user_id !== user?.id)
        .map((p: any) => ({
          ...p,
          email: emailMap.get(p.user_id) || "",
        }));
      setUsers(allUsers);
      setLoadingUsers(false);
    });
  }, [open, user?.id]);

  const toggleUser = (uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.user_id)));
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || selectedIds.size === 0) {
      toast({ title: "সব ফিল্ড পূরণ করুন এবং কমপক্ষে একজন ইউজার সিলেক্ট করুন", variant: "destructive" });
      return;
    }

    setSending(true);
    const rows = Array.from(selectedIds).map((uid) => ({
      user_id: uid,
      title: title.trim(),
      body: body.trim(),
      type: "custom",
    }));

    const { error } = await supabase.from("notifications").insert(rows);
    setSending(false);

    if (error) {
      toast({ title: "নোটিফিকেশন পাঠাতে সমস্যা হয়েছে", variant: "destructive" });
    } else {
      toast({ title: `${selectedIds.size} জনকে নোটিফিকেশন পাঠানো হয়েছে` });
      setOpen(false);
      setTitle("");
      setBody("");
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  };

  const getInitials = (name: string | null) =>
    (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <Send className="h-3.5 w-3.5" />
          নোটিফিকেশন পাঠান
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4.5 w-4.5 text-primary" />
            কাস্টম নোটিফিকেশন পাঠান
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">শিরোনাম</label>
            <Input
              placeholder="নোটিফিকেশনের শিরোনাম..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">বিস্তারিত</label>
            <Textarea
              placeholder="নোটিফিকেশনের বিস্তারিত মেসেজ..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="text-sm min-h-[80px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                প্রাপক নির্বাচন করুন
                {selectedIds.size > 0 && (
                  <span className="text-primary">({selectedIds.size} জন)</span>
                )}
              </label>
              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={selectAll}>
                {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 ? "সব বাদ দিন" : "সব সিলেক্ট"}
              </Button>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>

            <ScrollArea className="h-[200px] rounded-lg border border-border">
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">কোনো ইউজার পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="p-1">
                  {filteredUsers.map((u) => (
                    <label
                      key={u.user_id}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                        selectedIds.has(u.user_id) ? "bg-primary/5" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.has(u.user_id)}
                        onCheckedChange={() => toggleUser(u.user_id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                          {getInitials(u.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{u.full_name || "নাম নেই"}</p>
                        {u.email && <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>বাতিল</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            পাঠান
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
