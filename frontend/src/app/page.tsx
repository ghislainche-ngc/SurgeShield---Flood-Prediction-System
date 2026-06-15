import Hero from "@/components/landing/Hero";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import ValuesSection from "@/components/landing/ValuesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <HowItWorks />
      <FeaturesGrid />
      <ValuesSection />
      <CTASection />
      <Footer />
    </>
  );
}
