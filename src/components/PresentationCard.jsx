// components/PresentationCard.jsx
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

function extractImgSrc(htmlOrUrl) {
  if (!htmlOrUrl || typeof htmlOrUrl !== "string") return "";
  const s = htmlOrUrl.trim();

  if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:image/")) return s;

  if (s.startsWith("<img")) {
    const match = s.match(/src\s*=\s*["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }

  return s;
}

function absolutize(urlish) {
  try {
    if (!urlish) return "";
    if (/^(https?:)?\/\//i.test(urlish) || urlish.startsWith("data:image/")) return urlish;

    const base = typeof window !== "undefined" ? window.location.origin : "";
    if (!base) return urlish;
    const path = urlish.startsWith("/") ? urlish : `/${urlish}`;
    return new URL(path, base).toString();
  } catch {
    return urlish;
  }
}

export default function PresentationCard({ p }) {
  const [imgOk, setImgOk] = useState(true);

  if (!p || typeof p !== "object") {
    return (
      <div className="rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden bg-white min-h-[360px] flex flex-col">
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-sm text-gray-500">
          Invalid card data
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-1">—</div>
          <h3 className="font-semibold line-clamp-2">—</h3>
        </div>
      </div>
    );
  }

  const thumbUrl = useMemo(() => {
    let src = extractImgSrc(p.thumbnail);

    if (!src && typeof p.presentation_content === "string") {
      const m = p.presentation_content.match(/<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/i);
      if (m?.[1]) src = m[1];
    }

    if (!src && typeof p.thumbnailUrl === "string") src = extractImgSrc(p.thumbnailUrl);
    if (!src && typeof p.thumbnail_path === "string") src = extractImgSrc(p.thumbnail_path);

    return absolutize(src);
  }, [p?.thumbnail, p?.presentation_content, p?.thumbnailUrl, p?.thumbnail_path]);

  const showImage = imgOk && typeof thumbUrl === "string" && thumbUrl.length > 0;

  return (
    <Link
      href={`/presentations/${p.slug}`}
      className="group block rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden bg-white hover:shadow-lg transition-colors transition-shadow min-h-[380px] flex flex-col"
    >
      <div className="aspect-video bg-gray-100">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={p.thumbnail_alt_text || p.name || "Presentation thumbnail"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
            No thumbnail
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Topic */}
        <h3 className="font-semibold line-clamp-2">
          {p.topic || "Untitled presentation"}
        </h3>

        {/* Sub-topic */}
        {p.sub_topic && (
          <div className="text-xs text-gray-500 mt-2">{p.sub_topic}</div>
        )}

        {/* Subject & Grade */}
        <div className="mt-4 flex gap-6 text-sm text-gray-600">
          {/* Subject */}
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="17"
              viewBox="0 0 16 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 11.448V0.947998C15 0.532373 14.6656 0.197998 14.25 0.197998H4C2.34375 0.197998 1 1.54175 1 3.198V13.198C1 14.8542 2.34375 16.198 4 16.198H14.25C14.6656 16.198 15 15.8636 15 15.448V14.948C15 14.7136 14.8906 14.5011 14.7219 14.3636C14.5906 13.8824 14.5906 12.5105 14.7219 12.0292C14.8906 11.8949 15 11.6824 15 11.448ZM5 4.3855C5 4.28237 5.08437 4.198 5.1875 4.198H11.8125C11.9156 4.198 12 4.28237 12 4.3855V5.0105C12 5.11362 11.9156 5.198 11.8125 5.198H5.1875C5.08437 5.198 5 5.11362 5 5.0105V4.3855ZM5 6.3855C5 6.28237 5.08437 6.198 5.1875 6.198H11.8125C11.9156 6.198 12 6.28237 12 6.3855V7.0105C12 7.11362 11.9156 7.198 11.8125 7.198H5.1875C5.08437 7.198 5 7.11362 5 7.0105V6.3855ZM12.9187 14.198H4C3.44688 14.198 3 13.7511 3 13.198C3 12.648 3.45 12.198 4 12.198H12.9187C12.8594 12.7324 12.8594 13.6636 12.9187 14.198Z"
                fill="#000000"
              />
            </svg>
            <span>{p.subject || "—"}</span>
          </div>

          {/* Grade */}
          <div className="flex items-center gap-2">
            <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10.9668 10.019L7.9899 13.0001L5.01295 10.019C2.7818 10.1159 1 11.9439 1 14.2001V14.5001C1 15.3282 1.67091 16 2.49784 16H13.482C14.3089 16 14.9798 15.3282 14.9798 14.5001V14.2001C14.9798 11.9439 13.198 10.1159 10.9668 10.019ZM1.42439 2.49441L1.6241 2.54128V4.36619C1.40566 4.49744 1.24964 4.72555 1.24964 5.00054C1.24964 5.26302 1.39318 5.48176 1.59601 5.61613L1.10922 7.56291C1.05617 7.77853 1.17475 8.00039 1.34637 8.00039H2.65074C2.82237 8.00039 2.94095 7.77853 2.8879 7.56291L2.4011 5.61613C2.60393 5.48176 2.74747 5.26302 2.74747 5.00054C2.74747 4.72555 2.59145 4.49744 2.37302 4.36619V2.72252L4.43254 3.21937C4.16418 3.75685 3.99567 4.35682 3.99567 5.00054C3.99567 7.2098 5.78371 9.00034 7.9899 9.00034C10.1961 9.00034 11.9841 7.2098 11.9841 5.00054C11.9841 4.35682 11.8187 3.75685 11.5473 3.21937L14.5523 2.49441C15.1202 2.35692 15.1202 1.64758 14.5523 1.51008L8.61088 0.0726527C8.20521 -0.0242176 7.77771 -0.0242176 7.37204 0.0726527L1.42439 1.50696C0.859578 1.64445 0.859578 2.35692 1.42439 2.49441Z"
                fill="#000000"
              />
            </svg>
            <span>{p.grade || "—"}</span>
          </div>
        </div>

        {/* Footer pinned to bottom */}
        <div className="mt-auto">
          <hr className="my-3 border-gray-200" />
          <div className="flex justify-center">
            <span className="text-[#000000] font-medium">View Presentation</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
