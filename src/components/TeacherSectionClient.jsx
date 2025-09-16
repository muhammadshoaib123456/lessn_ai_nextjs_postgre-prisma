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

function mod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * This version supports a virtually-infinite list backed by server pagination.
 * Props:
 * - total: total rows in DB
 * - seedOffset: where the server seeded the first batch from (random)
 * - pageSize: server page window (same as API limit)
 * - apiHref: route to fetch ?offset=..&limit=..
 * - initial: first batch of items (length <= pageSize)
 */
function TeacherSectionClient({
  // server-provided
  initial = [],
  total = 0,
  seedOffset = 0,
  pageSize = 24,
  apiHref = "/api/presentations/slider",

  title = "Teachers love these",
  showCTA = true,
  ctaHref = "/explore-library",
  ctaLabel = "Explore Lessn Library",

  cardWidth = 320,
  cardHeight = 420,
  gap = 24,
  leftPad = 20,
  peekRight = true,

  animationMs = 160,
}) {
  const scrollerRef = useRef(null);
  const gridRef = useRef(null);
  const cardWidthRef = useRef(0);
  const initRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const animRef = useRef({ raf: 0, cancel: false });
  const [index, setIndex] = useState(0); // logical index in [0..total-1], relative to seedOffset

  // Keep a sliding window of items keyed by absolute index = (seedOffset + i) % total
  // We store them in a Map<number, item>
  const [cache, setCache] = useState(() => {
    const map = new Map();
    for (let i = 0; i < initial.length; i++) {
      const abs = mod(seedOffset + i, Math.max(1, total));
      map.set(abs, initial[i]);
    }
    return map;
  });

  // Window we want to keep in memory: current index ± 2 pages
  const WINDOW_PAGES_BEFORE = 1;
  const WINDOW_PAGES_AFTER = 2;

  const START_INDEX = 0; // we position to the first logical item (already in initial)

  // Helper to measure card column width + gap
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
    if (initRef.current || total === 0) return;
    const el = scrollerRef.current;
    if (!el) return;

    const w = measureCardWidth() || cardWidth + gap;
    cardWidthRef.current = w;

    setIndex(START_INDEX);
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = START_INDEX * w;
    el.style.scrollBehavior = prev || "";

    initRef.current = true;
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // keep pixel position on resize
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

  // Fetch a batch by absolute offset [absOffset .. absOffset+limit)
  const fetchBatch = async (absOffset) => {
    const url = `${apiHref}?offset=${absOffset}&limit=${pageSize}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    // json.items (array), json.offset (abs), json.count
    return json.items || [];
  };

  // Ensure a logical range [iStart..iEnd] (relative to seed) is present in cache
  const ensureRange = async (iStart, iEnd) => {
    if (total === 0) return;
    const missingOffsets = new Set();

    for (let i = iStart; i <= iEnd; i++) {
      const abs = mod(seedOffset + i, total);
      if (!cache.has(abs)) {
        // compute which page contains this abs
        const pageStart = Math.floor(abs / pageSize) * pageSize;
        missingOffsets.add(pageStart);
      }
    }

    if (missingOffsets.size === 0) return;

    const newMap = new Map(cache);
    // fetch in parallel but limit to reasonable number
    const tasks = Array.from(missingOffsets).slice(0, 5).map(async (absStart) => {
      const items = await fetchBatch(absStart);
      for (let j = 0; j < items.length; j++) {
        const abs = mod(absStart + j, total);
        newMap.set(abs, items[j]);
      }
    });

    await Promise.all(tasks);
    setCache(newMap);
  };

  // Prefetch around current window
  useEffect(() => {
    if (total === 0) return;
    const start = Math.max(0, index - WINDOW_PAGES_BEFORE * pageSize);
    const end = Math.min(total - 1, index + WINDOW_PAGES_AFTER * pageSize);
    // fire & forget
    void ensureRange(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total, pageSize]);

  // Build the currently rendered strip: we render only a “visible” band (one page worth) centered on index.
  // You can widen this for more offscreen cards.
  const bandSize = pageSize; // visible band
  const bandStart = Math.max(0, index);
  const bandEnd = Math.min(total - 1, bandStart + bandSize - 1);

  const visibleItems = useMemo(() => {
    if (total === 0) return [];
    const out = [];
    for (let i = bandStart; i <= bandEnd; i++) {
      const abs = mod(seedOffset + i, total);
      out.push({ abs, item: cache.get(abs) });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandStart, bandEnd, cache, seedOffset, total]);

  // If an item is missing (not fetched yet), show a lightweight skeleton
  const CardShell = ({ abs, it }) => {
    if (it) {
      return (
        <div data-card>
          <PresentationCard p={it} cardHeight={cardHeight} />
        </div>
      );
    }
    return (
      <div
        data-card
        className="rounded-xl border border-slate-200 bg-slate-50 animate-pulse"
        style={{ height: cardHeight }}
        title={`Loading #${abs}`}
      />
    );
  };

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
    const ease = (t) => 1 - Math.pow(1 - t, 3);

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

  const jumpTo = (newIdx, smooth = true) => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current;
    const w = cardWidthRef.current || measureCardWidth() || cardWidth + gap;

    // Wrap logical index through total
    const wrapped = total ? mod(newIdx, total) : 0;
    setIndex(wrapped);

    const targetLeft = (wrapped - bandStart) * w; // position within the current band
    if (!smooth) {
      const prev = el.style.scrollBehavior;
      el.style.scrollBehavior = "auto";
      el.scrollLeft = targetLeft;
      el.style.scrollBehavior = prev || "";
    } else {
      animateScrollTo(el, targetLeft, Math.max(100, animationMs));
    }
  };

  const scrollByOneCard = (dir) => {
    if (total === 0) return;
    jumpTo(index + dir, true);
  };

  return (
    <section className="relative z-0 max-w-[1366px] mx-auto px-0 md:px-0 my-10 overflow-x-clip">
      <h2 className="mb-8 text-center text-3xl font-semibold text-gray-800">
        {title}
      </h2>

      <div className="relative">
        {/* arrows */}
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
          style={{ overflowX: "hidden", willChange: "scroll-position" }}
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
            {visibleItems.map(({ abs, item }) => (
              <CardShell key={abs} abs={abs} it={item} />
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

export default memo(TeacherSectionClient);
