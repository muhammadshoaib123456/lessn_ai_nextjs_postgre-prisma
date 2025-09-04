// app/explore-library/page.js
import Header from "@/components/Header";
import ExploreClient from "@/components/ExploreClient";
import { headers } from "next/headers";

// Make this async now that headers() is async
async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = process.env.VERCEL ? "https" : "http";
  return `${proto}://${host}`;
}

// normalize URL params into arrays
function arr(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  // support CSV fallback if framework passed a string
  return String(x).split(",").map((s) => s.trim()).filter(Boolean);
}

async function fetchResults(sp) {
  const body = {
    q: sp.q || "",
    subjects: arr(sp.subjects),
    grades: arr(sp.grades),
    topics: arr(sp.topics),
    sub_topics: arr(sp.sub_topics),
    page: Number(sp.page || 1),
    pageSize: 12,
  };

  const base = process.env.NEXT_PUBLIC_BASE_URL || (await getBaseUrl());
  const res = await fetch(`${base}/api/presentations/search`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export const metadata = {
  title: "Explore Lessn Library",
  description: "Search and filter lessons by subject, grade, and topic.",
};

export default async function ExplorePage({ searchParams }) {
  // In Next 14, searchParams can be a plain object; keep robust either way
  const sp = await searchParams;

  const initial = await fetchResults(sp);

  return (
    <>
      <Header />
      <section className="py-12">
        <div className="max-w-[1366px] mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            Explore Lessn Library
          </h1>
          <ExploreClient initial={initial} initialQuery={sp.q || ""} />
        </div>
      </section>
    </>
  );
}
