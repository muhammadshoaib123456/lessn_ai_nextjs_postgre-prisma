"use client";

import React, { useState, useEffect } from "react";

// helper: defensively compare plain names
const normalize = (s) => String(s || "").trim();

export default function FilterPopup({ isOpen, onClose, defaults = {}, onApply }) {
  // ===== UI state =====
  const [subjects, setSubjects] = useState([]); // [{id,name,count,checked}]
  const [grades, setGrades]     = useState([]); // [{id,name,count,checked}]

  const [topics, setTopics] = useState([]);         // ["Algebra", ...]
  const [subTopics, setSubTopics] = useState([]);   // ["Basic Algebra", ...]

  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState("");

  const [showTopics, setShowTopics] = useState(false);
  const [showSubTopics, setShowSubTopics] = useState(false);

  // ===== Fetch subjects/grades (with counts) and hydrate defaults — ONLY when opened =====
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    const def = typeof defaults === "object" ? defaults : {};
    const defSubjects = new Set((def.subjects || []).map(normalize));
    const defGrades   = new Set((def.grades   || []).map(normalize));

    (async () => {
      try {
        // Expected shape:
        // { subjects: [{name, count}], grades: [{name, count}] }
        const res = await fetch("/api/meta/filters", { cache: "no-store" });
        const data = await res.json();
        const subj = Array.isArray(data?.subjects) ? data.subjects : [];
        const grad = Array.isArray(data?.grades) ? data.grades : [];

        if (aborted) return;

        setSubjects(
          subj.map((s, i) => ({
            id: i + 1,
            name: String(s.name || ""),
            count: Number(s.count || 0),
            checked: defSubjects.has(normalize(s.name)),
          }))
        );

        setGrades(
          grad.map((g, i) => ({
            id: i + 1,
            name: String(g.name || ""),
            count: Number(g.count || 0),
            checked: defGrades.has(normalize(g.name)),
          }))
        );
      } catch (e) {
        console.error("FilterPopup: /api/meta/filters failed", e);
        // fallback: keep current state (no hard crash)
      }
    })();

    // hydrate legacy defaults for topic/subtopic
    setSelectedTopic(
      def.topic ? String(def.topic) :
      Array.isArray(def.topics) && def.topics.length ? String(def.topics[0]) : ""
    );
    setSelectedSubTopic(
      def.subtopic ? String(def.subtopic) :
      Array.isArray(def.sub_topics) && def.sub_topics.length ? String(def.sub_topics[0]) : ""
    );

    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, JSON.stringify(defaults)]);

  // ===== Fetch topics when opened; fetch subtopics when topic changes =====
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    (async () => {
      try {
        // Expect: GET /api/meta/topics -> ["Algebra", "Geometry", ...]
        const r = await fetch("/api/meta/topics", { cache: "no-store" });
        const arr = await r.json();
        if (!aborted && Array.isArray(arr)) setTopics(arr.map(String));
      } catch (e) {
        console.warn("FilterPopup: /api/meta/topics failed, using fallback");
        if (!aborted) setTopics(["Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics", "Probability"]);
      }
    })();

    return () => { aborted = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedTopic) {
      setSubTopics([]);
      return;
    }
    let aborted = false;

    (async () => {
      try {
        // Expect: GET /api/meta/subtopics?topic=Algebra -> ["Basic Algebra", "Advanced Algebra", ...]
        const r = await fetch(`/api/meta/subtopics?topic=${encodeURIComponent(selectedTopic)}`, { cache: "no-store" });
        const arr = await r.json();
        if (!aborted && Array.isArray(arr)) setSubTopics(arr.map(String));
      } catch (e) {
        console.warn("FilterPopup: /api/meta/subtopics failed, using fallback");
        if (!aborted) {
          if (selectedTopic === "Algebra") setSubTopics(["Basic Algebra", "Advanced Algebra"]);
          else if (selectedTopic === "Geometry") setSubTopics(["Euclidean Geometry", "Coordinate Geometry"]);
          else setSubTopics(["General Subtopic 1", "General Subtopic 2"]);
        }
      }
    })();

    return () => { aborted = true; };
  }, [isOpen, selectedTopic]);

  // ===== BODY SCROLL LOCK (only while open) =====
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

  // ===== interactions =====
  const toggleChecked = (id, type) => {
    if (type === "subject") {
      setSubjects((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
    } else {
      setGrades((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
    }
  };

  const handleApply = () => {
    const selectedSubjects = subjects.filter((s) => s.checked).map((s) => s.name);
    const selectedGrades   = grades.filter((g) => g.checked).map((g) => g.name);

    onApply?.({
      // arrays for the new API
      subjects: selectedSubjects,
      grades: selectedGrades,
      topics: selectedTopic ? [selectedTopic] : [],
      sub_topics: selectedSubTopic ? [selectedSubTopic] : [],
      // legacy singles for backward compatibility
      topic: selectedTopic || "",
      subtopic: selectedSubTopic || "",
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 bg-white w-[570px] h-[520px] rounded-lg shadow-xl border border-gray-200 flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-purple-700 px-4 py-2 rounded-t-lg">
          <h2 className="text-white text-sm font-semibold">Select Filter</h2>
          <button
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
                      subject.checked
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white border-gray-400 text-transparent"
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

          {/* Topics & Sub-Topics (clickable dropdowns) */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Topics & Sub-Topics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Topics dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTopics((s) => !s);
                    if (!showTopics) setShowSubTopics(false);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <span>{selectedTopic || "Select Topic"}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showTopics ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showTopics && (
                  <div className="absolute left-0 right-0 mt-1 border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white shadow-md z-20">
                    {topics.map((t, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedTopic(t);
                          setSelectedSubTopic("");
                          setShowTopics(false);
                          setShowSubTopics(false);
                          // subtopics are auto-fetched by effect when selectedTopic changes
                        }}
                        className="p-2 cursor-pointer hover:bg-purple-100"
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-Topics dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSubTopics((s) => !s);
                    if (!showSubTopics) setShowTopics(false);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50 disabled:opacity-60"
                  disabled={!selectedTopic}
                >
                  <span>{selectedSubTopic || "Select Sub-Topic"}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showSubTopics ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSubTopics && (
                  <div className="absolute left-0 right-0 mt-1 border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white shadow-md z-20">
                    {subTopics.map((sub, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedSubTopic(sub);
                          setShowSubTopics(false);
                        }}
                        className="p-2 cursor-pointer hover:bg-purple-100"
                      >
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 flex justify-center bg-gray-50 rounded-b-lg">
          <button
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
