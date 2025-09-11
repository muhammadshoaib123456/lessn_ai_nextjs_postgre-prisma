// components/TeacherSection.jsx
import { prisma } from "@/lib/prisma";
import TeacherSectionClient from "@/components/TeacherSectionClient";
import { unstable_noStore as noStore } from "next/cache";

/**
 * SELECT
 * - Limit fields read from the DB (smaller payloads).
 * - Add/remove fields here if PresentationCard needs more/less data.
 */
const SELECT = {
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

/**
 * getTeacherItems()
 * - Server-side fetcher for items shown in the carousel.
 * - Not cached (noStore) so each request can pick a different random subset.
 * - If total ≤ pageSize: returns all (ordered by id asc).
 * - Else: picks a random start index and takes pageSize rows (ordered by id asc).
 *
 * TUNE THESE:
 * - pageSize (default 24): change to show more/less cards in the carousel.
 * - orderBy: currently { id: "asc" } for stable pagination. Change to random if you prefer,
 *            but random can be slower at scale without a strategy (e.g., random seed or precomputed).
 */
async function getTeacherItems() {
  // ⛔️ Do not cache: always compute per request
  noStore();

  const pageSize = 24; // ✅ NUMBER OF CARDS TO SHOW — change this to 12/18/30 etc.

  // Count total rows once (cheap)
  const total = await prisma.presentation.count();

  if (total <= pageSize) {
    // If fewer than pageSize, just return all (still noStore, so it will refetch each time)
    const rows = await prisma.presentation.findMany({
      orderBy: { id: "asc" }, // ✅ Stable order; change to 'desc' if you want most recent by id
      select: SELECT,
    });
    // Normalize 'sub_topic' → 'subtopic' (null if absent) for the PresentationCard
    return rows.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));
  }

  // Random start index (single query; fast) — gives variety per request
  const start = Math.floor(Math.random() * Math.max(1, total - pageSize));

  const rows = await prisma.presentation.findMany({
    orderBy: { id: "asc" }, // ✅ Stable ordering for skip/take
    skip: start,            // ✅ Where to start
    take: pageSize,         // ✅ How many to fetch
    select: SELECT,         // ✅ Only needed fields
  });

  return rows.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));
}

/**
 * TeacherSection (Server Component)
 *
 * - Fetches carousel items on the server.
 * - Renders a small left padding wrapper (pl-6),
 *   then mounts the client carousel (TeacherSectionClient).
 *
 * UI / LAYOUT KNOBS HERE:
 * - The outer <div className="pl-6">: increase/decrease left padding for alignment with the rest of the page.
 *   - For mobile/desktop differences: e.g., className="pl-4 md:pl-6 xl:pl-10"
 * - To cap width or center, wrap with a container (e.g., <div className="max-w-7xl mx-auto"> ... </div>)
 *   but note the child already has a max width in TeacherSectionClient (max-w-[1366px]).
 */
export default async function TeacherSection() {
  const items = await getTeacherItems(); // ✅ Server-side data fetch

  return (
    <div className="pl-6">
      {/* 
        ✅ LEFT PADDING:
        - Change 'pl-6' for horizontal alignment with your overall layout.
        - Make responsive: 'pl-4 md:pl-8' etc.
      */}
      <TeacherSectionClient items={items} />
      {/* 
        ✅ PASS CUSTOM SIZING IF NEEDED:
        - <TeacherSectionClient items={items} cardWidth={300} cardHeight={400} gap={20} leftPad={24} />
        - This is where you can globally change the carousel card sizes from the parent.
      */}
    </div>
  );
}
