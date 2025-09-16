"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PresentationCard from "@/components/PresentationCard";
import Paginator from "@/components/Paginator";
import FilterPopup from "@/components/FilterPopup";

/* --------------------- helpers ---------------------
 * Utility functions for URL parsing, state comparison, caching keys, etc.
 * You rarely need to change these unless you add new filters or query params.
 */
function getAll(sp, key) {
  // ✅ Safely read multiple values from URLSearchParams (e.g., ?topics=a&topics=b)
  if (!sp) return [];
  if (typeof sp.getAll === "function") return sp.getAll(key);
  const v = sp.get?.(key);
  if (!v) return [];
  return Array.isArray(v) ? v : String(v).split(",").filter(Boolean);
}

function buildURLFromState({ q, page, filters }) {
  // ✅ Build the querystring from current state (used to keep URL in sync with UI)
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page || 1));
  const pushArray = (key, arr) => (arr || []).forEach((v) => v && params.append(key, v));
  pushArray("subjects", filters.subjects);
  pushArray("grades", filters.grades);
  pushArray("topics", filters.topics);
  pushArray("sub_topics", filters.sub_topics);
  return params.toString();
}

function sameSearch(nextQs) {
  // ✅ Avoid redundant router.replace if the URL is already identical
  if (typeof window === "undefined") return false;
  const current = window.location.search.replace(/^\?/, "");
  return current === nextQs;
}

function eqArr(a = [], b = []) {
  // ✅ Order-insensitive array equality check (for filters)
  const A = [...a].sort();
  const B = [...b].sort();
  return A.length === B.length && A.every((v, i) => v === B[i]);
}

function makeCacheKey(q, filters, page, seed) {
  // ✅ Cache key: includes query, filters, page, and seed (seed affects randomized results)
  const s = (arr) => (arr || []).slice().sort().join(",");
  return [
    seed || "",
    q || "",
    `subj:${s(filters.subjects)}`,
    `grade:${s(filters.grades)}`,
    `topic:${s(filters.topics)}`,
    `subtopic:${s(filters.sub_topics)}`,
    `p:${page || 1}`,
  ].join("|");
}

/* --------------------- NEW: small helper for pretty pills ---------------------
 * Creates a compact list of up to N items to show as nice little badges.
 * If there are more than N, we append “+X”.
 */
function compressList(arr = [], maxShow = 3) {
  const a = (arr || []).filter(Boolean);
  if (a.length <= maxShow) return a;
  const head = a.slice(0, maxShow);
  return [...head, `+${a.length - maxShow} more`];
}

/* ----------------------------------------------------------------------------- */

/* --------------------- tune UX here ---------------------
 * INACTIVITY_MS: debounce wait before firing a search after typing stops.
 * PAGE_SIZE: items per page (also sent to API).
 * 👉 If you change PAGE_SIZE, update server and paginator accordingly.
 */
const INACTIVITY_MS = 2000; // ✅ Waits ~2 seconds after user stops typing before searching
const PAGE_SIZE = 12;       // ✅ Grid uses sm:2 cols, lg:3 cols → 12 keeps rows balanced

/* --------------------- component --------------------- */
export default function ExploreClient({ initial, initialQuery, seed }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ====== Core state ======
  const [data, setData] = useState(initial);          // ✅ Results payload (items + total)
  const [q, setQ] = useState(initialQuery || "");     // ✅ Search input value (controlled)
  const [page, setPage] = useState(1);                // ✅ Current page (1-based)

  // ✅ Active filters (last applied)
  const [lastFilters, setLastFilters] = useState({
    subjects: [],
    grades: [],
    topics: [],
    sub_topics: [],
  });

  // ✅ Filter popup toggle
  const [showFilters, setShowFilters] = useState(false);

  // ====== Loading flags (used for skeletons/transitions) ======
  const [loading, setLoading] = useState(false);         // ✅ Hard loading (new fetch)
  const [softLoading, setSoftLoading] = useState(false); // ✅ Soft loading (page change)
  const [typing, setTyping] = useState(false);           // ✅ User is typing (shows tiny loader)
  const [isPending, startTransition] = useTransition();  // ✅ React concurrent transition (smooth state updates)

  // ====== Refs for abort/debounce/compose/caching ======
  const abortRef = useRef(null);       // ✅ AbortController for in-flight fetch
  const debounceRef = useRef(null);    // ✅ Debounce timer
  const reqIdRef = useRef(0);          // ✅ Request id to ignore stale responses
  const composingRef = useRef(false);  // ✅ IME composition guard (for languages needing composition)

  const lastSearchedQueryRef = useRef(q); // ✅ Last query actually sent to server
  const pendingQueryRef = useRef(q);      // ✅ Latest input value waiting for debounce
  const lastCompletedQueryRef = useRef(initialQuery || ""); // ✅ Last query that fully finished

  // ✅ Simple in-memory cache per-session (query+filters+page+seed → results)
  const cacheRef = useRef(new Map());
  const putCache = (key, value) => cacheRef.current.set(key, value);
  const getCache = (key) => cacheRef.current.get(key);

  // ✅ Track if user initiated the action (vs initial URL sync) to decide prefetching neighbors
  const userInteractedRef = useRef(false);

  // ✅ Parse default filters from the URL (for first render or when popup opens without previous filters)
  const urlDefaults = useMemo(() => {
    const sp = searchParams;
    return {
      subjects: getAll(sp, "subjects"),
      grades: getAll(sp, "grades"),
      topics: getAll(sp, "topics"),
      sub_topics: getAll(sp, "sub_topics"),
    };
  }, [searchParams]);

  // ✅ Reset from SSR payload when it changes (e.g., navigation)
  useEffect(() => {
    setData(initial);
    lastSearchedQueryRef.current = initialQuery || "";
    lastCompletedQueryRef.current = initialQuery || "";
  }, [initial, initialQuery]);

  // ✅ Cleanup on unmount (abort fetch / clear timers)
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /**
   * scheduleDebounced
   * - Called on input change: waits INACTIVITY_MS then runs a search unless user keeps typing.
   * - Resets to page 1 if query string changed.
   */
  function scheduleDebounced(nextQ, nextPage = 1, filters = lastFilters) {
    pendingQueryRef.current = nextQ;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setTyping(true);

    debounceRef.current = setTimeout(() => {
      setTyping(false);
      const finalQ = pendingQueryRef.current.trim();

      // ✅ Skip if nothing actually changed (query/page/filters)
      if (
        finalQ === lastSearchedQueryRef.current &&
        nextPage === page &&
        eqArr(filters.subjects, lastFilters.subjects) &&
        eqArr(filters.grades, lastFilters.grades) &&
        eqArr(filters.topics, lastFilters.topics) &&
        eqArr(filters.sub_topics, lastFilters.sub_topics)
      ) {
        return;
      }

      const shouldResetPage = finalQ !== lastSearchedQueryRef.current;
      const effPage = shouldResetPage ? 1 : nextPage;

      userInteractedRef.current = true;
      runSearch({ q: finalQ, page: effPage, filters, mode: "debounced" });
    }, INACTIVITY_MS);
  }

  /**
   * runSearch
   * - Core fetcher. Handles cache, aborting stale requests, URL updates, and loading states.
   * - mode: "debounced" | "enter" | "blur" | "page" | "filter" | "url" | "other"
   */
  async function runSearch(opts = {}, trigger = "other") {
    const nextQ = (opts.q ?? q).trim();
    const nextPage = opts.page ?? page;
    const filters = opts.filters ?? lastFilters;
    const mode = opts.mode ?? trigger;

    // ✅ Clear pending debounce & typing
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setTyping(false);

    // ✅ Use cached results when possible (especially for back/forward URL changes)
    const cacheKey = makeCacheKey(nextQ, filters, nextPage, seed);
    const cached = getCache(cacheKey);

    if (mode === "url" && cached) {
      startTransition(() => {
        setPage(nextPage);
        setData(cached);
        const qs = buildURLFromState({ q: nextQ, page: nextPage, filters });
        if (!sameSearch(qs)) router.replace(`/explore-library?${qs}`, { scroll: false });
      });
      return;
    }

    // ✅ Abort previous request (if any)
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myReqId = ++reqIdRef.current;

    // ✅ Choose loading style
    const isPageNav = mode === "page";
    if (mode === "url") {
      setSoftLoading(false);
      setLoading(false);
    } else if (isPageNav) {
      setSoftLoading(true);
      setLoading(false);
    } else {
      setSoftLoading(false);
      setLoading(true);
    }

    // ✅ Update page & URL immediately (optimistic)
    startTransition(() => {
      setPage(nextPage);
      const qs = buildURLFromState({ q: nextQ, page: nextPage, filters });
      if (!sameSearch(qs)) router.replace(`/explore-library?${qs}`, { scroll: false });
      if (cached) setData(cached); // show cache while fetching fresh
    });

    try {
      lastSearchedQueryRef.current = nextQ;

      // ✅ Server search API
      const res = await fetch("/api/presentations/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          q: nextQ,
          page: nextPage,
          pageSize: PAGE_SIZE,
          ...filters,
          seed, // keep the seed so responses are consistent for this session
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // ✅ Ignore stale responses (if a newer request started)
      if (reqIdRef.current !== myReqId) return;

      // ✅ Cache & set data
      putCache(cacheKey, json);
      startTransition(() => {
        setData(json);
      });

      // ✅ Mark the query as fully completed (used to show the clear × only after results)
      lastCompletedQueryRef.current = nextQ;

      // ✅ Prefetch neighbor pages for snappier pagination
      if (mode !== "url" && userInteractedRef.current) {
        prefetchNeighbors(nextQ, filters, nextPage, json?.total || 0);
      }
    } catch (e) {
      // optional: console.error(e);
    } finally {
      if (reqIdRef.current === myReqId) {
        setLoading(false);
        setSoftLoading(false);
      }
    }
  }

  /**
   * prefetchNeighbors
   * - Preloads prev/next page (if exists) into cache after successful search.
   * - Makes page clicks feel instant.
   */
  async function prefetchNeighbors(qVal, filters, currentPage, total) {
    const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
    const neighbors = [currentPage - 1, currentPage + 1].filter((p) => p >= 1 && p <= totalPages);
    await Promise.all(
      neighbors.map(async (p) => {
        const key = makeCacheKey(qVal, filters, p, seed);
        if (getCache(key)) return;
        try {
          const res = await fetch("/api/presentations/search", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              q: qVal.trim(),
              page: p,
              pageSize: PAGE_SIZE,
              ...filters,
              seed,
            }),
            cache: "no-store",
          });
          if (res.ok) {
            const json = await res.json();
            putCache(key, json);
          }
        } catch {
          /* ignore prefetch errors */
        }
      })
    );
  }

  /**
   * onApply (Filters)
   * - Called by FilterPopup when user clicks "Apply".
   * - Clears cache (since filters changed), closes popup, runs search at page 1.
   */
  function onApply(filters) {
    userInteractedRef.current = true;
    cacheRef.current = new Map();        // ✅ clear page cache when filters change
    setLastFilters(filters);
    setShowFilters(false);
    runSearch({ q: pendingQueryRef.current.trim(), page: 1, filters, mode: "filter" });
  }

  // ===== First load & URL changes (browser back/forward) =====
  const firstLoadRef = useRef(true);
  useEffect(() => {
    const sp = searchParams;
    const urlQ = sp.get("q") || "";

    // Read the URL page, but ignore it on first load to ensure page 1 + fresh seed
    const urlPageRaw = Number(sp.get("page") || 1);
    const urlPage = firstLoadRef.current ? 1 : urlPageRaw;

    const filtersFromUrl = {
      subjects: getAll(sp, "subjects"),
      grades: getAll(sp, "grades"),
      topics: getAll(sp, "topics"),
      sub_topics: getAll(sp, "sub_topics"),
    };

    if (firstLoadRef.current) {
      // ✅ Hydrate from SSR payload on first client render
      firstLoadRef.current = false;

      setQ(urlQ);
      pendingQueryRef.current = urlQ;
      lastSearchedQueryRef.current = urlQ;
      lastCompletedQueryRef.current = urlQ;
      setPage(urlPage);
      setLastFilters(filtersFromUrl);

      const initialKey = makeCacheKey(urlQ, filtersFromUrl, urlPage, seed);
      putCache(initialKey, initial);
      setData(initial);
      return;
    }

    // ✅ For subsequent URL changes, decide whether to fetch or use cache
    const ck = makeCacheKey(urlQ, filtersFromUrl, urlPage, seed);
    const cached = getCache(ck);

    const needsFetch =
      !cached && (
        urlQ !== lastSearchedQueryRef.current ||
        urlPage !== page ||
        !eqArr(filtersFromUrl.subjects, lastFilters.subjects) ||
        !eqArr(filtersFromUrl.grades, lastFilters.grades) ||
        !eqArr(filtersFromUrl.topics, lastFilters.topics) ||
        !eqArr(filtersFromUrl.sub_topics, lastFilters.sub_topics)
      );

    setQ(urlQ);
    pendingQueryRef.current = urlQ;
    setLastFilters(filtersFromUrl);
    if (cached) setData(cached);

    if (needsFetch) {
      runSearch({ q: urlQ, page: urlPage, filters: filtersFromUrl, mode: "url" });
    } else {
      setPage(urlPage);
    }
  }, [searchParams]);

  // ===== Small inline components for loaders =====
  const EqualizerLoader = () => (
    <div className="flex items-end gap-1 h-5" aria-label="Loading">
      <span className="eqbar" style={{ animationDelay: "0ms" }} />
      <span className="eqbar" style={{ animationDelay: "120ms" }} />
      <span className="eqbar" style={{ animationDelay: "240ms" }} />
      <span className="eqbar" style={{ animationDelay: "360ms" }} />
      <style jsx>{`
        /* ✅ Equalizer mini loader (right side of search input while typing) */
        .eqbar { display:inline-block; width:4px; height:6px; border-radius:9999px; background:#6b21a8; animation:eqPulse 900ms ease-in-out infinite; }
        @keyframes eqPulse { 0%,100%{height:6px; opacity:0.6;} 50%{height:18px; opacity:1;} }
      `}</style>
    </div>
  );

  const SkeletonGrid = ({ count = 6 }) => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border shadow-sm p-3">
          <div className="aspect-video bg-gray-200 animate-pulse rounded mb-2" />
          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2 mb-1" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
        </div>
      ))}
    </div>
  );

  // ===== UI state combining loaders and transitions =====
  const isBusy = loading || isPending;
  const showTypingLoader = typing && !loading;
  const gridClass = softLoading ? "opacity-70 transition-opacity" : "";

  // ✅ Show clear button only after a search finished for the current text
  const showClearButton =
    !showTypingLoader &&
    !loading &&
    !!q &&
    q.trim() === (lastCompletedQueryRef.current || "").trim();

  /* --------------------- derive banner text + badges --------------------- */
  const completedQuery = (lastCompletedQueryRef.current || "").trim();
  const hasSearch = completedQuery.length > 0;
  const hasFilters =
    (lastFilters?.subjects?.length || 0) +
    (lastFilters?.grades?.length || 0) +
    (lastFilters?.topics?.length || 0) +
    (lastFilters?.sub_topics?.length || 0) > 0;

  let bannerTitle = "";
  if (hasSearch && hasFilters) {
    bannerTitle = `Results for “${completedQuery}” with filters applied`;
  } else if (hasSearch) {
    bannerTitle = `Search results for “${completedQuery}”`;
  } else if (hasFilters) {
    bannerTitle = `Filtered results`;
  }

  // -------- NEW/CHANGED: totals & range --------
  const itemsOnPage = Array.isArray(data?.items) ? data.items.length : 0;
  const totalMatches = Number.isFinite(data?.total) ? data.total : itemsOnPage;
  const startIdx = totalMatches === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = totalMatches === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + itemsOnPage, totalMatches);
  const totalPages = Math.max(1, Math.ceil((totalMatches || 0) / PAGE_SIZE));
  /* ------------------------------------------------------------------- */

  return (
    <>
      {/* ===== Top controls: search + filter button row ===== */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="relative w-[90%] sm:w-[320px] md:w-[420px]">
          <input
            value={q}
            onChange={(e) => {
              const val = e.target.value;
              setQ(val);
              if (composingRef.current) return;
              cacheRef.current = new Map();
              scheduleDebounced(val, 1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !composingRef.current) {
                // ✅ Immediate search on Enter
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setTyping(false);
                cacheRef.current = new Map();
                userInteractedRef.current = true;
                runSearch({ q: e.currentTarget.value.trim(), page: 1, mode: "enter" });
              }
            }}
            onBlur={(e) => {
              // ✅ If user leaves input mid-typing, commit a search
              if (typing && !composingRef.current) {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setTyping(false);
                cacheRef.current = new Map();
                userInteractedRef.current = true;
                runSearch({ q: e.currentTarget.value.trim(), page: 1, mode: "blur" });
              }
            }}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={(e) => {
              // ✅ IME end → then debounce
              composingRef.current = false;
              const val = e.currentTarget.value;
              setQ(val);
              cacheRef.current = new Map();
              userInteractedRef.current = true;
              scheduleDebounced(val, 1);
            }}
            placeholder="Search in Library"
            className="w-full py-3 pl-4 pr-12 border-2 border-purple-600 rounded-full outline-none focus:ring-2 focus:ring-purple-300"
          />
          {showTypingLoader ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {/* ✅ Tiny loader while typing */}
              <EqualizerLoader />
            </div>
          ) : showClearButton ? (
            <button
              type="button"
              aria-label="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                // Clear input, cancel debounce, and run fresh search
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setTyping(false);
                composingRef.current = false;
                setQ("");
                pendingQueryRef.current = "";
                cacheRef.current = new Map();
                userInteractedRef.current = true;
                runSearch({ q: "", page: 1, mode: "other" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-purple-50 focus:outline-none"
            >
              {/* × icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 hover:text-gray-700">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a 1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a 1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a 1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a 1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
              </svg>
            </button>
          ) : null}
        </div>

        <button
          onClick={() => {
            setShowFilters(true);
          }}
          className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white"
        >
          Filters
        </button>
      </div>

      {/* ===================== Results Context Banner ===================== */}
      {(hasSearch || hasFilters) && (
        <div className="mx-auto mt-6 w-[90%] sm:w-[680px] md:w-[820px] lg:w-[980px]">
          <div className="flex flex-col gap-2 rounded-2xl border border-purple-200 bg-purple-50/70 px-5 py-4 shadow-sm">
            {/* Title line */}
            <div className="text-lg md:text-xl font-semibold text-purple-900">
              {bannerTitle}
            </div>

            {/* Tiny subline with global count + page slice */}
            <div className="text-sm text-purple-700">
              {totalMatches === 0
                ? "No results"
                : `Page ${page} of ${totalPages} • Showing ${startIdx}–${endIdx} of ${totalMatches} results`}
            </div>

            {/* Filter pills (when filters are present) */}
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {compressList(lastFilters.subjects).map((s, i) => (
                  <span key={`subj-${i}`} className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-purple-900 ring-1 ring-purple-200">
                    {s}
                  </span>
                ))}
                {compressList(lastFilters.grades).map((g, i) => (
                  <span key={`grade-${i}`} className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-purple-900 ring-1 ring-purple-200">
                    {g}
                  </span>
                ))}
                {compressList(lastFilters.topics).map((t, i) => (
                  <span key={`topic-${i}`} className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-purple-900 ring-1 ring-purple-200">
                    {t}
                  </span>
                ))}
                {compressList(lastFilters.sub_topics).map((st, i) => (
                  <span key={`subtopic-${i}`} className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-purple-900 ring-1 ring-purple-200">
                    {st}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* =================== /Results Context Banner ====================== */}

      {/* ===== Results Grid (or Skeleton while busy) ===== */}
      {isBusy && !softLoading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 ${gridClass}`}>
          {(data?.items || []).map((p) => (
            <PresentationCard key={p.id ?? p.slug} p={p} />
          ))}
        </div>
      )}

      {/* ===== Pagination ===== */}
      <Paginator
        page={page}
        total={data?.total || 0}
        pageSize={PAGE_SIZE}
        onChange={(n) => {
          if (n === page) return;
          userInteractedRef.current = true;
          runSearch({ q: pendingQueryRef.current.trim(), page: n, mode: "page", filters: lastFilters }, "page");
        }}
      />

      {/* ===== Filter Popup (modal) ===== */}
      <FilterPopup
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        defaults={
          (lastFilters &&
            (lastFilters.subjects.length ||
              lastFilters.grades.length ||
              lastFilters.topics.length ||
              lastFilters.sub_topics.length))
            ? lastFilters
            : urlDefaults
        }
        onApply={onApply}
      />
    </>
  );
}
