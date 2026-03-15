import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Monitor, Smartphone, Tablet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOnlinePresence, OnlineMember, DeviceType } from "@/hooks/useOnlinePresence";
import { useIsMobile } from "@/hooks/use-mobile";

const ROLE_LABELS: Record<string, string> = {
  admin: "অ্যাডমিন",
  moderator: "মডারেটর",
  user: "ইউজার",
  client: "ক্লায়েন্ট",
  staff: "স্টাফ",
  hr: "HR",
  graphics_designer: "গ্রাফিক্স ডিজাইনার",
  web_developer: "ওয়েব ডেভেলপার",
  project_manager: "প্রজেক্ট ম্যানেজার",
  digital_marketer: "ডিজিটাল মার্কেটার",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/20",
  hr: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  project_manager: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  web_developer: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  graphics_designer: "bg-purple-500/15 text-purple-600 border-purple-500/20",
  digital_marketer: "bg-cyan-500/15 text-cyan-600 border-cyan-500/20",
  client: "bg-primary/10 text-primary border-primary/20",
  user: "bg-muted text-muted-foreground border-border",
  moderator: "bg-orange-500/15 text-orange-600 border-orange-500/20",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPrimaryRole(roles: string[]): string {
  const priority = ["admin", "hr", "project_manager", "web_developer", "graphics_designer", "digital_marketer", "client", "moderator", "user"];
  for (const r of priority) {
    if (roles.includes(r)) return r;
  }
  return roles[0] || "user";
}

// Group members by their primary role
function groupByRole(members: OnlineMember[]) {
  const groups: Record<string, OnlineMember[]> = {};
  for (const m of members) {
    const role = getPrimaryRole(m.roles);
    if (!groups[role]) groups[role] = [];
    groups[role].push(m);
  }

  // Sort groups by priority
  const priority = ["admin", "hr", "project_manager", "web_developer", "graphics_designer", "digital_marketer", "client", "moderator", "user"];
  const sorted: [string, OnlineMember[]][] = [];
  for (const role of priority) {
    if (groups[role]) sorted.push([role, groups[role]]);
  }
  // Add any remaining
  for (const [role, members] of Object.entries(groups)) {
    if (!priority.includes(role)) sorted.push([role, members]);
  }
  return sorted;
}

function MemberItem({ member, onNavigate }: { member: OnlineMember; onNavigate?: (path: string) => void }) {
  const primaryRole = getPrimaryRole(member.roles);
  const colorClass = ROLE_COLORS[primaryRole] || ROLE_COLORS.user;

  return (
    <div
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
      onClick={() => onNavigate?.(`/dashboard/profile/${member.user_id}`)}
    >
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
            {getInitials(member.full_name)}
          </AvatarFallback>
        </Avatar>
        {/* Online dot */}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {member.full_name || "Unknown"}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {ROLE_LABELS[primaryRole] || primaryRole}
        </p>
      </div>
    </div>
  );
}

function PanelContent({ members, onNavigate }: { members: OnlineMember[]; onNavigate?: (path: string) => void }) {
  const grouped = groupByRole(members);

  return (
    <div className="space-y-4">
      {/* Online count header */}
      <div className="flex items-center gap-2 px-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          অনলাইন — {members.length}
        </span>
      </div>

      {grouped.map(([role, roleMembers]) => (
        <div key={role}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1.5">
            {ROLE_LABELS[role] || role} — {roleMembers.length}
          </p>
          <div className="space-y-0.5">
            {roleMembers.map((m) => (
              <MemberItem key={m.user_id} member={m} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}

      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">কেউ অনলাইনে নেই</p>
        </div>
      )}
    </div>
  );
}

export default function OnlineMembersPanel() {
  const { onlineMembers } = useOnlinePresence();
  const navigate = useNavigate();

  return (
    <div className="w-56 shrink-0 border-l border-border bg-card/50 hidden lg:flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">মেম্বারস</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <PanelContent members={onlineMembers} onNavigate={navigate} />
      </ScrollArea>
    </div>
  );
}

// Export just the trigger button for headers
export function OnlineMembersTrigger() {
  const { onlineMembers } = useOnlinePresence();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative lg:hidden">
          <Users className="h-5 w-5" />
          {onlineMembers.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {onlineMembers.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 flex flex-col">
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            অনলাইন মেম্বারস
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 py-3">
          <PanelContent members={onlineMembers} onNavigate={handleNavigate} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
