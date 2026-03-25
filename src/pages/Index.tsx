import { Helmet } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import arodxLogo from "@/assets/arodx-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t("seo.home.title")}</title>
        <meta name="description" content={t("seo.home.description")} />
        <link rel="canonical" href="https://arodx-web-builder.lovable.app/" />
      </Helmet>
      <Navbar logo={arodxLogo} />
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
