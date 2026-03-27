import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  isAdmin: boolean;
}

export default function CreateTicketPage() {
  const { user } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [orderId, setOrderId] = useState<string>("");
  const [orders, setOrders] = useState<{ id: string; package_name: string; domain_name: string | null; business_name: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState<{ id: string; ticket_number: string; subject: string } | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);

  // Check for existing active (non-resolved/non-closed) ticket
  useEffect(() => {
    const checkActiveTicket = async () => {
      const { data } = await supabase
        .from("tickets")
        .select("id, ticket_number, subject")
        .eq("user_id", user.id)
        .in("status", ["open", "in_progress", "waiting"])
        .limit(1);
      
      if (data && data.length > 0) {
        setActiveTicket(data[0]);
      }
      setCheckingActive(false);
    };
    checkActiveTicket();
  }, [user.id]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, package_name")
        .eq("user_id", user.id)
        .eq("status", "confirmed");

      if (!orderData) { setOrders([]); return; }

      const orderIds = orderData.map((o) => o.id);
      const { data: bizData } = await supabase
        .from("businesses")
        .select("order_id, business_name, domain_name")
        .eq("user_id", user.id)
        .in("order_id", orderIds);

      const bizMap = new Map((bizData || []).map((b) => [b.order_id, b]));
      setOrders(
        orderData.map((o) => ({
          ...o,
          business_name: bizMap.get(o.id)?.business_name || null,
          domain_name: bizMap.get(o.id)?.domain_name || null,
        }))
      );
    };
    fetchOrders();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast({ title: "সব ফিল্ড পূরণ করুন", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data: ticketData, error } = await supabase.from("tickets").insert({
      user_id: user.id,
      ticket_number: "TMP",
      subject: subject.trim(),
      description: description.trim(),
      category: category as any,
      priority: priority as any,
      order_id: orderId || null,
    }).select("ticket_number").single();
    setSubmitting(false);
    if (error) {
      toast({ title: "টিকেট তৈরি করতে সমস্যা হয়েছে", description: error.message, variant: "destructive" });
    } else {
      // Send ticket received email (fire and forget)
      supabase.functions.invoke("send-template-email", {
        body: {
          templateName: "ticket-received",
          recipientEmail: user.email,
          data: { name: user.user_metadata?.full_name || user.email, ticketNumber: ticketData?.ticket_number, subject: subject.trim(), category, priority, ticketUrl: window.location.origin + "/dashboard/tickets" },
        },
      }).catch(() => {});
      toast({ title: "টিকেট সফলভাবে তৈরি হয়েছে" });
      navigate("/dashboard/tickets");
    }
  };

  if (checkingActive) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard/tickets")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold font-display text-foreground">নতুন টিকেট তৈরি করুন</h1>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 max-w-3xl mx-auto text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Send className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-base font-semibold text-foreground">আপনার একটি সক্রিয় টিকেট আছে</h2>
          <p className="text-sm text-muted-foreground">
            একই সময়ে একাধিক টিকেট খোলা যায় না। আপনার বর্তমান টিকেট ({activeTicket.ticket_number} - {activeTicket.subject}) সমাধান বা বন্ধ হলে নতুন টিকেট তৈরি করতে পারবেন।
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/tickets")}>
              টিকেট তালিকা
            </Button>
            <Button onClick={() => navigate(`/dashboard/tickets/${activeTicket.id}`)}>
              টিকেট দেখুন
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard/tickets")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold font-display text-foreground">নতুন টিকেট তৈরি করুন</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-5 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>ক্যাটাগরি</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">সাধারণ</SelectItem>
                <SelectItem value="billing">বিলিং</SelectItem>
                <SelectItem value="technical">টেকনিক্যাল</SelectItem>
                <SelectItem value="domain">ডোমেইন</SelectItem>
                <SelectItem value="feature_request">ফিচার রিকোয়েস্ট</SelectItem>
                <SelectItem value="bug_report">বাগ রিপোর্ট</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>প্রায়োরিটি</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">কম</SelectItem>
                <SelectItem value="medium">মাঝারি</SelectItem>
                <SelectItem value="high">উচ্চ</SelectItem>
                <SelectItem value="urgent">জরুরি</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {orders.length > 0 && (
          <div className="space-y-2">
            <Label>সম্পর্কিত অর্ডার (ঐচ্ছিক)</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger><SelectValue placeholder="অর্ডার সিলেক্ট করুন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">কোনো অর্ডার নয়</SelectItem>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.package_name} ({o.domain_name || o.business_name || o.id.slice(0, 8)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>বিষয়</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="আপনার সমস্যার বিষয় লিখুন"
          />
        </div>

        <div className="space-y-2">
          <Label>বিস্তারিত বর্ণনা</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="সমস্যার বিস্তারিত বর্ণনা করুন..."
            rows={6}
          />
        </div>

        <Button type="submit" disabled={submitting} className="gap-2">
          <Send className="w-4 h-4" />
          {submitting ? "তৈরি হচ্ছে..." : "টিকেট জমা দিন"}
        </Button>
      </form>
    </div>
  );
}
