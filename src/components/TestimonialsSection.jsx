"use client"; // ✅ Next.js client component (hooks allowed)
import React, { useState } from "react";

// ====== Testimonials Data ======
// - Array of objects with {quote, author}
// - Add more items to increase slides (and dots)
const testimonials = [
  {
    quote:
      "As a math teacher, I truly value the quality and variety of these presentations. They break down complex concepts effectively and positively impact my students’ overall performance!",
    author: "Math Teacher",
  },
  {
    quote:
      "Being able to quickly generate standards-based lessons has been a game changer for my classroom. Lessn’s library helps me stay organized and saves me precious planning time.",
    author: "John Borthwick",
  },
];

const TestimonialsSection = () => {
  // ====== Sizing knobs (edit these constants to control layout) ======
  const BASE_HEIGHT = 255;   // ✅ Default height for box (dot 1)
  const SMALL_HEIGHT = 240;  // ✅ Slightly shorter height for box (dot 2)
  const ICON_LEFT_PAD = 40;  // ✅ Horizontal padding for the SVG (px)

  // ====== State ======
  const [active, setActive] = useState(0); // ✅ Which testimonial is showing
  const [boxHeight, setBoxHeight] = useState(BASE_HEIGHT); // ✅ Current box height

  // ====== Handler for dot clicks ======
  const handleClick = (idx) => {
    setActive(idx); // switch testimonial
    // Switch box height (different heights per slide)
    // 👉 If you want the box to stay same height, replace with setBoxHeight(BASE_HEIGHT)
    setBoxHeight(idx === 0 ? BASE_HEIGHT : SMALL_HEIGHT);
  };

  return (
    // ====== OUTER SECTION ======
    <section className="bg-white py-16">
      {/**
       * BACKGROUND:
       * - bg-white → change to bg-gray-50 or brand hex
       * SPACING:
       * - py-16 → vertical padding (top+bottom). Use py-10 for tighter, py-20 for larger
       * RESPONSIVE:
       * - Add md:py-20 or lg:py-24 for bigger screens
       */}
      <div className="container mx-auto px-6 text-center">
        {/**
         * container → centers content, max width
         * mx-auto → center horizontally
         * px-6 → inner horizontal padding (adjust with px-4, md:px-12, etc.)
         * text-center → centers heading (not the gray box content, that’s text-left inside)
         */}

        {/* ====== SECTION HEADING ====== */}
        <h2 className="mb-8 text-3xl font-semibold text-gray-800">
          {/**
           * TEXT:
           * - "The Lessn effect" → change here to update heading
           * STYLES:
           * - text-3xl → base font size (change to text-2xl or md:text-4xl for responsive)
           * - font-semibold → weight (switch to font-bold if needed)
           * - text-gray-800 → color (use text-black or a brand hex)
           * - mb-8 → spacing below heading
           */}
          The Lessn effect
        </h2>

        {/* ====== GRAY TESTIMONIAL BOX ====== */}
        <div
          className="relative mx-auto rounded-xl bg-[#F2F2F2] p-8 text-left text-gray-800 shadow-lg transition-[height] duration-500 ease-in-out"
          style={{ width: 612, height: boxHeight }}
        >
          {/**
           * STYLE NOTES:
           * - relative → needed for absolutely positioned SVG
           * - mx-auto → center horizontally
           * - rounded-xl → rounded corners (increase to rounded-2xl)
           * - bg-[#F2F2F2] → background color (swap hex or use Tailwind gray-100)
           * - p-8 → padding inside box
           * - text-left → align testimonial text left
           * - text-gray-800 → text color
           * - shadow-lg → drop shadow (lighter = shadow-md, heavier = shadow-2xl)
           * - transition-[height] duration-500 ease-in-out → animate height changes
           *
           * WIDTH & HEIGHT:
           * - width: 612px fixed → change number here, OR replace with Tailwind: w-full max-w-[612px]
           * - height: controlled by boxHeight (BASE_HEIGHT/SMALL_HEIGHT)
           */}

          {/* ====== TOP-LEFT SVG (quote icon) ====== */}
          <div
            className="absolute top-0 left-0"
            style={{ left: ICON_LEFT_PAD }}
            aria-hidden="true"
          >
            {/**
             * POSITION:
             * - absolute top-0 left-0 → pins icon in top-left corner of box
             * - style={{ left: ICON_LEFT_PAD }} → horizontal offset (px)
             * 👉 To move DOWN: add top offset too, e.g., style={{ left: ICON_LEFT_PAD, top: 20 }}
             * 👉 To RESIZE: change <svg width="71" height="71">
             * 👉 To COLOR: edit fill="#9500DE" below
             */}
            <svg
              width="71"
              height="71"
              viewBox="0 0 72 71"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block m-0 p-0" // removes default spacing
            >
              {/* Purple background shape */}
              <path d="M0.931641 0H71.9316V46C71.9316 59.8071 60.7388 71 46.9316 71H25.9316C12.1245 71 0.931641 59.8071 0.931641 46V0Z" fill="#9500DE"/>
              {/* White quote marks */}
              <path d="M46.3296 34.211C46.7896 34.125 47.1996 34.06 47.5596 34.017C47.9196 33.974 48.2146 33.952 48.4456 33.952C50.1736 33.952 51.5616 34.484 52.6136 35.55C53.6646 36.616 54.1896 38.041 54.1896 39.826C54.1896 41.583 53.6286 43.009 52.5056 44.103C51.3826 45.197 49.9136 45.744 48.1006 45.744C45.9396 45.744 44.2196 45.003 42.9386 43.52C41.6566 42.036 41.0166 40.028 41.0166 37.494C41.0166 33.491 42.3336 29.762 44.9686 26.307C47.6026 22.852 50.8066 20.75 54.5796 20V23.629C52.0456 24.694 50.1226 26.063 48.8126 27.732C47.5026 29.402 46.6746 31.562 46.3296 34.211ZM26.2436 34.211C26.6756 34.153 27.0786 34.097 27.4536 34.038C27.8266 33.981 28.1306 33.952 28.3606 33.952C30.1166 33.952 31.5206 34.484 32.5716 35.55C33.6226 36.616 34.1486 38.041 34.1486 39.826C34.1486 41.583 33.5866 43.009 32.4646 44.103C31.3416 45.197 29.8576 45.744 28.0146 45.744C25.8546 45.744 24.1346 45.003 22.8526 43.52C21.5716 42.036 20.9316 40.028 20.9316 37.494C20.9316 33.491 22.2486 29.762 24.8836 26.307C27.5186 22.852 30.7216 20.75 34.4936 20V23.629C31.9596 24.694 30.0456 26.063 28.7496 27.732C27.4536 29.402 26.6186 31.562 26.2436 34.211Z" fill="white"/>
            </svg>
          </div>

          {/* ====== TEXT CONTENT ====== */}
          <div className="pt-20">
            {/**
             * pt-20 → pushes content down so it doesn’t overlap the SVG
             * 👉 If you move the SVG lower, you can reduce pt-20 → pt-16
             */}
            <p className="mb-4 text-base">
              {/**
               * QUOTE:
               * - text-base → font size (increase to text-lg or add md:text-xl for desktop)
               * - mb-4 → spacing below
               */}
              {testimonials[active].quote}
            </p>
            <p className="text-sm font-semibold text-[#9500DE]">
              {/**
               * AUTHOR:
               * - text-sm → font size (bump to text-base if too small)
               * - font-semibold → weight
               * - text-[#9500DE] → color (replace hex to match brand)
               */}
              — {testimonials[active].author}
            </p>
          </div>
        </div>

        {/* ====== DOT NAVIGATION ====== */}
        <div className="mt-6 flex justify-center space-x-3">
          {/**
           * mt-6 → space above dots
           * flex justify-center → centers horizontally
           * space-x-3 → gap between dots (increase for more spacing)
           */}
          {[0, 1].map((idx) => {
            const isActive = active === idx;
            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                className={`h-3 w-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#9500DE]/50 ${
                  isActive ? "bg-[#9500DE]" : "bg-gray-300 hover:bg-[#9500DE]/70"
                }`}
                aria-label={`Show testimonial ${idx + 1}`}
                aria-pressed={isActive}
                type="button"
              />
              /**
               * DOT STYLE:
               * - h-3 w-3 → circle size (increase to h-4 w-4 for larger dots)
               * - bg-[#9500DE] → active color
               * - bg-gray-300 → inactive color
               * - hover:bg-[#9500DE]/70 → hover effect
               * - focus:ring → accessibility focus outline
               */
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
