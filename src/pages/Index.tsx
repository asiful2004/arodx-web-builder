import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import ComparisonSection from "@/components/ComparisonSection";
import ProcessSection from "@/components/ProcessSection";
import PricingSection from "@/components/PricingSection";
import PortfolioSection from "@/components/PortfolioSection";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

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
        <ServicesSection />
        <ComparisonSection />
        <ProcessSection />
        <PricingSection />
        <PortfolioSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
