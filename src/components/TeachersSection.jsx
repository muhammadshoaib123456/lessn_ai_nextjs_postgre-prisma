// components/TeacherSection.jsx
import { prisma } from "@/lib/prisma";
import TeacherSectionClient from "./TeacherSectionClient";

export default async function TeacherSection() {
  // Fetch ALL rows without limit, no unstable_cache
  const items = await prisma.presentation.findMany({
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
      // ⚠️ Skip heavy fields like presentation_content unless really needed
    },
  });

  const normalized = items.map((r) => ({
    ...r,
    subtopic: r.sub_topic ?? null,
  }));

  return <TeacherSectionClient items={normalized} />;
}
