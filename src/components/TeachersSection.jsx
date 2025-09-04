// components/TeacherSection.jsx
import { prisma } from "@/lib/prisma";
import TeacherSectionClient from "@/components/TeacherSectionClient";

export default async function TeacherSection() {
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
    },
  });

  const normalized = items.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));

  return (
    <div className="pl-6">
    <TeacherSectionClient
      items={normalized}
      // fixed size & spacing
          // leave right side without padding so last card peeks
    />
    </div>
  );
}
