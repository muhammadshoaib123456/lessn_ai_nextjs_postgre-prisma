"use client";

import React, { useRef } from "react";
import Link from "next/link";
import PresentationCard from "./PresentationCard";

export default function TeacherSectionClient({ items = [] }) {
  const scrollerRef = useRef(null);

  const scrollByOneCard = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("div[data-card]");
    const cardWidth = card ? card.getBoundingClientRect().width + 16 : 280; 
    // +16 to account for gap
    el.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
  };

  return (
    <section className="relative z-0 max-w-[1366px] mx-auto px-4 md:px-8 my-10">
      <h2 className="mb-8 text-center text-3xl font-semibold text-gray-800">
          Teachers love these
        </h2>

      <div className="relative">
        {/* Prev */}
        <button
          aria-label="Prev"
          onClick={() => scrollByOneCard(-1)}
          className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2 z-10"
        >
          ‹
        </button>

        <div
          ref={scrollerRef}
          className="scroll-smooth no-scrollbar snap-x snap-mandatory"
          style={{
            overflowX: "hidden", // completely hide horizontal scroll
          }}
        >
          <div
            className="
              grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-4
              md:[grid-auto-columns:minmax(260px,1fr)]
              lg:[grid-auto-columns:minmax(280px,1fr)]
              xl:[grid-auto-columns:minmax(300px,1fr)]
              pb-2
            "
          >
            {items.map((it) => (
              <div data-card key={it.id || it.slug} className="snap-start">
                <PresentationCard p={it} />
              </div>
            ))}
          </div>
        </div>

        {/* Next */}
        <button
          aria-label="Next"
          onClick={() => scrollByOneCard(1)}
          className=" absolute -right-3 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2 z-10"
        >
          ›
        </button>
               <div className="mt-12 text-center">
          <Link
            href="/explore-library"
            className="rounded-full bg-[#9500DE] px-8 py-3 text-white hover:bg-[#7c00b9]"
          >
            Explore Lessn Library
          </Link>
        </div>
      </div>

      {/* Removed "showing N items" footer completely */}
    </section>
  );
}
