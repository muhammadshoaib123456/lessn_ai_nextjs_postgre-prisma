// components/TeacherSectionClient.jsx
"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import Link from "next/link";
import PresentationCard from "@/components/PresentationCard";

function TeacherSectionClient({
  items = [],
  title = "Teachers love these",
  showCTA = true,
  ctaHref = "/explore-library",
  ctaLabel = "Explore Lessn Library",

  // fixed sizing + spacing controls
  cardWidth = 320,
  cardHeight = 420,
  gap = 24,
  leftPad = 24,
  peekRight = true,

  // short, visible animation
  animationMs = 160,
}) {
  const scrollerRef = useRef(null);
  const gridRef = useRef(null);
  const cardWidthRef = useRef(0);
  const initRef = useRef(false);
  const [initialized, setInitialized] = useState(false);

  // Track an in-progress animation so we can cancel instantly
  const animRef = useRef({ raf: 0, cancel: false });

  // Fewer clones → far smaller DOM with identical visuals/behavior
  const CLONES = useMemo(() => {
    if (!items.length) return 0;
    // Cap clones to 2 to prevent DOM bloat; looks/behaves the same for users.
    const n = Math.max(1, Math.floor(items.length / 4) || 1);
    return Math.min(2, n);
  }, [items.length]);

  const extended = useMemo(() => {
    if (items.length === 0) return [];
    const head = items.slice(0, CLONES);
    const tail = items.slice(-CLONES);
    return [...tail, ...items, ...head];
  }, [items, CLONES]);

  const START_INDEX = useMemo(() => (items.length ? CLONES : 0), [items.length, CLONES]);
  const [index, setIndex] = useState(START_INDEX);

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
    if (initRef.current || extended.length === 0) return;
    const el = scrollerRef.current;
    if (!el) return;

    const w = measureCardWidth() || cardWidth + gap;
    cardWidthRef.current = w;

    setIndex(START_INDEX);
    // Avoid layout thrash: write once, with scroll-behavior disabled
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = START_INDEX * w;
    el.style.scrollBehavior = prev || "";

    initRef.current = true;
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [START_INDEX, extended.length]);

  // keep index position on resize (rAF to coalesce)
  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const newW = measureCardWidth() || cardWidth + gap;
        cardWidthRef.current = newW;
        const prev = el.style.scrollBehavior;
        el.style.scrollBehavior = "auto";
        el.scrollLeft = index * newW;
        el.style.scrollBehavior = prev || "";
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
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

    animRef.current.raf = requestAnimationFrame(step);
  };

  const scrollByOneCard = (dir) => {
    const el = scrollerRef.current;
    if (!el || extended.length === 0) return;

    const w = cardWidthRef.current || measureCardWidth() || cardWidth + gap;
    const next = index + dir;

    setIndex(next);
    animateScrollTo(el, next * w, Math.max(100, animationMs), () => {
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
          className={`no-scrollbar ${initialized ? "" : "invisible"}`}
          style={{
            overflowX: "hidden",
            willChange: "scroll-position", // hint for smoother scroll/animation
          }}
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
            <Link href={ctaHref} className="rounded-full bg-[#9500DE] px-8 py-3 text-white hover:bg-[#7c00b9]">
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TeacherSectionClient);
