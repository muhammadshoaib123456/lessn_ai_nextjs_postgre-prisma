// app/explore-library/page.js
import Header from "@/components/Header";
import ExploreClient from "@/components/ExploreClient";
import { headers } from "next/headers";
import crypto from "crypto";

/**
 * getBaseUrl
 * - Builds the absolute origin for server-side fetches (SSR).
 * - On Vercel we force https; locally we use http.
 * If you set NEXT_PUBLIC_BASE_URL in env, we’ll prefer that later.
 */
async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = process.env.VERCEL ? "https" : "http";
  return `${proto}://${host}`;
}

/**
 * arr
 * - Normalize query param(s) into an array.
 * - Supports single string or comma-separated values.
 */
function arr(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  return String(x).split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * fetchResults
 * - Server-side fetch to your search API endpoint.
 * - Includes seed to keep randomized results consistent during a single SSR render.
 * TWEAKS:
 * - Change pageSize default here for SSR (should match client PAGE_SIZE).
 * - If you add/remove filters, update the body accordingly.
 */
async function fetchResults(sp, seed) {
  const body = {
    q: sp.q || "",
    subjects: arr(sp.subjects),
    grades: arr(sp.grades),
    topics: arr(sp.topics),
    sub_topics: arr(sp.sub_topics),
    page: Number(sp.page || 1),
    pageSize: 12,  // ✅ Keep in sync with client PAGE_SIZE
    seed,          // ✅ pass seed to API (used to randomize)
  };

  const base = process.env.NEXT_PUBLIC_BASE_URL || (await getBaseUrl());
  const res = await fetch(`${base}/api/presentations/search`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    cache: "no-store", // ✅ Avoid SSR caching so each request is fresh
  });
  return res.json();
}

export const metadata = {
  title: "Explore Lessn Library",
  description: "Search and filter lessons by subject, grade, and topic.",
  // 👉 Add open graph/tw cards here if needed
};

export default async function ExplorePage({ searchParams }) {
  const sp = await searchParams;

  // ✅ One seed per SSR request (changes on hard refresh / fresh navigation)
  //    This makes “randomization” stable within the render, but new on reload.
  const seed = crypto.randomBytes(8).toString("hex");

  // ✅ Initial payload used to hydrate the client (avoids flash of empty state)
  const initial = await fetchResults(sp, seed);

  return (
    <>
      {/* Global site header (navigation/logo/etc.) */}
      <Header />

      {/* Outer section for vertical spacing around the explore page */}
      <section className="py-12">
        <div className="max-w-[1366px] mx-auto px-4">
          {/* 
            LAYOUT:
            - max-w-[1366px]: page max width; change to 1200/1440/etc.
            - mx-auto: center container
            - px-4: side padding (increase on large screens with md:px-8)
          */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            {/* 
              PAGE TITLE:
              - text-4xl → base size; md:text-5xl for ≥768px
              - font-bold: weight
              - mb-8: space below heading
              - text-center: center align
              TWEAK: adjust sizes to fit your hero/brand scale
            */}
            Explore Lessn Library
          </h1>

          {/* Hydrate client component with SSR results + initial query + seed */}
          <ExploreClient initial={initial} initialQuery={sp.q || ""} seed={seed} />
        </div>
      </section>
    </>
  );
}
