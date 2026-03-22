import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  [key: string]: any;
}

const fetchSettings = async (): Promise<SiteSettings> => {
  const { data, error } = await supabase
    .from("site_settings" as any)
    .select("key, value");
  if (error) throw error;
  const map: SiteSettings = {};
  (data as any[])?.forEach((row: any) => {
    map[row.key] = row.value;
  });
  return map;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("site_settings" as any)
        .upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}
