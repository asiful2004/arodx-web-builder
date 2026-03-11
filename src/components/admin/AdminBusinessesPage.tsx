import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Globe, Phone, MapPin, Loader2, User, Mail,
  Shirt, ShoppingCart, UtensilsCrossed, Stethoscope, GraduationCap, Briefcase,
  Palette, Cpu, Car, Plane, Landmark, Dumbbell, Music, Camera, Wrench, Heart,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const categoryIconMap: Record<string, LucideIcon> = {
  "Fashion & Clothing": Shirt,
  "E-commerce": ShoppingCart,
  "Food & Restaurant": UtensilsCrossed,
  "Health & Medical": Stethoscope,
  "Education": GraduationCap,
  "Business & Corporate": Briefcase,
  "Creative & Design": Palette,
  "Technology": Cpu,
  "Automotive": Car,
  "Travel & Tourism": Plane,
  "Finance & Banking": Landmark,
  "Fitness & Sports": Dumbbell,
  "Entertainment & Media": Music,
  "Photography": Camera,
  "Services & Maintenance": Wrench,
  "Beauty & Wellness": Heart,
};

const getCategoryIcon = (category?: string): LucideIcon => {
  if (!category) return Building2;
  return categoryIconMap[category] || Building2;
};

interface Business {
  id: string;
  business_name: string;
  business_category: string;
  business_phone: string;
  business_address: string | null;
  domain_type: string;
  domain_name: string | null;
  logo_url: string | null;
  created_at: string;
  user_id: string;
  owner_name?: string | null;
  owner_avatar?: string | null;
  owner_email?: string | null;
  package_name?: string | null;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*, orders(customer_email, package_name)")
        .order("created_at", { ascending: false });

      if (!bizData || bizData.length === 0) {
        setBusinesses([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(bizData.map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const enriched: Business[] = bizData.map((b: any) => {
        const profile = profileMap.get(b.user_id);
        const order = b.orders;
        return {
          ...b,
          owner_name: profile?.full_name || null,
          owner_avatar: profile?.avatar_url || null,
          owner_email: order?.customer_email || null,
          package_name: order?.package_name || null,
        };
      });

      setBusinesses(enriched);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {biz.logo_url ? (
                      <img src={biz.logo_url} alt={biz.business_name} className="w-full h-full object-cover rounded-xl" />
                    ) : (() => {
                      const CategoryIcon = getCategoryIcon(biz.business_category);
                      return <CategoryIcon className="w-5 h-5 text-primary" />;
                    })()}
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

              {/* Owner info */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={biz.owner_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                    {(biz.owner_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {biz.owner_name || "নাম নেই"}
                  </p>
                  {biz.owner_email && (
                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5 shrink-0" /> {biz.owner_email}
                    </p>
                  )}
                </div>
                {biz.package_name && (
                  <Badge variant="secondary" className="text-[9px] shrink-0">
                    {biz.package_name}
                  </Badge>
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
