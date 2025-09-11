import React from "react";
import Link from "next/link";

/**
 * Footer
 * - Simple two-column layout (logo/text/links on the left, social icons on the right).
 * - Stacks vertically on mobile (md: breakpoint switches to row).
 *
 * QUICK TUNING (Tailwind):
 * - Background gradient colors → <footer className="bg-gradient-to-b from-[#500078] to-[#9500DE] ...">
 * - Vertical padding → footer "py-0" (increase to py-6 / py-10 for more height)
 * - Text color → "text-white"
 * - Overall max width / centering → wrapper "container mx-auto"
 * - Horizontal padding → wrapper "px-6" and left/right paddings like "pl-6" / "pr-20"
 * - Spacing between columns → parent flex utilities and child margins
 * - Logo image size → control by wrapping div size or add explicit sizes on <img>
 * - Social icon size → per-icon classes "h-7 w-7"
 */
const Footer = () => {
  return (
    <>
      {/* ===== FOOTER WRAPPER =====
          TUNE:
          - Gradient start/end colors: from-[#500078] to-[#9500DE]
          - Vertical padding: py-0 (set to py-6 or py-10 to add top/bottom space)
          - Text color: text-white
      */}
      <footer className=" bg-gradient-to-b from-[#500078] to-[#9500DE] py-0 text-white">
        {/* ===== INNER CONTAINER =====
            TUNE:
            - "container mx-auto" centers and constrains width; change to "max-w-[1366px] mx-auto" if you want a custom cap
            - Responsive stacking: flex-col on mobile, md:flex-row from >=768px
            - Horizontal padding: px-6 (increase for more side breathing room)
            - Space between: justify-between keeps left/right apart on desktop
        */}
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          {/* ================= LEFT: (Logo + Text + Links) =================
              TUNE:
              - Adjust inner spacing between blocks: space-y-4 (mobile) / md:space-x-8 (desktop)
              - Left padding: pl-6
              - Alignment: items-center on mobile; md:items-start on desktop for left alignment
          */}
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 pl-6">
            {/* ----- Logo + small text block ----- */}
            <div className="flex flex-col items-center mt-10 text-center">
              {/* Small label above the logo
                 TUNE: font size → add classes like text-sm / text-base
                 TUNE: color → text-white opacity by adding text-white/80 */}
              <p className="mb-4">Brought to you by</p>

              {/* Logo container
                 TUNE:
                 - Outer spacing: mb-8
                 - Alignment: items-center justify-center
                 - Constrain logo size by giving this wrapper a fixed width/height, e.g.:
                   "w-[180px] h-[60px]" then the <img> can use w-full h-full object-contain
              */}
              <div className=" flex mb-8 items-center justify-center overflow-hidden">
                {/* Logo image
                   TUNE:
                   - If the logo is too large/small, set explicit size here:
                     className="h-12 w-auto" OR "w-40 h-auto"
                   - object-contain preserves aspect ratio inside the wrapper
                */}
                <img
                  src="/OneScreen.svg"
                  alt="OneScreen logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* ----- Footer links (Privacy / Terms) ----- */}
            <div className="flex mt-18 space-x-4 text-sm">
              {/* NOTE: "mt-18" is not a default Tailwind spacing class.
                  If you don't have a custom spacing scale, use arbitrary value: mt-[18px]
                  (Leaving as-is per your request not to change functionality) */}
              {/* TUNE:
                 - Font size: text-sm → text-base
                 - Spacing between links: space-x-4
                 - Hover color: hover:text-gray-300
              */}
              <Link href="/privacy" className="hover:text-gray-300">
                Privacy policy
              </Link>
              <span>|</span>
              <Link href="/terms" className="hover:text-gray-300">
                Terms of service
              </Link>
            </div>
          </div>

          {/* ================= RIGHT: Social icons =================
              TUNE:
              - Right padding: pr-20 (reduce/increase as needed)
              - Top margin on mobile: mt-6; remove at md+: md:mt-0
              - Icon size: change h-7 w-7 on each <img>
              - Hover feel: hover:opacity-80 (use hover:brightness-110 or hover:scale-105 for different effect)
          */}
          <div className="flex space-x-4 pr-20 mt-6 md:mt-0">
            {/* Replace "#" with your actual social URLs */}
            <a href="#" aria-label="Instagram">
              <img
                src="/I.svg"
                alt="Instagram"
                className="h-7 w-7 object-contain hover:opacity-80"
              />
            </a>
            <a href="#" aria-label="Facebook">
              <img
                src="/F.svg"
                alt="Facebook"
                className="h-7 w-7 object-contain hover:opacity-80"
              />
            </a>
            <a href="#" aria-label="x">
              <img
                src="/X.svg"
                alt="x"
                className="h-7 w-7 object-contain hover:opacity-80"
              />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
