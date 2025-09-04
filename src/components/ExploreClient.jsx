"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

// Compare current URL search vs. a next querystring to avoid redundant replaces
function sameSearch(nextQs) {
  if (typeof window === "undefined") return false;
  const current = window.location.search.replace(/^\?/, "");
  return current === nextQs;
}

// Shallow, order-insensitive array equality
function eqArr(a = [], b = []) {
  const A = [...a].sort();
  const B = [...b].sort();
  return A.length === B.length && A.every((v, i) => v === B[i]);
}

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

  // loading = network fetch in progress for input/filter actions
  const [loading, setLoading] = useState(false);
  // typing = show dots only when user is actively typing
  const [typing, setTyping] = useState(false);

  // Prevent stale overwrites & cancel in-flight requests
  const reqIdRef = useRef(0);
  const abortRef = useRef(null);

  // Start suppressed so first mount never triggers input-debounce/dots
  const suppressDebounceRef = useRef(true);

  // For debouncing input
  const debounceRef = useRef(null);

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
  }, [initial]);

  // Allow debouncing after first paint (prevents dots on first navigation)
  useEffect(() => {
    const t = setTimeout(() => {
      suppressDebounceRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Cleanup in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function runSearch(opts = {}, trigger = "other") {
    const nextQ = opts.q ?? q;
    const nextPage = opts.page ?? page;
    const filters = opts.filters ?? lastFilters;

    // cancel previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myReqId = ++reqIdRef.current;

    try {
      if (trigger === "input" || trigger === "filter") setLoading(true);

      const res = await fetch("/api/presentations/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          q: nextQ,
          page: nextPage,
          pageSize: 12,
          ...filters,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (reqIdRef.current !== myReqId) return; // stale
      setData(json);

      const qs = buildURLFromState({ q: nextQ, page: nextPage, filters });
      if (!sameSearch(qs)) {
        router.replace(`/explore-library?${qs}`, { scroll: false });
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        // Optionally show an error banner
        // console.error(e);
      }
    } finally {
      if (reqIdRef.current === myReqId && (trigger === "input" || trigger === "filter")) {
        setLoading(false);
      }
    }
  }

  function onApply(filters) {
    setLastFilters(filters);
    setShowFilters(false);
    if (page !== 1) setPage(1);
    runSearch({ page: 1, filters }, "filter");
  }

  /* -------- Debounced type-to-search: only when user types -------- */
  useEffect(() => {
    if (suppressDebounceRef.current) return; // skip on first mount or URL-driven updates
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (page !== 1) setPage(1);
      runSearch({ q, page: 1 }, "input");
      setTyping(false); // stop dots after we fire the search
    }, 600);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /* -------- React to URL changes AFTER first mount only -------- */
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

    // First mount: hydrate state from URL; do NOT fetch (we already have initial)
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      // keep suppressDebounceRef true here; it will be released by the post-mount effect
      setQ(urlQ);
      setPage(urlPage);
      setLastFilters(filtersFromUrl);
      return;
    }

    // Subsequent URL changes (back/forward, manual edits)
    const needsFetch =
      urlQ !== q ||
      urlPage !== page ||
      !eqArr(filtersFromUrl.subjects, lastFilters.subjects) ||
      !eqArr(filtersFromUrl.grades, lastFilters.grades) ||
      !eqArr(filtersFromUrl.topics, lastFilters.topics) ||
      !eqArr(filtersFromUrl.sub_topics, lastFilters.sub_topics);

    if (needsFetch) {
      // Temporarily suppress input debounce so we don’t double-fire
      suppressDebounceRef.current = true;

      setQ(urlQ);
      setPage(urlPage);
      setLastFilters(filtersFromUrl);

      runSearch({ q: urlQ, page: urlPage, filters: filtersFromUrl }, "url");

      // Re-enable input debounce on next tick
      setTimeout(() => {
        suppressDebounceRef.current = false;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* --------------------- UI helpers --------------------- */
  const DotLoader = () => (
    <div className="flex gap-1 items-center justify-center">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.2s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.1s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
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

  const isBusy = loading;                 // active network request
  const isTyping = typing && !loading;    // user is typing but fetch not fired yet

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="relative w-[90%] sm:w-[320px] md:w-[420px]">
          <input
            value={q}
            onChange={(e) => {
              setTyping(true);             // only show dots on actual typing
              setQ(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (page !== 1) setPage(1);
                runSearch({ q: e.currentTarget.value, page: 1 }, "input");
                setTyping(false);
              }
            }}
            placeholder="Search in Library"
            className="w-full py-3 pl-4 pr-10 border-1 border-purple-600 rounded-full"
          />
          {(isBusy || isTyping) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <DotLoader />
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

      {/* Cards */}
      {isBusy ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {(data?.items || []).map((p) => (
            <PresentationCard key={p.id ?? p.slug} p={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Paginator
        page={page}
        total={data?.total || 0}
        pageSize={12}
        onChange={(n) => {
          if (n === page) return; // no-op
          setPage(n);
          runSearch({ page: n }, "other"); // paginate without loading skeleton
        }}
      />

      {/* Filter popup */}
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
