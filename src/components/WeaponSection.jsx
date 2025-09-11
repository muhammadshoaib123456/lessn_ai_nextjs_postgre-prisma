const WeaponSection = () => {
  return (
    // ====== OUTER SECTION WRAPPER ======
    <section className="bg-white py-16 item">
      {/**
       * STYLES:
       * - bg-white: ✅ Background color of the section. Swap to gray-50, black, or brand hex.
       * - py-16: ✅ Vertical padding (top + bottom). Change to py-12 (smaller) or py-20 (larger).
       * - item: ⚠️ This looks like a custom/unused class. Remove if not defined in CSS.
       * RESPONSIVE:
       * - Add md:py-24 or lg:py-32 if you want more spacing on bigger screens.
       */}
      <div className="container mx-auto px-6 text-center">
        {/**
         * - container: ✅ Gives a centered max-width wrapper.
         * - mx-auto: ✅ Centers it horizontally.
         * - px-6: ✅ Horizontal padding inside container. Adjust for tighter/wider spacing.
         * - text-center: ✅ Centers inline content (the heading).
         */}

        {/* ====== HEADING ====== */}
        <h2 className="mb-20 text-4xl font-semibold text-gray-800 ">
          {/**
           * TEXT:
           * - "Your secret weapon..." → ✅ Change this string directly to edit the heading text.
           * STYLES:
           * - mb-20: ✅ Margin-bottom (space below heading). Change to mb-12 for less gap.
           * - text-4xl: ✅ Font size. For responsive scaling:
           *     - sm:text-3xl (smaller phones)
           *     - md:text-5xl (medium screens)
           * - font-semibold: ✅ Weight. Use font-bold for heavier.
           * - text-gray-800: ✅ Color. Swap for text-black, text-slate-900, etc.
           */}
          Your secret weapon for impactful, instant lessons
        </h2>

        {/* ====== IMAGE WRAPPER ====== */}
        <div className="flex flex-col items-center justify-center">
          {/**
           * - flex flex-col: ✅ Vertical stacking (only one child here: the img).
           * - items-center: ✅ Center horizontally in the flexbox.
           * - justify-center: ✅ Center vertically (no effect unless more height given).
           */}

          {/* ====== RESPONSIVE IMAGE ====== */}
          <img
            src="/Image.svg" // ✅ Replace with your actual image path
            alt="Secret weapon illustration" // ✅ Update alt for accessibility
            className="mx-auto w-full max-w-[300px] object-contain sm:max-w-[470px] md:max-w-[480px] lg:max-w-[870px] xl:max-w-[720px] 2xl:max-w-[840px]"
          />
          {/**
           * IMAGE STYLE:
           * - mx-auto: ✅ Center horizontally.
           * - w-full: ✅ Image scales to 100% of parent width.
           * - max-w-[300px]: ✅ Maximum width at base (mobile).
           * - object-contain: ✅ Keeps image proportions, no crop.
           *
           * RESPONSIVE SIZES:
           * - sm:max-w-[470px]: ✅ On small screens (≥640px), max width is 470px.
           * - md:max-w-[480px]: ✅ On medium screens (≥768px), max width is 480px.
           * - lg:max-w-[870px]: ✅ On large screens (≥1024px), max width is 870px.
           * - xl:max-w-[720px]: ✅ On extra-large screens (≥1280px), max width is 720px.
           * - 2xl:max-w-[840px]: ✅ On 2xl screens (≥1536px), max width is 840px.
           *
           * HOW TO CHANGE IMAGE SIZE:
           * - Edit these max-w-[...] classes to resize image per breakpoint.
           * - Example: xl:max-w-[900px] will make it bigger on desktops.
           */}
        </div>
      </div>
    </section>
  );
};

export default WeaponSection;
