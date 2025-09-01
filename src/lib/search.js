// shared helpers for building Prisma where clauses
export function buildTextWhere(q) {
  if (!q) return {};
  const like = `%${q}%`;
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { grade: { contains: q, mode: "insensitive" } },
      { topic: { contains: q, mode: "insensitive" } },
      { sub_topic: { contains: q, mode: "insensitive" } },
      { presentation_content: { contains: q, mode: "insensitive" } },
    ],
  };
}
export function buildFilterWhere({ subjects = [], grades = [], topics = [], sub_topics = [] } = {}) {
  const where = {};
  if (subjects.length) where.subject = { in: subjects };
  if (grades.length) where.grade = { in: grades };
  if (topics.length) where.topic = { in: topics };
  if (sub_topics.length) where.sub_topic = { in: sub_topics };
  return where;
}
