// lib/data/presentations.js
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Optional cap to keep the payload sane for very large datasets.
// Increase if you really want to show more than 1000.
// e.g. set MAX_TEACHER_ITEMS=10000 in .env
const MAX_TEACHER_ITEMS = Number(process.env.MAX_TEACHER_ITEMS || 5000);

/**
 * Returns a cached array of presentations.
 * Cache tag: "presentations" (manual revalidation)
 */
export const getAllPresentationsCached = unstable_cache(
  async () => {
    const rows = await prisma.presentation.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        subject: true,
        grade: true,
        topic: true,
        sub_topic: true,
        thumbnail: true,
        thumbnail_alt_text: true,
        presentation_content: true,
      },
      take: MAX_TEACHER_ITEMS,
    });

    // Normalize field name for convenience on the client
    return rows.map((r) => ({
      ...r,
      subtopic: r.sub_topic ?? null,
    }));
  },
  ["presentations-all"],
  { tags: ["presentations"], revalidate: false } // only refresh when you revalidateTag("presentations")
);
