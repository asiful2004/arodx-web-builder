import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Search, Shield, UserPlus, Trash2, Loader2, UserCog,
  Palette, Code, Briefcase, Megaphone, ChevronDown,
} from "lucide-react";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type SubRole = "graphics_designer" | "web_developer" | "project_manager" | "digital_marketer";

const SUB_ROLES: { value: SubRole; label: string; icon: typeof Palette; color: string }[] = [
  { value: "graphics_designer", label: "গ্রাফিক্স ডিজাইনার", icon: Palette, color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  { value: "web_developer", label: "ওয়েব ডেভেলপার", icon: Code, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "project_manager", label: "প্রজেক্ট ম্যানেজার", icon: Briefcase, color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "digital_marketer", label: "ডিজিটাল মার্কেটার", icon: Megaphone, color: "bg-green-500/10 text-green-600 border-green-500/20" },
];

const ALL_SUB_ROLE_VALUES = SUB_ROLES.map((r) => r.value as string);

interface StaffMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
  role_ids: Record<string, string>;
}

export default function StaffHRPage() {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<SubRole | "">("");
  const [adding, setAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);

    // Get all users with 'staff' role
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("id, user_id, role");

    if (!allRoles) {
      setStaffMembers([]);
      setLoading(false);
      return;
    }

    // Find users who have any sub-role
    const subRoleUsers = new Set(
      allRoles.filter((r) => ALL_SUB_ROLE_VALUES.includes(r.role)).map((r) => r.user_id)
    );

    if (subRoleUsers.size === 0) {
      setStaffMembers([]);
      setLoading(false);
      return;
    }

    const userIdsArr = Array.from(subRoleUsers);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIdsArr);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    // Build staff members with all their roles
    const members: StaffMember[] = userIdsArr.map((uid) => {
      const prof = profileMap.get(uid);
      const userRoles = allRoles.filter((r) => r.user_id === uid);
      const roleIds: Record<string, string> = {};
      userRoles.forEach((r) => {
        roleIds[r.role] = r.id;
      });

      return {
        user_id: uid,
        full_name: prof?.full_name || null,
        avatar_url: prof?.avatar_url || null,
        roles: userRoles.map((r) => r.role),
        role_ids: roleIds,
      };
    });

    setStaffMembers(members);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const fetchAvailableUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name");
    if (!profiles) return;
    const staffIds = new Set(staffMembers.map((s) => s.user_id));
    setAllUsers(profiles.filter((p) => !staffIds.has(p.user_id)));
  };

  const handleOpenAddDialog = () => {
    fetchAvailableUsers();
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
      toast({ title: "সমস্যা হয়েছে", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "স্টাফ সফলভাবে যোগ হয়েছে" });
      setAddDialogOpen(false);
      fetchStaff();
    }
  };

  const handleAssignSubRole = async (userId: string, role: SubRole) => {
    setActionLoading(`${userId}-${role}`);
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: role as any,
    });
    setActionLoading(null);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "এই রোল আগে থেকেই আছে", variant: "destructive" });
      } else {
        toast({ title: "রোল অ্যাসাইন করতে সমস্যা", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "রোল অ্যাসাইন হয়েছে" });
      fetchStaff();
    }
  };

  const handleRemoveSubRole = async (roleId: string, roleName: string) => {
    setActionLoading(roleId);
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    setActionLoading(null);
    if (error) {
      toast({ title: "রোল রিমুভ করতে সমস্যা", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${roleName} রোল রিমুভ হয়েছে` });
      fetchStaff();
    }
  };

  const handleRemoveStaff = async (member: StaffMember) => {
    setActionLoading(`remove-${member.user_id}`);
    // Remove staff role and all sub-roles
    const allStaffRoles = ["staff", "graphics_designer", "web_developer", "project_manager", "digital_marketer"];
    const idsToRemove = Object.entries(member.role_ids)
      .filter(([role]) => allStaffRoles.includes(role))
      .map(([, id]) => id);

    for (const id of idsToRemove) {
      await supabase.from("user_roles").delete().eq("id", id);
    }
    setActionLoading(null);
    toast({ title: "স্টাফ রিমুভ হয়েছে" });
    fetchStaff();
  };

  const filteredStaff = staffMembers.filter((s) =>
    (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) =>
    (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getSubRoleConfig = (role: string) =>
    SUB_ROLES.find((r) => r.value === role);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">এইচআর ম্যানেজমেন্ট</h1>
              <p className="text-xs text-muted-foreground">স্টাফ ও সাব-রোল ম্যানেজ করুন</p>
            </div>
          </div>
          <Button onClick={handleOpenAddDialog} size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            নতুন স্টাফ যোগ
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground">মোট স্টাফ</p>
          <p className="text-2xl font-bold text-foreground mt-1">{staffMembers.length}</p>
        </div>
        {SUB_ROLES.map((sr) => (
          <div key={sr.value} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] text-muted-foreground">{sr.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {staffMembers.filter((s) => s.roles.includes(sr.value)).length}
            </p>
          </div>
        ))}
      </div>

      {/* Staff Table */}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>স্টাফ</TableHead>
                  <TableHead>সাব-রোল</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.full_name || "নাম নেই"}</p>
                          <Badge variant="outline" className="mt-0.5 text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            Staff
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {SUB_ROLES.filter((sr) => member.roles.includes(sr.value)).map((sr) => (
                          <Badge
                            key={sr.value}
                            variant="outline"
                            className={`text-[10px] ${sr.color} cursor-pointer hover:opacity-70 gap-1`}
                            onClick={() => handleRemoveSubRole(member.role_ids[sr.value], sr.label)}
                          >
                            <sr.icon className="h-2.5 w-2.5" />
                            {sr.label}
                            {actionLoading === member.role_ids[sr.value] ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <span className="text-[8px] ml-0.5">✕</span>
                            )}
                          </Badge>
                        ))}
                        {SUB_ROLES.filter((sr) => member.roles.includes(sr.value)).length === 0 && (
                          <span className="text-xs text-muted-foreground">কোনো সাব-রোল নেই</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                              <UserPlus className="h-3 w-3" />
                              রোল দিন
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {SUB_ROLES.filter((sr) => !member.roles.includes(sr.value)).map((sr) => (
                              <DropdownMenuItem
                                key={sr.value}
                                onClick={() => handleAssignSubRole(member.user_id, sr.value)}
                                disabled={actionLoading === `${member.user_id}-${sr.value}`}
                                className="gap-2 text-xs"
                              >
                                <sr.icon className="h-3.5 w-3.5" />
                                {sr.label}
                              </DropdownMenuItem>
                            ))}
                            {SUB_ROLES.filter((sr) => !member.roles.includes(sr.value)).length === 0 && (
                              <DropdownMenuItem disabled className="text-xs">
                                সব রোল দেওয়া আছে
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 text-xs h-7"
                          onClick={() => handleRemoveStaff(member)}
                          disabled={actionLoading === `remove-${member.user_id}`}
                        >
                          {actionLoading === `remove-${member.user_id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          রিমুভ
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>নতুন স্টাফ যোগ করুন</DialogTitle>
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
