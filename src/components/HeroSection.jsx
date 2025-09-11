// components/HeroSection.jsx
"use client"; // ✅ Next.js App Router directive: this component runs on the client

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import ProfileDropdown from "@/components/ProfileDropdown";

// ✅ Lazy-load Help popup to keep initial JS smaller (improves first paint)
// - If you want to load it immediately, remove dynamic() and import directly.
// - `loading: () => null` avoids showing a fallback.
// - SSR disabled on purpose because it’s UI-only.
const HelpPopup = dynamic(() => import("@/components/HelpPopup"), { ssr: false, loading: () => null });

// ✅ Utility to remove any HTML from suggestion snippets
// - Usage: keep snippets safe in the dropdown.
const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, "").trim(); // small + fast

const HeroSection = () => {
  // ✅ NextAuth session: used to decide whether to show Login or Profile menu
  const { data: session } = useSession();

  // --- NAV / UI STATE ---
  // ✅ Controls if the mobile side menu drawer is open (MOBILE)
  const [openMobile, setOpenMobile] = useState(false);
  // ✅ Controls the Help modal visibility
  const [helpOpen, setHelpOpen] = useState(false);
  // ✅ Hover-based dropdown state for "Select Grade" and "Select Subject" in the navbar
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // --- DROPDOWN TIMERS ---
  // ✅ Delay before closing dropdowns on mouse leave (prevents flicker)
  const LEAVE_CLOSE_MS = 500;
  // ✅ Refs to store pending close timers
  const gradeCloseRef = useRef(null);
  const subjectCloseRef = useRef(null);
  // ✅ Clears any scheduled close for grade dropdown
  const clearGradeClose = () => {
    if (gradeCloseRef.current) {
      clearTimeout(gradeCloseRef.current);
      gradeCloseRef.current = null;
    }
  };
  // ✅ Clears any scheduled close for subject dropdown
  const clearSubjectClose = () => {
    if (subjectCloseRef.current) {
      clearTimeout(subjectCloseRef.current);
      subjectCloseRef.current = null;
    }
  };
  // ✅ Open grade dropdown and make sure subject is closed
  const openGrade = () => {
    clearSubjectClose();
    setShowSubjectDropdown(false);
    clearGradeClose();
    setShowGradeDropdown(true);
  };
  // ✅ Open subject dropdown and make sure grade is closed
  const openSubject = () => {
    clearGradeClose();
    setShowGradeDropdown(false);
    clearSubjectClose();
    setShowSubjectDropdown(true);
  };
  // ✅ On mouse leave, schedule close for grade dropdown
  const leaveGrade = () => {
    clearGradeClose();
    gradeCloseRef.current = setTimeout(() => setShowGradeDropdown(false), LEAVE_CLOSE_MS);
  };
  // ✅ On mouse leave, schedule close for subject dropdown
  const leaveSubject = () => {
    clearSubjectClose();
    subjectCloseRef.current = setTimeout(() => setShowSubjectDropdown(false), LEAVE_CLOSE_MS);
  };

  // --- SEARCH/SUGGEST STATE ---
  // ✅ q: current search input value
  const [q, setQ] = useState("");
  // ✅ open: whether suggestion dropdown is visible
  const [open, setOpen] = useState(false);
  // ✅ items: current suggestion items to render
  const [items, setItems] = useState([]);
  // ✅ loading: spinner flag while fetching suggestions
  const [loading, setLoading] = useState(false);
  // ✅ hadFirstType: used to show “No matches” only after typing started
  const [hadFirstType, setHadFirstType] = useState(false);

  // ✅ Ref to the search box container, used to close suggestions when clicking outside
  const boxRef = useRef(null);
  const router = useRouter();

  // ---- AbortController + debounce
  // ✅ Keep last request abort controller to cancel in-flight fetch on fast typing
  const suggestAbortRef = useRef(null);
  // ✅ Debounce timer ref (1s)
  const debounceRef = useRef(null);

  // ---- CLIENT-SIDE CACHE (query -> items)
  // ✅ Simple in-memory cache for suggestions to avoid re-fetching same query
  const cacheRef = useRef(new Map());
  // ✅ Track last fetched query so we know when to reuse cached results
  const [lastFetchedQ, setLastFetchedQ] = useState("");

  // --- DYNAMIC LISTS (grades / subjects) ---
  // ✅ Initial hardcoded defaults; will be replaced by /api/meta/filters if available
  // ✏️ Tailwind size change:
  // - These are data values (not CSS). The rendering size for dropdown is controlled in the JSX below.
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
  const [subjects, setSubjects] = useState(["Language arts", "Math", "Science", "Social Studies"]);

  // ✅ Prefetch common routes after browser is idle for faster navigation
  // ✏️ If you want to prefetch more pages, add more router.prefetch calls.
  useEffect(() => {
    const idle = (cb) => {
      if (typeof window === "undefined") return;
      if ("requestIdleCallback" in window) return window.requestIdleCallback(cb, { timeout: 2000 });
      return setTimeout(cb, 1200);
    };
    const cancel = idle(() => {
      try {
        router.prefetch("/see-all-results");
        router.prefetch("/explore-library");
        router.prefetch("/login");
        router.prefetch("/create");
      } catch {
        /* ignore */
      }
    });
    return () => {
      if (typeof cancel === "number") clearTimeout(cancel);
    };
  }, [router]);

  // ✅ Cache meta filters (grades/subjects) in sessionStorage to reduce API calls
  // - Try to load from sessionStorage first, otherwise fetch /api/meta/filters once.
  useEffect(() => {
    (async () => {
      try {
        const cachedG = sessionStorage.getItem("meta_grades");
        const cachedS = sessionStorage.getItem("meta_subjects");

        if (cachedG) setGrades(JSON.parse(cachedG));
        if (cachedS) setSubjects(JSON.parse(cachedS));

        if (!cachedG || !cachedS) {
          // ✅ Single round-trip endpoint returns both grades and subjects
          const res = await fetch("/api/meta/filters", { cache: "force-cache" });
          if (res.ok) {
            const data = await res.json();
            const gVals = Array.isArray(data?.grades) ? data.grades.map((g) => g.name) : [];
            const sVals = Array.isArray(data?.subjects) ? data.subjects.map((s) => s.name) : [];
            if (gVals.length) {
              setGrades(gVals);
              sessionStorage.setItem("meta_grades", JSON.stringify(gVals));
            }
            if (sVals.length) {
              setSubjects(sVals);
              sessionStorage.setItem("meta_subjects", JSON.stringify(sVals));
            }
          }
        }
      } catch {
        /* ignore */
      }
    })();

    // ✅ Cleanup debounce + abort controllers and clear dropdown timers
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      clearGradeClose();
      clearSubjectClose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Escape regex meta chars for safe regex building
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // ✅ Memoized tokens: recomputed when q changes (improves perf)
  const qTokens = useMemo(
    () =>
      String(q || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    [q]
  );

  // ✅ Memoized regex to highlight query tokens in suggestion text
  const qRegex = useMemo(() => {
    if (!qTokens.length) return null;
    return new RegExp(`(${qTokens.sort((a, b) => b.length - a.length).map(escapeRe).join("|")})`, "ig");
  }, [qTokens]);

  // ✅ Highlights search tokens in a suggestion topic using <mark>
// ✏️ If you want to change highlight style, edit className on <mark>
// e.g., "bg-[#9500DE] text-white rounded px-0.5"
  const highlightTopic = (topic) => {
    const t = String(topic || "");
    if (!qRegex) return t;
    const parts = t.split(qRegex);
    return parts.map((part, i) =>
      qRegex.test(part) ? (
        <mark key={i} className="bg-[#9500DE] text-white rounded px-0.5">
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  // ✅ Simple scoring to sort suggestions by relevance to the query
  const scoreByTopic = (topic) => {
    const T = String(topic || "").toLowerCase();
    if (!T || !qTokens.length) return 0;

    const phrase = qTokens.join(" ");
    let score = 0;

    if (T.startsWith(phrase)) score += 120;
    else if (T.includes(phrase)) score += 90;

    let all = true;
    qTokens.forEach((tk) => {
      if (T.startsWith(tk)) score += 30;
      if (T.includes(tk)) score += 20;
      if (!T.includes(tk)) all = false;
    });
    if (all) score += 40;
    return score;
  };

  // ✅ Input onChange handler: updates query, opens dropdown, and sets loading state
  const onType = (val) => {
    setQ(val);
    if (!hadFirstType) setHadFirstType(true);
    setOpen(true);

    const trimmed = val.trim();
    if (!trimmed) {
      setItems([]);
      setLoading(false);
      return;
    }

    // ✅ Serve from cache instantly if available
    const cached = cacheRef.current.get(trimmed);
    if (cached && cached.length) {
      setItems(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  // ✅ Debounced suggestions fetch: waits 1s after typing stops, cancels previous request if new keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = q.trim();
    if (!trimmed) {
      setItems([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    // ✅ If already fetched this exact query, re-use cache
    if (trimmed === lastFetchedQ) {
      const cached = cacheRef.current.get(trimmed);
      if (cached && cached.length) {
        setItems(cached);
        setLoading(false);
        setOpen(true);
        return;
      }
    }

    // ✅ Fetch after 1000ms debounce
    debounceRef.current = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      const ctrl = new AbortController();
      suggestAbortRef.current = ctrl;

      try {
        const url = `/api/search/suggest?q=${encodeURIComponent(trimmed)}`;
        // ✏️ If you want CDN caching for suggestions, change `{ cache: "no-store" }`
        const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Bad response");

        const data = await res.json();
        const rawItems = Array.isArray(data?.items) ? data.items : [];

        // ✅ Normalize expected fields used in UI
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

        // ✅ Sort by our simple relevance score, take top 4
        const sorted = normalized
          .sort((a, b) => scoreByTopic(b.topic) - scoreByTopic(a.topic))
          .slice(0, 4);

        // ✅ Cache results for this query
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

  // ✅ Close suggestions when clicking outside the search box
  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Navigate to the “See all results” page with the current query
  const goSearch = () => {
    const query = q.trim();
    if (!query) return;
    router.push(`/see-all-results?q=${encodeURIComponent(query)}`);
  };

  // ✅ Helper to push a route with query params (used by grade/subject dropdown clicks)
  const pushWithQuery = (params) => {
    const qs = new URLSearchParams(params).toString();
    router.push(`/explore-library?${qs}`);
  };

  // ✅ Handle clicking a grade from dropdown
  const onClickGrade = (gradeName) => {
    clearGradeClose();
    setShowGradeDropdown(false);
    pushWithQuery({ grades: gradeName });
  };
  // ✅ Handle clicking a subject from dropdown
  const onClickSubject = (subjectName) => {
    clearSubjectClose();
    setShowSubjectDropdown(false);
    pushWithQuery({ subjects: subjectName });
  };

  // ✅ Small loader row for the suggestions menu
  const LoaderRow = () => (
    <div className="px-4 py-3 flex items-center gap-2">
      {/* ✏️ To change spinner size/thickness: adjust h-4 w-4 and strokeWidth */}
      <svg className="h-4 w-4 animate-spin opacity-90" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span className="text-sm opacity-90">Searching…</span>
    </div>
  );

  // ✅ Prefetch presentation detail pages when hovering suggestions for snappier nav
  const prefetchPresentation = (slug) => {
    if (!slug) return;
    try {
      router.prefetch(`/presentations/${slug}`);
    } catch {}
  };

  return (
    <>
      {/* =========================
          TOP NAVIGATION BAR
          - Controls: font sizes, spacings, colors via Tailwind classes.
          - Change outer margins/paddings: edit ml/mr/mt/py classes below.
          - Text size adjustments: md:text-[12px], text-sm, lg:text-[14px], etc.
         ========================= */}
      <nav className="flex flex-wrap items-center justify-between md:ml-8 md:mr-7 md:mt-2 md:py-4 sm:px-30 md:px-0 lg:px-8 xl:mb-10 text-white">
        {/* LOGO LEFT
           ✏️ Change logo width/height: md:w-20, lg:w-30; update classes to scale.
           ✏️ Replace image source: change src="/lessnlogo.svg".
        */}
        <div className="flex items-center md:pl-2">
          <Link href="/" prefetch aria-label="Lessn Home">
            <img
              src="/lessnlogo.svg"
              alt="Lessn logo"
              className="md:w-20 h-auto lg:w-30 object-contain" // ✏️ Control width here (md:w-20, lg:w-30)
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </Link>
        </div>

        {/* CENTER NAV LINKS (DESKTOP)
           - Hidden on small screens: `hidden lg:flex`
           - Change spacing between items: adjust gap classes md:gap-4 / lg:gap-4
           - Change font sizes: md:text-[12px] / lg:text-[14px]
        */}
        <ul className="font-inter hidden lg:flex flex-grow justify-center md:text-[12px] md:gap-4 text-sm lg:text-[14px] lg:gap-4">
          {/* "Explore Library" link
             ✏️ Hover bg color: hover:bg-[#9500DE]
             ✏️ Padding area: px-2 py-2
             ✏️ Text hover color: hover:text-gray-200
          */}
          <li className="hover:bg-[#9500DE] px-2 py-2">
            <Link href="/explore-library" prefetch className="transition hover:text-gray-200 cursor-pointer">
              Explore Library
            </Link>
          </li>

          {/* "Create a Lesson" link */}
          <li className="hover:bg-[#9500DE] px-2 py-2">
            <Link href="/create" prefetch className="transition hover:text-gray-200 cursor-pointer">
              Create a Lesson
            </Link>
          </li>

          {/* GRADE DROPDOWN (DESKTOP)
             - Triggered on hover: onMouseEnter/onMouseLeave handlers
             - Menu width: w-48
             - Colors: bg-gray-800, hover:bg-[#9500DE]
             - Z-index: z-[500] (raise/lower if overlapping issues)
          */}
          <li className="relative hover:bg-[#9500DE] px-2 py-2" onMouseEnter={openGrade} onMouseLeave={leaveGrade}>
            <button type="button" className="flex items-center space-x-1 transition hover:text-gray-200">
              <span>Select Grade</span>
              {/* ▼ caret icon size: className="mt-1 h-3 w-3" */}
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
                    className="px-4 py-2 text-white border-b border-gray-700 last:border-none hover:bg-[#9500DE] cursor-pointer" // ✏️ Item padding/hover color here
                    onClick={() => onClickGrade(grade)}
                  >
                    {grade}
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* SUBJECT DROPDOWN (DESKTOP) */}
          <li className="relative hover:bg-[#9500DE] px-2 py-2" onMouseEnter={openSubject} onMouseLeave={leaveSubject}>
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

        {/* RIGHT-SIDE LINKS (DESKTOP)
           - Hidden on small screens: `hidden lg:flex`
           - Contains Login/Profile and Help icon
           - Font sizes: md:text-[12px], text-sm, lg:text-[14px]
        */}
        <div className="font-inter md:text-[12px] hidden lg:flex lg:gap-4 items-center text-sm lg:text-[14px]">
          {/* ✅ Show Login if no session, otherwise show ProfileDropdown */}
          {!session ? (
            <Link
              href="/login"
              prefetch
              className="transition flex items-center gap-1 hover:text-gray-200 hover:bg-[#9500DE] px-1 py-1" // ✏️ Adjust padding px/py and hover colors
            >
              {/* ← small arrow icon before "Login"; size via width/height */}
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.75 9.40576H7.78125C7.62656 9.40576 7.5 9.2792 7.5 9.12451V8.18701C7.5 8.03232 7.62656 7.90576 7.78125 7.90576H9.75C10.1648 7.90576 10.5 7.57061 10.5 7.15576V2.65576C10.5 2.24092 10.1648 1.90576 9.75 1.90576H7.78125C7.62656 1.90576 7.5 1.7792 7.5 1.62451V0.687012C7.5 0.532324 7.62656 0.405762 7.78125 0.405762H9.75C10.9922 0.405762 12 1.41357 12 2.65576V7.15576C12 8.39795 10.9922 9.40576 9.75 9.40576ZM8.64844 4.69482L4.71094 0.757324C4.35938 0.405762 3.75 0.651855 3.75 1.15576V3.40576H0.5625C0.250781 3.40576 0 3.65654 0 3.96826V6.21826C0 6.52998 0.250781 6.78076 0.5625 6.78076H3.75V9.03076C3.75 9.53467 4.35938 9.78076 4.71094 9.4292L8.64844 5.4917C8.86641 5.27139 8.86641 4.91514 8.64844 4.69482Z"
                  fill="white"
                />
              </svg>
              Login
            </Link>
          ) : (
            // ✏️ ProfileDropdown styling changes live inside the component
            <ProfileDropdown showLabel align="right" />
          )}

          {/* HELP ICON (DESKTOP)
             ✏️ To change image size: className="h-10 w-auto"
             ✏️ To change spacing, modify parent container px/py if needed.
          */}
          <div className="hidden lg:flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium">
            <img
              src="/Help.svg"
              alt="Help icon"
              className="h-10 w-auto object-contain" // ✏️ Change height/width here
              onClick={() => setHelpOpen(true)}
            />
          </div>
        </div>

        {/* =========================
           MOBILE CODE START: Top bar right side (Hamburger + compact links)
           - Visible on small screens: `lg:hidden`
           - Change icon size: className="h-6 w-6"
           - Toggle state: openMobile
           ========================= */}
        <div className="flex items-center gap-7 lg:hidden">
          <div className="hidden md:flex items-center gap-6">
            {/* Compact Login/Profile links for mid-size devices (md breakpoint) */}
            {!session ? (
              <Link href="/login" prefetch className="transition hover:text-gray-200 text-sm md:text-[12px]">
                Login
              </Link>
            ) : (
              <Link href="/profile" prefetch className="transition hover:text-gray-200 text-sm md:text-[12px]">
                My Profile
              </Link>
            )}
          </div>
          {/* HAMBURGER BUTTON (MOBILE) */}
          <button
            className="flex items-center text-gray-200"
            aria-label="Open menu"
            onClick={() => setOpenMobile(!openMobile)}
            type="button"
          >
            {/* Menu icon size: h-6 w-6 */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5h16.5m-16.5 7.5h16.5m-16.5 7.5h16.5" />
            </svg>
          </button>
        </div>
        {/* =========================
           MOBILE CODE END (Top bar)
           ========================= */}
      </nav>

      {/* =========================
         MOBILE SIDE MENU DRAWER
         - Visibility controlled by `openMobile`
         - Width changes per breakpoint: w-[80%] sm:w-[70%] md:w-[45%] lg:w-[30%]
         - Background: bg-[#500078] (change to tweak theme)
         - z-index: z-50 to overlay above content
         ========================= */}
      {openMobile && (
        <div className="fixed inset-y-0 right-0 z-50 w-[80%] sm:w-[70%] md:w-[45%] lg:w-[30%] bg-[#500078] text-white transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full p-4">
            {/* Drawer Header (logo + close button) */}
            <div className="flex justify-between items-center mb-4">
              <Link href="/" prefetch aria-label="Lessn Home">
                {/* ✏️ Change logo size: className="w-16 h-auto" */}
                <img src="/lessnlogo.svg" alt="Lessn logo" className="w-16 h-auto object-contain" />
              </Link>
              <button className="text-gray-200" aria-label="Close menu" onClick={() => setOpenMobile(false)} type="button">
                {/* Close icon size: h-6 w-6 */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Links (mobile navigation) */}
            <div className="flex flex-col space-y-4 text-sm">
              <Link href="/explore-library" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                Explore Library
              </Link>
              <Link href="/create" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                Create a Lesson
              </Link>

              {/* Placeholder buttons for grade/subject on mobile (no dropdown here) */}
              <button className="text-left hover:text-gray-200" type="button">Select Grade</button>
              <button className="text-left hover:text-gray-200" type="button">Select Subject</button>

              {/* Auth-related links visible only on mobile (`md:hidden`) */}
              <div className="flex flex-col space-y-2 pt-2 md:hidden">
                {!session ? (
                  <Link href="/login" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                    Login
                  </Link>
                ) : (
                  <>
                    <Link href="/profile" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                      My Profile
                    </Link>
                    <Link href="/library" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                      My Library
                    </Link>
                    <Link href="/pricing" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                      Pricing & Subscription
                    </Link>
                    {/* ✏️ You can add a Sign Out button here if needed */}
                  </>
                )}
              </div>

              {/* HELP button (mobile) */}
              <button
                className="rounded-full bg-[#24C864] px-3 py-1 text-xs font-medium w-fit" // ✏️ Change size via px/py/text-xs
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

      {/* =========================
         HERO SECTION (center content with left/right illustrations)
         - Control min height: min-h-[370px]
         - For spacing between columns: rely on md:flex-row and widths below
         ========================= */}
      <div className="relative flex flex-col items-center justify-center px-0 text-center md:flex-row md:text-left min-h-[370px]">
        {/* LEFT ILLUSTRATION COLUMN
           - Wrapper widths per breakpoint: md:w-[450px] lg:w-[500px] xl:w-[600px]
           - The visible image is absolutely positioned; invisible img preserves height
        */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-[450px] lg:w-[500px] xl:w-[600px] md:h-full">
          {/* VISIBLE LEFT IMAGE
             ✏️ Change the image file: src="/leftimg.svg"
             ✏️ Size by width classes per breakpoint (sm/md/lg/xl/2xl)
             ✏️ Positioning: absolute bottom-0 left-0 -translate-x-[30px]
          */}
          <img
            src="/leftimg.svg"
            alt="Left illustration"
            className="absolute bottom-0 left-0 -translate-x-[30px] object-contain sm:w-[320px] md:w-[480px] lg:w-[600px] xl:w-[700px] 2xl:w-[800px]" // ✏️ Adjust widths for each breakpoint here
            loading="eager"
            decoding="async"
          />
          {/* INVISIBLE IMAGE
             - Keeps layout stable so the absolute image has height to anchor to.
             ✏️ Adjust intrinsic width of placeholder to match desired layout height.
          */}
          <img
            src="/leftimg.svg"
            alt=""
            aria-hidden="true"
            className="invisible w-[260px] sm:w-[300px] md:w-[360px] lg:w-[420px] xl:w-[500px] h-auto" // ✏️ Change widths to increase/decrease column height
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* CENTER TEXT + SEARCH COLUMN
           - Z-index: z-[300] to sit above overlapping visuals
           - Vertical spacing: space-y-3 (desktop), xl:space-y-6
        */}
        <div className="relative z-[300] mt-8 flex w-full flex-col items-center space-y-3 md:mt-10 md:mb-10 md:justify-center xl:space-y-6">
          {/* HEADLINE TEXT
             ✏️ Font family/weight: font-mulish font-bold
             ✏️ Text color: text-white
             ✏️ Font sizes per breakpoint: sm:text-4xl md:text-[22px] lg:text-[30px] xl:text-[40px]
             - To change sizes: edit these classes.
          */}
          <h1 className="font-mulish font-bold text-white sm:text-4xl md:text-[22px] lg:text-[30px] xl:text-[40px]">
            Your next great Lessn starts here.
          </h1>

          {/* SUBHEAD / TAGLINE
             ✏️ Max width: max-w-md
             ✏️ Text sizes: text-base md:text-[15px] lg:text-[18px] xl:text-[18px]
             ✏️ Color: text-gray-200
          */}
          <p className="max-w-md text-base text-gray-200 md:text-[15px] lg:text-[18px] xl:text-[18px]">
            Build and explore standards-based, AI-driven lessons
          </p>

          {/* SEARCH BAR + SUGGESTIONS */}
          <div
            className="relative flex w-full max-w-sm items-center sm:max-w-md md:max-w-sm lg:max-w-md xl:max-w-lg space-x-3" // ✏️ Change overall search width at each breakpoint via max-w-*
            ref={boxRef}
          >
            {/* SEARCH INPUT
               ✏️ Rounded/full: rounded-full
               ✏️ Border/Color: border border-white bg-transparent text-white placeholder-gray-300
               ✏️ Padding: px-4 py-2
               ✏️ Width: w-full (fills container width)
            */}
            <input
              value={q}
              onChange={(e) => onType(e.target.value)}
              onFocus={() => {
                const trimmed = q.trim();
                if (!trimmed) return;
                const cached = cacheRef.current.get(trimmed);
                setOpen(true);
                if (cached && cached.length) {
                  setItems(cached);
                  setLoading(false);
                } else {
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

            {/* SEARCH BUTTON
               ✏️ Colors: bg-[#f6ebfa] (button bg), text-purple-800 (label color)
               ✏️ Padding: px-4 py-1 (increase for taller button)
               ✏️ Rounded: rounded-full
               ✏️ Shadow: shadow-md
            */}
            <button
              type="button"
              onClick={goSearch}
              className="rounded-full bg-[#f6ebfa] px-4 py-1 text-purple-800 hover:cursor-pointer shadow-md"
            >
              Search
            </button>

            {/* SUGGESTIONS DROPDOWN
               - Anchored absolutely under the input
               ✏️ Background: bg-gray-900
               ✏️ Text: text-white
               ✏️ Border radius: rounded-xl
               ✏️ Shadow: shadow-2xl
               ✏️ z-index: z-[900]
               ✏️ To change vertical offset: style={{ top: "110%" }}
            */}
            {open && (
              <div
                id="hero-suggest"
                role="listbox"
                className="absolute left-0 top[110%] mt-2 w-full bg-gray-900 text-white rounded-xl shadow-2xl z-[900]"
                style={{ top: "110%" }}
              >
                {loading && <LoaderRow />}

                {/* Empty state after first typing */}
                {!loading && items.length === 0 && hadFirstType && (
                  <div className="px-4 py-3 text-sm opacity-80">No matches</div>
                )}

                {/* Suggestions list */}
                {!loading && items.length > 0 && (
                  <div className="divide-y divide-gray-800">
                    {items.map((item) => {
                      const topic = item.topic || "Untitled";
                      const grade = item.grade || "";
                      const subtopic = item.subtopic || item.sub_topic || "";
                      const snippetShort = (() => {
                        const t = stripHtml(item.snippet || "");
                        return t.length > 140 ? t.slice(0, 140) + "…" : t; // ✏️ Change 140 to expand/collapse preview
                      })();

                      const href = `/presentations/${item.slug}`;

                      return (
                        <Link
                          key={item.id || item.slug || topic}
                          href={href}
                          prefetch
                          className="block px-4 py-3 hover:bg-[#9500DE]" // ✏️ Item padding/hover color
                          onClick={() => setOpen(false)}
                          onMouseEnter={() => prefetchPresentation(item.slug)}
                          onFocus={() => prefetchPresentation(item.slug)}
                          role="option"
                        >
                          {/* Topic (bold-ish look via font-semibold) */}
                          <div className="text-sm font-semibold">{highlightTopic(topic)}</div>
                          {/* Grade line */}
                          {grade && <div className="text-xs opacity-80">Grade: {grade}</div>}
                          {/* Subtopic line */}
                          {subtopic && <div className="text-xs opacity-80">{subtopic}</div>}
                          {/* Snippet preview (truncate) */}
                          {snippetShort && <div className="text-[11px] mt-1 line-clamp-1 opacity-60">{snippetShort}</div>}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* "See all results" button at the bottom of the suggestions */}
                <button
                  className="w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700" // ✏️ Adjust padding/text size/colors here
                  onClick={() => router.push(`/see-all-results?q=${encodeURIComponent(q)}`)}
                >
                  See all results
                </button>
              </div>
            )}
          </div>

          {/* "Or Generate a new lesson" row
             ✏️ Button styles: bg-[#d08bf2] rounded-full, padding md:px-4 py-2, text color text-white
             ✏️ Adjust spacing between "Or" and button via parent container: md:space-x-4
          */}
          <div className="flex items-center justify-center md:space-x-4">
            <span className="text-gray-200">Or</span>
            <Link href="/create" prefetch className="rounded-full bg-[#d08bf2] md:px-4 py-2 text-white cursor-pointer">
              Generate a new lesson
            </Link>
          </div>
        </div>

        {/* RIGHT ILLUSTRATION COLUMN
           - Absolute image, with invisible spacer image for layout stabilization
           ✏️ Change sizes per breakpoint via md:w-*, lg:w-*, xl:max-w-*, 2xl:max-w-*
        */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-1/2 md:h-full">
          {/* VISIBLE RIGHT IMAGE
             ✏️ Change src="/rightimg.svg"
             ✏️ Adjust width constraints with sm/md/lg/xl/2xl classes
          */}
          <img
            src="/rightimg.svg"
            alt="Right illustration"
            className="absolute bottom-0 right-0 object-contain sm:max-w-[350px] md:w-[200px] lg:w-[250px] xl:max-w-[480px] 2xl:max-w-[560px]"
            decoding="async"
          />
          {/* INVISIBLE SPACER */}
          <img
            src="/rightimg.svg"
            alt=""
            aria-hidden="true"
            className="invisible w-2/3 max-w-[350px] object-contain sm:max-w-[350px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] 2xl:max-w-[560px]"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {helpOpen && <HelpPopup open={helpOpen} onClose={() => setHelpOpen(false)} />}
    </>
  );
};

export default HeroSection;
