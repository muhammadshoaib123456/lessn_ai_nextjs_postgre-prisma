"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

/* ====================== Small helpers (pure functions) ======================
 * normalize:  safe-string a value.
 * keyOf:      normalized lowercase key (for stable ids & default matching).
 * csv:        join array → comma separated string for query params.
 * You generally don't need to change these unless your API shape changes.
 */
const normalize = (s) => String(s || "").trim();
const keyOf = (s) => normalize(s).toLowerCase();
const csv = (arr) => (Array.isArray(arr) && arr.length ? arr.join(",") : "");

/* =============================================================================
 * FilterPopup
 * - Modal that lets users pick Subjects, Grades, Topics, Sub-Topics.
 * - Fetches dependent lists based on selections & lightweight search fields.
 * - Applies defaults only on the first open (per mount), then preserves user choice.
 *
 * PROPS
 * - isOpen (bool): controls visibility.
 * - onClose (fn): called when clicking backdrop or ✕ or after applying.
 * - defaults (object): { subjects, grades, topics, sub_topics } → arrays of strings.
 * - onApply (fn): receives selected filters {subjects, grades, topics, sub_topics, topic, subtopic}.
 *
 * UI TUNING QUICK GUIDE
 * - Popup size → wrapper className: "w-[680px] h-[560px]" (change px or make responsive).
 * - Panel radius, shadow, border → "rounded-lg shadow-xl border".
 * - Header color/height → header div "bg-purple-700 px-4 py-2".
 * - Body font size/spacing → "text-xs", paddings "px-5 py-3", section gaps "space-y-4".
 * - Grid columns for lists → e.g., "grid grid-cols-3", "md:grid-cols-3".
 * - Checkboxes visual → small squares using Tailwind utilities; tweak colors/borders there.
 * - Buttons (Select all / Clear / Apply) → adjust sizes, colors, radii in their classNames.
 * - Search inputs → width/height/border via "w-full px-2 py-1 border rounded-md".
 * =============================================================================
 */
export default function FilterPopup({ isOpen, onClose, defaults = {}, onApply }) {
  // ====== Option buckets (each item: { id, name, count, checked }) ======
  const [subjects, setSubjects] = useState([]); // ✅ Subjects list (+ counts) + checkbox state
  const [grades, setGrades] = useState([]);     // ✅ Grades list (+ counts) + checkbox state

  const [topics, setTopics] = useState([]);       // ✅ Topics list (+ counts) + checkbox state
  const [subTopics, setSubTopics] = useState([]); // ✅ Sub-Topics list (+ counts) + checkbox state

  // ====== Inline search boxes for topics & sub-topics ======
  const [topicSearch, setTopicSearch] = useState("");
  const [subTopicSearch, setSubTopicSearch] = useState("");

  // ✅ Ensure defaults apply only once (first open), not after every refetch.
  const appliedDefaultsRef = useRef(false);

  // ===================== Modal behavior: lock scroll when open =====================
  useEffect(() => {
    if (!isOpen) return;
    const { body } = document;
    const scrollY = window.scrollY;         // remember scroll position
    const prevStyle = body.getAttribute("style") || "";
    // 🔒 Lock body to prevent background scroll on mobile & desktop when modal is open:
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    // 🔓 Restore on close:
    return () => {
      body.setAttribute("style", prevStyle);
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // ===================== Selected names (derived) =====================
  // Used to build API queries and render the selected "chips".
  const selectedSubjectNames = useMemo(
    () => subjects.filter((s) => s.checked).map((s) => s.name),
    [subjects]
  );
  const selectedGradeNames = useMemo(
    () => grades.filter((g) => g.checked).map((g) => g.name),
    [grades]
  );
  const selectedTopicNames = useMemo(
    () => topics.filter((t) => t.checked).map((t) => t.name),
    [topics]
  );
  const selectedSubTopicNames = useMemo(
    () => subTopics.filter((s) => s.checked).map((s) => s.name),
    [subTopics]
  );

  // For chip rendering (objects include ids for remove buttons)
  const selectedTopicObjs = useMemo(() => topics.filter((t) => t.checked), [topics]);
  const selectedSubTopicObjs = useMemo(() => subTopics.filter((s) => s.checked), [subTopics]);

  /* =======================================================================
   * Show/hide "Remove Filters" button
   * ======================================================================= */
  const hasAnySelection = useMemo(
    () =>
      selectedSubjectNames.length > 0 ||
      selectedGradeNames.length > 0 ||
      selectedTopicNames.length > 0 ||
      selectedSubTopicNames.length > 0,
    [selectedSubjectNames, selectedGradeNames, selectedTopicNames, selectedSubTopicNames]
  );

  /* =======================================================================
   * Clear all filters instantly (subjects, grades, topics, subtopics)
   * ======================================================================= */
  const handleClearAllFilters = () => {
    setSubjects((prev) => prev.map((it) => ({ ...it, checked: false })));
    setGrades((prev) => prev.map((it) => ({ ...it, checked: false })));
    setTopics((prev) => prev.map((it) => ({ ...it, checked: false })));
    setSubTopics((prev) => prev.map((it) => ({ ...it, checked: false })));
    // Note: searches remain as-is; only clicked filters are removed.
  };

  /* ============================================================================
   * 1) Load Subjects & Grades
   * - Fetches both lists whenever popup opens OR when user changes Subject/Grade selection.
   * - Each list is filtered by the opposite dimension (if any selected). E.g.:
   *   - GRADES API receives selected subjects (to filter grade counts & availability)
   *   - SUBJECTS API receives selected grades (to filter subject counts & availability)
   * - Applies `defaults` only once on first open using appliedDefaultsRef.
   * ============================================================================ */
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    const def = typeof defaults === "object" ? defaults : {};
    // Normalize defaults for quick membership checks (case-insensitive)
    const defSubjects = new Set((def.subjects || []).map(keyOf));
    const defGrades = new Set((def.grades || []).map(keyOf));

    (async () => {
      try {
        // ===== Fetch GRADES (filtered by selected subjects) =====
        const gradesURL = new URL("/api/meta/grades", window.location.origin);
        const subjCsv = csv(selectedSubjectNames);
        if (subjCsv) gradesURL.searchParams.set("subjects", subjCsv);
        const gradesRes = await fetch(gradesURL.toString(), { cache: "no-store" });
        const gradesArr = (await gradesRes.json()) || []; // [{ name, count }]

        // ===== Fetch SUBJECTS (filtered by selected grades) =====
        const subjectsURL = new URL("/api/meta/subjects", window.location.origin);
        const gradeCsv = csv(selectedGradeNames);
        if (gradeCsv) subjectsURL.searchParams.set("grades", gradeCsv);
        const subjectsRes = await fetch(subjectsURL.toString(), { cache: "no-store" });
        const subjectsArr = (await subjectsRes.json()) || []; // [{ name, count }]

        if (aborted) return;

        // ===== Hydrate grades list, preserving previously checked state when possible =====
        setGrades((prev) => {
          // Map of id → checked from previous state (so toggles persist across refetches)
          const prevChecked = new Map(prev.map((g) => [g.id, g.checked]));
          return gradesArr.map((g) => {
            const name = String(g.name || "");
            const id = keyOf(name);
            const wasChecked = prevChecked.get(id) === true;
            // Only during first open, auto-check items that match defaults:
            const isDefault = !appliedDefaultsRef.current && defGrades.has(id);
            return { id, name, count: Number(g.count || 0), checked: wasChecked || isDefault };
          });
        });

        // ===== Hydrate subjects list, preserving checked state, and mark defaults once =====
        setSubjects((prev) => {
          const prevChecked = new Map(prev.map((s) => [s.id, s.checked]));
          const next = subjectsArr.map((s) => {
            const name = String(s.name || "");
            const id = keyOf(name);
            const wasChecked = prevChecked.get(id) === true;
            const isDefault = !appliedDefaultsRef.current && defSubjects.has(id);
            return { id, name, count: Number(s.count || 0), checked: wasChecked || isDefault };
          });
          // ✅ Mark defaults as applied after first mapping to avoid re-checks later
          if (!appliedDefaultsRef.current) appliedDefaultsRef.current = true;
          return next;
        });
      } catch (e) {
        console.error("FilterPopup: load dependent subjects/grades failed", e);
      }
    })();

    return () => { aborted = true; };
    // ⚠️ Do NOT include `defaults` in deps; we only apply them once per open session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, JSON.stringify(selectedSubjectNames), JSON.stringify(selectedGradeNames)]);

  // (Note) We intentionally do not auto-check grades when a subject is selected (old behavior removed).

  /* ============================================================================
   * 2) Load Topics
   * - Refetches when popup opens, or when subjects/grades change, or when topicSearch changes.
   * - Preserves checked state for topics that remain in the list.
   * ============================================================================ */
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    (async () => {
      try {
        const url = new URL("/api/meta/topics", window.location.origin);
        const subjCsv = csv(selectedSubjectNames);
        const gradeCsv = csv(selectedGradeNames);
        if (subjCsv) url.searchParams.set("subjects", subjCsv);
        if (gradeCsv) url.searchParams.set("grades", gradeCsv);
        if (topicSearch.trim()) url.searchParams.set("q", topicSearch.trim());

        const r = await fetch(url.toString(), { cache: "no-store" });
        const arr = (await r.json()) || []; // [{ name, count }]
        if (aborted) return;

        setTopics((prev) => {
          const prevChecked = new Map(prev.map((t) => [t.id, t.checked]));
          return arr
            .map((t) => {
              const name = String(t.name || "");
              const id = keyOf(name);
              const wasChecked = prevChecked.get(id) === true; // keep toggles
              return { id, name, count: Number(t.count || 0), checked: wasChecked };
            })
            .filter((t) => t.name.trim());
        });
      } catch (e) {
        console.warn("FilterPopup: /api/meta/topics failed", e);
      }
    })();

    return () => { aborted = true; };
  }, [isOpen, JSON.stringify(selectedSubjectNames), JSON.stringify(selectedGradeNames), topicSearch]);

  /* ============================================================================
   * 3) Load Sub-Topics
   * - Refetches when popup opens, or when topics/subjects/grades change, or when subTopicSearch changes.
   * - Preserves checked state for sub-topics that remain in the new list.
   * ============================================================================ */
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;

    (async () => {
      try {
        const url = new URL("/api/meta/subtopics", window.location.origin);
        const topicsCsv = csv(selectedTopicNames);
        const subjCsv = csv(selectedSubjectNames);
        const gradeCsv = csv(selectedGradeNames);
        if (topicsCsv) url.searchParams.set("topics", topicsCsv);
        if (subjCsv) url.searchParams.set("subjects", subjCsv);
        if (gradeCsv) url.searchParams.set("grades", gradeCsv);
        if (subTopicSearch.trim()) url.searchParams.set("q", subTopicSearch.trim());

        const r = await fetch(url.toString(), { cache: "no-store" });
        const arr = (await r.json()) || []; // [{ name, count }]
        if (aborted) return;

        setSubTopics((prev) => {
          const prevChecked = new Map(prev.map((s) => [s.id, s.checked]));
          return arr
            .map((s) => {
              const name = String(s.name || "");
              const id = keyOf(name);
              const wasChecked = prevChecked.get(id) === true; // keep toggles
              return { id, name, count: Number(s.count || 0), checked: wasChecked };
            })
            .filter((s) => s.name.trim());
        });
      } catch (e) {
        console.warn("FilterPopup: /api/meta/subtopics failed", e);
      }
    })();

    return () => { aborted = true; };
  }, [isOpen, JSON.stringify(selectedTopicNames), JSON.stringify(selectedSubjectNames), JSON.stringify(selectedGradeNames), subTopicSearch]);

  // ===================== Modal visibility guard =====================
  if (!isOpen) return null;

  // ===================== Toggle handlers (no auto-check chains) =====================
  // Subjects/Grades toggles → list re-fetch is handled by effects above.
  const toggleChecked = (id, type) => {
    if (type === "subject") {
      setSubjects((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
    } else if (type === "grade") {
      setGrades((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
    }
  };
  const toggleTopic = (id) => setTopics((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
  const toggleSubTopic = (id) => setSubTopics((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));

  // Chip “x” buttons
  const removeTopic = (id) => setTopics((prev) => prev.map((it) => (it.id === id ? { ...it, checked: false } : it)));
  const removeSubTopic = (id) => setSubTopics((prev) => prev.map((it) => (it.id === id ? { ...it, checked: false } : it)));

  // Bulk select/clear for topics/subtopics lists
  const selectAll = (type) => {
    if (type === "topics") setTopics((prev) => prev.map((it) => ({ ...it, checked: true })));
    if (type === "subtopics") setSubTopics((prev) => prev.map((it) => ({ ...it, checked: true })));
  };
  const clearAll = (type) => {
    if (type === "topics") setTopics((prev) => prev.map((it) => ({ ...it, checked: false })));
    if (type === "subtopics") setSubTopics((prev) => prev.map((it) => ({ ...it, checked: false })));
  };

  // ===================== Apply =====================
  const handleApply = () => {
    // Return full arrays + convenience single picks (topic/subtopic)
    const selectedSubjects = selectedSubjectNames;
    const selectedGrades = selectedGradeNames;
    const selectedTopics = selectedTopicNames;
    const selectedSubs = selectedSubTopicNames;

    onApply?.({
      subjects: selectedSubjects,
      grades: selectedGrades,
      topics: selectedTopics,
      sub_topics: selectedSubs,
      // Convenience single-pick for places in your code that expect one value:
      topic: selectedTopics[0] || "",
      subtopic: selectedSubs[0] || "",
    });
    onClose?.();
  };

  /* ============================ UI (Modal) ============================
   * STRUCTURE:
   * <backdrop> + <panel> (header, body, footer)
   *
   * SIZING:
   * - Outer panel size: "w-[680px] h-[560px]" (px). Make responsive: w-full max-w-[720px] h-auto md:h-[560px].
   * - Scroll: body area scrolls (overflow-y-auto), header/footer pinned.
   *
   * COLORS/TYPOGRAPHY:
   * - Header: bg-purple-700 (change to brand). Title text white.
   * - Body text base: text-xs (increase to text-sm if you want larger list text).
   * ================================================================== */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      {/* ===== Backdrop (click to close) ===== */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* ===== Panel ===== */}
      <div
        className="relative z-10 bg-white w-[680px] h-[560px] rounded-lg shadow-xl border border-gray-200 flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()} // prevent clicks inside the panel from closing
      >
        {/* ===== Header ===== */}
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

        {/* ===== Body (scrollable) ===== */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 text-xs">
          {/* -------- Subjects -------- */}
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
              {subjects.length === 0 && (
                <div className="text-gray-500 text-xs">No subjects match your selection.</div>
              )}
            </div>
          </div>

          <hr />

          {/* -------- Grades -------- */}
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
              {grades.length === 0 && (
                <div className="text-gray-500 text-xs">No grades match your selection.</div>
              )}
            </div>
          </div>

          <hr />

          {/* -------- Topics & Sub-Topics -------- */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Topics & Sub-Topics</h3>

            {/* ===== Topics block ===== */}
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

              <input
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics…"
                className="w-full mb-2 border border-gray-300 rounded-md px-2 py-1"
              />

              {selectedTopicObjs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedTopicObjs.map((t) => (
                    <span
                      key={t.id}
                      title={t.name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      <span className="truncate max-w-[180px]">{t.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${t.name}`}
                        onClick={(e) => { e.stopPropagation(); removeTopic(t.id); }}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700
                                   focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1 transition-colors"
                        title="Remove"
                      >
                        <svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true">
                          <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="max-h-32 overflow-auto border border-gray-200 rounded-md p-2">
                {topics.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={t.checked} onChange={() => toggleTopic(t.id)} className="h-4 w-4" />
                    <span className="flex-1 text-gray-700">{t.name}</span>
                    <span className="text-gray-500">({t.count})</span>
                  </label>
                ))}
                {topics.length === 0 && <div className="text-gray-500 text-xs">No topics found.</div>}
              </div>
            </div>

            {/* ===== Sub-Topics block ===== */}
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

              <input
                value={subTopicSearch}
                onChange={(e) => setSubTopicSearch(e.target.value)}
                placeholder="Search sub-topics…"
                className="w-full mb-2 border border-gray-300 rounded-md px-2 py-1"
              />

              {selectedSubTopicObjs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedSubTopicObjs.map((s) => (
                    <span
                      key={s.id}
                      title={s.name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <span className="truncate max-w-[180px]">{s.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${s.name}`}
                        onClick={(e) => { e.stopPropagation(); removeSubTopic(s.id); }}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white hover:bg-purple-700
                                   focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1 transition-colors"
                        title="Remove"
                      >
                        {/* NOTE: hover:bg-purple-700 looks like a branding mix; keep as-is per your request not to change behavior/styles. */}
                        <svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true">
                          <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="max-h-32 overflow-auto border border-gray-200 rounded-md p-2">
                {subTopics.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={s.checked} onChange={() => toggleSubTopic(s.id)} className="h-4 w-4" />
                    <span className="flex-1 text-gray-700">{s.name}</span>
                    <span className="text-gray-500">({s.count})</span>
                  </label>
                ))}
                {subTopics.length === 0 && (
                  <div className="text-gray-500 text-xs">
                    {selectedTopicNames.length ? "No sub-topics found for selected topics." : "Pick one or more topics to see sub-topics."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Footer (Apply + Remove Filters) ===== */}
        <div className="p-3 flex justify-between items-center bg-gray-50 rounded-b-lg">
  {/* Left spacer (empty, keeps Apply centered) */}
  <div className="w-1/3"></div>

  {/* Center button */}
  <div className="w-1/3 flex justify-center">
    <button
      type="button"
      onClick={handleApply}
      className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-700 to-purple-500 text-white text-sm font-medium hover:opacity-90"
    >
      Apply Filters
    </button>
  </div>

  {/* Right button */}
  <div className="w-1/3 flex justify-end mr-7">
    {hasAnySelection && (
      <button
        type="button"
        onClick={handleClearAllFilters}
        className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-700 to-purple-500 text-white text-sm font-medium hover:opacity-90"
        aria-label="Remove all filters"
        title="Remove all filters"
      >
        Remove Filters
      </button>
    )}
  </div>
</div>

      </div>
    </div>
  );
}
