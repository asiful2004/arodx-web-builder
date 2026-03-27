import { useState } from "react";
import { Eye, Loader2, X, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplatePreviewDialogProps {
  templateKey: string;
  templateTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sample data for preview
const PREVIEW_DATA: Record<string, any> = {
  name: "রাহুল আহমেদ",
  email: "rahul@example.com",
  dashboardUrl: "#",
  device: "Chrome on Windows",
  browser: "Chrome 120",
  os: "Windows 11",
  package: "Business",
  billingPeriod: "monthly",
  amount: "৫,০০০",
  paymentMethod: "bKash",
  transactionId: "TXN-PREVIEW-123456",
  renewalDate: "০১ ফেব্রুয়ারি ২০২৬",
  nextPaymentDate: "০১ ফেব্রুয়ারি ২০২৬",
  expiryDate: "৩১ জানুয়ারি ২০২৬",
  daysLeft: "৩",
  activeUntil: "বিলিং পিরিয়ড শেষ পর্যন্ত",
  ticketNumber: "TKT-00001",
  subject: "ওয়েবসাইটে সমস্যা",
  category: "Technical",
  priority: "High",
  ticketUrl: "#",
  replyPreview: "আপনার সমস্যাটি আমরা দেখছি। শীঘ্রই সমাধান দেওয়া হবে ইনশাআল্লাহ।",
  project: "E-Commerce Website",
  feedbackUrl: "#",
  paymentUrl: "#",
  resubscribeUrl: "#",
  reason: "পেমেন্ট মেথডে সমস্যা",
};

export default function EmailTemplatePreviewDialog({
  templateKey,
  templateTitle,
  open,
  onOpenChange,
}: EmailTemplatePreviewDialogProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const loadPreview = async () => {
    if (html) return; // Already loaded
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-template-email", {
        body: {
          templateName: templateKey,
          recipientEmail: "__preview__",
          data: PREVIEW_DATA,
          previewOnly: true,
        },
      });
      if (fnError) throw fnError;
      if (data?.html) {
        setHtml(data.html);
      } else if (data?.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || "প্রিভিউ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
    if (val) {
      setHtml(null);
      setError(null);
      loadPreview();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-semibold">{templateTitle} — প্রিভিউ</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">এটি স্যাম্পল ডেটা দিয়ে তৈরি প্রিভিউ</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 p-4 flex justify-center">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {html && !loading && (
            <div
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
                viewMode === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"
              }`}
            >
              <iframe
                srcDoc={html}
                className="w-full border-0"
                style={{ minHeight: "600px", height: "100%" }}
                title={`${templateKey} preview`}
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
