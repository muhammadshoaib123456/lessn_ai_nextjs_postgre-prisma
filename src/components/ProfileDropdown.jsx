"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

/**
 * A self-contained avatar + dropdown used in Header and HeroSection.
 * - Wider than the grade/subject menus (w-72) per your requirement
 * - Items: My Profile, My Library, Pricing & Subscription, Logout
 * - Shows initials bubble + (optionally) the user's name/email
 */
export default function ProfileDropdown({
  showLabel = true,          // show user's name/email next to avatar
  labelClassName = "",       // extra classes for the label text
  align = "right",           // menu alignment
  className = "",            // wrapper classes
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) return null;

  const nameOrEmail = session?.user?.name || session?.user?.email || "";
  const initials = nameOrEmail
    .split(" ")
    .map((s) => s?.[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  // alignment class
  const side = align === "left" ? "left-0" : "right-0";

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">
          {initials || "?"}
        </div>
        {showLabel && (
          <span className={`hidden sm:block truncate max-w-[200px] ${labelClassName}`}>
            {nameOrEmail}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${side} mt-2 w-72 rounded-xl bg-white text-black shadow-xl ring-1 ring-black/5 p-2 z-[999]`}
          role="menu"
        >
          <div className="px-3 py-2 text-sm font-semibold border-b">Account</div>

          <Link href="/profile" className="block px-3 py-2 hover:bg-gray-100 rounded-md" role="menuitem">
            My Profile
          </Link>
          <Link href="/library" className="block px-3 py-2 hover:bg-gray-100 rounded-md" role="menuitem">
            My Library
          </Link>
          <Link href="/pricing" className="block px-3 py-2 hover:bg-gray-100 rounded-md" role="menuitem">
            Pricing &amp; Subscription
          </Link>

          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
            onClick={() => signOut({ callbackUrl: "/login" })}
            role="menuitem"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
