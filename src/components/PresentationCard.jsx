// components/PresentationCard.jsx
"use client"; // ✅ Client component: allows useEffect/useState and DOM APIs

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * extractImgSrc
 * - Accepts either a raw URL string OR an <img ...> HTML string.
 * - Returns the src URL if found; else empty string.
 * WHERE TO CHANGE:
 * - Usually you won't touch this, but if your source stores images differently,
 *   adapt the regex or add more fallbacks.
 */
function extractImgSrc(htmlOrUrl) {
  if (!htmlOrUrl || typeof htmlOrUrl !== "string") return "";
  const s = htmlOrUrl.trim();
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:image/")) return s;
  if (s.startsWith("<img")) {
    const match = s.match(/src\s*=\s*["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }
  return s;
}

/**
 * absolutize
 * - Converts a relative path to an absolute URL using window.location.origin (client-side).
 * - Leaves absolute URLs and data URLs unchanged.
 * WHERE TO CHANGE:
 * - If you serve images from a CDN domain, you could prepend your CDN base here.
 */
function absolutize(urlish) {
  try {
    if (!urlish) return "";
    if (/^(https?:)?\/\//i.test(urlish) || urlish.startsWith("data:image/")) return urlish;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    if (!base) return urlish;
    const path = urlish.startsWith("/") ? urlish : `/${urlish}`;
    return new URL(path, base).toString();
  } catch {
    return urlish;
  }
}

/**
 * PresentationCard
 * - A clickable card that links to /presentations/[slug]
 * - Shows a thumbnail, topic, optional sub_topic, and subject/grade badges.
 *
 * EASY KNOBS:
 * - Overall card height → prop `cardHeight` (default 420). Also used for the image band height.
 * - Borders/shadows/hover color → classes on the outer Link.
 * - Image cropping mode → <img className="... object-cover"> (change to object-contain to letterbox).
 * - Title/subtitle font sizes/colors → classes on <h3> and sub_topic <div>.
 * - Icon sizes → their SVG wrapper classes (w-4 h-4).
 */
export default function PresentationCard({ p, cardHeight }) {
  const [imgOk, setImgOk] = useState(true); // ✅ If image fails to load, we show "No thumbnail"
  const router = useRouter();
  const ref = useRef(null);
  const href = `/presentations/${p?.slug ?? ""}`; // ✅ Destination link

  /**
   * Prefetch the target route when the card first scrolls near the viewport.
   * - IntersectionObserver waits until it’s within ~200px before entering to prefetch.
   * - Improves perceived performance on hover/click.
   */
  useEffect(() => {
    if (!ref.current || !p?.slug) return;
    let obs;
    try {
      obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              router.prefetch(href); // ✅ Next.js route prefetch
              obs.disconnect();
              break;
            }
          }
        },
        { rootMargin: "200px 0px" } // ✅ Prefetch ~200px before the card fully appears
      );
      obs.observe(ref.current);
    } catch {
      // no-op if IO not available (older browsers or SSR)
    }
    return () => {
      try { obs && obs.disconnect(); } catch {}
    };
  }, [router, href, p?.slug]);

  // ===== Guard if bad data =====
  if (!p || typeof p !== "object") {
    return (
      <div
        className="rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden bg-white h-[var(--card-h)] flex flex-col"
        // ℹ️ The height is driven by CSS var --card-h (set on Link in the normal path).
        // Here we're returning early, so this block uses whatever --card-h was on the parent or defaults.
      >
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Invalid card data
        </div>
      </div>
    );
  }

  /**
   * thumbUrl
   * - Tries multiple fields in priority to find a usable thumbnail.
   * - p.thumbnail (string or <img> HTML) → presentation_content (first <img>) → thumbnailUrl → thumbnail_path
   * - Finally absolutize to ensure relative paths are usable.
   * WHERE TO CHANGE:
   * - If your data uses a different field name, add it here.
   */
  const thumbUrl = useMemo(() => {
    let src = extractImgSrc(p.thumbnail);
    if (!src && typeof p.presentation_content === "string") {
      const m = p.presentation_content.match(/<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/i);
      if (m?.[1]) src = m[1];
    }
    if (!src && typeof p.thumbnailUrl === "string") src = extractImgSrc(p.thumbnailUrl);
    if (!src && typeof p.thumbnail_path === "string") src = extractImgSrc(p.thumbnail_path);
    return absolutize(src);
  }, [p?.thumbnail, p?.presentation_content, p?.thumbnailUrl, p?.thumbnail_path]);

  const showImage = imgOk && typeof thumbUrl === "string" && thumbUrl.length > 0;

  /**
   * Image band height:
   * - Uses ~56% of the card height by default; min 120px so tiny cards don’t collapse.
   * - Change 0.56 to tune the ratio (e.g., 0.5 for half card height).
   */
  const imgH = Math.max(120, Math.round((cardHeight || 420) * 0.56));

  // Hover/focus prefetch for snappy UX:
  const prefetch = () => {
    try { router.prefetch(href); } catch {}
  };

  return (
    <Link
      href={href}
      prefetch // ✅ Next.js <Link prefetch> hint (can be controlled by Next)
      ref={ref} // ✅ Used by IntersectionObserver above
      onMouseEnter={prefetch} // ✅ Prefetch on hover
      onFocus={prefetch} // ✅ Prefetch on keyboard focus
      style={{ ["--card-h"]: `${cardHeight || 420}px` }} // ✅ CSS var used below for consistent card height
      className="
        group
        rounded-xl
        border border-gray-300
        shadow-sm
        overflow-hidden
        bg-white
        hover:border-purple-800
        h-[var(--card-h)]
        flex flex-col
      "
      /*
        OUTER CARD STYLES:
        - rounded-xl: corner radius (increase to rounded-2xl for softer corners)
        - border border-gray-300: default border color (change to border-slate-300 or brand)
        - hover:border-purple-800: hover state border color (change for your brand)
        - shadow-sm: subtle elevation (try shadow or shadow-md for more)
        - h-[var(--card-h)]: sets total card height (controlled via prop `cardHeight`)
        - flex flex-col: allow image band + text area to stack vertically
      */
    >
      {/* ===== Image band (fixed height for uniform grid feel) ===== */}
      <div style={{ height: imgH }} className="bg-white">
        {/* 
          HEIGHT CONTROL:
          - Inline style height: imgH (derived from cardHeight)
          - To force a hard-coded height, replace with style={{ height: 240 }}
        */}
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={p.thumbnail_alt_text || p.name || "Presentation thumbnail"}
            className="w-full h-full object-cover p-2"
            loading="lazy"
            onError={() => setImgOk(false)} // ✅ If image fails → show fallback “No thumbnail”
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
            No thumbnail
          </div>
        )}
      </div>

      {/* ===== Text/content area fills the remaining space ===== */}
      <div className="p-4 flex flex-col flex-1 min-h-0">
        {/* 
          p-4: inner padding; increase to p-5 for more breathing room
          flex-1: fill available height
          min-h-0: ensures proper flexbox overflow behavior when clamping text
        */}

        {/* ===== Title / Topic ===== */}
        <h3 className="font-inter line-clamp-2 text-[#334155] font-bold">
          {/*
            TYPOGRAPHY:
            - font-inter: uses Inter (ensure loaded)
            - line-clamp-2: show up to 2 lines, then ellipsis
            - text-[#334155]: title color (slate-ish). Change to text-slate-800 or brand hex
            - font-bold: weight
            SIZE CONTROL:
            - add text-base / text-lg / text-xl, e.g. "text-lg md:text-xl"
          */}
          {p.topic || "Untitled presentation"}
        </h3>

        {/* ===== Subtopic (optional) ===== */}
        {p.sub_topic && (
          <div className="font-inter text-base text-[#334155] mt-1 line-clamp-1">
            {/*
              - text-base: size (use text-sm for smaller)
              - text-[#334155]: color
              - mt-1: small spacing from title
              - line-clamp-1: single line ellipsis
            */}
            {p.sub_topic}
          </div>
        )}

        {/* ===== Subject + Grade row (icons + labels) ===== */}
        <div className="mt-3 flex flex-nowrap items-center gap-5 text-sm text-gray-700 whitespace-nowrap overflow-hidden">
          {/*
            LAYOUT:
            - mt-3: spacing from subtitle
            - flex flex-nowrap: lay icons+labels in a row; prevent wrapping into multiple lines
            - gap-5: space between the two groups (subject | grade)
            - text-sm text-gray-700: default size+color for both labels
            - whitespace-nowrap overflow-hidden: prevent text from pushing card width; clip if too long
            SIZE TWEAK:
            - Use text-xs for smaller badges, or text-base for larger.
          */}

          {/* Subject */}
          <div className="inline-flex items-center gap-2 shrink-0">
            {/* 
              - inline-flex items-center gap-2: icon+text horizontally aligned
              - shrink-0: don't allow this group to shrink below its content width
            */}
            <svg className="w-4 h-4 inline-block align-middle shrink-0" viewBox="0 0 16 17" aria-hidden="true">
              {/* 
                ICON SIZE:
                - w-4 h-4: change to w-5 h-5 for bigger
                COLOR:
                - inherits current text color (text-gray-700). Add className="text-[#9500DE]" to force brand color.
              */}
              <path
                d="M15 11.448V0.947998C15 0.532373 14.6656 0.197998 14.25 0.197998H4C2.34375 0.197998 1 1.54175 1 3.198V13.198C1 14.8542 2.34375 16.198 4 16.198H14.25C14.6656 16.198 15 15.8636 15 15.448V14.948C15 14.7136 14.8906 14.5011 14.7219 14.3636C14.5906 13.8824 14.5906 12.5105 14.7219 12.0292C14.8906 11.8949 15 11.6824 15 11.448ZM5 4.3855C5 4.28237 5.08437 4.198 5.1875 4.198H11.8125C11.9156 4.198 12 4.28237 12 4.3855V5.0105C12 5.11362 11.9156 5.198 11.8125 5.198H5.1875C5.08437 5.198 5 5.11362 5 5.0105V4.3855ZM5 6.3855C5 6.28237 5.08437 6.198 5.1875 6.198H11.8125C11.9156 6.198 12 6.28237 12 6.3855V7.0105C12 7.11362 11.9156 7.198 11.8125 7.198H5.1875C5.08437 7.198 5 7.11362 5 7.0105V6.3855ZM12.9187 14.198H4C3.44688 14.198 3 13.7511 3 13.198C3 12.648 3.45 12.198 4 12.198H12.9187C12.8594 12.7324 12.8594 13.6636 12.9187 14.198Z"
                fill="currentColor"
              />
            </svg>
            <span className="align-middle">{p.subject || "—"}</span>
            {/* 
              TEXT SIZE:
              - inherits from parent text-sm. Change here with className="text-xs" for smaller, etc.
            */}
          </div>

          {/* Grade */}
          <div className="inline-flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4 inline-block align-middle shrink-0" viewBox="0 0 17 17" aria-hidden="true">
              <path
                d="M10.9668 10.019L7.9899 13.0001L5.01295 10.019C2.7818 10.1159 1 11.9439 1 14.2001V14.5001C1 15.3282 1.67091 16 2.49784 16H13.482C14.3089 16 14.9798 15.3282 14.9798 14.5001V14.2001C14.9798 11.9439 13.198 10.1159 10.9668 10.019ZM1.42439 2.49441L1.6241 2.54128V4.36619C1.40566 4.49744 1.24964 4.72555 1.24964 5.00054C1.24964 5.26302 1.39318 5.48176 1.59601 5.61613L1.10922 7.56291C1.05617 7.77853 1.17475 8.00039 1.34637 8.00039H2.65074C2.82237 8.00039 2.94095 7.77853 2.8879 7.56291L2.4011 5.61613C2.60393 5.48176 2.74747 5.26302 2.74747 5.00054C2.74747 4.72555 2.59145 4.49744 2.37302 4.36619V2.72252L4.43254 3.21937C4.16418 3.75685 3.99567 4.35682 3.99567 5.00054C3.99567 7.2098 5.78371 9.00034 7.9899 9.00034C10.1961 9.00034 11.9841 7.2098 11.9841 5.00054C11.9841 4.35682 11.8187 3.75685 11.5473 3.21937L14.5523 2.49441C15.1202 2.35692 15.1202 1.64758 14.5523 1.51008L8.61088 0.0726527C8.20521 -0.0242176 7.77771 -0.0242176 7.37204 0.0726527L1.42439 1.50696C0.859578 1.64445 0.859578 2.35692 1.42439 2.49441Z"
                fill="currentColor"
              />
            </svg>
            <span className="align-middle">{p.grade || "—"}</span>
          </div>
        </div>

        {/* ===== Bottom bar (divider + "View Presentation") ===== */}
        <div className="mt-auto">
          {/* 
            mt-auto: pushes this block to the bottom of the flex column
          */}
          <hr className="my-3 border-gray-300" />
          {/* 
            Divider spacing & color:
            - my-3: top/bottom margin around the <hr>. Change to my-2 or my-4.
            - border-gray-300: divider color
          */}
          <div className="flex justify-center">
            <span className="text-[#000000] font-medium">
              {/* 
                TEXT:
                - "View Presentation" → change label here
                STYLE:
                - text-[#000000]: text color (use text-slate-800 or brand hex)
                - font-medium: weight
                SIZE:
                - add text-sm / text-base / text-lg to adjust
              */}
              View Presentation
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
