import { Helmet } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import arodxLogo from "@/assets/arodx-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBranding } from "@/hooks/useBranding";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const ComparisonSection = lazy(() => import("@/components/ComparisonSection"));
const ProcessSection = lazy(() => import("@/components/ProcessSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const PortfolioSection = lazy(() => import("@/components/PortfolioSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  const { t } = useLanguage();
  const branding = useBranding();
  const { data: settings } = useSiteSettings();
  const logoSrc = branding.logo_url || arodxLogo;

  // Pull SEO config from DB, fallback to translations
  const seo = (settings?.seo_config as any) || {};
  const title = seo.home_title || t("seo.home.title");
  const description = seo.home_description || t("seo.home.description");
  const keywords = seo.home_keywords || "";
  const canonical = seo.canonical_url || "https://arodx-web-builder.lovable.app/";
  const ogImage = seo.og_image || "";
  const ogType = seo.og_type || "website";
  const twitterCard = seo.twitter_card || "summary_large_image";
  const robotsIndex = seo.robots_index !== false;
  const robotsFollow = seo.robots_follow !== false;
  const googleVerification = seo.google_verification || "";
  const bingVerification = seo.bing_verification || "";

  const robotsContent = `${robotsIndex ? "index" : "noindex"}, ${robotsFollow ? "follow" : "nofollow"}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="robots" content={robotsContent} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={ogType} />
        <meta property="og:url" content={canonical} />
        {ogImage && <meta property="og:image" content={ogImage} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* Verification */}
        {googleVerification && <meta name="google-site-verification" content={googleVerification} />}
        {bingVerification && <meta name="msvalidate.01" content={bingVerification} />}

        {branding.favicon_url && <link rel="icon" href={branding.favicon_url} type="image/png" />}
      </Helmet>
      <Navbar logo={logoSrc} />
      <main>
        <HeroSection />
        <Suspense fallback={null}>
          <ServicesSection />
          <ComparisonSection />
          <ProcessSection />
          <PricingSection />
          <PortfolioSection />
          <AboutSection />
          <ContactSection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
