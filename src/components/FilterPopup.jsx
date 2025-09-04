"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

// helpers
const normalize = (s) => String(s || "").trim();
const keyOf = (s) => normalize(s).toLowerCase();

export default function FilterPopup({ isOpen, onClose, defaults = {}, onApply }) {
  const router = useRouter();

  const [subjects, setSubjects] = useState([]); // [{id,name,count,checked}]
  const [grades, setGrades] = useState([]);     // [{id,name,count,checked}]

  const [topics, setTopics] = useState([]);         // [{id,name,count,checked}]
  const [subTopics, setSubTopics] = useState([]);   // [{id,name,count,checked}]

  const [topicSearch, setTopicSearch] = useState("");
  const [subTopicSearch, setSubTopicSearch] = useState("");

  const selectedTopicNames = useMemo(
    () => topics.filter((t) => t.checked).map((t) => t.name),
    [topics]
  );
  const selectedSubTopicNames = useMemo(
    () => subTopics.filter((s) => s.checked).map((s) => s.name),
    [subTopics]
  );

  // ===== open: hydrate subjects/grades defaults =====
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    const def = typeof defaults === "object" ? defaults : {};
    const defSubjects = new Set((def.subjects || []).map(keyOf));
    const defGrades = new Set((def.grades || []).map(keyOf));

    (async () => {
      try {
        const res = await fetch("/api/meta/filters", { cache: "no-store" });
        const data = await res.json();
        const subj = Array.isArray(data?.subjects) ? data.subjects : [];
        const grad = Array.isArray(data?.grades) ? data.grades : [];
        if (aborted) return;

        setSubjects(
          subj.map((s) => {
            const name = String(s.name || "");
            return {
              id: keyOf(name), // ← stable id
              name,
              count: Number(s.count || 0),
              checked: defSubjects.has(keyOf(name)),
            };
          })
        );

        setGrades(
          grad.map((g) => {
            const name = String(g.name || "");
            return {
              id: keyOf(name), // ← stable id
              name,
              count: Number(g.count || 0),
              checked: defGrades.has(keyOf(name)),
            };
          })
        );
      } catch (e) {
        console.error("FilterPopup: /api/meta/filters failed", e);
      }
    })();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, JSON.stringify(defaults)]);

  // ===== topics (merge selection; stable ids) =====
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    const def = typeof defaults === "object" ? defaults : {};
    const defTopics = new Set([...(def.topics || []), def.topic].filter(Boolean).map(keyOf));

    (async () => {
      try {
        const url = new URL("/api/meta/topics", window.location.origin);
        if (topicSearch.trim()) url.searchParams.set("q", topicSearch.trim());
        const r = await fetch(url.toString(), { cache: "no-store" });
        const arr = (await r.json()) || []; // [{name,count}]
        if (aborted) return;

        setTopics((prev) => {
          const prevChecked = new Map(prev.map((t) => [t.id, t.checked]));
          return arr
            .map((t) => {
              const name = String(t.name || "");
              const id = keyOf(name);
              const checked = defTopics.has(id) || prevChecked.get(id) === true;
              return { id, name, count: Number(t.count || 0), checked };
            })
            .filter((t) => t.name.trim());
        });
      } catch (e) {
        console.warn("FilterPopup: /api/meta/topics failed", e);
        if (!aborted) setTopics((prev) => prev); // keep existing on error
      }
    })();

    return () => {
      aborted = true;
    };
  }, [isOpen, topicSearch, JSON.stringify(defaults)]);

  // ===== subtopics (refetch when selected topics change; merge selection) =====
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    const def = typeof defaults === "object" ? defaults : {};
    const defSubs = new Set([...(def.sub_topics || []), def.subtopic].filter(Boolean).map(keyOf));
    const selected = selectedTopicNames;

    (async () => {
      try {
        const url = new URL("/api/meta/subtopics", window.location.origin);
        if (selected.length) url.searchParams.set("topics", selected.join(","));
        if (subTopicSearch.trim()) url.searchParams.set("q", subTopicSearch.trim());
        const r = await fetch(url.toString(), { cache: "no-store" });
        const arr = (await r.json()) || []; // [{name,count}]
        if (aborted) return;

        setSubTopics((prev) => {
          const prevChecked = new Map(prev.map((s) => [s.id, s.checked]));
          return arr
            .map((s) => {
              const name = String(s.name || "");
              const id = keyOf(name);
              const checked = defSubs.has(id) || prevChecked.get(id) === true;
              return { id, name, count: Number(s.count || 0), checked };
            })
            .filter((s) => s.name.trim());
        });
      } catch (e) {
        console.warn("FilterPopup: /api/meta/subtopics failed", e);
        if (!aborted) setSubTopics((prev) => prev);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [isOpen, JSON.stringify(selectedTopicNames), subTopicSearch, JSON.stringify(defaults)]);

  // ===== body scroll lock (unchanged) =====
  useEffect(() => {
    const body = document.body;
    const lock = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      body.setAttribute("data-scroll-lock-y", String(scrollY));
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      const hasScrollbar = window.innerWidth > document.documentElement.clientWidth;
      if (hasScrollbar) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    };
    const unlock = () => {
      const y = Number(body.getAttribute("data-scroll-lock-y") || "0");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.paddingRight = "";
      body.removeAttribute("data-scroll-lock-y");
      window.scrollTo(0, y);
    };
    if (isOpen) {
      lock();
      return () => unlock();
    } else {
      const t = setTimeout(() => {
        if (document.body.style.position === "fixed") unlock();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ===== helpers =====
  const toggleChecked = (id, type) => {
    if (type === "subject") {
      setSubjects((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
    } else if (type === "grade") {
      setGrades((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
    }
  };

  const toggleTopic = (id) => {
    setTopics((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
  };

  const toggleSubTopic = (id) => {
    setSubTopics((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
  };

  const selectAll = (type) => {
    if (type === "topics") setTopics((prev) => prev.map((it) => ({ ...it, checked: true })));
    if (type === "subtopics") setSubTopics((prev) => prev.map((it) => ({ ...it, checked: true })));
  };

  const clearAll = (type) => {
    if (type === "topics") setTopics((prev) => prev.map((it) => ({ ...it, checked: false })));
    if (type === "subtopics") setSubTopics((prev) => prev.map((it) => ({ ...it, checked: false })));
  };

  const handleApply = () => {
    const selectedSubjects = subjects.filter((s) => s.checked).map((s) => s.name);
    const selectedGrades = grades.filter((g) => g.checked).map((g) => g.name);
    const selectedTopics = selectedTopicNames;
    const selectedSubs = selectedSubTopicNames;

    onApply?.({
      subjects: selectedSubjects,
      grades: selectedGrades,
      topics: selectedTopics,
      sub_topics: selectedSubs,
      // single-value fallbacks (first selected) for backward compatibility
      topic: selectedTopics[0] || "",
      subtopic: selectedSubs[0] || "",
    });
    onClose?.();
  };

  // ===== UI =====
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 bg-white w-[680px] h-[560px] rounded-lg shadow-xl border border-gray-200 flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-purple-700 px-4 py-2 rounded-t-lg">
          <h2 className="text-white text-sm font-semibold">Select Filter</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white text-lg font-bold hover:text-gray-200"
            aria-label="Close filter popup"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 text-xs">
          {/* Subjects */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Subjects</h3>
            <div className="grid grid-cols-3 gap-2">
              {subjects.map((subject) => (
                <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subject.checked}
                    onChange={() => toggleChecked(subject.id, "subject")}
                    className="hidden"
                  />
                  <span
                    className={`w-4 h-4 flex items-center justify-center rounded-sm border text-[10px] ${
                      subject.checked ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-400 text-transparent"
                    }`}
                  >
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.49512 4.5144L4.99512 8.0144L11.9951 1.0144" stroke="white" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <span className="text-gray-700">
                    {subject.name} ({subject.count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <hr />

          {/* Grades */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Grades</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {grades.map((grade) => (
                <label key={grade.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grade.checked}
                    onChange={() => toggleChecked(grade.id, "grade")}
                    className="hidden"
                  />
                  <span
                    className={`w-4 h-4 flex items-center justify-center rounded-sm border text-[10px] ${
                      grade.checked ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-400"
                    }`}
                  >
                    {grade.checked && "✔"}
                  </span>
                  <span className="text-gray-700">
                    {grade.name} ({grade.count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <hr />

          {/* Topics & Sub-Topics */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Topics & Sub-Topics</h3>

            {/* Topics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-700">Topics</div>
                <div className="space-x-2">
                  <button type="button" onClick={() => selectAll("topics")} className="text-purple-700 hover:underline">
                    Select all
                  </button>
                  <button type="button" onClick={() => clearAll("topics")} className="text-gray-600 hover:underline">
                    Clear
                  </button>
                </div>
              </div>

              {/* Search */}
              <input
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics…"
                className="w-full mb-2 border border-gray-300 rounded-md px-2 py-1"
              />

              {/* Chips of selected */}
              {selectedTopicNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedTopicNames.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-purple-100 text-purple-700 border border-purple-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* List */}
              <div className="max-h-32 overflow-auto border border-gray-200 rounded-md p-2">
                {topics.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.checked}
                      onChange={() => toggleTopic(t.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 text-gray-700">{t.name}</span>
                    <span className="text-gray-500">({t.count})</span>
                  </label>
                ))}
                {topics.length === 0 && <div className="text-gray-500 text-xs">No topics found.</div>}
              </div>
            </div>

            {/* Sub-Topics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-700">Sub-Topics</div>
                <div className="space-x-2">
                  <button type="button" onClick={() => selectAll("subtopics")} className="text-purple-700 hover:underline">
                    Select all
                  </button>
                  <button type="button" onClick={() => clearAll("subtopics")} className="text-gray-600 hover:underline">
                    Clear
                  </button>
                </div>
              </div>

              {/* Search */}
              <input
                value={subTopicSearch}
                onChange={(e) => setSubTopicSearch(e.target.value)}
                placeholder="Search sub-topics…"
                className="w-full mb-2 border border-gray-300 rounded-md px-2 py-1"
              />

              {/* Chips of selected */}
              {selectedSubTopicNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedSubTopicNames.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 border border-green-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* List */}
              <div className="max-h-32 overflow-auto border border-gray-200 rounded-md p-2">
                {subTopics.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.checked}
                      onChange={() => toggleSubTopic(s.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 text-gray-700">{s.name}</span>
                    <span className="text-gray-500">({s.count})</span>
                  </label>
                ))}
                {subTopics.length === 0 && (
                  <div className="text-gray-500 text-xs">
                    {selectedTopicNames.length
                      ? "No sub-topics found for selected topics."
                      : "Pick one or more topics to see sub-topics."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 flex justify-center bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-700 to-purple-500 text-white text-sm font-medium hover:opacity-90"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
