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
      {/* ===== HERO WRAPPER =====
         This outer <section> gives the hero a gradient background and a high z-index so its popovers/menus stack above other sections.
         CHANGE COLORS: edit from-[#500078] and to-[#9500DE]
         CHANGE DIRECTION: bg-gradient-to-b → to-r / to-br etc.
         LAYERING: z-50 controls stacking above later sections (bigger = more on top)
      */}
      <section className="relative z-50 overflow-visible bg-gradient-to-b from-[#500078] to-[#9500DE]">
        <div className="mx-auto max-w-100% min:h-[532px]">
          {/* 
            WIDTH: mx-auto centers children. 
            NOTE: `max-w-100%` and `min:h-[532px]` look like typos. 
            Tailwind equivalents are usually `max-w-full` and `min-h-[532px]`.
            If your config doesn’t define those custom classes, use:
              className="mx-auto max-w-full min-h-[532px]"
            MIN HEIGHT: controls how tall the hero area is at minimum. Increase for taller hero.
          */}
          <div className="grid h-full grid-rows-[auto,1fr]">
            {/* 
              GRID: 2 rows → first row auto (content sized), second row fills remaining (1fr).
              If your HeroSection self-sizes, you can also simplify to a normal div.
              HEIGHT: h-full makes grid fill the container’s min-height.
            */}
            <HeroSection />
            {/* 
              EDIT HERO CONTENT: open components/HeroSection.{jsx,tsx}
              Typography, buttons, dropdowns, images live inside that component.
              To make hero “taller/shorter” globally → adjust container min-height here.
            */}
          </div>
        </div>
      </section>

      {/* ===== REST OF PAGE STACKS UNDER HERO =====
         These are independent sections rendered in order. 
         To reorder, just move these lines.
      */}
      <TeachersSection />
      {/* 
        EDIT TEACHERS SECTION STYLES: inside components/TeachersSection.{jsx,tsx}
        Vertical spacing (py-*) and internal layout live inside that component.
        If you need extra global spacing around it (usually not needed), wrap in a <div className="my-..."> here.
      */}

      <PlanningSection />
      {/* 
        Same idea—open components/PlanningSection to adjust headings, gaps, images, etc.
      */}

      <WeaponSection />
      {/* 
        Your illustration section. Image size scales via responsive max-w classes inside WeaponSection.
        Change the title, spacing, and image sizes there.
      */}

      <TestimonialsSection />
      {/* 
        Dots/quotes/box height logic lives in TestimonialsSection. 
        Change the quotes array, box width/height, and colors there.
      */}

      <Footer />
      {/* 
        Footer styles/content live in components/Footer. 
        To make footer full-bleed or constrained, adjust container classes inside Footer.
      */}

      {/* ===== FLOATING UI ON TOP =====
         ScrollTop renders a floating button (position: fixed inside that component).
         It appears above everything because it’s rendered last and typically uses a high z-index.
         EDIT position/offset in ./ScrollTop.
      */}
      <ScrollTop />
    </>
  );
}
