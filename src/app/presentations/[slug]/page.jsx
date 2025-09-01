// app/presentations/[slug]/page.jsx

// (optional but recommended if you rely on no-store or per-request data)
export const dynamic = "force-dynamic";

async function getData(slug) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${base}/api/presentations/${slug}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }) {
  const { slug } = await params; // ✅ await params
  const p = await getData(slug);
  if (!p) return {};
  return {
    title: p.meta_titles || p.name,
    description: p.meta_description || [p.subject, p.grade, p.topic].filter(Boolean).join(" • "),
  };
}

export default async function PresentationPage({ params }) {
  const { slug } = await params; // ✅ await params
  const p = await getData(slug);
  if (!p) {
    return <div className="max-w-[960px] mx-auto p-6">Not found</div>;
  }

  // 🔹 Extract clean embed URL for iframe
  let embedUrl = "";
  if (p.presentation_view_link) {
    // If DB/CSV stored full iframe HTML snippet, pull the src out
    const srcMatch = String(p.presentation_view_link).match(/src="([^"]+)"/);
    embedUrl = srcMatch ? srcMatch[1] : p.presentation_view_link;
  }
  if (!embedUrl && p.slides_export_link_url) {
    // Construct embed URL from Google Slides export link
    const googleIdMatch = String(p.slides_export_link_url).match(/presentation\/d\/([^/]+)/);
    if (googleIdMatch) {
      const presId = googleIdMatch[1];
      embedUrl = `https://docs.google.com/presentation/d/${presId}/embed?slide=id.p`;
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      {/* Metadata info */}
      <div className="text-sm text-gray-500 mb-2">
        Subject: <span className="font-medium">{p.subject}</span>&nbsp;&nbsp;
        Grade: <span className="font-medium">{p.grade}</span>&nbsp;&nbsp;
        Topic: <span className="font-medium">{p.topic || "-"}</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{p.name}</h1>

      {/* iFrame Section */}
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={p.name}
            className="w-full h-full"
            frameBorder="0"
            // React's canonical fullscreen prop is allowFullScreen (camelCase)
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <p className="p-4 text-center text-gray-500">
            Presentation preview is not available.
          </p>
        )}
      </div>

      {/* Details Section */}
      <details className="mt-6 bg-gray-50 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold">Show details</summary>
        <div className="mt-3 text-sm leading-6">
          {p.presentation_content || p.summary || "No additional details."}
        </div>
      </details>
    </div>
  );
}
