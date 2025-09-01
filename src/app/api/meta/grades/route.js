import { prisma } from "@/lib/prisma";

const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export async function GET() {
  // groupBy gives us distinct values AND counts
  const rows = await prisma.presentation.groupBy({
    by: ["grade"],
    _count: { grade: true },
  });

  const set = new Map();
  for (const r of rows) {
    const t = titleCase(r.grade);
    if (t) {
      // dedupe case-insensitively, keep counts summed
      const key = t.toLowerCase();
      set.set(key, {
        name: t,
        count: (set.get(key)?.count || 0) + r._count.grade,
      });
    }
  }

  const list = Array.from(set.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return new Response(JSON.stringify(list), { status: 200 });
}
