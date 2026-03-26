import { useSiteSettings } from "@/hooks/useSiteSettings";

export interface BrandingConfig {
  logo_url: string;
  favicon_url: string;
  preloader_logo_url: string;
}

const DEFAULTS: BrandingConfig = {
  logo_url: "",
  favicon_url: "",
  preloader_logo_url: "",
};

export function useBranding(): BrandingConfig & { isLoading: boolean } {
  const { data: settings, isLoading } = useSiteSettings();
  const branding = (settings?.branding as any) || {};
  return {
    logo_url: branding.logo_url || DEFAULTS.logo_url,
    favicon_url: branding.favicon_url || DEFAULTS.favicon_url,
    preloader_logo_url: branding.preloader_logo_url || DEFAULTS.preloader_logo_url,
    isLoading,
  };
}
