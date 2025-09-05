// components/TeacherSection.jsx
import { prisma } from "@/lib/prisma";
import TeacherSectionClient from "@/components/TeacherSectionClient";
import { cache } from "react";

/**
 * Keep this list small to avoid massive DOM trees and heavy hydration.
 * We keep order by newest (id desc) to preserve your current behavior.
 */
const getTeacherItems = cache(async () => {
  const rows = await prisma.presentation.findMany({
    orderBy: { id: "desc" },
    take: 24, // ⬅️ cap the list; huge speedup on load + navigation
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
    },
  });
  return rows.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));
});

export default async function TeacherSection() {
  const items = await getTeacherItems();
  return (
    <div className="pl-6">
      <TeacherSectionClient items={items} />
    </div>
  );
}
