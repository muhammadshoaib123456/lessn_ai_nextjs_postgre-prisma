"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PresentationCard from "@/components/PresentationCard";
import Paginator from "@/components/Paginator";
import FilterPopup from "@/components/FilterPopup";

/* --------------------- helpers --------------------- */
function getAll(sp, key) {
  if (!sp) return [];
  if (typeof sp.getAll === "function") return sp.getAll(key);
  const v = sp.get?.(key);
  if (!v) return [];
  return Array.isArray(v) ? v : String(v).split(",").filter(Boolean);
}

function buildURLFromState({ q, page, filters }) {
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
  if (typeof window === "undefined") return false;
  const current = window.location.search.replace(/^\?/, "");
  return current === nextQs;
}

function eqArr(a = [], b = []) {
  const A = [...a].sort();
  const B = [...b].sort();
  return A.length === B.length && A.every((v, i) => v === B[i]);
}

function makeCacheKey(q, filters, page) {
  const s = (arr) => (arr || []).slice().sort().join(",");
  return [
    q || "",
    `subj:${s(filters.subjects)}`,
    `grade:${s(filters.grades)}`,
    `topic:${s(filters.topics)}`,
    `subtopic:${s(filters.sub_topics)}`,
    `p:${page || 1}`,
  ].join("|");
}

/* --------------------- tune UX here --------------------- */
const INACTIVITY_MS = 1000; // debounce ONLY for input typing
const PAGE_SIZE = 12;

/* --------------------- component --------------------- */
export default function ExploreClient({ initial, initialQuery }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initial);
  const [q, setQ] = useState(initialQuery || "");
  const [page, setPage] = useState(1);

  const [lastFilters, setLastFilters] = useState({
    subjects: [],
    grades: [],
    topics: [],
    sub_topics: [],
  });

  const [showFilters, setShowFilters] = useState(false);

  // UX flags
  const [loading, setLoading] = useState(false); // full (hard) loader
  const [softLoading, setSoftLoading] = useState(false); // dim cards on page-jumps
  const [typing, setTyping] = useState(false);   // ONLY for input debounce visual
  const [isPending, startTransition] = useTransition();

  // request / debounce control
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const reqIdRef = useRef(0);
  const composingRef = useRef(false);

  // "distinct until changed" guards
  const lastSearchedQueryRef = useRef(q);
  const pendingQueryRef = useRef(q);

  // simple in-memory page cache
  const cacheRef = useRef(new Map()); // key -> { items, total }
  const putCache = (key, value) => cacheRef.current.set(key, value);
  const getCache = (key) => cacheRef.current.get(key);

  // track if user interacted (to enable prefetch only after that)
  const userInteractedRef = useRef(false);

  const urlDefaults = useMemo(() => {
    const sp = searchParams;
    return {
      subjects: getAll(sp, "subjects"),
      grades: getAll(sp, "grades"),
      topics: getAll(sp, "topics"),
      sub_topics: getAll(sp, "sub_topics"),
    };
  }, [searchParams]);

  useEffect(() => {
    setData(initial);
    lastSearchedQueryRef.current = initialQuery || "";
  }, [initial, initialQuery]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /** Debounced trigger — schedules exactly one search after input inactivity */
  function scheduleDebounced(nextQ, nextPage = 1, filters = lastFilters) {
    pendingQueryRef.current = nextQ;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setTyping(true); // show typing loader ONLY for input

    debounceRef.current = setTimeout(() => {
      setTyping(false);

      const finalQ = pendingQueryRef.current.trim();

      // Distinct until changed
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

      // always search page 1 when query text changed
      const shouldResetPage = finalQ !== lastSearchedQueryRef.current;
      const effPage = shouldResetPage ? 1 : nextPage;

      userInteractedRef.current = true; // mark user action
      runSearch({ q: finalQ, page: effPage, filters, mode: "debounced" });
    }, INACTIVITY_MS);
  }

  /**
   * Core search
   * mode:
   * - "page": fast page navigation → optimistic page + soft loader (no debounce)
   * - "filter" / "debounced" / "enter" / "blur": hard loader (no debounce)
   * - "url": **silent** sync → no loader, no prefetch, only fetch if not cached
   */
  async function runSearch(opts = {}, trigger = "other") {
    const nextQ = (opts.q ?? q).trim();
    const nextPage = opts.page ?? page;
    const filters = opts.filters ?? lastFilters;
    const mode = opts.mode ?? trigger;

    // cancel pending input debounce for immediate actions
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setTyping(false);

    const cacheKey = makeCacheKey(nextQ, filters, nextPage);
    const cached = getCache(cacheKey);

    // For URL mode: if we already have cached data, DO NOT fetch again.
    if (mode === "url" && cached) {
      startTransition(() => {
        setPage(nextPage);
        setData(cached);
        const qs = buildURLFromState({ q: nextQ, page: nextPage, filters });
        if (!sameSearch(qs)) router.replace(`/explore-library?${qs}`, { scroll: false });
      });
      return; // <- exit early: no network, no prefetch, no loaders
    }

    // abort in-flight
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myReqId = ++reqIdRef.current;

    const isPageNav = mode === "page";

    // Decide loaders
    if (mode === "url") {
      setSoftLoading(false);
      setLoading(false); // silent
    } else if (isPageNav) {
      setSoftLoading(true);
      setLoading(false);
    } else {
      setSoftLoading(false);
      setLoading(true);
    }

    // Update URL & page immediately
    startTransition(() => {
      setPage(nextPage);
      const qs = buildURLFromState({ q: nextQ, page: nextPage, filters });
      if (!sameSearch(qs)) {
        router.replace(`/explore-library?${qs}`, { scroll: false });
      }
      if (cached) setData(cached);
    });

    try {
      lastSearchedQueryRef.current = nextQ;

      const res = await fetch("/api/presentations/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          q: nextQ,
          page: nextPage,
          pageSize: PAGE_SIZE,
          ...filters,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (reqIdRef.current !== myReqId) return;

      putCache(cacheKey, json);
      startTransition(() => {
        setData(json);
      });

      // Prefetch neighbors ONLY after a user action (not on URL loads)
      if (mode !== "url" && userInteractedRef.current) {
        prefetchNeighbors(nextQ, filters, nextPage, json?.total || 0);
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        // optionally toast/log
      }
    } finally {
      if (reqIdRef.current === myReqId) {
        setLoading(false);
        setSoftLoading(false);
      }
    }
  }

  // Prefetch next/prev pages (if within range and not cached)
  async function prefetchNeighbors(qVal, filters, currentPage, total) {
    const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
    const neighbors = [currentPage - 1, currentPage + 1].filter(
      (p) => p >= 1 && p <= totalPages
    );
    await Promise.all(
      neighbors.map(async (p) => {
        const key = makeCacheKey(qVal, filters, p);
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

  function onApply(filters) {
    userInteractedRef.current = true;
    // clear page-scope cache when filters change (new query space)
    cacheRef.current = new Map();
    setLastFilters(filters);
    setShowFilters(false);
    // immediate search (NO debounce), reset to page 1
    runSearch({ q: pendingQueryRef.current.trim(), page: 1, filters, mode: "filter" });
  }

  // First load & react to URL changes (e.g., back/forward)
  const firstLoadRef = useRef(true);
  useEffect(() => {
    const sp = searchParams;
    const urlQ = sp.get("q") || "";
    const urlPage = Number(sp.get("page") || 1);

    const filtersFromUrl = {
      subjects: getAll(sp, "subjects"),
      grades: getAll(sp, "grades"),
      topics: getAll(sp, "topics"),
      sub_topics: getAll(sp, "sub_topics"),
    };

    if (firstLoadRef.current) {
      firstLoadRef.current = false;

      // seed from URL WITHOUT fetching again
      setQ(urlQ);
      pendingQueryRef.current = urlQ;
      lastSearchedQueryRef.current = urlQ;
      setPage(urlPage);
      setLastFilters(filtersFromUrl);

      const initialKey = makeCacheKey(urlQ, filtersFromUrl, urlPage);
      putCache(initialKey, initial); // seed cache
      setData(initial); // ensure immediate render
      return; // ← important: no network on first mount
    }

    // For subsequent URL changes (e.g., user navigates with back/forward)
    const ck = makeCacheKey(urlQ, filtersFromUrl, urlPage);
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

    // Always reflect URL state in UI
    setQ(urlQ);
    pendingQueryRef.current = urlQ;
    setLastFilters(filtersFromUrl);
    if (cached) setData(cached);

    if (needsFetch) {
      // Silent sync (no loader, no prefetch) and only if not cached
      runSearch({ q: urlQ, page: urlPage, filters: filtersFromUrl, mode: "url" });
    } else {
      // keep page in sync without network
      setPage(urlPage);
    }
  }, [searchParams]);

  const EqualizerLoader = () => (
    <div className="flex items-end gap-1 h-5" aria-label="Loading">
      <span className="eqbar" style={{ animationDelay: "0ms" }} />
      <span className="eqbar" style={{ animationDelay: "120ms" }} />
      <span className="eqbar" style={{ animationDelay: "240ms" }} />
      <span className="eqbar" style={{ animationDelay: "360ms" }} />
      <style jsx>{`
        .eqbar {
          display: inline-block;
          width: 4px;
          height: 6px;
          border-radius: 9999px;
          background: #6b21a8;
          animation: eqPulse 900ms ease-in-out infinite.
        }
        @keyframes eqPulse {
          0%, 100% { height: 6px; opacity: 0.6; }
          50%      { height: 18px; opacity: 1; }
        }
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

  const isBusy = loading || isPending;
  const showTypingLoader = typing && !loading; // typing indicator only while input-debouncing
  const gridClass = softLoading ? "opacity-70 transition-opacity" : "";

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="relative w-[90%] sm:w-[320px] md:w-[420px]">
          <input
            value={q}
            onChange={(e) => {
              const val = e.target.value;
              setQ(val);
              if (composingRef.current) return;
              cacheRef.current = new Map();
              // DEBOUNCE APPLIES ONLY HERE (input search)
              scheduleDebounced(val, 1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !composingRef.current) {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setTyping(false);
                cacheRef.current = new Map();
                userInteractedRef.current = true;
                // immediate search on Enter (NO debounce)
                runSearch({ q: e.currentTarget.value.trim(), page: 1, mode: "enter" });
              }
            }}
            onBlur={(e) => {
              if (typing && !composingRef.current) {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setTyping(false);
                cacheRef.current = new Map();
                userInteractedRef.current = true;
                // immediate search on blur (NO debounce)
                runSearch({ q: e.currentTarget.value.trim(), page: 1, mode: "blur" });
              }
            }}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              const val = e.currentTarget.value;
              setQ(val);
              cacheRef.current = new Map();
              userInteractedRef.current = true;
              // DEBOUNCE for IME-completed input only
              scheduleDebounced(val, 1);
            }}
            placeholder="Search in Library"
            className="w-full py-3 pl-4 pr-12 border-2 border-purple-600 rounded-full outline-none focus:ring-2 focus:ring-purple-300"
          />
          {/* Show the animated typing loader ONLY during input debounce */}
          {showTypingLoader && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <EqualizerLoader />
            </div>
          )}
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white"
        >
          Filters
        </button>
      </div>

      {/* Hard searches show skeleton; page jumps keep content and dim */}
      {isBusy && !softLoading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 ${gridClass}`}>
          {(data?.items || []).map((p) => (
            <PresentationCard key={p.id ?? p.slug} p={p} />
          ))}
        </div>
      )}

      <Paginator
        page={page}
        total={data?.total || 0}
        pageSize={PAGE_SIZE}
        onChange={(n) => {
          if (n === page) return;
          userInteractedRef.current = true;
          // Immediate page change (NO debounce)
          runSearch(
            { q: pendingQueryRef.current.trim(), page: n, mode: "page", filters: lastFilters },
            "page"
          );
        }}
      />

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
