// app/presentations/[slug]/page.jsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeacherSectionClient from "@/components/TeacherSectionClient";
export const dynamic = "force-dynamic";

// ---------- data fetchers ----------
async function getData(slug) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${base}/api/presentations/${slug}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

// ---------- metadata ----------
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getData(slug);
  if (!p) return {};
  return {
    title: p.meta_titles || p.name,
    description:
      p.meta_description || [p.subject, p.grade, p.topic].filter(Boolean).join(" • "),
  };
}

// ---------- auth ----------
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ---------- DB for slider seed/initial ----------
import { prisma } from "@/lib/prisma";

// ---------- sanitization ----------
import DOMPurify from "isomorphic-dompurify";
function decodeEntities(s = "") {
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
function prepareHtml(html) {
  const decoded = decodeEntities(html)
    .replace(/<span>\s*\|\s*<\/span>/g, "<br/>")
    .replace(/<div>\s*<\/div>/g, "");
  return DOMPurify.sanitize(decoded, { USE_PROFILES: { html: true } });
}

// ---------- utils ----------
function appendQuery(url, params) {
  try {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    return u.toString();
  } catch {
    return url;
  }
}

const SLIDER_SELECT = {
  id: true,
  slug: true,
  name: true,
  subject: true,
  grade: true,
  topic: true,
  sub_topic: true,
  thumbnail: true,
  thumbnail_alt_text: true,
};

export default async function PresentationPage({ params }) {
  const { slug } = await params;

  // Parallelized SSR work (no massive "getAllPresentations" scan anymore)
  const [p, session] = await Promise.all([
    getData(slug),
    getServerSession(authOptions),
  ]);

  if (!p) return <div className="max-w-[960px] mx-auto p-6">Not found</div>;

  // ---- Build Google Slides embed URL (keep controls/slider) ----
  let embedUrl = "";
  if (p.presentation_view_link) {
    const m = String(p.presentation_view_link).match(/src="([^"]+)"/i);
    embedUrl = m ? m[1] : String(p.presentation_view_link);
  }
  if (!embedUrl && p.slides_export_link_url) {
    const m = String(p.slides_export_link_url).match(/presentation\/d\/([^/]+)/i);
    if (m) embedUrl = `https://docs.google.com/presentation/d/${m[1]}/embed?slide=id.p`;
  }
  if (embedUrl) {
    embedUrl = appendQuery(embedUrl, {
      start: "false",
      loop: "false",
      delayms: "3000",
      rm: "minimal", // cleaner embed
    });
  }

  const summaryHtml = p.summary ? prepareHtml(p.summary) : "";
  const contentHtml = p.presentation_content ? prepareHtml(p.presentation_content) : "";
  const hasAnyButtons = Boolean(
    p.download_pdf_url || p.download_ppt_url || p.slides_export_link_url
  );

  // ---- Slider: same behavior as your TeacherSection.jsx (server-seeded + API-backed) ----
  const pageSize = 24;
  const total = await prisma.presentation.count();

  let seedOffset = 0;
  let initial = [];
  if (total > 0) {
    seedOffset = Math.floor(Math.random() * total);
    if (seedOffset + pageSize <= total) {
      initial = await prisma.presentation.findMany({
        orderBy: { id: "asc" },
        skip: seedOffset,
        take: pageSize,
        select: SLIDER_SELECT,
      });
    } else {
      const takeA = total - seedOffset;
      const a = await prisma.presentation.findMany({
        orderBy: { id: "asc" },
        skip: seedOffset,
        take: takeA,
        select: SLIDER_SELECT,
      });
      const b = await prisma.presentation.findMany({
        orderBy: { id: "asc" },
        skip: 0,
        take: pageSize - takeA,
        select: SLIDER_SELECT,
      });
      initial = [...a, ...b];
    }
  }

  const normalizedInitial = initial.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));

  return (
    <>
      <Header />

      <div className="max-w-[1100px] mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold leading-snug mb-4">{p.name}</h1>

        {/* Meta row */}
        <div className="text-base md:text-lg text-gray-700 mb-4">
          <span className="font-bold text-black">Subject:</span>{" "}
          <span className="font-medium">{p.subject || "-"}</span>
          <span className="mx-3" />
          <span className="font-bold text-black">Grade:</span>{" "}
          <span className="font-medium">{p.grade || "-"}</span>
          <span className="mx-3" />
          <span className="font-bold text-black">Topic:</span>{" "}
          <span className="font-medium">{p.topic || "-"}</span>
        </div>

        {/* Bullet-style Summary label + content */}
        {summaryHtml ? (
          <ul className="list-disc pl-6 mb-6">
            <li className="text-sm md:text-base">
              <span className="font-semibold">Summary:</span>
              <div
                className="prose max-w-none text-gray-800 mt-2"
                dangerouslySetInnerHTML={{ __html: summaryHtml }}
              />
            </li>
          </ul>
        ) : null}

        {/* Preview — slim border; cropped sides; slider visible */}
        <div className="mx-auto max-w-[1100px] w-full">
          <div className="relative w-full rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
            {/* Slightly taller than 16:9 so the bottom controls are not cut */}
            <div className="pt-[58.5%]" />

            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={p.name}
                className="absolute inset-0 w-full h-full block origin-center"
                style={{
                  transform: "scaleX(1.12)", // crop side gutters only
                  border: 0,
                  background: "transparent",
                }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <p className="p-4 text-center text-gray-500">
                Presentation preview is not available.
              </p>
            )}
          </div>
        </div>

        {/* Gated CTA */}
        <div className="mx-auto max-w-[800px] w-full mt-6">
          {!session ? (
            <p className="text-center text-[#1e3a8a] font-semibold">
              Please{" "}
              <a href={`/login?next=/presentations/${p.slug}`} className="underline">
                LOG IN
              </a>{" "}
              to download the presentation. Access is available to registered users only.
            </p>
          ) : (
            hasAnyButtons && (
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                {p.download_pdf_url && (
                  <a
                    href={`/api/presentations/${p.slug}/download?type=pdf`}
                    className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-black"
                  >
                    Download PDF
                  </a>
                )}
                {p.slides_export_link_url && (
                  <a
                    href={`/api/presentations/${p.slug}/download?type=slides`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-black"
                  >
                    Export to Slides
                  </a>
                )}
                {p.download_ppt_url && (
                  <a
                    href={`/api/presentations/${p.slug}/download?type=ppt`}
                    className="px-4 py-2 rounded-full bg-[#6c2bd9] hover:bg-[#5b21b6] text-white"
                  >
                    Download PPT
                  </a>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Server-seeded, API-backed slider — identical behavior to your TeacherSection.jsx */}
      <section className="w-full px-4 sm:px-6 lg:px-12 py-10 bg-white">
        <TeacherSectionClient
          initial={normalizedInitial}
          total={total}
          seedOffset={seedOffset}
          pageSize={pageSize}
          apiHref="/api/presentations/slider"
          title="View More Content"
          showCTA={false}
        />
      </section>

      <div className="max-w-[1100px] mx-auto px-4 pb-10">
        <details className="bg-gray-50 rounded-lg p-5">
          <summary className="cursor-pointer font-semibold text-lg">Show Details</summary>
          {contentHtml && (
            <div
              className="mt-6 text-sm md:text-base leading-6"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}
        </details>
      </div>

      <Footer />
    </>
  );
}
