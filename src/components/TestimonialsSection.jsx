"use client";
import React, { useState } from "react";

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
  const BASE_HEIGHT = 255;   // original height
  const SMALL_HEIGHT = 240;  // decreased height for second dot
  const ICON_LEFT_PAD = 40;  // 👈 left padding (in px) for the SVG inside the box

  const [active, setActive] = useState(0);
  const [boxHeight, setBoxHeight] = useState(BASE_HEIGHT);

  const handleClick = (idx) => {
    setActive(idx);
    setBoxHeight(idx === 0 ? BASE_HEIGHT : SMALL_HEIGHT);
  };

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6 text-center">
        <h2 className="mb-8 text-3xl font-semibold text-gray-800">The Lessn effect</h2>

        <div
          className="relative mx-auto rounded-xl bg-[#F2F2F2] p-8 text-left text-gray-800 shadow-lg transition-[height] duration-500 ease-in-out"
          style={{ width: 612, height: boxHeight }}
        >
          {/* Top-left SVG pinned to the top edge with left padding */}
          <div
            className="absolute top-0 left-0"
            style={{ left: ICON_LEFT_PAD }} // exact left padding
            aria-hidden="true"
          >
            <svg
              width="71"
              height="71"
              viewBox="0 0 72 71"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block m-0 p-0" // ensure zero margin/padding
            >
              <path d="M0.931641 0H71.9316V46C71.9316 59.8071 60.7388 71 46.9316 71H25.9316C12.1245 71 0.931641 59.8071 0.931641 46V0Z" fill="#9500DE"/>
              <path d="M46.3296 34.211C46.7896 34.125 47.1996 34.06 47.5596 34.017C47.9196 33.974 48.2146 33.952 48.4456 33.952C50.1736 33.952 51.5616 34.484 52.6136 35.55C53.6646 36.616 54.1896 38.041 54.1896 39.826C54.1896 41.583 53.6286 43.009 52.5056 44.103C51.3826 45.197 49.9136 45.744 48.1006 45.744C45.9396 45.744 44.2196 45.003 42.9386 43.52C41.6566 42.036 41.0166 40.028 41.0166 37.494C41.0166 33.491 42.3336 29.762 44.9686 26.307C47.6026 22.852 50.8066 20.75 54.5796 20V23.629C52.0456 24.694 50.1226 26.063 48.8126 27.732C47.5026 29.402 46.6746 31.562 46.3296 34.211ZM26.2436 34.211C26.6756 34.153 27.0786 34.097 27.4536 34.038C27.8266 33.981 28.1306 33.952 28.3606 33.952C30.1166 33.952 31.5206 34.484 32.5716 35.55C33.6226 36.616 34.1486 38.041 34.1486 39.826C34.1486 41.583 33.5866 43.009 32.4646 44.103C31.3416 45.197 29.8576 45.744 28.0146 45.744C25.8546 45.744 24.1346 45.003 22.8526 43.52C21.5716 42.036 20.9316 40.028 20.9316 37.494C20.9316 33.491 22.2486 29.762 24.8836 26.307C27.5186 22.852 30.7216 20.75 34.4936 20V23.629C31.9596 24.694 30.0456 26.063 28.7496 27.732C27.4536 29.402 26.6186 31.562 26.2436 34.211Z" fill="white"/>
            </svg>
          </div>

          {/* content */}
          <div className="pt-20"> {/* add top padding so text doesn't overlap the SVG */}
            <p className="mb-4 text-base">{testimonials[active].quote}</p>
            <p className="text-sm font-semibold text-[#9500DE]">— {testimonials[active].author}</p>
          </div>
        </div>

        {/* Two dots only */}
        <div className="mt-6 flex justify-center space-x-3">
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
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
