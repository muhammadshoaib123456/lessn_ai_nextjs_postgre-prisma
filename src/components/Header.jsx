"use client";

import React, { useEffect, useRef, useState } from "react";
import HelpPopup from "@/components/HelpPopup";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Header = () => {
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
               <svg width="108" height="36" viewBox="0 0 108 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M104.688 16.7434C104.688 13.9164 103.148 12.4614 100.826 12.4614C98.4746 12.4614 96.9356 13.9164 96.9356 16.7434V25.3624H93.7456V9.94241H96.9356V11.7054C97.9706 10.4464 99.6776 9.69141 101.526 9.69141C105.135 9.69141 107.849 11.9584 107.849 16.2674V25.3624H104.688V16.7434Z" fill="white"/>
                <path d="M84.3984 25.6144C80.7044 25.6144 78.1014 23.4314 77.9614 20.6334H81.2634C81.3764 21.8924 82.5794 22.9274 84.3424 22.9274C86.1894 22.9274 87.1684 22.1444 87.1684 21.0804C87.1684 18.0584 78.2134 19.7934 78.2134 14.1404C78.2134 11.6774 80.5084 9.69043 84.1464 9.69043C87.6444 9.69043 89.9384 11.5664 90.1064 14.6444H86.9174C86.8044 13.3014 85.7694 12.3774 84.0354 12.3774C82.3284 12.3774 81.4314 13.0774 81.4314 14.1124C81.4314 17.2184 90.1354 15.4844 90.3024 21.0524C90.3024 23.6554 88.0354 25.6144 84.3984 25.6144Z" fill="white"/>
                <path d="M69.4541 25.6144C65.7601 25.6144 63.1581 23.4314 63.0171 20.6334H66.3201C66.4331 21.8924 67.6351 22.9274 69.3981 22.9274C71.2451 22.9274 72.2251 22.1444 72.2251 21.0804C72.2251 18.0584 63.2701 19.7934 63.2701 14.1404C63.2701 11.6774 65.5641 9.69043 69.2021 9.69043C72.7001 9.69043 74.9951 11.5664 75.1641 14.6444H71.9731C71.8611 13.3014 70.8261 12.3774 69.0911 12.3774C67.3841 12.3774 66.4881 13.0774 66.4881 14.1124C66.4881 17.2184 75.1911 15.4844 75.3591 21.0524C75.3591 23.6554 73.0931 25.6144 69.4541 25.6144Z" fill="white"/>
                <path d="M48.8583 16.2679H57.3933C57.3373 13.8889 55.4623 12.3779 53.0843 12.3779C50.9283 12.3779 49.1933 13.8319 48.8583 16.2679ZM53.2233 25.6149C48.8013 25.6149 45.5273 22.4799 45.5273 17.6399C45.5273 12.7979 48.6623 9.69092 53.2233 9.69092C57.6173 9.69092 60.7233 12.7419 60.7233 17.2749C60.7233 17.8069 60.6953 18.3109 60.6123 18.8419H48.8303C49.0533 21.3889 50.8733 22.9279 53.2233 22.9279C55.1823 22.9279 56.2743 21.9769 56.8613 20.7729H60.3033C59.4353 23.4599 57.0013 25.6149 53.2233 25.6149Z" fill="white"/>
                <path d="M37.3565 5.91333V22.7883H43.9335V25.3623H34.1665V5.91333H37.3565Z" fill="white"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M15.5586 24.9519V23.1599L14.9406 23.5739L3.87061 31.0219V32.8129L4.48861 32.3989L15.5586 24.9519Z" fill="white"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M18.2687 24.9055L7.19873 32.3535V34.1445L7.81673 33.7305L18.8867 26.2825V24.4915L18.2687 24.9055Z" fill="white"/>
                <path d="M23.796 5.12774C23.777 4.37974 23.484 3.64674 22.979 2.99374C22.411 2.26174 21.57 1.62374 20.551 1.17974C19.554 0.746743 18.378 0.495743 17.117 0.526743C15.353 0.569743 13.423 1.16274 11.59 2.57774L0.332 10.1517L0 10.3757V31.8487L12.441 23.4787L12.481 23.4507C15.143 21.3877 17.998 21.3677 19.972 22.2297C20.572 22.4917 21.085 22.8327 21.48 23.2197C21.851 23.5837 22.112 23.9807 22.234 24.3787C22.425 25.0087 22.244 25.6857 21.551 26.2677L10.526 33.6847V35.4757L11.145 35.0627L22.425 27.4727L22.486 27.4287C23.336 26.7257 23.743 25.9097 23.796 25.0787V25.0657C23.803 24.9507 23.803 24.8347 23.796 24.7197V5.12774Z" fill="white"/>
                <path d="M6.19234 22.0851C5.99034 22.0501 5.78534 22.0271 5.58634 21.9771C4.79734 21.7751 4.23734 21.2871 3.84234 20.5851C3.75734 20.4331 3.87134 20.2001 4.00034 20.1361C4.10034 20.0851 4.15234 20.1401 4.20034 20.2261C4.47834 20.7311 4.86834 21.1231 5.39934 21.3591C6.07934 21.6621 6.77534 21.6451 7.47635 21.4531C8.36135 21.2101 9.12934 20.7441 9.82335 20.1581C11.4473 18.7881 12.5423 17.0601 13.2243 15.0581C13.2303 15.0421 13.2363 15.0241 13.2393 15.0071C13.2413 15.0001 13.2353 14.9911 13.2273 14.9661C13.0423 15.2251 12.8633 15.4751 12.6823 15.7241C12.6433 15.7781 12.6023 15.8371 12.5483 15.8731C12.5073 15.9001 12.4283 15.9191 12.3953 15.8981C12.3593 15.8741 12.3383 15.7961 12.3463 15.7471C12.3563 15.6791 12.3873 15.6081 12.4273 15.5511C12.7633 15.0751 13.1023 14.6021 13.4433 14.1291C13.4733 14.0861 13.5143 14.0481 13.5583 14.0191C13.6283 13.9711 13.6933 13.9771 13.7393 14.0581C13.9213 14.3811 14.1083 14.7031 14.2863 15.0291C14.3633 15.1701 14.2523 15.4161 14.1003 15.4631C14.0223 15.4881 13.9743 15.4571 13.9373 15.3881C13.8423 15.2161 13.7443 15.0471 13.6323 14.8531C13.5943 14.9661 13.5653 15.0531 13.5353 15.1391C12.7963 17.2541 11.6283 19.0851 9.90434 20.5351C9.15534 21.1671 8.32634 21.6681 7.37034 21.9271C7.12934 21.9921 6.87934 22.0171 6.63134 22.0601C6.59234 22.0671 6.55434 22.0771 6.51534 22.0851H6.19234Z" fill="#4B269F"/>
                <path d="M9.16484 11.5583C8.92784 11.6903 8.72684 11.8283 8.50584 11.9193C8.23384 12.0303 8.12184 12.1983 8.17084 12.4913C8.20084 12.6713 8.11484 12.8153 7.97884 12.9403C7.81684 13.0883 7.66384 13.2463 7.51884 13.4103C7.29984 13.6563 7.30284 13.6623 7.01584 13.5013C6.93084 13.4543 6.87784 13.4633 6.82984 13.5493C6.73084 13.7253 6.62784 13.8983 6.52584 14.0723C6.41884 14.2563 6.31084 14.4413 6.19884 14.6333C6.26484 14.6743 6.31584 14.7073 6.36884 14.7393C6.56884 14.8593 6.57884 14.8993 6.50784 15.1173C6.42884 15.3553 6.35484 15.5953 6.29284 15.8373C6.24784 16.0083 6.16584 16.1393 6.00284 16.2163C5.91384 16.2583 5.82784 16.3083 5.74484 16.3603C5.71484 16.3793 5.67484 16.4163 5.67484 16.4463C5.66984 16.8043 5.67184 17.1613 5.67184 17.5453C5.80884 17.4703 5.92484 17.4053 6.04084 17.3423C6.19584 17.2573 6.23784 17.2783 6.29684 17.4383C6.34784 17.5773 6.39684 17.7203 6.47584 17.8423C6.56684 17.9843 6.55884 18.1073 6.47684 18.2423C6.40284 18.3643 6.32684 18.4863 6.26484 18.6153C6.24484 18.6543 6.24984 18.7443 6.27484 18.7613C6.47684 18.8923 6.68584 19.0123 6.89984 19.1393C7.00484 18.9603 7.10084 18.7933 7.19984 18.6293C7.25784 18.5343 7.32984 18.4663 7.45684 18.4643C7.62584 18.4623 7.79584 18.4503 7.96384 18.4293C8.13084 18.4083 8.17084 18.4343 8.17384 18.6103C8.17584 18.7433 8.17384 18.8753 8.17384 19.0343C8.39984 18.9083 8.59284 18.7743 8.80584 18.6883C9.09484 18.5723 9.22184 18.3933 9.16884 18.0783C9.14084 17.9133 9.22384 17.7793 9.34784 17.6643C9.50884 17.5153 9.66184 17.3573 9.80884 17.1953C10.0378 16.9403 10.0348 16.9353 10.3318 17.0983C10.3978 17.1333 10.4498 17.1413 10.4908 17.0703C10.7058 16.7043 10.9198 16.3363 11.1398 15.9603C11.0638 15.9143 10.9958 15.8713 10.9278 15.8303C10.7778 15.7403 10.7608 15.6913 10.8168 15.5213C10.8738 15.3513 10.9358 15.1833 10.9838 15.0113C11.1348 14.4663 11.0348 14.5413 11.5768 14.2463C11.6508 14.2043 11.6728 14.1553 11.6718 14.0753C11.6688 13.7793 11.6708 13.4833 11.6698 13.1873C11.6698 13.1483 11.6638 13.1103 11.6578 13.0533C11.5138 13.1323 11.3868 13.2053 11.2578 13.2733C11.1578 13.3263 11.0938 13.3043 11.0528 13.1893C10.9978 13.0383 10.9428 12.8833 10.8588 12.7483C10.7738 12.6103 10.7768 12.4913 10.8548 12.3603C10.9318 12.2333 11.0098 12.1073 11.0758 11.9753C11.0958 11.9383 11.0948 11.8533 11.0718 11.8383C10.8668 11.7053 10.6548 11.5833 10.4378 11.4543C10.3818 11.5503 10.3338 11.6303 10.2858 11.7113C10.2358 11.7963 10.1878 11.8823 10.1378 11.9663C10.0698 12.0793 9.97884 12.1343 9.83884 12.1283C9.68784 12.1223 9.53484 12.1383 9.38484 12.1603C9.20484 12.1853 9.16884 12.1643 9.16484 11.9833C9.16284 11.8513 9.16484 11.7193 9.16484 11.5583ZM10.0038 17.5183C9.85284 17.6563 9.71583 17.7773 9.58484 17.9063C9.55783 17.9333 9.54884 17.9853 9.54584 18.0273C9.53784 18.1393 9.54684 18.2523 9.53084 18.3623C9.49684 18.6073 9.37084 18.7973 9.15384 18.9203C8.83484 19.1023 8.51484 19.2813 8.19284 19.4583C7.93784 19.5993 7.80284 19.5173 7.79784 19.2253C7.79584 19.1323 7.79684 19.0383 7.79684 18.9333C7.65284 18.9433 7.52384 18.9473 7.39584 18.9633C7.36684 18.9673 7.33684 19.0103 7.31584 19.0423C7.23884 19.1623 7.17884 19.2963 7.08984 19.4063C6.92284 19.6133 6.76984 19.7123 6.50784 19.5263C6.36184 19.4223 6.20084 19.3413 6.04684 19.2493C5.87984 19.1493 5.81084 19.0333 5.86084 18.8463C5.90984 18.6673 5.99084 18.4953 6.07284 18.3293C6.10984 18.2513 6.12084 18.1953 6.07684 18.1193C6.02584 18.0313 5.99084 17.9343 5.94484 17.8323C5.83784 17.8903 5.73884 17.9493 5.63484 17.9983C5.44584 18.0903 5.30484 18.0153 5.30084 17.8083C5.29284 17.3873 5.28784 16.9653 5.30484 16.5443C5.31384 16.2873 5.45184 16.0763 5.68484 15.9643C5.88184 15.8683 6.00784 15.7413 6.03184 15.5203C6.03384 15.4983 6.04484 15.4773 6.05184 15.4553C6.12284 15.2273 6.12384 15.2253 5.93184 15.0953C5.79884 15.0063 5.80184 14.8743 5.82784 14.7463C5.84784 14.6523 5.88884 14.5583 5.93584 14.4743C6.14384 14.1083 6.35284 13.7423 6.57484 13.3843C6.65084 13.2613 6.75484 13.1483 6.86784 13.0583C7.02884 12.9303 7.20384 12.9693 7.31884 13.0613C7.47684 12.9253 7.62184 12.8053 7.75984 12.6773C7.78584 12.6523 7.79284 12.5973 7.79584 12.5553C7.80084 12.4703 7.79384 12.3853 7.79984 12.3003C7.81684 12.0253 7.94184 11.8123 8.18184 11.6743C8.50383 11.4893 8.82884 11.3093 9.15484 11.1293C9.39384 10.9983 9.53484 11.0813 9.54384 11.3523C9.54684 11.4543 9.54384 11.5563 9.54384 11.6493C9.56784 11.6583 9.57184 11.6613 9.57584 11.6613C9.87284 11.6943 10.0718 11.5783 10.1818 11.2913C10.2158 11.2013 10.3018 11.1243 10.3788 11.0583C10.5148 10.9443 10.6178 10.9443 10.7708 11.0353C10.9448 11.1383 11.1178 11.2413 11.2908 11.3453C11.4538 11.4433 11.5258 11.5653 11.4768 11.7483C11.4278 11.9273 11.3468 12.0983 11.2648 12.2653C11.2268 12.3433 11.2168 12.3983 11.2618 12.4743C11.3118 12.5613 11.3478 12.6593 11.3938 12.7633C11.4978 12.7043 11.5938 12.6473 11.6918 12.5983C11.8838 12.5013 12.0338 12.5763 12.0398 12.7883C12.0508 13.2053 12.0548 13.6223 12.0368 14.0383C12.0248 14.3053 11.8828 14.5203 11.6398 14.6383C11.4558 14.7263 11.3318 14.8403 11.3118 15.0513C11.3088 15.0903 11.2888 15.1283 11.2768 15.1663C11.2138 15.3713 11.2138 15.3713 11.3968 15.4933C11.5128 15.5703 11.5538 15.6873 11.5078 15.8633C11.4838 15.9533 11.4458 16.0413 11.3998 16.1223C11.1908 16.4883 10.9788 16.8523 10.7628 17.2133C10.7028 17.3113 10.6278 17.4043 10.5428 17.4813C10.3688 17.6403 10.1788 17.6643 10.0038 17.5183Z" fill="#4B269F"/>
                <path d="M3.88867 16.3523C4.08367 16.0793 4.26567 15.8243 4.44867 15.5713C4.48567 15.5203 4.52567 15.4673 4.57567 15.4353C4.61467 15.4093 4.69167 15.3903 4.71867 15.4113C4.75467 15.4393 4.78167 15.5123 4.77467 15.5593C4.76267 15.6313 4.72967 15.7063 4.68767 15.7663C4.35467 16.2393 4.01767 16.7083 3.68067 17.1783C3.64967 17.2213 3.60967 17.2603 3.56667 17.2903C3.49267 17.3423 3.42467 17.3343 3.37567 17.2483C3.19567 16.9283 3.01167 16.6103 2.83467 16.2883C2.75667 16.1453 2.86067 15.9033 3.01367 15.8503C3.08867 15.8243 3.14067 15.8493 3.17967 15.9193C3.27667 16.0953 3.37667 16.2693 3.48967 16.4653C3.56167 16.1883 3.61767 15.9333 3.69467 15.6843C4.43467 13.2653 5.72567 11.2073 7.72067 9.62534C8.46067 9.04034 9.27767 8.58734 10.2097 8.37934C10.9567 8.21334 11.6897 8.23934 12.3797 8.60734C13.1467 9.01734 13.5767 9.69034 13.8237 10.4983C13.8467 10.5763 13.8167 10.6893 13.7727 10.7633C13.7317 10.8313 13.6437 10.8863 13.5657 10.9053C13.5387 10.9123 13.4637 10.8013 13.4407 10.7333C13.1627 9.93134 12.6977 9.29434 11.8897 8.96134C11.2267 8.68834 10.5487 8.72234 9.87367 8.91334C8.90567 9.18834 8.07667 9.71634 7.33867 10.3843C5.57567 11.9783 4.44067 13.9483 3.88467 16.2563C3.88167 16.2693 3.87967 16.2823 3.87867 16.2953C3.87767 16.3043 3.88167 16.3123 3.88867 16.3523Z" fill="#4B269F"/>
                <path d="M7.408 15.9372C7.417 16.0552 7.419 16.1452 7.431 16.2332C7.514 16.7772 7.94 17.0362 8.453 16.8382C8.626 16.7722 8.793 16.6722 8.937 16.5562C9.379 16.2002 9.664 15.7352 9.829 15.1952C9.911 14.9272 9.946 14.6542 9.908 14.3732C9.836 13.8342 9.422 13.5672 8.91 13.7442C8.78 13.7892 8.65 13.8512 8.541 13.9322C7.854 14.4362 7.489 15.1212 7.408 15.9372ZM10.322 14.3372C10.195 15.5602 9.701 16.5132 8.692 17.1562C8.507 17.2742 8.273 17.3402 8.053 17.3752C7.651 17.4382 7.323 17.2312 7.162 16.8552C6.989 16.4542 7.011 16.0392 7.11 15.6282C7.313 14.7962 7.739 14.1002 8.424 13.5762C8.697 13.3662 9.001 13.2142 9.357 13.2072C9.746 13.2002 10.026 13.3792 10.169 13.7332C10.251 13.9372 10.28 14.1632 10.322 14.3372Z" fill="#4B269F"/>
              </svg>
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
            {/* Auth Links */}
            <div className="hidden md:flex items-center space-x-6 text-[14px]">
              <Link href="/login" className="flex items-center space-x-1 hover:text-gray-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 9a2 2 0 012-2h5V4l5 5-5 5v-3H5a2 2 0 01-2-2z" />
                </svg>
                <span>Login</span>
              </Link>
              <Link href="/register" className="flex items-center space-x-1 hover:text-gray-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11h-2v2H7v2h2v2h2v-2h2v-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Sign up</span>
              </Link>
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
              <Link href="/login" onClick={closeMenu} className="pl-1 hover:text-gray-300">
                Login
              </Link>
              <Link href="/register" onClick={closeMenu} className="pl-1 hover:text-gray-300">
                Sign up
              </Link>
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
