"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HelpPopup from "@/components/HelpPopup";
import DOMPurify from "isomorphic-dompurify";

const HeroSection = () => {
  // --- NAV / UI STATE ---
  const [openMobile, setOpenMobile] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // --- DROPDOWN TIMERS ---
  const LEAVE_CLOSE_MS = 500;
  const gradeCloseRef = useRef(null);
  const subjectCloseRef = useRef(null);
  const clearGradeClose = () => {
    if (gradeCloseRef.current) {
      clearTimeout(gradeCloseRef.current);
      gradeCloseRef.current = null;
    }
  };
  const clearSubjectClose = () => {
    if (subjectCloseRef.current) {
      clearTimeout(subjectCloseRef.current);
      subjectCloseRef.current = null;
    }
  };
  const openGrade = () => {
    clearSubjectClose();
    setShowSubjectDropdown(false);
    clearGradeClose();
    setShowGradeDropdown(true);
  };
  const openSubject = () => {
    clearGradeClose();
    setShowGradeDropdown(false);
    clearSubjectClose();
    setShowSubjectDropdown(true);
  };
  const leaveGrade = () => {
    clearGradeClose();
    gradeCloseRef.current = setTimeout(
      () => setShowGradeDropdown(false),
      LEAVE_CLOSE_MS
    );
  };
  const leaveSubject = () => {
    clearSubjectClose();
    subjectCloseRef.current = setTimeout(
      () => setShowSubjectDropdown(false),
      LEAVE_CLOSE_MS
    );
  };

  // --- SEARCH/SUGGEST STATE ---
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hadFirstType, setHadFirstType] = useState(false);

  const boxRef = useRef(null);
  const router = useRouter();

  // ---- AbortController + debounce
  const suggestAbortRef = useRef(null);
  const debounceRef = useRef(null);

  // ---- CLIENT-SIDE CACHE (query -> items)
  const cacheRef = useRef(new Map()); // Map<string, Array>
  const [lastFetchedQ, setLastFetchedQ] = useState(""); // track last query that we actually fetched

  // --- DYNAMIC LISTS (grades / subjects) ---
  const [grades, setGrades] = useState([
    "Pre-K",
    "Kindergarten",
    "First Grade",
    "Second Grade",
    "Third Grade",
    "Fourth Grade",
    "Fifth Grade",
    "Sixth Grade",
    "Seventh Grade",
    "Eighth Grade",
    "High School",
  ]);
  const [subjects, setSubjects] = useState([
    "Language arts",
    "Math",
    "Science",
    "Social Studies",
  ]);

  // Prefetch routes to reduce navigational delay
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/see-all-results");
    router.prefetch("/explore-library");
  }, [router]);

  // Cache meta in sessionStorage to avoid re-fetching on return
  useEffect(() => {
    (async () => {
      try {
        const cachedG = sessionStorage.getItem("meta_grades");
        const cachedS = sessionStorage.getItem("meta_subjects");

        if (cachedG) setGrades(JSON.parse(cachedG));
        if (cachedS) setSubjects(JSON.parse(cachedS));

        if (!cachedG || !cachedS) {
          const [gr, sj] = await Promise.all([
            fetch("/api/meta/grades", { cache: "force-cache" }).then((r) =>
              r.ok ? r.json() : []
            ),
            fetch("/api/meta/subjects", { cache: "force-cache" }).then((r) =>
              r.ok ? r.json() : []
            ),
          ]);
          if (Array.isArray(gr) && gr.length) {
            const vals = gr.map((g) => g.name);
            setGrades(vals);
            sessionStorage.setItem("meta_grades", JSON.stringify(vals));
          }
          if (Array.isArray(sj) && sj.length) {
            const vals = sj.map((s) => s.name);
            setSubjects(vals);
            sessionStorage.setItem("meta_subjects", JSON.stringify(vals));
          }
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      clearGradeClose();
      clearSubjectClose();
    };
  }, []);

  // ---- Helpers
  const toPlain = (s) =>
    DOMPurify.sanitize(String(s || ""), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim();

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // multi-keyword highlight inside TOPIC only
  const highlightTopic = (topic, query) => {
    const t = String(topic || "");
    const tokens = String(query || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!tokens.length) return t;

    const pattern = new RegExp(
      `(${tokens.sort((a, b) => b.length - a.length).map(escapeRe).join("|")})`,
      "ig"
    );

    // Important: reset regex state for .test by using a new instance in map
    const parts = t.split(pattern);
    return parts.map((part, i) =>
      new RegExp(pattern).test(part) ? (
        <mark key={i} className="bg-[#9500DE] text-white rounded px-0.5">
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  // topic-only scoring with multi-keyword AND preference
  const scoreByTopic = (topic, query) => {
    const T = String(topic || "").toLowerCase();
    const toks = String(query || "")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!T || !toks.length) return 0;

    const phrase = toks.join(" ");
    let score = 0;

    // phrase signals
    if (T.startsWith(phrase)) score += 120;
    else if (T.includes(phrase)) score += 90;

    // token signals (AND weight)
    let all = true;
    toks.forEach((tk) => {
      if (T.startsWith(tk)) score += 30;
      if (T.includes(tk)) score += 20;
      if (!T.includes(tk)) all = false;
    });
    if (all) score += 40; // bonus for matching all keywords
    return score;
  };

  // --- Instant feedback on typing: mark dirty + open; show loader only if cache miss
  const onType = (val) => {
    setQ(val);
    if (!hadFirstType) setHadFirstType(true);
    setOpen(true);

    const trimmed = val.trim();
    if (!trimmed) {
      // clearing input
      setItems([]);
      setLoading(false);
      return;
    }

    // If we already have cached results for this exact query, show instantly (no spinner)
    const cached = cacheRef.current.get(trimmed);
    if (cached && cached.length) {
      setItems(cached);
      setLoading(false);
    } else {
      // only show loader on cache miss
      setLoading(true);
    }
  };

  // --- Debounced suggestions fetch (1s after typing stops)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = q.trim();

    if (!trimmed) {
      setItems([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    // If we already fetched this exact query (and it's cached), skip fetch
    if (trimmed === lastFetchedQ) {
      const cached = cacheRef.current.get(trimmed);
      if (cached && cached.length) {
        setItems(cached);
        setLoading(false);
        setOpen(true);
        return;
      }
      // fall-through if somehow not cached
    }

    // 1000ms debounce per requirement
    debounceRef.current = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      const ctrl = new AbortController();
      suggestAbortRef.current = ctrl;

      try {
        const url = `/api/search/suggest?q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Bad response");

        const data = await res.json();
        const rawItems = Array.isArray(data?.items) ? data.items : [];

        // normalize & topic-only sort, take top 4
        const normalized = rawItems.map((x) => ({
          id: x.id || x.slug || x.topic || x.title || x.name,
          slug: x.slug,
          topic: x.topic || x.title || x.name || "Untitled",
          grade: x.grade || "",
          subtopic: x.subtopic || x.sub_topic || "",
          snippet:
            x.snippet ??
            x.presentation_content ??
            x.presentation_html ??
            x.content ??
            "",
        }));

        const sorted = normalized
          .sort((a, b) => scoreByTopic(b.topic, trimmed) - scoreByTopic(a.topic, trimmed))
          .slice(0, 4);

        // cache & set state
        cacheRef.current.set(trimmed, sorted);
        setLastFetchedQ(trimmed);
        setItems(sorted);
        setOpen(true);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setItems([]);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Close suggestions when clicking outside (do NOT clear items; keep cache)
  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Initiate search navigation
  const goSearch = () => {
    const query = q.trim();
    if (!query) return;
    router.push(`/see-all-results?q=${encodeURIComponent(query)}`);
  };

  // Build query for Explore Library
  const pushWithQuery = (params) => {
    const qs = new URLSearchParams(params).toString();
    router.push(`/explore-library?${qs}`);
  };

  // Click handlers for dropdown menu items
  const onClickGrade = (gradeName) => {
    clearGradeClose();
    setShowGradeDropdown(false);
    pushWithQuery({ grades: gradeName });
  };
  const onClickSubject = (subjectName) => {
    clearSubjectClose();
    setShowSubjectDropdown(false);
    pushWithQuery({ subjects: subjectName });
  };

  // Loader UI
  const LoaderRow = () => (
    <div className="px-4 py-3 flex items-center gap-2">
      <svg className="h-4 w-4 animate-spin opacity-90" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path
          d="M21 12a9 9 0 0 1-9 9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <span className="text-sm opacity-90">Searching…</span>
    </div>
  );

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="flex flex-wrap items-center justify-between md:ml-8 md:mr-7 md:mt-2 md:py-4 sm:px-30 md:px-0 lg:px-8 xl:mb-10 text-white">
        <div className="flex items-center md:pl-2">
          {/* Prefetching Link for faster returns to landing */}
          <Link href="/" prefetch aria-label="Lessn Home">
            <img
              src="/lessnlogo.svg"
              alt="Lessn logo"
              className="md:w-20 h-auto lg:w-30 object-contain"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </Link>
        </div>

        {/* Center nav links */}
        <ul className="font-inter hidden lg:flex flex-grow justify-center md:text-[12px] md:gap-4 text-sm lg:text-[14px] lg:gap-4">
          <li className="hover:bg-[#9500DE] px-2 py-2">
            <Link href="/explore-library" prefetch className="transition hover:text-gray-200 cursor-pointer">
              Explore Library
            </Link>
          </li>
          <li className="hover:bg-[#9500DE] px-2 py-2">
            <Link href="/create" prefetch className="transition hover:text-gray-200 cursor-pointer">
              Create a Lesson
            </Link>
          </li>

          {/* Grade selector */}
          <li
            className="relative hover:bg-[#9500DE] px-2 py-2"
            onMouseEnter={openGrade}
            onMouseLeave={leaveGrade}
          >
            <button type="button" className="flex items-center space-x-1 transition hover:text-gray-200">
              <span>Select Grade</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="mt-1 h-3 w-3">
                <path
                  fillRule="evenodd"
                  d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
            {showGradeDropdown && (
              <ul className="absolute left-0 top-full mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-[500]">
                {grades.map((grade, idx) => (
                  <li
                    key={idx}
                    className="px-4 py-2 text-white border-b border-gray-700 last:border-none hover:bg-[#9500DE] cursor-pointer"
                    onClick={() => onClickGrade(grade)}
                  >
                    {grade}
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Subject selector */}
          <li
            className="relative hover:bg-[#9500DE] px-2 py-2"
            onMouseEnter={openSubject}
            onMouseLeave={leaveSubject}
          >
            <button type="button" className="flex items-center space-x-1 transition hover:text-gray-200">
              <span>Select Subject</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="mt-1 h-3 w-3">
                <path
                  fillRule="evenodd"
                  d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
            {showSubjectDropdown && (
              <ul className="absolute left-0 top-full mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-[500]">
                {subjects.map((subject, idx) => (
                  <li
                    key={idx}
                    className="px-4 py-2 text-white border-b border-gray-700 last:border-none hover:bg-[#9500DE] cursor-pointer"
                    onClick={() => onClickSubject(subject)}
                  >
                    {subject}
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>

        {/* Right-side links (Login/Help) */}
        <div className="font-inter md:text-[12px] hidden lg:flex lg:gap-4 items-center text-sm lg:text-[14px]">
          <Link
            href="/login"
            prefetch
            className="transition flex items-center gap-1 hover:text-gray-200 hover:bg-[#9500DE] px-1 py-1"
          >
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9.75 9.40576H7.78125C7.62656 9.40576 7.5 9.2792 7.5 9.12451V8.18701C7.5 8.03232 7.62656 7.90576 7.78125 7.90576H9.75C10.1648 7.90576 10.5 7.57061 10.5 7.15576V2.65576C10.5 2.24092 10.1648 1.90576 9.75 1.90576H7.78125C7.62656 1.90576 7.5 1.7792 7.5 1.62451V0.687012C7.5 0.532324 7.62656 0.405762 7.78125 0.405762H9.75C10.9922 0.405762 12 1.41357 12 2.65576V7.15576C12 8.39795 10.9922 9.40576 9.75 9.40576ZM8.64844 4.69482L4.71094 0.757324C4.35938 0.405762 3.75 0.651855 3.75 1.15576V3.40576H0.5625C0.250781 3.40576 0 3.65654 0 3.96826V6.21826C0 6.52998 0.250781 6.78076 0.5625 6.78076H3.75V9.03076C3.75 9.53467 4.35938 9.78076 4.71094 9.4292L8.64844 5.4917C8.86641 5.27139 8.86641 4.91514 8.64844 4.69482Z"
                fill="white"
              />
            </svg>
            Login
          </Link>
          <span className="hidden">
            <Link href="/register" prefetch>
              Register
            </Link>
          </span>
          <div className="hidden lg:flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium">
            <img
              src="/Help.svg"
              alt="Help icon"
              className="h-10 w-auto object-contain"
              onClick={() => setHelpOpen(true)}
            />
          </div>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-7 lg:hidden">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" prefetch className="transition hover:text-gray-200 text-sm md:text-[12px]">
              Login
            </Link>
            <span className="hidden">
              <Link href="/register" prefetch>
                Register
              </Link>
            </span>
          </div>
          <button
            className="flex items-center text-gray-200"
            aria-label="Open menu"
            onClick={() => setOpenMobile(!openMobile)}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5h16.5m-16.5 7.5h16.5m-16.5 7.5h16.5" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Side Menu */}
      {openMobile && (
        <div className="fixed inset-y-0 right-0 z-50 w-[80%] sm:w-[70%] md:w-[45%] lg:w-[30%] bg-[#500078] text-white transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
              <Link href="/" prefetch aria-label="Lessn Home">
                <img src="/lessnlogo.svg" alt="Lessn logo" className="w-16 h-auto object-contain" />
              </Link>
              <button
                className="text-gray-200"
                aria-label="Close menu"
                onClick={() => setOpenMobile(false)}
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col space-y-4 text-sm">
              <Link
                href="/explore-library"
                prefetch
                className="hover:text-gray-200"
                onClick={() => setOpenMobile(false)}
              >
                Explore Library
              </Link>
              <Link href="/create" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                Create a Lesson
              </Link>

              <button className="text-left hover:text-gray-200" type="button">
                Select Grade
              </button>
              <button className="text-left hover:text-gray-200" type="button">
                Select Subject
              </button>

              <div className="flex flex-col space-y-2 pt-2 md:hidden">
                <Link href="/login" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                  Login
                </Link>
                <span className="hidden">
                  <Link href="/register" prefetch>
                    Register
                  </Link>
                </span>
              </div>

              <button
                className="rounded-full bg-[#24C864] px-3 py-1 text-xs font-medium w-fit"
                onClick={() => {
                  setOpenMobile(false);
                  setHelpOpen(true);
                }}
              >
                HELP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section Content */}
      <div className="relative flex flex-col items-center justify-center px-0 text-center md:flex-row md:text-left min-h-[370px]">
        {/* Left illustration */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-[450px] lg:w-[500px] xl:w-[600px] md:h-full">
          <img
            src="/leftimg.svg"
            alt="Left illustration"
            className="absolute bottom-0 left-0 -translate-x-[30px] object-contain sm:w-[320px] md:w-[480px] lg:w-[600px] xl:w-[700px] 2xl:w-[800px]"
            loading="eager"
            decoding="async"
          />
          <img
            src="/leftimg.svg"
            alt=""
            aria-hidden="true"
            className="invisible w-[260px] sm:w-[300px] md:w-[360px] lg:w-[420px] xl:w-[500px] h-auto"
          />
        </div>

        {/* Center text and search */}
        <div className="relative z-[300] mt-8 flex w-full flex-col items-center space-y-3 md:mt-10 md:mb-10 md:justify-center xl:space-y-6">
          <h1 className="font-mulish font-bold text-white sm:text-4xl md:text-[22px] lg:text-[30px] xl:text-[40px]">
            Your next great Lessn starts here.
          </h1>
          <p className="max-w-md text-base text-gray-200 md:text-[15px] lg:text-[18px] xl:text-[18px]">
            Build and explore standards-based, AI-driven lessons
          </p>

          {/* Search bar with suggestions */}
          <div className="relative flex w-full max-w-sm items-center sm:max-w-md md:max-w-sm lg:max-w-md xl:max-w-lg space-x-3" ref={boxRef}>
            <input
              value={q}
              onChange={(e) => onType(e.target.value)}
              onFocus={() => {
                const trimmed = q.trim();
                if (!trimmed) return; // nothing to show
                const cached = cacheRef.current.get(trimmed);
                setOpen(true);
                if (cached && cached.length) {
                  // show cached immediately, no spinner, no fetch
                  setItems(cached);
                  setLoading(false);
                } else {
                  // cache miss: show loader until debounce fetch completes
                  setLoading(true);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && goSearch()}
              placeholder="Search e.g. English colonies, unit rates…"
              className="w-full flex-grow appearance-none rounded-full border border-white bg-transparent px-4 py-2 text-white placeholder-gray-300 focus:outline-none"
              type="text"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="hero-suggest"
            />
            <button
              type="button"
              onClick={goSearch}
              className="rounded-full bg-[#f6ebfa] px-4 py-1 text-purple-800 hover:cursor-pointer shadow-md"
            >
              Search
            </button>

            {/* Suggestions dropdown */}
            {open && (
              <div
                id="hero-suggest"
                role="listbox"
                className="absolute left-0 top[110%] mt-2 w-full bg-gray-900 text-white rounded-xl shadow-2xl z-[900]"
                style={{ top: "110%" }}
              >
                {/* Loader while typing / fetching */}
                {loading && <LoaderRow />}

                {!loading && items.length === 0 && hadFirstType && (
                  <div className="px-4 py-3 text-sm opacity-80">No matches</div>
                )}

                {!loading && items.length > 0 && (
                  <div className="divide-y divide-gray-800">
                    {items.map((item) => {
                      const topic = item.topic || "Untitled";
                      const grade = item.grade || "";
                      const subtopic = item.subtopic || item.sub_topic || "";
                      const snippet = toPlain(item.snippet || "");
                      const snippetShort = snippet.length > 140 ? snippet.slice(0, 140) + "…" : snippet;
                      return (
                        <Link
                          key={item.id || item.slug || topic}
                          href={`/presentations/${item.slug}`}
                          className="block px-4 py-3 hover:bg-[#9500DE]"
                          onClick={() => setOpen(false)}
                          role="option"
                        >
                          <div className="text-sm font-semibold">{highlightTopic(topic, q)}</div>
                          {grade && <div className="text-xs opacity-80">Grade: {grade}</div>}
                          {subtopic && <div className="text-xs opacity-80">{subtopic}</div>}
                          {snippetShort && (
                            <div className="text-[11px] mt-1 line-clamp-1 opacity-60">{snippetShort}</div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                <button
                  className="w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700"
                  onClick={() => router.push(`/see-all-results?q=${encodeURIComponent(q)}`)}
                >
                  See all results
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center md:space-x-4">
            <span className="text-gray-200">Or</span>
            <Link href="/create" prefetch className="rounded-full bg-[#d08bf2] md:px-4 py-2 text-white cursor-pointer">
              Generate a new lesson
            </Link>
          </div>
        </div>

        {/* Right illustration */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-1/2 md:h-full">
          <img
            src="/rightimg.svg"
            alt="Right illustration"
            className="absolute bottom-0 right-0 object-contain sm:max-w-[350px] md:w-[200px] lg:w-[250px] xl:max-w-[480px] 2xl:max-w-[560px]"
            decoding="async"
          />
          <img
            src="/rightimg.svg"
            alt=""
            aria-hidden="true"
            className="invisible w-2/3 max-w-[350px] object-contain sm:max-w-[350px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] 2xl:max-w-[560px]"
          />
        </div>
      </div>

      {helpOpen && <HelpPopup open={helpOpen} onClose={() => setHelpOpen(false)} />}
    </>
  );
};

export default HeroSection;
