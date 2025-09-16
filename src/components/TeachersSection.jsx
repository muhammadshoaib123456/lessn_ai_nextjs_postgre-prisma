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

export default async function TeacherSection() {
  noStore();

  // configurable page size for the client window + API
  const pageSize = 24;

  const total = await prisma.presentation.count();

  // If there’s no data, just render empty client
  if (total === 0) {
    return (
      <div className="pl-6">
        <TeacherSectionClient initial={[]} total={0} seedOffset={0} pageSize={pageSize} />
      </div>
    );
  }

  // Random seed offset (your "change on refresh" behavior)
  const seedOffset = Math.floor(Math.random() * total);

  // Initial batch from that offset (wrap at end)
  let initial = [];
  if (seedOffset + pageSize <= total) {
    initial = await prisma.presentation.findMany({
      orderBy: { id: "asc" },
      skip: seedOffset,
      take: pageSize,
      select: SELECT,
    });
  } else {
    // wrap: pull tail + head
    const takeA = total - seedOffset;
    const a = await prisma.presentation.findMany({
      orderBy: { id: "asc" },
      skip: seedOffset,
      take: takeA,
      select: SELECT,
    });
    const b = await prisma.presentation.findMany({
      orderBy: { id: "asc" },
      skip: 0,
      take: pageSize - takeA,
      select: SELECT,
    });
    initial = [...a, ...b];
  }

  const normalized = initial.map((r) => ({ ...r, subtopic: r.sub_topic ?? null }));

  return (
    <div className="pl-6">
      <TeacherSectionClient
        initial={normalized}
        total={total}
        seedOffset={seedOffset}
        pageSize={pageSize}
        apiHref="/api/presentations/slider"
      />
    </div>
  );
}
