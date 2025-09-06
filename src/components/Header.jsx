"use client";

import React, { useEffect, useRef, useState } from "react";
import HelpPopup from "@/components/HelpPopup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProfileDropdown from "@/components/ProfileDropdown";

const Header = () => {
  // auth
  const { data: session } = useSession();

  // ===== UI state =====
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // ===== Data (APIs return [{ name, count }]) =====
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Desktop dropdown visibility
  const [showGradesDesktop, setShowGradesDesktop] = useState(false);
  const [showSubjectsDesktop, setShowSubjectsDesktop] = useState(false);

  // Mobile expandable sections
  const [showGradesMobile, setShowGradesMobile] = useState(false);
  const [showSubjectsMobile, setShowSubjectsMobile] = useState(false);

  const router = useRouter();

  // ===== Fetch dropdown data once =====
  useEffect(() => {
    fetch("/api/meta/subjects", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setSubjects(data) : setSubjects([])))
      .catch(() => setSubjects([]));

    fetch("/api/meta/grades", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setGrades(data) : setGrades([])))
      .catch(() => setGrades([]));
  }, []);

  // ===== Lock body scroll for drawer =====
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // ===== Desktop dropdown timing (match HeroSection) =====
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

  const openGradesMenu = () => {
    // close Subjects immediately when entering Grades
    clearSubjectClose();
    setShowSubjectsDesktop(false);
    // open Grades (cancel any pending close)
    clearGradeClose();
    setShowGradesDesktop(true);
  };
  const openSubjectsMenu = () => {
    // close Grades immediately when entering Subjects
    clearGradeClose();
    setShowGradesDesktop(false);
    // open Subjects (cancel any pending close)
    clearSubjectClose();
    setShowSubjectsDesktop(true);
  };
  const leaveGradesMenu = () => {
    clearGradeClose();
    gradeCloseRef.current = setTimeout(
      () => setShowGradesDesktop(false),
      LEAVE_CLOSE_MS
    );
  };
  const leaveSubjectsMenu = () => {
    clearSubjectClose();
    subjectCloseRef.current = setTimeout(
      () => setShowSubjectsDesktop(false),
      LEAVE_CLOSE_MS
    );
  };

  useEffect(() => {
    return () => {
      clearGradeClose();
      clearSubjectClose();
    };
  }, []);

  // Desktop click handlers (navigate with query params)
  const onClickGrade = (name) => {
    clearGradeClose();
    setShowGradesDesktop(false);
    router.push(`/explore-library?grades=${encodeURIComponent(name)}`);
  };
  const onClickSubject = (name) => {
    clearSubjectClose();
    setShowSubjectsDesktop(false);
    router.push(`/explore-library?subjects=${encodeURIComponent(name)}`);
  };

  return (
    <>
      <header className="w-full bg-gradient-to-r from-[#500078] to-[#9500DE] text-white pl-3 pr-3">
        <div className="max-w-[1366px] mx-auto flex items-center justify-between px-6 lg:px-12 py-5 relative">
          {/* LEFT: Logo */}
          <div className="flex items-center space-x-2 z-50">
            <Link href="/">
              {/* (Logo SVG left as-is) */}
              <div className="flex items-center md:pl-2">
                <img
                  src="/lessnlogo.svg"
                  alt="Lessn logo"
                  className="md:w-20 h-auto lg:w-30 object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center pl-4 gap-x-9 text-[14px]">
            <Link href="/explore-library" className="rounded-md hover:text-gray-300 cursor-pointer">
              Explore Library
            </Link>
            <Link href="/create" className="hover:text-gray-300 cursor-pointer">
              Create a Lesson
            </Link>

            {/* Select Grade */}
            <div
              className="relative hover:text-gray-300 cursor-pointer"
              onMouseEnter={openGradesMenu}
              onMouseLeave={leaveGradesMenu}
            >
              <div className="flex items-center space-x-1">
                <span>Select Grade</span>
                <svg width="11" height="6" viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.961914 0.609619L5.67991 5.39062L10.3079 0.824619" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {showGradesDesktop && (
                <ul className="absolute left-0 top-full mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-50">
                  {(grades?.length
                    ? grades.map((g) => g.name)
                    : [
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
                      ]
                  ).map((grade, idx) => (
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
            </div>

            {/* Select Subject */}
            <div
              className="relative hover:text-gray-300 cursor-pointer"
              onMouseEnter={openSubjectsMenu}
              onMouseLeave={leaveSubjectsMenu}
            >
              <div className="flex items-center space-x-1">
                <span>Select Subject</span>
                <svg width="11" height="6" viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.961914 0.609619L5.67991 5.39062L10.3079 0.824619" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {showSubjectsDesktop && (
                <ul className="absolute left-0 top-full mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-50">
                  {(subjects?.length
                    ? subjects.map((s) => s.name)
                    : ["Language arts", "Math", "Science", "Social Studies"]
                  ).map((subject, idx) => (
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
            </div>
          </nav>

          {/* RIGHT: Auth + Hamburger */}
          <div className="flex items-center gap-4 z-50">
            {/* Auth Links OR Profile */}
            <div className="hidden md:flex items-center space-x-6 text-[14px]">
              {!session ? (
                <Link href="/login" className="flex items-center space-x-1 hover:text-gray-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 9a2 2 0 012-2h5V4l5 5-5 5v-3H5a2 2 0 01-2-2z" />
                  </svg>
                  <span>Login</span>
                </Link>
              ) : (
                <ProfileDropdown showLabel labelClassName="" align="right" />
              )}

              {/* Help button remains */}
              <div className="hidden lg:flex items-center">
                <img
                  src="/Help.svg"
                  alt="Help"
                  className="ml-1 h-10 w-10 cursor-pointer rounded-full"
                  onClick={() => setHelpOpen(true)}
                />
              </div>
            </div>

            {/* Hamburger Menu */}
            <button
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
              className="lg:hidden flex flex-col space-y-1"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span
                className={`block w-6 h-0.5 bg-white transition-transform ${
                  menuOpen ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`block w-6 h-0.5 bg-white transition-opacity ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block w-6 h-0.5 bg-white transition-transform ${
                  menuOpen ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>

          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
              menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={closeMenu}
          />

          {/* Drawer (mobile menu) */}
          <aside
            id="mobile-drawer"
            className={`fixed top-0 right-0 h-full bg-[#500078] text-white z-50 transition-transform duration-300 w-full md:w-1/2 ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <span className="text-lg font-semibold">Menu</span>
              <button aria-label="Close menu" className="p-2 -m-2" onClick={closeMenu}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col px-6 py-6 space-y-4 text-base">
              <Link href="/explore-library" onClick={closeMenu} className="w-full hover:text-gray-300">
                Explore Library
              </Link>
              <Link href="/create" onClick={closeMenu} className="w-full hover:text-gray-300">
                Create a Lesson
              </Link>

              {/* Mobile: Grades expandable */}
              <button
                className="flex items-center justify-between w-full hover:text-gray-300"
                onClick={() => setShowGradesMobile((v) => !v)}
              >
                <span>Grades</span>
                <svg
                  width="11"
                  height="6"
                  viewBox="0 0 11 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${showGradesMobile ? "rotate-180" : ""} transition-transform`}
                >
                  <path
                    d="M0.961914 0.609619L5.67991 5.39062L10.3079 0.824619"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {showGradesMobile && (
                <div className="ml-2 mt-1 space-y-2">
                  {(grades?.length
                    ? grades.map((g) => g.name)
                    : [
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
                      ]
                  ).map((name) => (
                    <Link
                      key={name}
                      href={`/explore-library?grades=${encodeURIComponent(name)}`}
                      onClick={closeMenu}
                      className="block hover:text-gray-300"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Mobile: Subjects expandable */}
              <button
                className="flex items-center justify-between w-full hover:text-gray-300"
                onClick={() => setShowSubjectsMobile((v) => !v)}
              >
                <span>Subjects</span>
                <svg
                  width="11"
                  height="6"
                  viewBox="0 0 11 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${showSubjectsMobile ? "rotate-180" : ""} transition-transform`}
                >
                  <path
                    d="M0.961914 0.609619L5.67991 5.39062L10.3079 0.824619"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {showSubjectsMobile && (
                <div className="ml-2 mt-1 space-y-2">
                  {(subjects?.length
                    ? subjects.map((s) => s.name)
                    : ["Language arts", "Math", "Science", "Social Studies"]
                  ).map((name) => (
                    <Link
                      key={name}
                      href={`/explore-library?subjects=${encodeURIComponent(name)}`}
                      onClick={closeMenu}
                      className="block hover:text-gray-300"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              )}

              <hr className="border-white/10 my-2" />
              {!session ? (
                <Link href="/login" onClick={closeMenu} className="pl-1 hover:text-gray-300">
                  Login
                </Link>
              ) : (
                <>
                  <Link href="/profile" onClick={closeMenu} className="pl-1 hover:text-gray-300">
                    My Profile
                  </Link>
                  <Link href="/library" onClick={closeMenu} className="pl-1 hover:text-gray-300">
                    My Library
                  </Link>
                  <Link href="/pricing" onClick={closeMenu} className="pl-1 hover:text-gray-300">
                    Pricing & Subscription
                  </Link>
                  <Link href="/login" onClick={() => closeMenu()} className="pl-1 hover:text-gray-300">
                    {/* Logout is handled in dropdown; mobile users typically use Login/Account pages */}
                    {/* (You can also add a separate mobile-only signOut button if you want) */}
                  </Link>
                </>
              )}
            </nav>
          </aside>
        </div>
      </header>

      {/* Help Popup */}
      {helpOpen && <HelpPopup open={helpOpen} onClose={() => setHelpOpen(false)} />}
    </>
  );
};

export default Header;
