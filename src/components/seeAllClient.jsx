"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PresentationCard from "@/components/PresentationCard";

export default function SeeAllClient({ initialQuery = "" }) {
  // Store the search query in a ref to avoid unnecessary effect re-runs
  const qRef = useRef(initialQuery || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Refs to track loading state and current page outside of state (for stable infinite scroll)
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const doneRef = useRef(false);
  const sentinelRef = useRef(null);

  // Compute a relevance score for a given presentation object and query
  const scoreByQuery = (obj, query) => {
    if (!query) return 0;
    const ql = query.toLowerCase();
    const topic = (obj.topic || obj.title || obj.name || "").toLowerCase();
    const subtopic = (obj.sub_topic || obj.subtopic || "").toLowerCase();
    const subject = (obj.subject || "").toLowerCase();
    const grade = (obj.grade || "").toLowerCase();
    const content = String(obj.presentation_content || obj.presentation_html || obj.content || "")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase();

    const hit = (text) => ({
      starts: text.startsWith(ql),
      includes: text.includes(ql),
    });

    let score = 0;
    const t = hit(topic), st = hit(subtopic), sj = hit(subject), gr = hit(grade), ct = hit(content);
    if (t.starts) score = Math.max(score, 100);
    if (t.includes) score = Math.max(score, 80);
    if (st.starts) score = Math.max(score, 75);
    if (st.includes) score = Math.max(score, 65);
    if (sj.starts) score = Math.max(score, 60);
    if (sj.includes) score = Math.max(score, 55);
    if (gr.starts) score = Math.max(score, 50);
    if (gr.includes) score = Math.max(score, 45);
    if (ct.starts) score = Math.max(score, 40);
    if (ct.includes) score = Math.max(score, 35);
    return score;
  };

  // Fetch a page of results from the API and process them
  const loadPage = useCallback(async (page) => {
    if (loadingRef.current || doneRef.current) return;  // Prevent multiple simultaneous fetches
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/presentations/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: qRef.current,
          page: page,
          pageSize: 12,
          subjects: [],
          grades: [],
          topics: [],
          sub_topics: [],
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const fetchedItems = Array.isArray(data?.items) ? data.items : [];

      // Filter out items with no match to the query and sort the rest by relevance
      const relevantItems = fetchedItems
        .map(item => ({ item, score: scoreByQuery(item, qRef.current) }))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(entry => entry.item);

      // Append or set items for this page
      setItems(prev => page === 1 ? relevantItems : [...prev, ...relevantItems]);

      // If we've reached the end of results, mark as done
      const totalResults = data?.total || 0;
      const reachedEnd = relevantItems.length === 0 || page * 12 >= totalResults;
      if (reachedEnd) {
        setDone(true);
        doneRef.current = true;
      }

      pageRef.current = page;
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load on component mount
  useEffect(() => {
    setItems([]);
    setDone(false);
    doneRef.current = false;
    loadingRef.current = false;
    pageRef.current = 1;
    loadPage(1);
  }, [loadPage]);

  // Setup IntersectionObserver for infinite scrolling
  useEffect(() => {
    const sentinelEl = sentinelRef.current;
    if (!sentinelEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current && !doneRef.current) {
          loadPage(pageRef.current + 1);
        }
      },
      { rootMargin: "600px 0px 0px 0px", threshold: 0.01 }
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [loadPage]);

  return (
    <>
      {/* Results grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(p => (
          <PresentationCard key={p.id || p.slug} p={p} />
        ))}
      </div>

      {/* Loader and sentinel element for infinite scroll */}
      <div className="flex items-center justify-center py-6">
        {loading && (
          <div className="flex gap-1 items-center justify-center text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
          </div>
        )}
        {!done && <span ref={sentinelRef} className="block h-2 w-2" />}
        {done && !loading && (
          <div className="text-gray-500 text-sm">You’ve reached the end.</div>
        )}
      </div>
    </>
  );
}
