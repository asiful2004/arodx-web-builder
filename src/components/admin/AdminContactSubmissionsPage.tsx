import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Eye, Trash2, MessageSquare, CheckCircle, Clock, Inbox } from "lucide-react";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export default function AdminContactSubmissionsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchSubmissions = useCallback(async () => {
    const query = supabase
      .from("contact_submissions" as any)
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (!error && data) setSubmissions(data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const updateStatus = async (id: string, status: string, note?: string) => {
    const update: any = { status, updated_at: new Date().toISOString() };
    if (note !== undefined) update.admin_note = note;

    const { error } = await supabase
      .from("contact_submissions" as any)
      .update(update)
      .eq("id", id);

    if (error) {
      toast({ title: "ত্রুটি", description: "আপডেট করতে সমস্যা হয়েছে।", variant: "destructive" });
    } else {
      toast({ title: "আপডেট হয়েছে" });
      fetchSubmissions();
      setSelectedSubmission(null);
    }
  };

  const deleteSubmission = async (id: string) => {
    const { error } = await supabase.from("contact_submissions" as any).delete().eq("id", id);
    if (!error) {
      toast({ title: "ডিলিট হয়েছে" });
      setSubmissions(prev => prev.filter(s => s.id !== id));
    }
  };

  const filtered = filter === "all" ? submissions : submissions.filter(s => s.status === filter);

  const statusBadge = (status: string) => {
    switch (status) {
      case "unread": return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" /> অপঠিত</Badge>;
      case "read": return <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" /> পঠিত</Badge>;
      case "replied": return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> উত্তর দেওয়া হয়েছে</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: submissions.length,
    unread: submissions.filter(s => s.status === "unread").length,
    read: submissions.filter(s => s.status === "read").length,
    replied: submissions.filter(s => s.status === "replied").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> কন্টাক্ট সাবমিশন
        </h1>
        <p className="text-sm text-muted-foreground mt-1">ওয়েবসাইট থেকে আসা সকল কন্টাক্ট ফর্ম সাবমিশন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "মোট", value: stats.total, icon: Inbox, color: "text-foreground" },
          { label: "অপঠিত", value: stats.unread, icon: Clock, color: "text-destructive" },
          { label: "পঠিত", value: stats.read, icon: Eye, color: "text-muted-foreground" },
          { label: "উত্তর দেওয়া", value: stats.replied, icon: CheckCircle, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "সব" },
          { key: "unread", label: "অপঠিত" },
          { key: "read", label: "পঠিত" },
          { key: "replied", label: "উত্তর দেওয়া" },
        ].map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>কোনো সাবমিশন নেই</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>ইমেইল</TableHead>
                  <TableHead className="hidden md:table-cell">মেসেজ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sub => (
                  <TableRow key={sub.id} className={sub.status === "unread" ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell className="text-sm">{sub.email}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm text-muted-foreground">
                      {sub.message}
                    </TableCell>
                    <TableCell>{statusBadge(sub.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(sub.created_at).toLocaleDateString("bn-BD")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setAdminNote(sub.admin_note || "");
                            if (sub.status === "unread") updateStatus(sub.id, "read");
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteSubmission(sub.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              কন্টাক্ট বিস্তারিত
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">নাম</p>
                  <p className="font-medium">{selectedSubmission.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">ইমেইল</p>
                  <a href={`mailto:${selectedSubmission.email}`} className="font-medium text-primary hover:underline">
                    {selectedSubmission.email}
                  </a>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">মেসেজ</p>
                <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {new Date(selectedSubmission.created_at).toLocaleString("bn-BD")}
                <span className="ml-auto">{statusBadge(selectedSubmission.status)}</span>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">অ্যাডমিন নোট</p>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="এখানে নোট লিখুন..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => updateStatus(selectedSubmission.id, "read", adminNote)}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> পঠিত
                </Button>
                <Button size="sm" onClick={() => updateStatus(selectedSubmission.id, "replied", adminNote)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> উত্তর দেওয়া হয়েছে
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
