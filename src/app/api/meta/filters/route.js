// app/api/meta/filters/route.js
import { prisma } from "@/lib/prisma";

const titleCase = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function buildList(rows, key) {
  // rows look like: [{ [key]: "Math", _count: { _all: 3110 } }, ...]
  const map = new Map();

  for (const r of rows || []) {
    const raw = r?.[key];
    const name = titleCase(raw);
    if (!name) continue; // skip null/empty

    const k = name.toLowerCase();
    const prev = map.get(k);

    map.set(k, {
      name,
      count: (prev?.count || 0) + (r?._count?._all || 0),
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET() {
  try {
    const [subjectsAgg, gradesAgg] = await Promise.all([
      prisma.presentation.groupBy({ by: ["subject"], _count: { _all: true } }),
      prisma.presentation.groupBy({ by: ["grade"], _count: { _all: true } }),
    ]);

    const subjects = buildList(subjectsAgg, "subject");
    const grades = buildList(gradesAgg, "grade");

    return new Response(JSON.stringify({ subjects, grades }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/meta/filters error:", e);
    return new Response(JSON.stringify({ subjects: [], grades: [] }), {
      status: 200, // or 500 if you prefer to signal failure
      headers: { "content-type": "application/json" },
    });
  }
}
