"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PresentationCard from "@/components/PresentationCard";
import Paginator from "@/components/Paginator";
import FilterPopup from "@/components/FilterPopup";

export default function ExploreClient({ initial, initialQuery }) {
  const [data, setData] = useState(initial);
  const [q, setQ] = useState(initialQuery || "");
  const [page, setPage] = useState(1);

  // popup visibility is explicit; starts closed
  const [showFilters, setShowFilters] = useState(false);

  // remember last-applied filters so the popup can reflect them as defaults
  const [lastFilters, setLastFilters] = useState({
    subjects: [],
    grades: [],
    topics: [],
    sub_topics: [],
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const urlDefaults = useMemo(() => {
    // if you ever pass filters via URL, read them here (currently only q/page exist)
    const subjects = [];
    const grades = [];
    // example if you add to URL later:
    // subjects = searchParams.getAll("subject");
    // grades = searchParams.getAll("grade");
    return { subjects, grades, topics: [], sub_topics: [] };
  }, [searchParams]);

  async function runSearch(opts = {}) {
    const nextQ = opts.q ?? q;
    const nextPage = opts.page ?? page;
    const filters = opts.filters ?? lastFilters;

    const res = await fetch("/api/presentations/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        q: nextQ,
        page: nextPage,
        pageSize: 12,
        ...filters,
      }),
    });
    const json = await res.json();
    setData(json);

    // keep URL in sync
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    if (nextQ) p.set("q", nextQ); else p.delete("q");
    p.set("page", String(nextPage));
    router.replace(`/explore-library?${p.toString()}`, { scroll: false });
  }

  function onApply(filters) {
    // apply filters only when user clicks the button in popup
    setLastFilters(filters);
    setShowFilters(false);
    setPage(1);
    runSearch({ page: 1, filters });
  }

  // enter-flow from ?q=...
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    const urlPage = Number(searchParams.get("page") || 1);

    let needsFetch = false;
    if (urlQ && urlQ !== q) {
      setQ(urlQ);
      needsFetch = true;
    }
    if (urlPage !== page) {
      setPage(urlPage);
      needsFetch = true;
    }
    if (needsFetch) runSearch({ q: urlQ, page: urlPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (setPage(1), runSearch({ q: e.currentTarget.value, page: 1 }))
          }
          placeholder='Search in Library (e.g. "eighth grade", "ecosystems")'
          className="w-[90%] sm:w-[320px] md:w-[420px] py-3 px-4 border-2 border-purple-600 rounded-full"
        />
        <button
          onClick={() => runSearch({ q, page: 1 })}
          className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(true)}
          className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white"
        >
          Filters
        </button>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {(data?.items || []).map((p) => (
          <PresentationCard key={p.id} p={p} />
        ))}
      </div>

      {/* Pagination */}
      <Paginator
        page={page}
        total={data?.total || 0}
        pageSize={12}
        onChange={(n) => {
          setPage(n);
          runSearch({ page: n });
        }}
      />

      {/* Controlled popup (starts closed; opens ONLY when user clicks Filters) */}
      <FilterPopup
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        defaults={Object.keys(lastFilters || {}).length ? lastFilters : urlDefaults}
        onApply={onApply}
      />
    </>
  );
}
