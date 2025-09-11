// components/TeacherSectionClient.jsx
"use client"; // ✅ Next.js Client Component: allows useEffect/useState and DOM APIs

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

/**
 * TeacherSectionClient
 *
 * UI: A horizontally scrollable carousel of presentation cards with left/right arrows,
 *      a section title, and an optional CTA button under it.
 *
 * CUSTOMIZE SIZES / SPACING / COLORS:
 * - Title text: h2 element Tailwind classes (font-size: 'text-3xl', color 'text-gray-800', margin 'mb-8')
 * - Card sizes: 'cardWidth' and 'cardHeight' props → reflected via CSS variables --card-w/--card-h
 * - Gap between cards: 'gap' prop → CSS variable --card-gap
 * - Left/right padding: 'leftPad' and computed right pad → CSS variables --left-pad/--right-pad
 * - Arrow button colors: className bg-[#9500DE] hover:bg... etc
 * - CTA button styles: Tailwind classes on <Link> near bottom
 *
 * RESPONSIVE (MOBILE → DESKTOP):
 * - Most dimensions are fixed via props (cardWidth/cardHeight). Adjust props for global size changes.
 * - Check responsive utilities, e.g., "md:px-0" (Mobile first). "md:*" applies at ≥768px.
 * - Container section uses "max-w-[1366px]" (change this to grow/shrink overall width).
 */

function TeacherSectionClient({
  items = [],                 // ✅ Array of cards to show (PresentationCard consumes each item)
  title = "Teachers love these", // ✅ Section headline text (edit here to change the title string)
  showCTA = true,             // ✅ Toggle CTA button
  ctaHref = "/explore-library", // ✅ CTA destination
  ctaLabel = "Explore Lessn Library", // ✅ CTA text label

  // ======= FIXED SIZING + SPACING CONTROLS (edit these to impact layout) =======
  cardWidth = 320,            // ✅ Width (px) of each card → change here to enlarge/shrink cards
  cardHeight = 420,           // ✅ Height (px) of each card → change for taller/shorter cards
  gap = 24,                   // ✅ Horizontal gap (px) between cards
  leftPad = 20,               // ✅ Left padding (px) of the carousel list
  peekRight = true,           // ✅ If true, reduces right padding so next card “peeks in”

  // ======= ANIMATION DURATION =======
  animationMs = 160,          // ✅ Scroll animation duration (ms). Increase for slower glide
}) {
  // ======= DOM REFS =======
  const scrollerRef = useRef(null);   // ✅ Ref to scroll container (the horizontal scroller)
  const gridRef = useRef(null);       // ✅ Ref to the grid that lays out cards in columns
  const cardWidthRef = useRef(0);     // ✅ Cached measured width (card + gap)
  const initRef = useRef(false);      // ✅ Guard to avoid re-running initial scroll logic
  const [initialized, setInitialized] = useState(false); // ✅ Hide content until we position it once

  // Track an in-progress animation so we can cancel instantly (prevents stutter if user clicks quickly)
  const animRef = useRef({ raf: 0, cancel: false });

  // ======= CLONE LOGIC (for seamless infinite carousel) =======
  // We append a small number of items to both ends (head/tail) so when we cross edges we “jump” invisibly.
  // Fewer clones = smaller DOM footprint while preserving seamless UX.
  const CLONES = useMemo(() => {
    if (!items.length) return 0;
    // Cap clones to 2 to prevent DOM bloat; looks/behaves the same for users.
    // For very small item counts we still ensure 1 clone minimum.
    const n = Math.max(1, Math.floor(items.length / 4) || 1);
    return Math.min(2, n);
  }, [items.length]);

  // ======= EXTENDED ARRAY WITH CLONES =======
  // extended = [...tail clones, ...items, ...head clones]
  const extended = useMemo(() => {
    if (items.length === 0) return [];
    const head = items.slice(0, CLONES);
    const tail = items.slice(-CLONES);
    return [...tail, ...items, ...head];
  }, [items, CLONES]);

  // The “real” starting index points at the first actual item (after left-side clones)
  const START_INDEX = useMemo(() => (items.length ? CLONES : 0), [items.length, CLONES]);
  const [index, setIndex] = useState(START_INDEX); // ✅ Current logical index in the extended list

  /**
   * measureCardWidth()
   * - Calculates the width of a card + the grid gap (in px) using the first rendered card.
   * - If DOM is not ready, falls back to the props (cardWidth + gap).
   */
  const measureCardWidth = () => {
    const grid = gridRef.current;
    if (!grid) return 0;
    // Find a child with data-card attribute (set below when rendering cards):
    const first = grid.querySelector("div[data-card]");
    if (!first) return 0;
    const rect = first.getBoundingClientRect();
    const styles = getComputedStyle(grid);
    const gapPx = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return rect.width + gapPx;
  };

  // ======= INITIAL POSITION (BEFORE FIRST PAINT) =======
  // We place the scroller at the START_INDEX so that left/right scrolls seamlessly.
  // useLayoutEffect triggers before paint → avoids visible jump.
  useLayoutEffect(() => {
    if (initRef.current || extended.length === 0) return;
    const el = scrollerRef.current;
    if (!el) return;

    const w = measureCardWidth() || cardWidth + gap;   // ✅ If measurement fails, use props
    cardWidthRef.current = w;

    setIndex(START_INDEX);
    // Temporarily disable smooth scroll to set an immediate position (no flicker)
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = START_INDEX * w; // ✅ Set initial scrollLeft in pixels
    el.style.scrollBehavior = prev || "";

    initRef.current = true;
    setInitialized(true); // ✅ Reveal content once positioned
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [START_INDEX, extended.length]);

  // ======= KEEP INDEX POSITION ON RESIZE =======
  // If the viewport changes, card width (or gap) may change → we recompute and keep the same index centered.
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
        el.scrollLeft = index * newW; // ✅ Maintain logical index’s pixel position
        el.style.scrollBehavior = prev || "";
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, [index, cardWidth, gap]);

  /**
   * jumpWithoutAnim(targetIndex)
   * - Immediately jump to a target index (used after we hit a clone edge).
   * - Smooth animation is DISABLED for the jump to make it invisible to users.
   */
  const jumpWithoutAnim = (targetIndex) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = cardWidthRef.current || measureCardWidth() || cardWidth + gap;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = targetIndex * w;
    el.style.scrollBehavior = prev || "";
  };

  /**
   * animateScrollTo
   * - Smoothly animates from current scrollLeft to targetLeft over 'duration' ms.
   * - Easing: easeOutCubic
   * - Cancels any previous RAF if user clicks repeatedly.
   */
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
    const ease = (t) => 1 - Math.pow(1 - t, 3); // ✅ easeOutCubic

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

  /**
   * scrollByOneCard(dir)
   * - dir = +1 (next) or -1 (previous)
   * - Moves by exactly one card width (including gap), then checks if we crossed into clones.
   * - If we crossed, it jumps to the equivalent real index to keep the illusion of infinite scroll.
   */
  const scrollByOneCard = (dir) => {
    const el = scrollerRef.current;
    if (!el || extended.length === 0) return;

    const w = cardWidthRef.current || measureCardWidth() || cardWidth + gap;
    const next = index + dir;

    setIndex(next);
    animateScrollTo(el, next * w, Math.max(100, animationMs), () => {
      if (next < CLONES) {
        // ✅ We scrolled into the left-side clones: jump forward by items.length
        const newIndex = next + items.length;
        setIndex(newIndex);
        jumpWithoutAnim(newIndex);
      } else if (next >= CLONES + items.length) {
        // ✅ We scrolled past the right-side clones: jump back by items.length
        const newIndex = next - items.length;
        setIndex(newIndex);
        jumpWithoutAnim(newIndex);
      }
    });
  };

  return (
    // ======= OUTER SECTION WRAPPER =======
    <section
      className="relative z-0 max-w-[1366px] mx-auto px-0 md:px-0 my-10 overflow-x-clip"
      /**
       * LAYOUT / WIDTH / RESPONSIVE:
       * - max-w-[1366px]: ✅ Overall max width of the section. Increase/decrease for wider/narrower layout.
       * - mx-auto: ✅ Centers the section horizontally.
       * - my-10: ✅ Vertical margin (top/bottom). Change to my-6/my-16 as needed.
       * - px-0 md:px-0: ✅ Horizontal padding is 0 on mobile and desktop (you can add px-4, md:px-8, etc.).
       * - overflow-x-clip: ✅ Prevents horizontal scrollbars and clips overflow.
       *
       * MOBILE (starts here): Tailwind is mobile-first. Classes without breakpoint apply to mobile.
       * DESKTOP: Classes prefixed with md: apply at ≥768px.
       */
    >
      {/* ======= TITLE / HEADING ======= */}
      <h2
        className="mb-8 text-center text-3xl font-semibold text-gray-800"
        /**
         * TEXT STYLES:
         * - text-3xl: ✅ Font size. For mobile smaller, change to text-2xl; for bigger desktop, add md:text-4xl.
         * - font-semibold: ✅ Weight. Use font-bold for heavier.
         * - text-gray-800: ✅ Color. Swap to text-slate-900, etc.
         * - mb-8: ✅ Space below heading. Adjust for tighter/looser spacing.
         * - text-center: ✅ Center-aligned title.
         *
         * CHANGE TITLE TEXT ITSELF:
         * - Controlled by the 'title' prop above (default: "Teachers love these").
         */
      >
        {title}
      </h2>

      <div className="relative">
        {/* ======= OVERLAY ARROW BUTTONS (Prev/Next) ======= */}
        <div
          className="pointer-events-none absolute top-1/3 left-0 right-0 flex justify-between px-2 z-10"
          /**
           * POSITIONING:
           * - absolute + left-0 right-0: ✅ Stretch overlay across width of carousel.
           * - top-1/3: ✅ Vertical position (approx one third from the top). Change to top-1/2 for centered.
           * - flex justify-between: ✅ Space buttons to left/right edges.
           * - px-2: ✅ Horizontal padding inside overlay.
           * - z-10: ✅ Ensure buttons float above cards.
           */
        >
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByOneCard(-1)} // ✅ Click → move one card left
            className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-[#9500DE] text-white shadow-lg hover:bg-[#7c00b9] focus:outline-none focus:ring-2 focus:ring-[#9500DE]/30"
            /**
             * BUTTON SIZE / SHAPE / COLOR:
             * - w-8 h-8: ✅ Button size. Increase to w-10 h-10 for larger hit area (good for mobile).
             * - rounded-full: ✅ Circular button.
             * - bg-[#9500DE]: ✅ Primary background color. Replace hex for brand color.
             * - hover:bg-[#7c00b9]: ✅ Hover color on desktop.
             * - text-white: ✅ Icon color.
             * - shadow-lg: ✅ Elevation. Remove if you want flat design.
             * - focus:ring-2 focus:ring-[#9500DE]/30: ✅ Accessibility focus styles.
             *
             * MOBILE: You can wrap size classes with responsive utilities (e.g., md:w-10 md:h-10) for larger desktop buttons.
             */
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              {/* Icon size controlled by width/height props above; change to 24 for bigger chevrons */}
              <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByOneCard(1)} // ✅ Click → move one card right
            className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-[#9500DE] text-white shadow hover:bg-[#7c00b9] focus:outline-none focus:ring-2 focus:ring-[#9500DE]/30"
            /**
             * Same styling considerations as the Previous button.
             * Tip: Synchronize both buttons’ sizes for consistent UX across mobile & desktop.
             */
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>

        {/* ======= SCROLLER (HORIZONTAL) ======= */}
        <div
          ref={scrollerRef}
          className={`no-scrollbar ${initialized ? "" : "invisible"}`}
          style={{
            overflowX: "hidden",               // ✅ Hide native horizontal scrollbar
            willChange: "scroll-position",     // ✅ Hint for smoother scroll/animation
          }}
          /**
           * VISIBILITY:
           * - Starts as "invisible" until we've positioned to START_INDEX once; prevents initial jump flash.
           *
           * SCROLL BEHAVIOR:
           * - overflowX: hidden keeps the layout clean; we animate scrollLeft manually via JS.
           *
           * MOBILE:
           * - Nothing special required here; if you want touch-drag, you can allow overflowX: auto (and remove our JS).
           */
        >
          {/* ======= GRID OF CARDS (FLOWING HORIZONTALLY) ======= */}
          <div
            ref={gridRef}
            style={{
              // ✅ These CSS variables reflect component props; adjust props at the top to change global sizes.
              ["--card-w"]: `${cardWidth}px`,  // width per card column
              ["--card-h"]: `${cardHeight}px`, // height passed into PresentationCard via prop
              ["--card-gap"]: `${gap}px`,      // gap between columns
              ["--left-pad"]: `${leftPad}px`,  // left padding
              ["--right-pad"]: peekRight ? "0px" : `${leftPad}px`, // reduce right padding to “peek” next card
            }}
            className={`
              grid grid-flow-col pb-2
              gap-[var(--card-gap)]
              [grid-auto-columns:var(--card-w)]
              pl-[var(--left-pad)] pr-[var(--right-pad)]
            `}
            /**
             * LAYOUT:
             * - grid-flow-col: ✅ Adds a grid column for each card across the horizontal axis.
             * - [grid-auto-columns:var(--card-w)]: ✅ Each column width equals --card-w.
             * - gap-[var(--card-gap)]: ✅ Space between columns.
             * - pb-2: ✅ Bottom padding (change for more/less space under cards).
             * - pl/pr: ✅ Left/right padding control; see CSS variables above.
             *
             * CHANGE CARD SIZE:
             * - Prefer changing the props (cardWidth/cardHeight) so grid + card content stay in sync.
             *
             * MOBILE:
             * - If you need smaller card width/height on mobile, you can:
             *   A) Pass different props based on viewport OR
             *   B) Replace CSS variables with responsive Tailwind classes (e.g., sm:[grid-auto-columns:280px] md:[grid-auto-columns:320px]).
             */
          >
            {extended.map((it, i) => (
              <div data-card key={`${it.id || it.slug || i}-${i}`}>
                {/* 
                  ✅ Each card wrapper. Use data-card for measuring width.
                  HEIGHT CONTROL:
                  - The PresentationCard receives cardHeight={cardHeight}. Inspect that component to control internal content (image/text sizes).
                */}
                <PresentationCard p={it} cardHeight={cardHeight} />
              </div>
            ))}
          </div>
        </div>

        {/* ======= CALL TO ACTION (CTA) BUTTON UNDER CAROUSEL ======= */}
        {showCTA && (
          <div className="mt-12 text-center">
            <Link
              href={ctaHref} // ✅ Where the CTA goes (change prop above)
              className="rounded-full bg-[#9500DE] px-8 py-3 text-white hover:bg-[#7c00b9]"
              /**
               * CTA STYLING:
               * - rounded-full: ✅ Pill-shaped button
               * - bg-[#9500DE] / hover:bg...: ✅ Button color
               * - px-8 py-3: ✅ Button padding (increase for a larger button)
               * - text-white: ✅ Label color
               *
               * TEXT:
               * - Controlled by {ctaLabel} below.
               *
               * MOBILE:
               * - Add responsive sizing if desired: e.g., md:px-10 md:py-4 for larger desktop.
               */
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TeacherSectionClient); // ✅ memo: avoids re-renders when props don’t change
