import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Search, Shield, UserPlus, Trash2, Loader2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface StaffMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role_id: string;
}

export default function StaffPanelPage() {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<{ user_id: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    // Get all users with 'staff' role
    const subRoles = ['graphics_designer', 'web_developer', 'project_manager', 'digital_marketer', 'hr'];
    const { data: roles } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .in("role", subRoles as any);

    if (!roles || roles.length === 0) {
      setStaffMembers([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, created_at")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    setStaffMembers(
      roles.map(r => {
        const prof = profileMap.get(r.user_id);
        return {
          user_id: r.user_id,
          full_name: prof?.full_name || null,
          avatar_url: prof?.avatar_url || null,
          created_at: prof?.created_at || "",
          role_id: r.id,
        };
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const fetchAllUsers = async () => {
    // Get all profiles that don't already have staff role
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url");

    if (!profiles) return;

    // Filter out already staff
    const staffIds = new Set(staffMembers.map(s => s.user_id));
    setAllUsers(profiles.filter(p => !staffIds.has(p.user_id)));
  };

  const handleOpenAddDialog = () => {
    fetchAllUsers();
    setSelectedUserId("");
    setAddDialogOpen(true);
  };

  const handleAddStaff = async () => {
    if (!selectedUserId) return;
    setAdding(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUserId,
      role: "staff" as any,
    });
    setAdding(false);
    if (error) {
      toast({ title: "স্টাফ যোগ করতে সমস্যা", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "স্টাফ সফলভাবে যোগ হয়েছে" });
      setAddDialogOpen(false);
      fetchStaff();
    }
  };

  const handleRemoveStaff = async (roleId: string) => {
    setRemovingId(roleId);
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    setRemovingId(null);
    if (error) {
      toast({ title: "স্টাফ রিমুভ করতে সমস্যা", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "স্টাফ রিমুভ হয়েছে" });
      fetchStaff();
    }
  };

  const filteredStaff = staffMembers.filter(s =>
    (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) =>
    (name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">স্টাফ প্যানেল</h1>
              <p className="text-xs text-muted-foreground">টিম মেম্বার ম্যানেজমেন্ট</p>
            </div>
          </div>
          <Button onClick={handleOpenAddDialog} size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            স্টাফ যোগ করুন
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">মোট স্টাফ</p>
          <p className="text-2xl font-bold text-foreground mt-1">{staffMembers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">অ্যাক্টিভ</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{staffMembers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">রোল</p>
          <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Shield className="h-3 w-3 mr-1" />
            Staff
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "কোনো স্টাফ পাওয়া যায়নি" : "এখনো কোনো স্টাফ যোগ করা হয়নি"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>স্টাফ</TableHead>
                <TableHead className="hidden sm:table-cell">যোগদান</TableHead>
                <TableHead className="hidden sm:table-cell">রোল</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((s) => (
                <TableRow key={s.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={s.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {getInitials(s.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.full_name || "নাম নেই"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString("bn-BD") : "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Staff
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 text-xs"
                      onClick={() => handleRemoveStaff(s.role_id)}
                      disabled={removingId === s.role_id}
                    >
                      {removingId === s.role_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      রিমুভ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>স্টাফ যোগ করুন</DialogTitle>
            <DialogDescription>একজন ইউজারকে স্টাফ রোল দিন</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ইউজার সিলেক্ট করুন</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="ইউজার বাছাই করুন" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name || u.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleAddStaff} disabled={!selectedUserId || adding} className="gap-1.5">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              যোগ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
