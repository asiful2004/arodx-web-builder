import { useState, useEffect } from "react";
import { FileText, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

const AdminLegalPagesEditor = () => {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const { toast } = useToast();

  const [terms, setTerms] = useState({ title: "Terms & Conditions", content: "", last_updated: "" });
  const [privacy, setPrivacy] = useState({ title: "Privacy Policy", content: "", last_updated: "" });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.terms_and_conditions) {
      const t = settings.terms_and_conditions as any;
      setTerms({ title: t.title || "Terms & Conditions", content: t.content || "", last_updated: t.last_updated || "" });
    }
    if (settings?.privacy_policy) {
      const p = settings.privacy_policy as any;
      setPrivacy({ title: p.title || "Privacy Policy", content: p.content || "", last_updated: p.last_updated || "" });
    }
  }, [settings]);

  const handleSave = async (key: string, data: any) => {
    setSaving(key);
    try {
      const payload = { ...data, last_updated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) };
      await updateSetting.mutateAsync({ key, value: payload });
      if (key === "terms_and_conditions") setTerms(payload);
      else setPrivacy(payload);
      toast({ title: "সেভ হয়েছে", description: `${data.title} সফলভাবে আপডেট হয়েছে` });
    } catch {
      toast({ title: "ত্রুটি", description: "সেভ করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">আইনি পেইজ ম্যানেজমেন্ট</h2>
          <p className="text-sm text-muted-foreground">Terms & Conditions এবং Privacy Policy এডিট করুন</p>
        </div>
      </div>

      <Tabs defaultValue="terms">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">পেইজ টাইটেল</Label>
                <Input value={terms.title} onChange={(e) => setTerms({ ...terms, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">কন্টেন্ট</Label>
                <Textarea value={terms.content} onChange={(e) => setTerms({ ...terms, content: e.target.value })} rows={20} placeholder="আপনার Terms & Conditions এখানে লিখুন..." className="font-mono text-sm" />
              </div>
              {terms.last_updated && <p className="text-xs text-muted-foreground">সর্বশেষ আপডেট: {terms.last_updated}</p>}
              <Button onClick={() => handleSave("terms_and_conditions", terms)} disabled={saving === "terms_and_conditions"} className="gap-2">
                {saving === "terms_and_conditions" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                সেভ করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">পেইজ টাইটেল</Label>
                <Input value={privacy.title} onChange={(e) => setPrivacy({ ...privacy, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">কন্টেন্ট</Label>
                <Textarea value={privacy.content} onChange={(e) => setPrivacy({ ...privacy, content: e.target.value })} rows={20} placeholder="আপনার Privacy Policy এখানে লিখুন..." className="font-mono text-sm" />
              </div>
              {privacy.last_updated && <p className="text-xs text-muted-foreground">সর্বশেষ আপডেট: {privacy.last_updated}</p>}
              <Button onClick={() => handleSave("privacy_policy", privacy)} disabled={saving === "privacy_policy"} className="gap-2">
                {saving === "privacy_policy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                সেভ করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLegalPagesEditor;
