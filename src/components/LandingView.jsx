
import HeroSection from "@/components/HeroSection";
import TeachersSection from "@/components/TeachersSection"
import PlanningSection from "@/components/PlanningSection";
import WeaponSection from "@/components/WeaponSection";
import TestimonialsSection from "@/components/TestimonialsSection"; // <- ensure correct file
import Footer from "@/components/Footer";
import ScrollTop from "./ScrollTop";

export default function LandingView() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#500078] to-[#9500DE] ">
  <div className="mx-auto max-w-100% min:h-[532px]">
    <div className="grid h-full grid-rows-[auto,1fr]">
            
            <HeroSection />
          </div>
        </div>
      </section>
      <TeachersSection />
      <PlanningSection />
      <WeaponSection />
      <TestimonialsSection />
      <Footer />

       {/* Floating scroll-to-top button */}
      <ScrollTop />
    </>
  );
}
