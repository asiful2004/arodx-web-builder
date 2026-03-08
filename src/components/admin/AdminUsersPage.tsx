import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users, Loader2, Search, Shield, ShieldCheck, UserCog,
  RefreshCw, Calendar, UserPlus, Trash2, Crown, User as UserIcon,
} from "lucide-react";

type AppRole = "admin" | "moderator" | "user" | "client";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; className: string }> = {
  admin: {
    label: "অ্যাডমিন",
    icon: Crown,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  moderator: {
    label: "মডারেটর",
    icon: ShieldCheck,
    className: "bg-accent/20 text-accent-foreground border-accent/30",
  },
  client: {
    label: "ক্লায়েন্ট",
    icon: ShieldCheck,
    className: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  user: {
    label: "ইউজার",
    icon: UserIcon,
    className: "bg-secondary text-secondary-foreground border-border",
  },
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [addingRole, setAddingRole] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("user");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    const rolesMap = new Map<string, AppRole[]>();
    (rolesRes.data || []).forEach((r: UserRole) => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    });

    const users: UserProfile[] = (profilesRes.data || []).map((p: any) => ({
      ...p,
      roles: rolesMap.get(p.user_id) || [],
    }));

    setProfiles(users);
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    let result = profiles;
    if (roleFilter !== "all") {
      result = result.filter((u) =>
        roleFilter === "no_role"
          ? u.roles.length === 0
          : u.roles.includes(roleFilter as AppRole)
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        u.user_id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [profiles, roleFilter, searchQuery]);

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole("user");
    setRoleDialogOpen(true);
  };

  const addRole = async () => {
    if (!selectedUser) return;
    if (selectedUser.roles.includes(newRole)) {
      toast({ title: "এই রোল ইতোমধ্যে আছে", variant: "destructive" });
      return;
    }
    setAddingRole(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUser.user_id,
      role: newRole,
    });

    if (error) {
      toast({ title: "রোল যোগ ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${roleConfig[newRole].label} রোল যোগ করা হয়েছে` });
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === selectedUser.user_id
            ? { ...p, roles: [...p.roles, newRole] }
            : p
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, roles: [...prev.roles, newRole] } : null
      );
    }
    setAddingRole(false);
  };

  const removeRole = async (role: AppRole) => {
    if (!selectedUser) return;
    // Prevent removing own admin role
    if (selectedUser.user_id === currentUser?.id && role === "admin") {
      toast({ title: "নিজের অ্যাডমিন রোল রিমুভ করা যাবে না", variant: "destructive" });
      return;
    }
    setRemovingRoleId(role);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", selectedUser.user_id)
      .eq("role", role);

    if (error) {
      toast({ title: "রোল রিমুভ ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${roleConfig[role].label} রোল রিমুভ করা হয়েছে` });
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === selectedUser.user_id
            ? { ...p, roles: p.roles.filter((r) => r !== role) }
            : p
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, roles: prev.roles.filter((r) => r !== role) } : null
      );
    }
    setRemovingRoleId(null);
  };

  const stats = useMemo(() => ({
    total: profiles.length,
    admins: profiles.filter((u) => u.roles.includes("admin")).length,
    clients: profiles.filter((u) => u.roles.includes("client")).length,
    moderators: profiles.filter((u) => u.roles.includes("moderator")).length,
    users: profiles.filter((u) => u.roles.includes("user")).length,
  }), [profiles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">ইউজার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">ইউজারদের রোল ও পারমিশন ম্যানেজ করুন</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsersWithRoles} className="gap-2 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5" />
          রিফ্রেশ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "মোট ইউজার", value: stats.total, icon: Users, color: "bg-primary/10 text-primary" },
          { label: "অ্যাডমিন", value: stats.admins, icon: Crown, color: "bg-yellow-500/10 text-yellow-600" },
          { label: "মডারেটর", value: stats.moderators, icon: ShieldCheck, color: "bg-green-500/10 text-green-600" },
          { label: "নো রোল", value: stats.noRole, icon: UserIcon, color: "bg-secondary text-muted-foreground" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col gap-2 p-5 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-bold font-display text-foreground">{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-border rounded-xl"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary/50 border-border rounded-xl">
            <SelectValue placeholder="রোল ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ইউজার</SelectItem>
            <SelectItem value="admin">অ্যাডমিন</SelectItem>
            <SelectItem value="moderator">মডারেটর</SelectItem>
            <SelectItem value="user">ইউজার</SelectItem>
            <SelectItem value="no_role">নো রোল</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden"
      >
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>কোনো ইউজার পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">ইউজার</TableHead>
                  <TableHead className="text-muted-foreground">রোল</TableHead>
                  <TableHead className="text-muted-foreground">যোগদান</TableHead>
                  <TableHead className="text-muted-foreground text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const initials = (u.full_name || "U")
                    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  const isCurrentUser = u.user_id === currentUser?.id;
                  return (
                    <TableRow key={u.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                              {u.full_name || "নাম সেট করা হয়নি"}
                              {isCurrentUser && (
                                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">আপনি</span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {u.user_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground/60 italic">কোনো রোল নেই</span>
                          ) : (
                            u.roles.map((role) => {
                              const rc = roleConfig[role];
                              const RIcon = rc.icon;
                              return (
                                <Badge key={role} className={`${rc.className} border gap-1 text-[11px]`}>
                                  <RIcon className="w-3 h-3" />
                                  {rc.label}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("bn-BD", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRoleDialog(u)}
                          className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          রোল ম্যানেজ
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              রোল ম্যানেজমেন্ট
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name || "ইউজার"} এর রোল যোগ বা রিমুভ করুন
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(selectedUser.full_name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedUser.full_name || "নাম সেট করা হয়নি"}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    ID: {selectedUser.user_id.slice(0, 12)}...
                  </p>
                </div>
              </div>

              {/* Current Roles */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  বর্তমান রোল
                </p>
                {selectedUser.roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic py-2">কোনো রোল অ্যাসাইন করা হয়নি</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.roles.map((role) => {
                      const rc = roleConfig[role];
                      const RIcon = rc.icon;
                      const isSelfAdmin = selectedUser.user_id === currentUser?.id && role === "admin";
                      return (
                        <div
                          key={role}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/30"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${rc.className}`}>
                              <RIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{rc.label}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeRole(role)}
                            disabled={removingRoleId === role || isSelfAdmin}
                            title={isSelfAdmin ? "নিজের অ্যাডমিন রোল রিমুভ করা যাবে না" : "রোল রিমুভ করুন"}
                          >
                            {removingRoleId === role ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Role */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  নতুন রোল যোগ করুন
                </p>
                <div className="flex gap-2">
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger className="flex-1 bg-secondary/50 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">অ্যাডমিন</SelectItem>
                      <SelectItem value="moderator">মডারেটর</SelectItem>
                      <SelectItem value="user">ইউজার</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addRole}
                    disabled={addingRole || selectedUser.roles.includes(newRole)}
                    className="gap-1.5 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    {addingRole ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    যোগ করুন
                  </Button>
                </div>
                {selectedUser.roles.includes(newRole) && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">এই রোল ইতোমধ্যে অ্যাসাইন করা আছে</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} className="rounded-xl">
              বন্ধ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
