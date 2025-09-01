// components/HeroSection.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HelpPopup from "./HelpPopup";

const HeroSection = () => {
  // --- NAV / UI STATE (unchanged) ---
  const [openMobile, setOpenMobile] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // --- SEARCH/SUGGEST STATE (unchanged) ---
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const router = useRouter();

  // NEW: dynamic lists from your DB APIs (fallback to your old statics if fetch fails)
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
  ]);
  const [subjects, setSubjects] = useState([
    "Language arts",
    "Math",
    "Science",
    "Social Studies",
  ]);

  // Fetch dynamic grades/subjects ONCE (from /api/grade and /api/subject)
  useEffect(() => {
    (async () => {
      try {
        const [gr, sj] = await Promise.all([
          fetch("/api/grade", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/subject", { cache: "no-store" }).then((r) => r.json()),
        ]);

        // APIs return [{ name, count }]; we only need the names
        if (Array.isArray(gr) && gr.length) setGrades(gr.map((g) => g.name));
        if (Array.isArray(sj) && sj.length) setSubjects(sj.map((s) => s.name));
      } catch {
        // keep fallbacks already set in state
      }
    })();
  }, []);

  // Debounced fetch to /api/search/suggest
  useEffect(() => {
    const t = setTimeout(async () => {
      const query = q.trim();
      if (query.length < 2) {
        setItems([]);
        setOpen(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(query)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setItems(data.items || []);
        setOpen(true);
      } catch {
        setItems([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close suggestions on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Go to Explore with q
  function goSearch() {
    const query = q.trim();
    if (!query) return;
    router.push(`/explore-library?q=${encodeURIComponent(query)}`);
  }

  // Click handlers for dropdown items (navigate; keep your UI)
  const onClickGrade = (name) => {
    setShowGradeDropdown(false);
    router.push(`/explore-library?grade=${encodeURIComponent(name)}`);
  };
  const onClickSubject = (name) => {
    setShowSubjectDropdown(false);
    router.push(`/explore-library?subject=${encodeURIComponent(name)}`);
  };

  return (
    <>
      {/* TOP NAV */}
      <nav className="flex flex-wrap items-center justify-between md:ml-8 md:mr-7 md:mt-2 md:py-4 sm:px-30 md:px-0 lg:px-8 xl:mb-10 text-white">
        {/* Logo */}
        <div className="flex items-center md:pl-2">
          <img
            src="/lessnlogo.svg"
            alt="Lessn logo"
            className="md:w-20 h-auto lg:w-30 object-contain"
          />
        </div>

        {/* Center links (lg+) */}
        <ul className="font-inter hidden lg:flex flex-grow justify-center md:text-[12px] md:gap-4 text-sm lg:text-[14px] lg:gap-4">
          <li className="hover:bg-[#9500DE] px-2 py-2">
            <Link
              href="/explore-library"
              className="transition hover:text-gray-200 hover:cursor-pointer"
            >
              Explore Library
            </Link>
          </li>
          <li className="hover:bg-[#9500DE] px-2 py-2">
            <Link
              href="/create"
              className="transition hover:text-gray-200 hover:cursor-pointer"
            >
              Create a Lesson
            </Link>
          </li>

          {/* Grade selector (now populated from /api/grade; no counts; hover opens) */}
          <li
            className="relative hover:bg-[#9500DE] px-2 py-2"
            onMouseEnter={() => setShowGradeDropdown(true)}
            onMouseLeave={() => setShowGradeDropdown(false)}
          >
            <button
              className="flex items-center space-x-1 transition hover:text-gray-200"
              type="button"
            >
              <span>Select Grade</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="mt-1 h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
            {showGradeDropdown && (
              <ul className="absolute left-0 top-full mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-50">
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

          {/* Subject selector (now populated from /api/subject; no counts; hover opens) */}
          <li
            className="relative hover:bg-[#9500DE] px-2 py-2"
            onMouseEnter={() => setShowSubjectDropdown(true)}
            onMouseLeave={() => setShowSubjectDropdown(false)}
          >
            <button
              className="flex items-center space-x-1 transition hover:text-gray-200"
              type="button"
            >
              <span>Select Subject</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="mt-1 h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
            {showSubjectDropdown && (
              <ul className="absolute left-0 top-full mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-50">
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

        {/* Right cluster (lg+) */}
        <div className="font-inter md:text-[12px] hidden lg:flex lg:gap-4 items-center text-sm lg:text-[14px]">
          <Link
            href="/login"
            className="transition flex items-center gap-1 hover:text-gray-200 hover:bg-[#9500DE] px-1 py-1"
          >
            <svg
              width="12"
              height="10"
              viewBox="0 0 12 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.75 9.40576H7.78125C7.62656 9.40576 7.5 9.2792 7.5 9.12451V8.18701C7.5 8.03232 7.62656 7.90576 7.78125 7.90576H9.75C10.1648 7.90576 10.5 7.57061 10.5 7.15576V2.65576C10.5 2.24092 10.1648 1.90576 9.75 1.90576H7.78125C7.62656 1.90576 7.5 1.7792 7.5 1.62451V0.687012C7.5 0.532324 7.62656 0.405762 7.78125 0.405762H9.75C10.9922 0.405762 12 1.41357 12 2.65576V7.15576C12 8.39795 10.9922 9.40576 9.75 9.40576ZM8.64844 4.69482L4.71094 0.757324C4.35938 0.405762 3.75 0.651855 3.75 1.15576V3.40576H0.5625C0.250781 3.40576 0 3.65654 0 3.96826V6.21826C0 6.52998 0.250781 6.78076 0.5625 6.78076H3.75V9.03076C3.75 9.53467 4.35938 9.78076 4.71094 9.4292L8.64844 5.4917C8.86641 5.27139 8.86641 4.91514 8.64844 4.69482Z"
                fill="white"
              />
            </svg>
            Login
          </Link>
          <Link
            href="/register"
            className="transition flex items-center gap-1 hover:text-gray-200 hover:bg-[#9500DE] px-1 py-1"
          >
            <svg
              width="14"
              height="12"
              viewBox="0 0 14 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.65 4.95446H12.25V3.56039C12.25 3.3687 12.0925 3.21187 11.9 3.21187H11.2C11.0075 3.21187 10.85 3.3687 10.85 3.56039V4.95446H9.45C9.2575 4.95446 9.1 5.11129 9.1 5.30297V6.00001C9.1 6.19169 9.2575 6.34852 9.45 6.34852H10.85V7.74259C10.85 7.93428 11.0075 8.09111 11.2 8.09111H11.9C12.0925 8.09111 12.25 7.93428 12.25 7.74259V6.34852H13.65C13.8425 6.34852 14 6.19169 14 6.00001V5.30297C14 5.11129 13.8425 4.95446 13.65 4.95446ZM4.9 6.00001C6.44656 6.00001 7.7 4.75188 7.7 3.21187C7.7 1.67186 6.44656 0.423737 4.9 0.423737C3.35344 0.423737 2.1 1.67186 2.1 3.21187C2.1 4.75188 3.35344 6.00001 4.9 6.00001ZM6.86 6.69704H6.49469C6.00906 6.91922 5.46875 7.04556 4.9 7.04556C4.33125 7.04556 3.79313 6.91922 3.30531 6.69704H2.94C1.31687 6.69704 0 8.00834 0 9.62458V10.5307C0 11.108 0.470313 11.5763 1.05 11.5763H8.75C9.32969 11.5763 9.8 11.108 9.8 10.5307V9.62458C9.8 8.00834 8.48312 6.69704 6.86 6.69704Z"
                fill="white"
              />
            </svg>
            Register
          </Link>
          <div className="hidden lg:flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium">
            <img
              src="/Help.svg"
              alt="Help icon"
              className="h-10 w-auto object-contain"
              onClick={() => setHelpOpen(true)}
            />
          </div>
        </div>

        {/* Right cluster (lg-) */}
        <div className="flex items-center gap-7 lg:hidden">
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/login"
              className="transition flex gap-1 items-center hover:text-gray-200 text-sm md:text-[12px]"
            >
              <svg
                width="12"
                height="10"
                viewBox="0 0 12 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.75 9.40576H7.78125C7.62656 9.40576 7.5 9.2792 7.5 9.12451V8.18701C7.5 8.03232 7.62656 7.90576 7.78125 7.90576H9.75C10.1648 7.90576 10.5 7.57061 10.5 7.15576V2.65576C10.5 2.24092 10.1648 1.90576 9.75 1.90576H7.78125C7.62656 1.90576 7.5 1.7792 7.5 1.62451V0.687012C7.5 0.532324 7.62656 0.405762 7.78125 0.405762H9.75C10.9922 0.405762 12 1.41357 12 2.65576V7.15576C12 8.39795 10.9922 9.40576 9.75 9.40576ZM8.64844 4.69482L4.71094 0.757324C4.35938 0.405762 3.75 0.651855 3.75 1.15576V3.40576H0.5625C0.250781 3.40576 0 3.65654 0 3.96826V6.21826C0 6.52998 0.250781 6.78076 0.5625 6.78076H3.75V9.03076C3.75 9.53467 4.35938 9.78076 4.71094 9.4292L8.64844 5.4917C8.86641 5.27139 8.86641 4.91514 8.64844 4.69482Z"
                  fill="white"
                />
              </svg>
              Login
            </Link>
            <Link
              href="/register"
              className="transition flex gap-1 items-center hover:text-gray-200 text-sm md:text-[12px]"
            >
              <svg
                width="14"
                height="12"
                viewBox="0 0 14 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.65 4.95446H12.25V3.56039C12.25 3.3687 12.0925 3.21187 11.9 3.21187H11.2C11.0075 3.21187 10.85 3.3687 10.85 3.56039V4.95446H9.45C9.2575 4.95446 9.1 5.11129 9.1 5.30297V6.00001C9.1 6.19169 9.2575 6.34852 9.45 6.34852H10.85V7.74259C10.85 7.93428 11.0075 8.09111 11.2 8.09111H11.9C12.0925 8.09111 12.25 7.93428 12.25 7.74259V6.34852H13.65C13.8425 6.34852 14 6.19169 14 6.00001V5.30297C14 5.11129 13.8425 4.95446 13.65 4.95446ZM4.9 6.00001C6.44656 6.00001 7.7 4.75188 7.7 3.21187C7.7 1.67186 6.44656 0.423737 4.9 0.423737C3.35344 0.423737 2.1 1.67186 2.1 3.21187C2.1 4.75188 3.35344 6.00001 4.9 6.00001ZM6.86 6.69704H6.49469C6.00906 6.91922 5.46875 7.04556 4.9 7.04556C4.33125 7.04556 3.79313 6.91922 3.30531 6.69704H2.94C1.31687 6.69704 0 8.00834 0 9.62458V10.5307C0 11.108 0.470313 11.5763 1.05 11.5763H8.75C9.32969 11.5763 9.8 11.108 9.8 10.5307V9.62458C9.8 8.00834 8.48312 6.69704 6.86 6.69704Z"
                fill="white"
              />
              </svg>
              Register
            </Link>
          </div>

          {/* Hamburger */}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 5h16.5m-16.5 7.5h16.5m-16.5 7.5h16.5"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Side menu (hamburger) */}
      {openMobile && (
        <div className="fixed inset-y-0 right-0 z-50 w-[80%] sm:w-[70%] md:w-[45%] lg:w-[30%] bg-[#500078] text-white transform transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
              <img
                src="/lessnlogo.svg"
                alt="Lessn logo"
                className="w-16 h-auto object-contain"
              />
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col space-y-4 text-sm">
              <Link
                href="/explore-library"
                className="hover:text-gray-200"
                onClick={() => setOpenMobile(false)}
              >
                Explore Library
              </Link>
              <Link
                href="/create"
                className="hover:text-gray-200"
                onClick={() => setOpenMobile(false)}
              >
                Create a Lesson
              </Link>

              {/* Mobile simple buttons (keep UI simple) */}
              <button className="text-left hover:text-gray-200" type="button">
                Select Grade
              </button>
              <button className="text-left hover:text-gray-200" type="button">
                Select Subject
              </button>

              {/* Small screens: login/register inside the menu */}
              <div className="flex flex-col space-y-2 pt-2 md:hidden">
                <Link
                  href="/login"
                  className="hover:text-gray-200"
                  onClick={() => setOpenMobile(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hover:text-gray-200"
                  onClick={() => setOpenMobile(false)}
                >
                  Register
                </Link>
              </div>

              {/* Help pill */}
              <button
                className="rounded-full bg-[#24C864] px-3 py-1 text-xs font-medium text-center w-fit"
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

      {/* HERO CONTENT */}
      <div
        className="relative flex flex-col items-center justify-center px-0 text-center md:flex-row md:text-left
                min-h-[370px] md:min-h-[370px] lg:min-h-[370px] xl:min-h-[370px]"
      >
        {/* Left art */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-[450px] lg:w-[500px] xl:w-[600px] md:h-full ">
          <img
            src="/leftimg.svg"
            alt="Left illustration"
            className="absolute bottom-0 left-0 -translate-x-[30px] object-contain
             sm:w-[320px] md:w-[480px] lg:w-[600px] xl:w-[700px] 2xl:w-[800px]"
          />
          <img
            src="/leftimg.svg"
            alt=""
            aria-hidden="true"
            className="invisible w-[260px] sm:w-[300px] md:w-[360px] lg:w-[420px] xl:w-[500px] h-auto"
          />
        </div>

        {/* Center copy + SEARCH WITH SUGGESTIONS */}
        <div className="relative z-30 mt-8 flex w-full flex-col items-center space-y-3 md:mt-10 md:mb-10 md:justify-center xl:space-y-6">
          <h1 className="font-mulish font-bold text-white sm:text-4xl md:text-[22px] lg:text-[30px] xl:text-[40px]">
            Your next great Lessn starts here.
          </h1>
          <p className="max-w-md text-base text-gray-200 md:text-[15px] lg:text-[18px] xl:text-[18px]">
            Build and explore standards-based, AI-driven lessons
          </p>

          {/* Search input + button */}
          <div
            className="relative flex w-full max-w-sm items-center sm:max-w-md md:max-w-sm lg:max-w-md xl:max-w-lg space-x-3"
            ref={boxRef}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goSearch()}
              placeholder="Search e.g. math, sixth grade, unit rates…"
              className="w-full flex-grow appearance-none rounded-full border border-white bg-transparent px-4 py-2 text-white placeholder-gray-300 focus:outline-none"
              type="text"
            />
            <button
              type="button"
              onClick={goSearch}
              className="rounded-full bg-[#f6ebfa] px-4 py-1 text-[purple] hover:cursor-pointer shadow-md"
            >
              Search
            </button>

            {/* Suggestions panel (z-index raised) */}
            {open && (
              <div className="absolute left-0 top-[110%] mt-2 w-full bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden z-[120]">
                {loading && (
                  <div className="px-4 py-3 text-sm opacity-80">Searching…</div>
                )}
                {!loading && items.length === 0 && (
                  <div className="px-4 py-3 text-sm opacity-80">No matches</div>
                )}
                {!loading &&
                  items.map((i) => (
                    <Link
                      key={i.id}
                      href={`/presentations/${i.slug}`}
                      className="block px-4 py-3 hover:bg-gray-800"
                      onClick={() => setOpen(false)}
                    >
                      <div className="text-sm font-semibold">
                        {i.subtopic || i.topic || i.title}
                      </div>
                      <div className="text-xs opacity-80">{i.grade}</div>
                      <div className="text-xs opacity-80">
                        {i.topic || i.title}
                      </div>
                      {i.snippet && (
                        <div className="text-[11px] mt-1 line-clamp-1 opacity-60">
                          {i.snippet}
                        </div>
                      )}
                    </Link>
                  ))}
                <button
                  className="w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700"
                  onClick={() =>
                    router.push(
                      `/explore-library?q=${encodeURIComponent(q)}`
                    )
                  }
                >
                  See all results
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center md:space-x-4">
            <span className="text-gray-200">Or</span>
            <Link
              href="/create"
              className="rounded-full bg-[#d08bf2] md:px-4 py-2 text-white hover:cursor-pointer"
            >
              Generate a new lesson
            </Link>
          </div>
        </div>

        {/* Right art */}
        <div className="relative mb-8 mt-8 w-full md:mb-0 md:mt-0 md:w-1/2  md:h-full">
          <img
            src="/rightimg.svg"
            alt="Right illustration"
            className="absolute bottom-0 right-0  object-contain sm:max-w-[350px] md:w-[200px] lg:w-[250px] xl:max-w-[480px] 2xl:max-w-[560px]"
          />
          <img
            src="/rightimg.svg"
            alt=""
            aria-hidden="true"
            className="invisible w-2/3 max-w-[350px] object-contain sm:max-w-[350px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] 2xl:max-w-[560px]"
          />
        </div>
      </div>

      {helpOpen && (
        <HelpPopup open={helpOpen} onClose={() => setHelpOpen(false)} />
      )}
    </>
  );
};

export default HeroSection;
