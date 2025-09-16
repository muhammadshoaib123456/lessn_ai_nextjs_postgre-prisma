// components/HeroSection.jsx
"use client";

/**
 * ✅ WHAT THIS FILE DOES
 * A fully client-side Hero/Header section with:
 * - Top navigation (logo, Explore, Create, Select Grade/Subject dropdowns)
 * - Login/Profile area + Help popup
 * - Mobile slide-in menu
 * - Hero search box with debounced suggestions + keyboard "Enter" to search
 * - Left/Right decorative images
 *
 * 🔧 WHERE TO CUSTOMIZE (quick map)
 * Colors / Hover states .......... Tailwind classes in JSX (e.g., bg-[#9500DE], text-white, hover:bg-*)
 * Width / Height of elements ..... Tailwind sizing classes (w-*, h-*, max-w-*, px-*, py-*)
 * UI Text (labels, placeholders) . Inline strings (e.g., "Explore Library", "Search", placeholders)
 * Search behavior ................. Debounce timing, fetch URL (/api/search/suggest), result scoring, max items
 * Images (left/right/logo/help) ... <img src="/leftimg.svg" />, <img src="/rightimg.svg" />, <img src="/lessnlogo.svg" />
 * Dropdown items (grades/subjects) Session-cached values from /api/meta/filters (fallback arrays below)
 *
 * 🧩 Tailwind tip
 * Most CSS tweaks (color, border, spacing, hover) can be done by editing tailwind
 * classNames directly where you see them in the markup.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import ProfileDropdown from "@/components/ProfileDropdown";

// Lazy-load the Help modal to reduce initial JS
const HelpPopup = dynamic(() => import("@/components/HelpPopup"), {
  ssr: false,
  loading: () => null,
});

// Utility: remove any HTML tags from strings
const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();

const HeroSection = () => {
  const { data: session } = useSession();

  // ──────────────────────────────────────────────────────────────────────────
  // NAV STATE (desktop hover dropdowns + mobile menu)
  // ──────────────────────────────────────────────────────────────────────────
  const [openMobile, setOpenMobile] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Controls how long after mouse leaves before menus close
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
    gradeCloseRef.current = setTimeout(() => setShowGradeDropdown(false), LEAVE_CLOSE_MS);
  };
  const leaveSubject = () => {
    clearSubjectClose();
    subjectCloseRef.current = setTimeout(() => setShowSubjectDropdown(false), LEAVE_CLOSE_MS);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SEARCH STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [q, setQ] = useState(""); // 🔤 UI TEXT: search input value
  const [open, setOpen] = useState(false); // open/close suggestion panel
  const [items, setItems] = useState([]); // suggestion items
  const [loading, setLoading] = useState(false); // loader row
  const [hadFirstType, setHadFirstType] = useState(false); // to show "No matches" state

  const boxRef = useRef(null);
  const router = useRouter();
  const suggestAbortRef = useRef(null);
  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map()); // local cache for suggestions
  const [lastFetchedQ, setLastFetchedQ] = useState("");

  // ──────────────────────────────────────────────────────────────────────────
  // DROPDOWN DATA (grades/subjects)
  // - We try to read from sessionStorage -> else fetch from /api/meta/filters
  // - You can hardcode or change fallback arrays below
  // ──────────────────────────────────────────────────────────────────────────
  const [grades, setGrades] = useState([
    // ✏️ UI TEXT: change/rename grades here if needed (Fallback only)
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
    // ✏️ UI TEXT: change/rename subjects here if needed (Fallback only)
    "Language arts",
    "Math",
    "Science",
    "Social Studies",
  ]);

  // Prefetch a few routes in the background for snappier nav
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

  // Load meta lists (grades/subjects) from API (cached in sessionStorage)
  useEffect(() => {
    (async () => {
      try {
        const cachedG = sessionStorage.getItem("meta_grades");
        const cachedS = sessionStorage.getItem("meta_subjects");

        if (cachedG) setGrades(JSON.parse(cachedG));
        if (cachedS) setSubjects(JSON.parse(cachedS));

        // Change /api/meta/filters if your backend path differs
        if (!cachedG || !cachedS) {
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

    // cleanup timers/aborters on unmount
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      clearGradeClose();
      clearSubjectClose();
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // SEARCH HIGHLIGHT & SCORING (client-side ranking)
  // - You can tweak the scoring weights in scoreByTopic()
  // - highlightTopic wraps matches in a <mark> tag (Tailwind styled)
  // ──────────────────────────────────────────────────────────────────────────
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const qTokens = useMemo(
    () => String(q || "").trim().split(/\s+/).filter(Boolean),
    [q]
  );
  const qRegex = useMemo(() => {
    if (!qTokens.length) return null;
    // 🧪 If you want to change the highlight color, update the <mark> classes below.
    return new RegExp(`(${qTokens.sort((a, b) => b.length - a.length).map(escapeRe).join("|")})`, "ig");
  }, [qTokens]);

  const highlightTopic = (text) => {
    const t = String(text || "");
    if (!qRegex) return t;
    const parts = t.split(qRegex);
    return parts.map((part, i) =>
      // NOTE: .test() advances lastIndex on global regex; but since split keeps separators we can safely test part
      qRegex.test(part) ? (
        <mark key={i} className="bg-[#9500DE] text-white rounded px-0.5">
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  const scoreByTopic = (topic) => {
    // ⚖️ Adjust weights here to change suggestion ordering
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

  // Called on each keystroke; sets loading state & shows cached results if present
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
    const cached = cacheRef.current.get(trimmed);
    if (cached && cached.length) {
      setItems(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  // Debounced fetch to /api/search/suggest
  // 🕐 To change the debounce time, edit the setTimeout(..., 1000) value below.
  // 🌐 To change the API endpoint/params, modify the `url` construction below.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (!trimmed) {
      setItems([]);
      setLoading(false);
      setOpen(false);
      return;
    }
    if (trimmed === lastFetchedQ) {
      const cached = cacheRef.current.get(trimmed);
      if (cached && cached.length) {
        setItems(cached);
        setLoading(false);
        setOpen(true);
        return;
      }
    }
    debounceRef.current = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      const ctrl = new AbortController();
      suggestAbortRef.current = ctrl;
      try {
        // 🔁 CHANGE THIS to match your backend suggest route
        const url = `/api/search/suggest?q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();
        const rawItems = Array.isArray(data?.items) ? data.items : [];
        const normalized = rawItems.map((x) => ({
          id: x.id || x.slug || x.topic || x.title || x.name,
          slug: x.slug,
          topic: x.topic || x.title || x.name || "Untitled",
          grade: x.grade || "",
          subtopic: x.subtopic || x.sub_topic || "",
          snippet: x.snippet ?? x.presentation_content ?? x.presentation_html ?? x.content ?? "",
        }));
        // Order by our score & keep top N (✏️ change .slice(0, 4) to show more/less)
        const sorted = normalized.sort((a, b) => scoreByTopic(b.topic) - scoreByTopic(a.topic)).slice(0, 4);
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
  }, [q, lastFetchedQ]);

  // Close suggestions when clicking outside of the search box
  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Perform the full results search navigation
  const goSearch = () => {
    const query = q.trim();
    if (!query) return;
    // 🔁 Change /see-all-results route if your routing differs
    router.push(`/see-all-results?q=${encodeURIComponent(query)}`);
  };

  // Navigate to Explore Library with query params (grade/subject selections)
  const pushWithQuery = (params) => {
    // e.g., { grades: "Third Grade" } -> /explore-library?grades=Third+Grade
    const qs = new URLSearchParams(params).toString();
    router.push(`/explore-library?${qs}`);
  };
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

  // Small loader row used in suggestion panel
  const LoaderRow = () => (
    <div className="px-4 py-3 flex items-center gap-2">
      {/* 🎨 ICON COLOR: inherits from text color; change via parent classes */}
      <svg className="h-4 w-4 animate-spin opacity-90" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 0 1 -9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span className="text-sm opacity-90">Searching…</span>
    </div>
  );

  // Prefetch presentation page for faster hover → click nav
  const prefetchPresentation = (slug) => {
    if (!slug) return;
    try {
      // 🔁 Change route prefix if your presentation path differs
      router.prefetch(`/presentations/${slug}`);
    } catch {}
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────
          TOP NAVBAR
          - PRIMARY COLORS: text-white / hover:bg-[#9500DE]
          - HEIGHT / PADDING: tweak md:py-4, px classes, etc.
          - LOGO IMAGE: <img src="/lessnlogo.svg" /> (change src to replace image)
         ──────────────────────────────────────────────────────────────────── */}
      <nav className="flex flex-wrap items-center justify-between md:ml-8 md:mr-7 md:mt-2 md:py-4 sm:px-30 md:px-0 lg:px-8 xl:mb-10 text-white">
        {/* Logo (left) */}
        <div className="flex items-center md:pl-2">
          <Link href="/" prefetch aria-label="Lessn Home">
            <img
              src="/lessnlogo.svg" // 🖼️ Replace to change the logo image
              alt="Lessn logo"
              className="md:w-20 h-auto lg:w-30 object-contain" // 📏 WIDTH/HEIGHT: adjust md:w-20 / lg:w-30
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </Link>
        </div>

        {/* Center nav (desktop) */}
        <ul className="font-inter hidden lg:flex flex-grow justify-center md:text-[12px] md:gap-4 text-sm lg:text-[14px] lg:gap-4">
          <li className="hover:bg-[#9500DE] px-2 py-2">
            {/* ✏️ UI TEXT */}
            <Link href="/explore-library" prefetch className="transition hover:text-gray-200 cursor-pointer">
              Explore Library
            </Link>
          </li>
          <li className="hover:bg-[#9500DE] px-2 py-2">
            {/* ✏️ UI TEXT */}
            <Link href="/create" prefetch className="transition hover:text-gray-200 cursor-pointer">
              Create a Lesson
            </Link>
          </li>

          {/* Grade dropdown */}
          <li
            className="relative hover:bg-[#9500DE] px-2 py-2"
            onMouseEnter={openGrade}
            onMouseLeave={leaveGrade}
          >
            <button type="button" className="flex items-center space-x-1 transition hover:text-gray-200">
              <span>Select Grade</span> {/* ✏️ UI TEXT */}
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

          {/* Subject dropdown */}
          <li
            className="relative hover:bg-[#9500DE] px-2 py-2"
            onMouseEnter={openSubject}
            onMouseLeave={leaveSubject}
          >
            <button type="button" className="flex items-center space-x-1 transition hover:text-gray-200">
              <span>Select Subject</span> {/* ✏️ UI TEXT */}
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

        {/* Right side: Login/Profile + Help (desktop) */}
        <div className="font-inter md:text-[12px] hidden lg:flex lg:gap-4 items-center text-sm lg:text-[14px]">
          {!session ? (
            <Link
              href="/login"
              prefetch
              className="transition flex items-center gap-1 hover:text-gray-200 hover:bg-[#9500DE] px-1 py-1"
            >
              {/* ✏️ UI TEXT */}
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  d="M9.75 9.40576H7.78125C7.62656 9.40576 7.5 9.2792 7.5 9.12451V8.18701C7.5 8.03232 7.62656 7.90576 7.78125 7.90576H9.75C10.1648 7.90576 10.5 7.57061 10.5 7.15576V2.65576C10.5 2.24092 10.1648 1.90576 9.75 1.90576H7.78125C7.62656 1.90576 7.5 1.7792 7.5 1.62451V0.687012C7.5 0.532324 7.62656 0.405762 7.78125 0.405762H9.75C10.9922 0.405762 12 1.41357 12 2.65576V7.15576C12 8.39795 10.9922 9.40576 9.75 9.40576ZM8.64844 4.69482L4.71094 0.757324C4.35938 0.405762 3.75 0.651855 3.75 1.15576V3.40576H0.5625C0.250781 3.40576 0 3.65654 0 3.96826V6.21826C0 6.52998 0.250781 6.78076 0.5625 6.78076H3.75V9.03076C3.75 9.53467 4.35938 9.78076 4.71094 9.4292L8.64844 5.4917C8.86641 5.27139 8.86641 4.91514 8.64844 4.69482Z"
                  fill="white"
                />
              </svg>
              Login
            </Link>
          ) : (
            // If logged in, show a profile dropdown (component provided elsewhere)
            <ProfileDropdown showLabel align="right" />
          )}

          {/* Help button/icon (opens HelpPopup) */}
          <div className="hidden lg:flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium">
            <img
              src="/Help.svg" // 🖼️ Replace to change the help icon
              alt="Help icon"
              className="h-10 w-auto object-contain" // 📏 Adjust help icon size here
              onClick={() => setHelpOpen(true)}
            />
          </div>
        </div>

        {/* Right side: Mobile hamburger */}
        <div className="flex items-center gap-7 lg:hidden">
          <div className="hidden md:flex items-center gap-6">
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
          <button
            className="flex items-center text-gray-200"
            aria-label="Open menu"
            onClick={() => setOpenMobile(!openMobile)}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5h16.5M3.75 12.5h16.5M3.75 19.5h16.5" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────────────
          MOBILE SLIDE-IN MENU
          - Panel BG color ............. bg-[#500078]
          - Width ...................... w-[80%] sm:w-[70%] md:w-[45%] lg:w-[30%]
         ──────────────────────────────────────────────────────────────────── */}
      {openMobile && (
        <div className="fixed inset-y-0 right-0 z-50 w-[80%] sm:w-[70%] md:w-[45%] lg:w-[30%] bg-[#500078] text-white transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full p-4">
            {/* Mobile header (logo + close button) */}
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
                  fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile links */}
            <div className="flex flex-col space-y-4 text-sm">
              <Link href="/explore-library" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                Explore Library
              </Link>
              <Link href="/create" prefetch className="hover:text-gray-200" onClick={() => setOpenMobile(false)}>
                Create a Lesson
              </Link>
              <button className="text-left hover:text-gray-200" type="button">Select Grade</button>
              <button className="text-left hover:text-gray-200" type="button">Select Subject</button>

              {/* Quick account links (only show when NOT large screens) */}
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
                  </>
                )}
              </div>

              {/* Help CTA */}
              <button
                className="rounded-full bg-[#24C864] px-3 py-1 text-xs font-medium w-fit" // 🎨 Change green color here
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

      {/* ─────────────────────────────────────────────────────────────────────
          HERO BODY
          - LEFT IMAGE ................. /leftimg.svg
          - RIGHT IMAGE ................ /rightimg.svg
          - HEADLINE / SUBTEXT ......... edit strings below
          - SEARCH AREA ................ see <input> and suggestion panel
         ──────────────────────────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center px-0 text-center md:flex-row md:text-left min-h-[370px]">
        {/* LEFT DECOR IMAGE (set sizes with sm:/md:/lg: width classes) */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-[450px] lg:w-[500px] xl:w-[600px] md:h-full">
          <img
            src="/leftimg.svg" // 🖼️ Replace file to change the left illustration
            alt="Left illustration"
            className="absolute bottom-0 left-0 -translate-x-[30px] object-contain sm:w-[320px] md:w-[480px] lg:w-[600px] xl:w-[700px] 2xl:w-[800px]" // 📏 Width/position
            loading="eager"
            decoding="async"
          />
          {/* Invisible placeholder preserves layout height */}
          <img
            src="/leftimg.svg"
            alt=""
            aria-hidden="true"
            className="invisible w-[260px] sm:w-[300px] md:w-[360px] lg:w-[420px] xl:w-[500px] h-auto"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* CENTER: HEADLINE + SEARCH */}
        <div className="relative z-[300] mt-8 flex w-full flex-col items-center space-y-3 md:mt-10 md:mb-10 md:justify-center xl:space-y-6">
          {/* ✏️ UI TEXT: Headline */}
          <h1 className="font-mulish font-bold text-white sm:text-4xl md:text-[22px] lg:text-[30px] xl:text-[40px]">
            Your next great Lessn starts here.
          </h1>

          {/* ✏️ UI TEXT: Subheading */}
          <p className="max-w-md text-base text-gray-200 md:text-[15px] lg:text-[18px] xl:text-[18px]">
            Build and explore standards-based, AI-driven lessons
          </p>

          {/* SEARCH BOX + SUGGESTIONS
              - Border/Background color .... border-white bg-transparent
              - Text color .................. text-white placeholder-gray-300
              - Button color ................ bg-[#f6ebfa] text-purple-800
              - Panel BG .................... bg-gray-900; row hover bg-[#9500DE]
           */}
          <div
            className="relative flex w-full max-w-sm items-center sm:max-w-md md:max-w-sm lg:max-w-md xl:max-w-lg space-x-3"
            ref={boxRef}
          >
            {/* 🔤 Input styles (width/height/colors) are Tailwind classes below */}
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
              placeholder="Search e.g. English colonies, unit rates…" // ✏️ UI TEXT: placeholder
              className="w-full flex-grow appearance-none rounded-full border border-white bg-transparent px-4 py-2 text-white placeholder-gray-300 focus:outline-none"
              // 🔧 WIDTH/HEIGHT: px-4 py-2 for padding; rounded-full for pill; border-* / text-* for colors
              type="text"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="hero-suggest"
            />

            {/* Search button */}
            <button
              type="button"
              onClick={goSearch}
              className="rounded-full bg-[#f6ebfa] px-4 py-1 text-purple-800 hover:cursor-pointer shadow-md"
              // 🎨 BUTTON COLOR: change bg-[#f6ebfa] + text-purple-800 for brand colors
            >
              Search
            </button>

            {/* Suggestion dropdown */}
            {open && (
              <div
                id="hero-suggest"
                role="listbox"
                className="absolute left-0 mt-2 w-full bg-gray-900 text-white rounded-xl shadow-2xl z-[900]"
                style={{ top: "110%" }} // ⬇️ move panel down/up by changing % (or replace with Tailwind top-* classes)
              >
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
                      const snippetShort = (() => {
                        const t = stripHtml(item.snippet || "");
                        return t.length > 140 ? t.slice(0, 140) + "…" : t;
                      })();

                      // 🔁 Change this href if your presentation route differs
                      const href = `/presentations/${item.slug}`;

                      return (
                        <Link
                          key={item.id || item.slug || topic}
                          href={href}
                          prefetch
                          className="block px-4 py-3 hover:bg-[#9500DE]" // 🎨 ROW HOVER COLOR
                          onClick={() => setOpen(false)}
                          onMouseEnter={() => prefetchPresentation(item.slug)}
                          onFocus={() => prefetchPresentation(item.slug)}
                          role="option"
                        >
                          <div className="text-sm font-semibold">{highlightTopic(topic)}</div>
                          {grade && (
                            <div className="text-xs opacity-80">Grade: {highlightTopic(grade)}</div>
                          )}
                          {subtopic && (
                            <div className="text-xs opacity-80">{highlightTopic(subtopic)}</div>
                          )}
                          {snippetShort && (
                            <div className="text-[11px] mt-1 line-clamp-1 opacity-60">
                              {highlightTopic(snippetShort)}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* "See all results" CTA */}
                <button
                  className="w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700"
                  onClick={() => router.push(`/see-all-results?q=${encodeURIComponent(q)}`)}
                >
                  See all results
                </button>
              </div>
            )}
          </div>

          {/* Generate new lesson CTA */}
          <div className="flex items-center justify-center md:space-x-4">
            <span className="text-gray-200">Or</span> {/* ✏️ UI TEXT */}
            <Link
              href="/create"
              prefetch
              className="rounded-full bg-[#d08bf2] md:px-4 py-2 text-white cursor-pointer"
              // 🎨 BUTTON COLOR: bg-[#d08bf2] (change to your brand)
            >
              Generate a new lesson
            </Link>
          </div>
        </div>

        {/* RIGHT DECOR IMAGE */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-1/2 md:h-full">
          <img
            src="/rightimg.svg" // 🖼️ Replace file to change the right illustration
            alt="Right illustration"
            className="absolute bottom-0 right-0 object-contain sm:max-w-[350px] md:w-[200px] lg:w-[250px] xl:max-w-[480px] 2xl:max-w-[560px]"
            decoding="async"
          />
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

      {/* Help modal */}
      {helpOpen && <HelpPopup open={helpOpen} onClose={() => setHelpOpen(false)} />}
    </>
  );
};

export default HeroSection;
