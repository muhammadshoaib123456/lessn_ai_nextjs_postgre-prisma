import HeroSection from "@/components/HeroSection";
import TeachersSection from "@/components/TeachersSection"
import PlanningSection from "@/components/PlanningSection";
import WeaponSection from "@/components/WeaponSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import ScrollTop from "./ScrollTop";

export default function LandingView() {
  return (
    <>
      {/* Allow hero dropdown/popup to render above the next sections */}
 <section className="relative z-50 overflow-visible bg-gradient-to-b from-[#500078] to-[#9500DE]">
        <div className="mx-auto max-w-100% min:h-[532px]">
          <div className="grid h-full grid-rows-[auto,1fr]">
            <HeroSection />
          </div>
        </div>
      </section>

      {/* Everything else sits under hero */}
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
