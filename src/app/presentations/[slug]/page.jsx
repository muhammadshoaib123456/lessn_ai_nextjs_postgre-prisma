// app/presentations/[slug]/page.jsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeacherSectionClient from "@/components/TeacherSectionClient";
export const dynamic = "force-dynamic";

// data fetchers (unchanged)
async function getData(slug) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${base}/api/presentations/${slug}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
async function getAllPresentations() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const pageSize = 1000;
  let page = 1;
  const all = [];
  const MAX_PAGES = 1000000;
  while (page <= MAX_PAGES) {
    const res = await fetch(`${base}/api/presentations/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ q: "", subjects: [], grades: [], page, pageSize }),
    });
    if (!res.ok) break;
    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];
    all.push(...items);
    if (items.length < pageSize) break;
    page += 1;
  }
  return all;
}

// metadata (unchanged)
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getData(slug);
  if (!p) return {};
  return {
    title: p.meta_titles || p.name,
    description: p.meta_description || [p.subject, p.grade, p.topic].filter(Boolean).join(" • "),
  };
}

// auth helper
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// sanitization helpers (unchanged)
import DOMPurify from "isomorphic-dompurify";
function decodeEntities(s = "") { return String(s).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," "); }
function prepareHtml(html) { const decoded = decodeEntities(html).replace(/<span>\s*\|\s*<\/span>/g,"<br/>").replace(/<div>\s*<\/div>/g,""); return DOMPurify.sanitize(decoded, { USE_PROFILES: { html: true } }); }

export default async function PresentationPage({ params }) {
  const { slug } = await params;
  const p = await getData(slug);
  if (!p) return <div className="max-w-[960px] mx-auto p-6">Not found</div>;

  const session = await getServerSession(authOptions);

  const all = await getAllPresentations();
  const sliderItems = all.filter((it) => it?.slug !== p.slug);

  // Build embed URL (unchanged)
  let embedUrl = "";
  if (p.presentation_view_link) {
    const m = String(p.presentation_view_link).match(/src="([^"]+)"/i);
    embedUrl = m ? m[1] : String(p.presentation_view_link);
  }
  if (!embedUrl && p.slides_export_link_url) {
    const m = String(p.slides_export_link_url).match(/presentation\/d\/([^/]+)/i);
    if (m) embedUrl = `https://docs.google.com/presentation/d/${m[1]}/embed?slide=id.p`;
  }

  const summaryHtml = p.summary ? prepareHtml(p.summary) : "";
  const contentHtml = p.presentation_content ? prepareHtml(p.presentation_content) : "";

  const hasAnyButtons = Boolean(p.download_pdf_url || p.download_ppt_url || p.slides_export_link_url);

  return (
    <>
      <Header />

      <div className="max-w-[1100px] mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold leading-snug mb-4">{p.name}</h1>

        <div className="text-base md:text-lg text-gray-700 mb-6">
          <span className="font-bold text-black">Subject:</span> <span className="font-medium">{p.subject}</span>
          <span className="mx-3" />
          <span className="font-bold text-black">Grade:</span> <span className="font-medium">{p.grade}</span>
          <span className="mx-3" />
          <span className="font-bold text-black">Topic:</span> <span className="font-medium">{p.topic || "-"}</span>
        </div>

        <div className="mx-auto max-w-[800px] w-full">
          <div className="aspect-video bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={p.name}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <p className="p-4 text-center text-gray-500">Presentation preview is not available.</p>
            )}
          </div>
        </div>

        {/* Gated CTA */}
        <div className="mx-auto max-w-[800px] w-full mt-6">
          {!session ? (
            <p className="text-center text-[#1e3a8a] font-semibold">
              Please <a href={`/login?next=/presentations/${p.slug}`} className="underline">LOG IN</a> to download the presentation. Access is available to registered users only.
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
                    target="_blank" rel="noreferrer"
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

      <section className="w-full px-4 sm:px-6 lg:px-12 py-10 bg-white">
        <TeacherSectionClient items={sliderItems} title="View More Content" showCTA={false} />
      </section>

      <div className="max-w-[1100px] mx-auto px-4 pb-10">
        <details className="bg-gray-50 rounded-lg p-5">
          <summary className="cursor-pointer font-semibold text-lg">Show Details</summary>
          {summaryHtml && (<div className="mt-4 text-sm md:text-base leading-6" dangerouslySetInnerHTML={{ __html: summaryHtml }} />)}
          {contentHtml && (<div className="mt-6 text-sm md:text-base leading-6" dangerouslySetInnerHTML={{ __html: contentHtml }} />)}
        </details>
      </div>

      <Footer />
    </>
  );
}
