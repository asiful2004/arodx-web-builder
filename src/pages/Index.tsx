import { Helmet } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const ComparisonSection = lazy(() => import("@/components/ComparisonSection"));
const ProcessSection = lazy(() => import("@/components/ProcessSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const PortfolioSection = lazy(() => import("@/components/PortfolioSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Arodx - বাংলাদেশের সেরা Digital Agency | Web Development, Marketing & Design</title>
        <meta name="description" content="Arodx হলো বাংলাদেশের অন্যতম সেরা ডিজিটাল এজেন্সি। Web Development, Digital Marketing, Graphics Design, Video Editing, Business Automation — সবকিছু এক ছাদের নিচে।" />
        <link rel="canonical" href="https://arodx-web-builder.lovable.app/" />
      </Helmet>
      <Navbar />
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
