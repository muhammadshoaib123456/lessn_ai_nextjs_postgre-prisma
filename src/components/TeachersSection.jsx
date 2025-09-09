// components/TeacherSection.jsx
import { prisma } from "@/lib/prisma";
import TeacherSectionClient from "@/components/TeacherSectionClient";
import { unstable_noStore as noStore } from "next/cache";

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

async function getTeacherItems() {
  // ⛔️ Do not cache: always compute per request
  noStore();

  const pageSize = 24;

  // Count total rows once
  const total = await prisma.presentation.count();

  if (total <= pageSize) {
    // If fewer than 24, just return all (still noStore, so it will refetch each time)
    const rows = await prisma.presentation.findMany({
      orderBy: { id: "asc" },
      select: SELECT,
    });
    return rows.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));
  }

  // Random start index (single query; fast)
  const start = Math.floor(Math.random() * Math.max(1, total - pageSize));

  const rows = await prisma.presentation.findMany({
    orderBy: { id: "asc" }, // stable ordering for skip/take
    skip: start,
    take: pageSize,
    select: SELECT,
  });

  return rows.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));
}

export default async function TeacherSection() {
  const items = await getTeacherItems();
  return (
    <div className="pl-6">
      <TeacherSectionClient items={items} />
    </div>
  );
}
