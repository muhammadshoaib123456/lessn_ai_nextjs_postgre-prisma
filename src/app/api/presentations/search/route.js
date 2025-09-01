import { prisma } from "@/lib/prisma";

function extractThumbSrc(t) {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  if (s.startsWith("<img")) {
    const m = s.match(/src=["']([^"']+)["']/i);
    return m ? m[1] : null;
  }
  return s;
}

export async function POST(req) {
  const {
    q = "", subjects = [], grades = [], topics = [], sub_topics = [],
    page = 1, pageSize = 12,
  } = await req.json();

  const where = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { grade: { contains: q, mode: "insensitive" } },
              { topic: { contains: q, mode: "insensitive" } },
              { sub_topic: { contains: q, mode: "insensitive" } },
              { presentation_content: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      subjects.length ? { subject: { in: subjects } } : {},
      grades.length ? { grade: { in: grades } } : {},
      topics.length ? { topic: { in: topics } } : {},
      sub_topics.length ? { sub_topic: { in: sub_topics } } : {},
    ],
  };

  const total = await prisma.presentation.count({ where });

  const raw = await prisma.presentation.findMany({
    where,
    orderBy: [{ rating: "desc" }, { reviews: "desc" }, { id: "asc" }],
    take: Number(pageSize),
    skip: (Number(page) - 1) * Number(pageSize),
    select: {
      id: true, slug: true, name: true, subject: true, grade: true,
      topic: true, sub_topic: true, thumbnail: true, thumbnail_alt_text: true,
    },
  });

  const items = raw.map(i => ({
    ...i,
    thumbnail: extractThumbSrc(i.thumbnail),
  }));

  // aggregates unchanged...
  const [subjectsAgg, gradesAgg, topicsAgg, subtopicsAgg] = await Promise.all([
    prisma.presentation.groupBy({ by: ["subject"], _count: { _all: true } }),
    prisma.presentation.groupBy({ by: ["grade"], _count: { _all: true } }),
    prisma.presentation.groupBy({ by: ["topic"], _count: { _all: true } }),
    prisma.presentation.groupBy({ by: ["sub_topic"], _count: { _all: true } }),
  ]);

  const tidy = (s) => String(s || "").trim();
  const titleCase = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());

  return new Response(
    JSON.stringify({
      total,
      items,
      aggregates: {
        subjects: subjectsAgg
          .map((s) => ({ name: titleCase(s.subject), count: s._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        grades: gradesAgg
          .map((g) => ({ name: titleCase(g.grade), count: g._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        topics: topicsAgg
          .filter((t) => tidy(t.topic))
          .map((t) => ({ name: t.topic, count: t._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        sub_topics: subtopicsAgg
          .filter((s) => tidy(s.sub_topic))
          .map((s) => ({ name: s.sub_topic, count: s._count._all }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      },
    }),
    { status: 200 }
  );
}

export async function GET() {
  return new Response("Use POST with JSON body.", { status: 405 });
}
