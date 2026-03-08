import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Globe, Phone, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Business {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
  created_at: string;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBusinesses(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">ব্যবসা সমূহ</h1>
        <p className="text-sm text-muted-foreground">রেজিস্টার্ড সকল ব্যবসার তালিকা</p>
      </div>

      {businesses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
        >
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">এখনো কোনো ব্যবসা নেই</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((biz, i) => (
            <motion.div
              key={biz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{biz.business_name}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{biz.business_category}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {biz.business_phone}
                </div>
                {biz.business_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {biz.business_address}
                  </div>
                )}
                {biz.domain_name && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3" /> {biz.domain_name}
                    <Badge variant="secondary" className="text-[10px]">
                      {biz.domain_type === "own" ? "নিজস্ব" : "প্যাকেজ"}
                    </Badge>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground/60">
                {new Date(biz.created_at).toLocaleDateString("bn-BD", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
