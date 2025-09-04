// components/TeacherSectionClient.jsx
"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PresentationCard from "@/components/PresentationCard";

export default function TeacherSectionClient({
  items = [],
  title = "Teachers love these",
  showCTA = true,
  ctaHref = "/explore-library",
  ctaLabel = "Explore Lessn Library",

  // fixed sizing + spacing controls
  cardWidth = 320,
  cardHeight = 420,
  gap = 24,
  leftPad = 24,     // ⬅ first card inset
  peekRight = true, // ⬅ if true, no right padding → last card peeks

  // ⚡ Short, visible animation that starts immediately
  animationMs = 160,
}) {
  const scrollerRef = useRef(null);
  const gridRef = useRef(null);
  const cardWidthRef = useRef(0);
  const initRef = useRef(false);
  const [initialized, setInitialized] = useState(false);

  // Track an in-progress animation so we can cancel instantly on a new click
  const animRef = useRef({ raf: 0, cancel: false });

  // clones for infinite loop
  const CLONES = Math.min(5, Math.max(1, Math.floor(items.length / 3) || 1));
  const extended = useMemo(() => {
    if (items.length === 0) return [];
    const head = items.slice(0, CLONES);
    const tail = items.slice(-CLONES);
    return [...tail, ...items, ...head];
  }, [items, CLONES]);

  const START_INDEX = useMemo(() => (items.length ? CLONES : 0), [items.length, CLONES]);
  const [index, setIndex] = useState(START_INDEX);

  // measure one column width + column gap
  const measureCardWidth = () => {
    const grid = gridRef.current;
    if (!grid) return 0;
    const first = grid.querySelector("div[data-card]");
    if (!first) return 0;
    const rect = first.getBoundingClientRect();
    const styles = getComputedStyle(grid);
    const gapPx = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return rect.width + gapPx;
  };

  // initial position
  useLayoutEffect(() => {
    if (initRef.current) return;
    const el = scrollerRef.current;
    if (!el || extended.length === 0) return;

    const w = measureCardWidth() || cardWidth + gap;
    cardWidthRef.current = w;

    setIndex(START_INDEX);
    el.scrollLeft = START_INDEX * w;

    initRef.current = true;
    setInitialized(true);
  }, [START_INDEX, extended.length, cardWidth, gap]);

  // keep index position on resize
  useEffect(() => {
    const onResize = () => {
      const el = scrollerRef.current;
      if (!el) return;
      const newW = measureCardWidth() || cardWidth + gap;
      cardWidthRef.current = newW;
      el.scrollLeft = index * newW;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index, cardWidth, gap]);

  const jumpWithoutAnim = (targetIndex) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = cardWidthRef.current || measureCardWidth() || cardWidth + gap;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = targetIndex * w;
    el.style.scrollBehavior = prev || "";
  };

  // Instant-start animation helper with cancel + onDone
  const animateScrollTo = (el, targetLeft, duration, onDone) => {
    // cancel any in-flight animation
    if (animRef.current.raf) {
      cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = 0;
    }
    animRef.current.cancel = false;

    const start = el.scrollLeft;
    const delta = targetLeft - start;
    if (!delta || duration <= 0) {
      el.scrollLeft = targetLeft;
      onDone?.();
      return;
    }

    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const step = (now) => {
      if (animRef.current.cancel) return;
      const t = Math.min(1, (now - t0) / duration);
      el.scrollLeft = start + delta * ease(t);
      if (t < 1) {
        animRef.current.raf = requestAnimationFrame(step);
      } else {
        animRef.current.raf = 0;
        onDone?.();
      }
    };

    // ensure immediate start
    animRef.current.raf = requestAnimationFrame(step);
  };

  // one-card move — instant start + short visible animation
  const scrollByOneCard = (dir) => {
    const el = scrollerRef.current;
    if (!el || extended.length === 0) return;

    const w = cardWidthRef.current || measureCardWidth() || cardWidth + gap;
    const next = index + dir;

    // Update state right away so UI reflects the new logical slide
    setIndex(next);

    // Start animation immediately
    animateScrollTo(el, next * w, Math.max(100, animationMs), () => {
      // Loop correction exactly when animation ends (no timers)
      if (next < CLONES) {
        const newIndex = next + items.length;
        setIndex(newIndex);
        jumpWithoutAnim(newIndex);
      } else if (next >= CLONES + items.length) {
        const newIndex = next - items.length;
        setIndex(newIndex);
        jumpWithoutAnim(newIndex);
      }
    });
  };

  return (
    <section className="relative z-0 max-w-[1366px] mx-auto px-0 md:px-0 my-10 overflow-x-clip">
      <h2 className="mb-8 text-center text-3xl font-semibold text-gray-800">{title}</h2>

      <div className="relative">
        {/* overlay buttons */}
        <div className="pointer-events-none absolute top-1/3 left-0 right-0 flex justify-between px-2 z-10">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByOneCard(-1)}
            className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-[#9500DE] text-white shadow-lg hover:bg-[#7c00b9] focus:outline-none focus:ring-2 focus:ring-[#9500DE]/30"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByOneCard(1)}
            className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-[#9500DE] text-white shadow hover:bg-[#7c00b9] focus:outline-none focus:ring-2 focus:ring-[#9500DE]/30"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>

        {/* scroller */}
        <div
          ref={scrollerRef}
          // Remove scroll-snap so it doesn't fight our JS animation
          className={`no-scrollbar ${initialized ? "" : "invisible"}`}
          style={{ overflowX: "hidden" }}
        >
          <div
            ref={gridRef}
            style={{
              ["--card-w"]: `${cardWidth}px`,
              ["--card-h"]: `${cardHeight}px`,
              ["--card-gap"]: `${gap}px`,
              ["--left-pad"]: `${leftPad}px`,
              ["--right-pad"]: peekRight ? "0px" : `${leftPad}px`,
            }}
            className={`
              grid grid-flow-col pb-2
              gap-[var(--card-gap)]
              [grid-auto-columns:var(--card-w)]
              pl-[var(--left-pad)] pr-[var(--right-pad)]
            `}
          >
            {extended.map((it, i) => (
              <div data-card key={`${it.id || it.slug || i}-${i}`}>
                <PresentationCard p={it} cardHeight={cardHeight} />
              </div>
            ))}
          </div>
        </div>

        {showCTA && (
          <div className="mt-12 text-center">
            <Link
              href={ctaHref}
              className="rounded-full bg-[#9500DE] px-8 py-3 text-white hover:bg-[#7c00b9]"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
