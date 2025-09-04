"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PresentationCard from "@/components/PresentationCard";
import Paginator from "@/components/Paginator";
import FilterPopup from "@/components/FilterPopup";

// ---- helpers ----
function getAll(sp, key) {
  if (typeof sp.getAll === "function") return sp.getAll(key);
  const v = sp.get(key);
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
  const [loading, setLoading] = useState(false);

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

  // ========= request guard to prevent stale overwrite =========
  const reqIdRef = useRef(0);
  const abortRef = useRef(null);

  async function runSearch(opts = {}, trigger = "other") {
    const nextQ = opts.q ?? q;
    const nextPage = opts.page ?? page;
    const filters = opts.filters ?? lastFilters;

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
      router.replace(`/explore-library?${qs}`, { scroll: false });
    } catch (e) {
      if (e.name !== "AbortError") {
        // optional: show error banner
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
    setPage(1);
    runSearch({ page: 1, filters }, "filter");
  }

  // ========= Debounced type-to-search (150ms) =========
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      runSearch({ q, page: 1 }, "input");
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // ========= React to URL changes (reads all 4 filters) =========
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

    const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

    let needsFetch = false;

    if (urlQ !== q) { setQ(urlQ); needsFetch = true; }
    if (urlPage !== page) { setPage(urlPage); needsFetch = true; }

    if (
      !arraysEqual(filtersFromUrl.subjects, lastFilters.subjects) ||
      !arraysEqual(filtersFromUrl.grades, lastFilters.grades) ||
      !arraysEqual(filtersFromUrl.topics, lastFilters.topics) ||
      !arraysEqual(filtersFromUrl.sub_topics, lastFilters.sub_topics)
    ) {
      setLastFilters(filtersFromUrl);
      needsFetch = true;
    }

    if (needsFetch) runSearch({ q: urlQ, page: urlPage, filters: filtersFromUrl }, "url");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 3-dot loader (pure CSS/Tailwind)
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

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="relative w-[90%] sm:w-[320px] md:w-[420px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (setPage(1), runSearch({ q: e.currentTarget.value, page: 1 }, "input"))
            }
            placeholder="Search in Library"
            className="w-full py-3 pl-4 pr-10 border-1 border-purple-600 rounded-full"
          />
          {loading && (
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
      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {(data?.items || []).map((p) => (
            <PresentationCard key={p.id || p.slug} p={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Paginator
        page={page}
        total={data?.total || 0}
        pageSize={12}
        onChange={(n) => {
          setPage(n);
          runSearch({ page: n }, "other");
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
